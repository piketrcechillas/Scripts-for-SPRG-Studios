
var ItemControl = {
	decreaseItem: function(unit, item) {
		this.decreaseLimit(unit, item);
		
		if (this.isItemBroken(item)) {
			this.lostItem(unit, item);
			
			if (unit.getUnitType() !== UnitType.PLAYER && DataConfig.isDropTrophyLinked()) {
				ItemControl.deleteTrophy(unit, item);
			}
		}
	},
	
	decreaseLimit: function(unit, item) {
		var limit;
		
		// The Item which has durability 0 isn't reduced.
		if (item.getLimitMax() === 0) {
			return;
		}
		
		if (item.isWeapon()) {
			// If the weapon is broken, it doesn't reduce.
			if (item.getLimit() === WeaponLimitValue.BROKEN) {
				return;
			}
		}
		
		limit = item.getLimit() - 1;
		item.setLimit(limit);
	},
	
	lostItem: function(unit, item) {
		var weaponType = item.getWeaponType();
		
		if (weaponType.getBreakedWeapon() !== null) {
			// If "Broken Weapon" is set, set the value to show broken state.
			item.setLimit(WeaponLimitValue.BROKEN);
			return;
		}
		
		if (unit === null) {
			StockItemControl.cutStockItem(StockItemControl.getIndexFromItem(item));
		}
		else {
			this.deleteItem(unit, item);
		}
	},
	
	deleteItem: function(unit, item) {
		var i;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			if (UnitItemControl.getItem(unit, i) === item) {
				// Remove from the unit item list.
				UnitItemControl.cutItem(unit, i);
				return true;
			}
		}
		
		return false;
	},
	
	deleteTrophy: function(unit, item) {
		var i, trophy;
		var list = unit.getDropTrophyList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			trophy = list.getData(i);
			if (ItemControl.compareItem(trophy.getItem(), item)) {
				// Delete because id item which is the same as item is included in the drop trophy.
				root.getCurrentSession().getTrophyEditor().deleteTrophy(list, trophy);
				return true;
			}
		}
		
		return false;
	},
	
	isItemBroken: function(item) {
		// Check if durability of the item which has a durability is unlimited is 0.
		return item.getLimitMax() !== 0 && item.getLimit() === 0;
	},
	
	isWeaponTypeAllowed: function(refList, weapon) {
		var i;
		var count = refList.getTypeCount();
		
		for (i = 0; i < count; i++) {
			if (weapon.isWeaponTypeMatched(refList.getTypeData(i))) {
				break;
			}
		}
		
		if (i === count) {
			return false;
		}
		
		return true;
	},
	
	getEquippedWeapon: function(unit) {
		var i, item, count;
		
		if (unit === null) {
			return null;
		}
		
		count = UnitItemControl.getPossessionItemCount(unit);
		
		// Equipped weapon is the first weapon in the item list.
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && this.isWeaponAvailable(unit, item)) {
				return item;
			}
		}
		
		return null;
	},
	
	setEquippedWeapon: function(unit, targetItem) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		var fastIndex = -1, targetIndex = -1;
		
		// The unit is equipped with a weapon of targetItem.
		// targetItem is listed on top in the item list.
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && fastIndex === -1) {
				// Save the first item index in the item list.
				fastIndex = i;
			}
			
			if (item === targetItem) {
				// Save the item index to be equipped.
				targetIndex = i;
			}
		}
		
		if (fastIndex === -1 || targetIndex === -1) {
			return;
		}
		
		// Don't trade if the index is matched.
		if (fastIndex === targetIndex) {
			return;
		}
		
		// Swap items.
		item = UnitItemControl.getItem(unit, fastIndex);
		UnitItemControl.setItem(unit, fastIndex, targetItem);
		UnitItemControl.setItem(unit, targetIndex, item);
		
		this.updatePossessionItem(unit);
	},
	
	// This method is called if changes occur in the item list.
	// For example, item equipped, increase, trade, stock trade, weapon durability 0 etc.
	updatePossessionItem: function(unit) {
		var scene = root.getCurrentScene();
		var mhp = ParamBonus.getMhp(unit);
		
		// If scene is neither FREE nor EVENT, HP is always matched with maximum HP.
		// If this processing is forgotten, HP changes with item trade or item increase/decrease.
		if (scene !== SceneType.FREE && scene !== SceneType.EVENT) {
			unit.setHp(mhp);
		}
		
		// HP shouldn't exceed the maximum HP.
		if (unit.getHp() > mhp) {
			unit.setHp(mhp);
		}
		else if (unit.getHp() < 1) {
			unit.setHp(1);
		}
	},
	
	// Check if the unit can equip with the item.
	// But this is not to check if the unit is equipped with the item.
	isWeaponAvailable: function(unit, item) {
		if (item === null) {
			return false;
		}
		
		// If item is not weapon, cannot equip.
		if (!item.isWeapon()) {
			return false;
		}
		
		// Check "Weapon Level".
		if (!this._isWeaponLevel(unit, item)) {
			return false;
		}
		
		// Check if "Fighters" etc. are matched.
		if (!this._compareTemplateAndCategory(unit, item)) {
			return false;
		}
		
		// Check if it's included in the list of class, "Equipable Weapons".
		if (!this.isWeaponTypeAllowed(unit.getClass().getEquipmentWeaponTypeReferenceList(), item)) {
			return false;
		}
		
		// Check "Users".
		if (!this.isOnlyData(unit, item)) {
			return false;
		}
		
		if (item.getWeaponCategoryType() === WeaponCategoryType.MAGIC) {
			// Check if "Magic attack" is prohibited.
			if (StateControl.isBadStateFlag(unit, BadStateFlag.MAGIC)) {
				return false;
			}
		}
		else {
			// Check if "Physical attack" is prohibited.
			if (StateControl.isBadStateFlag(unit, BadStateFlag.PHYSICS)) {
				return false;
			}
		}
		
		return true;
	},
	
	// Check if the unit can use the item.
	isItemUsable: function(unit, item) {
		// Cannot use the weapon.
		if (item.isWeapon()) {
			return false;
		}
		
		// Check if use of item is prohibited.
		if (StateControl.isBadStateFlag(unit, BadStateFlag.ITEM)) {
			return false;
		}
			
		if (item.isWand()) {
			// If the item is a wand, the class should be able to use the wand.
			if (!(unit.getClass().getClassOption() & ClassOptionFlag.WAND)) {
				return false;
			}
			
			// Check if use of a wand is prohibited.
			if (StateControl.isBadStateFlag(unit, BadStateFlag.WAND)) {
				return false;
			}
		}
		
		if (item.getItemType() === ItemType.KEY) {
			if (item.getKeyInfo().isAdvancedKey()) {
				// If it's "Class Key", the class should be able to use the key.
				if (!(unit.getClass().getClassOption() & ClassOptionFlag.KEY)) {
					return false;
				}
			}
		}
		
		// Check "Users".
		if (!this.isOnlyData(unit, item)) {
			return false;
		}
		
		return true;
	},
	
	// Check "Users".
	isOnlyData: function(unit, item) {
		// If the skill is specified at the "Users", need to check the weapon skill,
		// but prevent to loop by specifying that weapon to the second argument.
		return item.getAvailableAggregation().isConditionFromWeapon(unit, item);
	},
	
	// Check if it's a specific effectiveness.
	isEffectiveData: function(unit, item) {
		var aggregation = item.getEffectiveAggregation();
		
		if (aggregation.getObjectCount() === 0) {
			return false;
		}
		
		return aggregation.isCondition(unit);
	},
	
	// Obtain the key item including flag from the item which the unit possesses.
	getKeyItem: function(unit, flag) {
		var i, item, info, isKey;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		// Check the item in sequence.
		// The front item is prioritized more.
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item === null) {
				continue;
			}
			
			if (!item.isWeapon() && item.getItemType() === ItemType.KEY && this.isItemUsable(unit, item)) {
				isKey = false;
				info = item.getKeyInfo();
				
				// The item is not returned if it's a wand.
				if (!item.isWand()) {
					if (info.getKeyFlag() & flag) {
						isKey = true;
					}
					else {
						isKey = false;
					}
				}
				
				if (isKey) {
					return item;
				}
			}
		}
		
		return null;
	},
	
	// Check if item and targetItem are identical type.
	compareItem: function(item, targetItem) {
		var id, targetId;
		
		if (item === null || targetItem === null) {
			return false;
		}
		
		id = item.getId();
		targetId = targetItem.getId();
		
		if (!item.isWeapon()) {
			id += ItemIdValue.BASE;
		}
		
		if (!targetItem.isWeapon()) {
			targetId += ItemIdValue.BASE;
		}
		
		// Normally, each data id is a sole value.
		// However, the same item has the same ID, so the following decision is valid.
		return id === targetId;
	},
	
	_isWeaponLevel: function(unit, item) {
		// Loop if ParamBonus.getWlv is called.
		return ParamBonus.getBonusFromWeapon(unit, ParamType.WLV, item) >= item.getWeaponLevel();
	},
	
	_compareTemplateAndCategory: function(unit, item) {
		var result = false;
		var classMotionFlag = unit.getClass().getClassMotionFlag();
		var weaponCategoryType = item.getWeaponCategoryType();
		
		// if "Fighters", "Archers" and "Mages" of the class are all blank,
		// all weapons can be equipped.
		if (classMotionFlag === 0) {
			return true;
		}
		
		if (weaponCategoryType === WeaponCategoryType.PHYSICS) {
			if (classMotionFlag & ClassMotionFlag.FIGHTER) {
				result = true;
			}
		}
		else if (weaponCategoryType === WeaponCategoryType.SHOOT) {
			if (classMotionFlag & ClassMotionFlag.ARCHER) {
				result = true;
			}
		}
		else if (weaponCategoryType === WeaponCategoryType.MAGIC) {
			if (classMotionFlag & ClassMotionFlag.MAGE) {
				result = true;
			}
		}
		
		return result;
	}
};

