
var ItemListWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	initialize: function() {
		this._scrollbar = createScrollbarObject(ItemListScrollbar, this);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowXPadding() * 2);
	},
	
	setDefaultItemFormation: function() {
		var max = 7;
		var count = DataConfig.getMaxUnitItemCount();
		
		if (count > max) {
			count = max;
		}
		
		this.setItemFormation(count);
	},
	
	setItemFormation: function(count) {
		this._scrollbar.setScrollFormation(1, count);
	},
	
	setUnitMaxItemFormation: function(unit) {
		this._scrollbar.setUnitMaxItemFormation(unit);
	},
	
	setUnitItemFormation: function(unit) {
		this._scrollbar.setUnitItemFormation(unit);
	},
	
	setStockItemFormation: function() {
		this._scrollbar.setStockItemFormation();
		this._scrollbar.enablePageChange();
	},
	
	setStockItemFormationFromWeaponType: function(weapontype) {
		this._scrollbar.setStockItemFormationFromWeaponType(weapontype);
	},
	
	setActive: function(isActive) {
		this._scrollbar.setActive(isActive);
	},
	
	setForceSelect: function(index) {
		this._scrollbar.setForceSelect(index);
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	},
	
	enableWarningState: function(isEnabled) {
		this._scrollbar.enableWarningState(isEnabled);
	},
	
	getCurrentItem: function() {
		return this._scrollbar.getObject();
	},
	
	getItemIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	setItemIndex: function(index) {
		return this._scrollbar.setIndex(index);
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	resetItemList: function() {
		this._scrollbar.resetScrollData();
	},
	
	getItemFromIndex: function(index) {
		return this._scrollbar.getObjectFromIndex(index);
	},
	
	getItemScrollbar: function() {
		return this._scrollbar;
	}
}
);

var ItemListScrollbar = defineObject(BaseScrollbar,
{
	_unit: null,
	_isWarningAllowed: false,
	_availableArray: null,
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var isAvailable, color;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		
		if (object === null) {
			return;
		}
		
		if (this._availableArray !== null) {
			isAvailable = this._availableArray[index];
		}
		else {
			isAvailable = true;
		}
		color = this._getTextColor(object, isSelect, index);
		
		if (isAvailable) {
			ItemRenderer.drawItem(x, y, object, color, font, true);
		}
		else {
			// Draw it tinted if items cannot be used.
			ItemRenderer.drawItemAlpha(x, y, object, color, font, true, 120);
		}
	},
	
	playOptionSound: function() {
		MediaControl.soundDirect('commandselect');
	},
	
	getObjectWidth: function() {
		return ItemRenderer.getItemWidth();
	},
	
	getObjectHeight: function() {
		return ItemRenderer.getItemHeight();
	},
	
	setUnitMaxItemFormation: function(unit) {
		var i;
		var maxCount = DataConfig.getMaxUnitItemCount();
		
		this._unit = unit;
		
		this.resetScrollData();
		
		for (i = 0; i < maxCount; i++) {
			this.objectSet(UnitItemControl.getItem(unit, i));
		}
		
		this.objectSetEnd();
		
		this.resetAvailableData();
	},
	
	setUnitItemFormation: function(unit) {
		var i, item;
		var maxCount = DataConfig.getMaxUnitItemCount();
		
		this._unit = unit;
		
		this.resetScrollData();
		
		for (i = 0; i < maxCount; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null) {
				this.objectSet(item);
			}
		}
		
		this.objectSetEnd();
		
		this.resetAvailableData();
	},
	
	setStockItemFormation: function() {
		var i;
		var maxCount = StockItemControl.getStockItemCount();
		
		this._unit = null;
		
		this.resetScrollData();
		
		for (i = 0; i < maxCount; i++) {
			this.objectSet(StockItemControl.getStockItem(i));
		}
		
		this.objectSetEnd();
		
		this.resetAvailableData();
	},
	
	setStockItemFormationFromWeaponType: function(weapontype) {
		var i, item;
		var maxCount = StockItemControl.getStockItemCount();
		
		this._unit = null;
		
		this.resetScrollData();
		
		for (i = 0; i < maxCount; i++) {
			item = StockItemControl.getStockItem(i);
			if (item.getWeaponType() === weapontype) {
				this.objectSet(item);
			}
		}
		
		this.objectSetEnd();
		
		this.resetAvailableData();
	},
	
	enableWarningState: function(isEnabled) {
		this._isWarningAllowed = isEnabled;
	},
	
	resetAvailableData: function() {
		var i, item;
		var length = this._objectArray.length;
		
		this._availableArray = [];
		
		for (i = 0; i < length; i++) {
			item = this._objectArray[i];
			if (item !== null) {
				this._availableArray.push(this._isAvailable(item, false, i));
			}
		}
	},
	
	setAvailableArray: function(arr) {
		this._availableArray = arr;
	},
	
	getAvailableArray: function(arr) {
		return this._availableArray;
	},
	
	_isAvailable: function(object, isSelect, index) {
		var isAvailable;
		
		if (this._unit === null) {
			isAvailable = true;
		}
		else if (object.isWeapon()) {
			// Check if the item can be equipped when the item type is a weapon.
			isAvailable = ItemControl.isWeaponAvailable(this._unit, object);
		}
		else {
			// Check if the item can be used when the item type is not a weapon.
			isAvailable = ItemControl.isItemUsable(this._unit, object);
		}
		
		return isAvailable;
	},
	
	_getTextColor: function(object, isSelect, index) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		
		if (this._isWarningItem(object)) {
			color = ColorValue.KEYWORD;
		}
		
		return color;
	},
	
	_isWarningItem: function(object) {
		return this._isWarningAllowed && Miscellaneous.isTradeDisabled(this._unit, object);
	}
}
);

