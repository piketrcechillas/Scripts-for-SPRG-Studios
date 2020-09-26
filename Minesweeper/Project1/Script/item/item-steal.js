
var StealItemSelection = defineObject(BaseItemSelection,
{
	isPosSelectable: function() {
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		if (targetUnit === null) {
			return false;
		}
		
		return Miscellaneous.isStealEnabled(this._unit, targetUnit, this._item.getStealInfo().getStealFlag());
	}
}
);

var StealItemUse = defineObject(BaseItemUse,
{
	_itemUseParent: null,
	_unitItemStealScreen: null,
	
	enterMainUseCycle: function(itemUseParent) {
		var screenParam;
		
		this._itemUseParent = itemUseParent;
		
		if (this._isImmediately()) {
			this.mainAction();
			return EnterResult.NOTENTER;
		}
		
		if (this._itemUseParent.isItemSkipMode()) {
			// To display the graphics from now, deactivate the skip.
			this._itemUseParent.setItemSkipMode(false);
		}
		
		screenParam = this._createScreenParam();
		
		this._unitItemStealScreen = createObject(UnitItemStealScreen);
		SceneManager.addScreen(this._unitItemStealScreen, screenParam);
		
		return EnterResult.OK;
	},
	
	moveMainUseCycle: function() {
		if (SceneManager.isScreenClosed(this._unitItemStealScreen)) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawMainUseCycle: function() {
	},
	
	mainAction: function() {
		var flag;
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		
		if (itemTargetInfo.targetUnit === null || itemTargetInfo.targetItem === null) {
			return;
		}
		
		if (itemTargetInfo.targetUnit.getUnitType() === UnitType.PLAYER && itemTargetInfo.targetItem.isImportance()) {
			// The important item which the player possesses cannot be traded.
			return;
		}
		
		flag = itemTargetInfo.item.getStealInfo().getStealFlag();
		if (!Miscellaneous.isStealEnabled(itemTargetInfo.unit, itemTargetInfo.targetUnit, flag)) {
			// Cannot steal due to lack of speed.
			return;
		}
		
		if (Miscellaneous.isStealTradeDisabled(itemTargetInfo.unit, itemTargetInfo.targetItem, flag)) {
			// Cannot steal because trade is prohibited for specified items or due to their weight. 
			return;
		}
		
		if (!UnitItemControl.pushItem(itemTargetInfo.unit, itemTargetInfo.targetItem)) {
			// Cannot add items any more because items which the item user possesses are full. 
			return;
		}
		
		// The targetUnit might include the targetItem as a trophy, if so, delete it.
		ItemControl.deleteTrophy(itemTargetInfo.targetUnit, itemTargetInfo.targetItem);
		
		// Remove targetItem from targetUnit because targetItem could be added in the unit.
		ItemControl.deleteItem(itemTargetInfo.targetUnit, itemTargetInfo.targetItem);
	},
	
	getItemAnimePos: function(itemUseParent, animeData) {
		return this.getUnitBasePos(itemUseParent, animeData);
	},
	
	_isImmediately: function() {
		// If targetItem has already been set, it can steal it immediately without displaying a trade screen.
		return this._itemUseParent.getItemTargetInfo().targetItem !== null;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildUnitItemSteal();
		
		screenParam.unit = this._itemUseParent.getItemTargetInfo().unit;
		screenParam.targetUnit = this._itemUseParent.getItemTargetInfo().targetUnit;
		screenParam.stealFlag = this._itemUseParent.getItemTargetInfo().item.getStealInfo().getStealFlag();
		
		return screenParam;
	}
}
);

var StealItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Steal));
		
		y += ItemInfoRenderer.getSpaceY();
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	},
	
	getInfoPartsCount: function() {
		return 2;
	}
}
);

var StealItemPotency = defineObject(BaseItemPotency,
{
}
);

var StealItemAvailability = defineObject(BaseItemAvailability,
{
	isItemAllowed: function(unit, targetUnit, item) {
		var stealFlag = item.getStealInfo().getStealFlag();
		
		return Miscellaneous.isStealEnabled(unit, targetUnit, stealFlag);
	}
}
);

var StealItemAI = defineObject(BaseItemAI,
{
	getItemScore: function(unit, combination) {
		var stealFlag;
		
		if (!UnitItemControl.isUnitItemSpace(unit)) {
			return AIValue.MIN_SCORE;
		}
		
		stealFlag = this._getStealFlag(unit, combination);
		if (!Miscellaneous.isStealEnabled(unit, combination.targetUnit, stealFlag)) {
			return AIValue.MIN_SCORE;
		}
		
		combination.targetItem = this._getBestItem(unit, combination, stealFlag);
		if (combination.targetItem === null) {
			return AIValue.MIN_SCORE;
		}
		
		return 150;
	},
	
	// Don't steal several items when AI processing.
	_getBestItem: function(unit, combination, stealFlag) {
		var i, item;
		var arr = [];
		var count = UnitItemControl.getPossessionItemCount(combination.targetUnit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(combination.targetUnit, i);
			if (item.isImportance() || item.isTradeDisabled()) {
				continue;
			}
			
			if (Miscellaneous.isStealTradeDisabled(unit, item, stealFlag)) {
				continue;
			}
			
			arr.push(item);
		}
		
		if (arr.length === 0) {
			return null;
		}
		
		this._sortItem(arr);
	
		return arr[0];
	},
	
	_getStealFlag: function(unit, combination) {
		var stealFlag = 0;
		
		if (combination.item !== null) {
			stealFlag = combination.item.getStealInfo().getStealFlag();
		}
		else if (combination.skill !== null) {
			stealFlag = combination.skill.getSkillValue();
		}
		
		return stealFlag;
	},
	
	_sortItem: function(arr) {
		arr.sort(
			function(item1, item2) {
				var price1, price2;
				
				price1 = item1.getGold();
				price2 = item2.getGold();
				
				if (price1 > price2) {
					return -1;
				}
				else if (price1 < price2) {
					return 1;
				}
				
				return 0;
			}
		);
	}
}
);