// Wrap to call unit.getItem etc.
var UnitItemControl = {
	getItem: function(unit, index) {
		return unit.getItem(index);
	},
	
	setItem: function(unit, index, item) {
		unit.setItem(index, item);
	},
	
	cutItem: function(unit, index) {
		var item;
		
		// clearItem set the item position which index points to be null.
		// Return value is the item which existed before.
		item = unit.clearItem(index);
		
		this.arrangeItem(unit);
		
		return item;
	},
	
	// Tidy the item turns.
	arrangeItem: function(unit) {
		var i, j, item;
		var count = this.getPossessionItemCount(unit);
		var maxCount = DataConfig.getMaxUnitItemCount();
		
		// Stuff the item in order not to have a blank between items.
		for (i = 0; i < count; i++) {
			if (unit.getItem(i) === null) {
				for (j = i + 1; j < maxCount; j++) {
					item = unit.getItem(j);
					if (item !== null) {
						unit.setItem(i, item);
						unit.clearItem(j);
						break;
					}
				}
			}
		}
	},
	
	// Add the item at the unit item list.
	pushItem: function(unit, item) {
		var count = this.getPossessionItemCount(unit);
		
		if (count < DataConfig.getMaxUnitItemCount()) {	
			this.arrangeItem(unit);
			unit.setItem(count, item);
			return true;
		}
		
		return false;
	},
	
	// Return the item numbers which the unit possesses.
	getPossessionItemCount: function(unit) {
		var i;
		var count = DataConfig.getMaxUnitItemCount();
		var bringCount = 0;
		
		for (i = 0; i < count; i++) {
			if (unit.getItem(i) !== null) {
				bringCount++;
			}
		}
		
		return bringCount;
	},
	
	// Check if there is a space to add the item.
	isUnitItemSpace: function(unit) {
		return this.getPossessionItemCount(unit) !== DataConfig.getMaxUnitItemCount();
	},
	
	getMatchItem: function(unit, targetItem) {
		var i, item, count;
		
		if (unit === null) {
			return null;
		}
		
		count = this.getPossessionItemCount(unit);

		// Check if the unit possesses the targetItem.
		for (i = 0; i < count; i++) {
			item = this.getItem(unit, i);
			if (item === targetItem) {
				return item;
			}
		}

		// If no possession, check if possesses the identical ID item.
		for (i = 0; i < count; i++) {
			item = this.getItem(unit, i);
			if (ItemControl.compareItem(item, targetItem)) {
				return item;
			}
		}
		
		return null;
	},
	
	getIndexFromItem: function(unit, targetItem) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item === targetItem) {
				return i;
			}
		}
		
		return -1;
	}
};