var ItemDropListScrollbar = defineObject(ItemListScrollbar,
{
	_trophyRefArray: null,
	
	resetDropMark: function() {
		var i, count, trophy, list;
		var length = this._objectArray.length;
		
		this._trophyRefArray = [];
		
		for (i = 0; i < length; i++) {
			this._trophyRefArray.push(false);
		}
		
		if (this._unit !== null && this._unit.getUnitType() === UnitType.ENEMY) {
			list = this._unit.getDropTrophyList();
			count = list.getCount();
			for (i = 0; i < count; i++) {
				trophy = list.getData(i);
				// Check if the contents of the trophy are items and if they need to be obtained immediately.
				if ((trophy.getFlag() & TrophyFlag.ITEM) && trophy.isImmediately()) {
					this._checkDrop(trophy);
				}
			}
		}
	},
	
	_checkDrop: function(trophy) {
		var i;
		var length = this._objectArray.length;
		
		for (i = 0; i < length; i++) {
			if (!this._trophyRefArray[i]) {
				if (ItemControl.compareItem(this._objectArray[i], trophy.getItem())) {
					// Specify true so as to display in color if the same item as the trophy item is possessed.
					this._trophyRefArray[i] = true;
					break;
				}
			}
		}
	},
	
	_getTextColor: function(object, isSelect, index) {
		var color = ItemListScrollbar._getTextColor.call(this, object, isSelect, index);
		
		if (this._isDropItem(index)) {
			color = ColorValue.LIGHT;
		}
		
		return color;
	},
	
	_isDropItem: function(index) {
		if (this._unit !== null && this._unit.getUnitType() === UnitType.ENEMY) {
			return this._trophyRefArray[index];
		}
		
		return false;
	}
}
);

var ItemDurabilityListWindow = defineObject(ItemListWindow,
{
	initialize: function() {
		this._scrollbar = createScrollbarObject(ItemDurabilityListScrollbar, this);
	},
	
	setDurabilityItemFormation: function(unit, repairItem) {
		this._scrollbar.setDurabilityItemFormation(unit, repairItem);
	}
}
);

var ItemDurabilityListScrollbar = defineObject(ItemListScrollbar,
{
	_repairItem: null,
	
	setDurabilityItemFormation: function(unit, repairItem) {
		this._repairItem = repairItem;
		this.setUnitItemFormation(unit);
	},
	
	_getTextColor: function(object, isSelect, index) {
		var color = ItemListScrollbar._getTextColor.call(this, object, isSelect, index);
		
		if (!Miscellaneous.isDurabilityChangeAllowed(this._repairItem, object)) {
			color = ColorValue.KEYWORD;
		}
		
		return color;
	}
}
);