// Wrap to call root.getMetaSession().getStockItemArray.
var StockItemControl = {
	getStockItemArray: function() {
		return root.getMetaSession().getStockItemArray();
	},
	
	getStockItem: function(index) {
		var itemArray = this.getStockItemArray();
		return itemArray[index];
	},
	
	setStockItem: function(index, item) {
		var itemArray = this.getStockItemArray();
		
		itemArray[index] = item;
		this.sortItem();
	},
	
	pushStockItem: function(item) {
		var itemArray = this.getStockItemArray();
		
		itemArray.push(item);
		this.sortItem();
	},
	
	cutStockItem: function(index) {
		var itemArray = this.getStockItemArray();
		
		itemArray.splice(index, 1);
		this.sortItem();
	},
	
	getStockItemCount: function() {
		var itemArray = this.getStockItemArray();
		return itemArray.length;
	},
	
	isStockItemSpace: function() {
		return this.getStockItemCount() !== DataConfig.getMaxStockItemCount();
	},
	
	getMatchItem: function(targetItem) {
		var i, item;
		var count = this.getStockItemCount();
		
		for (i = 0; i < count; i++) {
			item = this.getStockItem(i);
			if (ItemControl.compareItem(item, targetItem)) {
				return item;
			}
		}
		
		return null;
	},
	
	getIndexFromItem: function(item) {
		var i;
		var count = this.getStockItemCount();
		
		for (i = 0; i < count; i++) {
			if (this.getStockItem(i) === item) {
				return i;
			}
		}
		
		return -1;
	},
	
	sortItem: function() {
		var itemArray = this.getStockItemArray();
		
		// Priority of sorting is as below.
		// Weapon has more priority than the item,
		// the item with low id has more priority than the high item,
		// the item with a low durability has more priority than the high item.
		itemArray.sort(
			function(item1, item2) {
				var id1, id2;
				var limit1, limit2;
				
				id1 = item1.getId();
				id2 = item2.getId();
				
				if (!item1.isWeapon()) {
					id1 += ItemIdValue.BASE;
				}
				
				if (!item2.isWeapon()) {
					id2 += ItemIdValue.BASE;
				}
				
				if (id1 > id2) {
					return 1;
				}
				else if (id1 < id2) {
					return -1;
				}
				else {
					limit1 = item1.getLimit();
					limit2 = item2.getLimit();
					
					if (limit1 > limit2) {
						return 1;
					}
					else if (limit1 < limit2) {
						return -1;
					}
				}
				
				return 0;
			}
		);
	}
};

var ItemChangeControl = {
	changeStockItem: function(targetItem, increaseType) {
		var arr = [];
		
		// If the item is stored at arr, the item cannot be stored in the stock.
		
		if (increaseType === IncreaseType.INCREASE) {
			arr = this._increaseStockItem(targetItem);
		}
		else if (increaseType === IncreaseType.DECREASE) {
			arr = this._decreaseStockItem(targetItem);
		}
		else if (increaseType === IncreaseType.ALLRELEASE) {
			arr = this._releaseAllStockItem();
		}
		
		return arr;
	},
	
	changeUnitItem: function(unit, targetItem, increaseType, isStockSend) {
		var arr = [];
		
		// If the item is stored at arr, the item cannot be possessed or stored in the stock.
		
		if (increaseType === IncreaseType.INCREASE) {
			arr = this._increaseUnitItem(unit, targetItem);
		}
		else if (increaseType === IncreaseType.DECREASE) {
			arr = this._decreaseUnitItem(unit, targetItem, isStockSend);
		}
		else if (increaseType === IncreaseType.ALLRELEASE) {
			arr = this._releaseAllUnitItem(unit, isStockSend);
		}
		
		MapHpControl.updateHp(unit);
		
		return arr;
	},
	
	_increaseStockItem: function(targetItem) {
		var arr = [];
		
		if (!StockItemControl.isStockItemSpace()) {
			arr.push(targetItem);
			return arr;
		}
		
		StockItemControl.pushStockItem(targetItem);
		
		return arr;
	},
	
	_decreaseStockItem: function(targetItem) {
		var i, item;
		var count = StockItemControl.getStockItemCount();
		
		for (i = 0; i < count; i++) {
			item = StockItemControl.getStockItem(i);
			if (item !== null && ItemControl.compareItem(item, targetItem)) {
				StockItemControl.cutStockItem(i);
				break;
			}
		}
		
		return [];
	},
	
	_releaseAllStockItem: function() {
		var i;
		var count = StockItemControl.getStockItemCount();
		
		// Delete all including important item.
		for (i = 0; i < count; i++) {
			StockItemControl.cutStockItem(0);
		}
		
		return [];
	},
	
	_increaseUnitItem: function(unit, targetItem) {
		var arr = [];
		
		if (!UnitItemControl.isUnitItemSpace(unit)) {
			arr.push(targetItem);
			return arr;
		}
		
		UnitItemControl.pushItem(unit, targetItem);
		
		// Update because new item is possessed.
		ItemControl.updatePossessionItem(unit);
		
		return arr;
	},
	
	_decreaseUnitItem: function(unit, targetItem, isStockSend) {
		var i, item, curItem;
		var count = DataConfig.getMaxUnitItemCount();
		var arr = [];
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (ItemControl.compareItem(item, targetItem)) {
				// Delete because same item was found.
				curItem = UnitItemControl.cutItem(unit, i);
				if (curItem !== null && isStockSend) {
					if (StockItemControl.isStockItemSpace()) {
						StockItemControl.pushStockItem(curItem);
					}
					else {
						arr.push(curItem);
					}
				}
				break;
				
			}
		}
		
		return arr;
	},
	
	_releaseAllUnitItem: function(unit, isStockSend) {
		var i, curItem;
		var count = DataConfig.getMaxUnitItemCount();
		var arr = [];
		
		for (i = 0; i < count; i++) {
			curItem = UnitItemControl.cutItem(unit, 0);
			if (curItem !== null && isStockSend) {
				if (StockItemControl.isStockItemSpace()) {
					StockItemControl.pushStockItem(curItem);
				}
				else {
					arr.push(curItem);
				}
			}
		}
		
		return arr;
	}
};
