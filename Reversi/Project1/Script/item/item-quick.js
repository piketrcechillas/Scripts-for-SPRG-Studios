
var QuickItemSelection = defineObject(BaseItemSelection,
{
	isPosSelectable: function() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		if (unit === null) {
			return false;
		}
		
		// The unit who is a target of Again item should be in wait state.
		return unit.isWait();
	}
}
);

var QuickItemUse = defineObject(BaseItemUse,
{
	_itemUseParent: null,
	
	enterMainUseCycle: function(itemUseParent) {
		this._itemUseParent = itemUseParent;
		
		this.mainAction();
		
		return EnterResult.OK;
	},
	
	mainAction: function() {
		var targetUnit = this._itemUseParent.getItemTargetInfo().targetUnit;
		
		targetUnit.setWait(false);
		
		// Enable to move with the enemy turn by deactivating acted.
		targetUnit.setOrderMark(OrderMarkType.FREE);
	},
	
	getItemAnimePos: function(itemUseParent, animeData) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}
}
);

var QuickItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Quick));
		
		y += ItemInfoRenderer.getSpaceY();
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	},
	
	getInfoPartsCount: function() {
		return 2;
	}
}
);

var QuickItemPotency = defineObject(BaseItemPotency,
{
}
);

var QuickItemAvailability = defineObject(BaseItemAvailability,
{
	isItemAllowed: function(unit, targetUnit, item) {
		// The unit who doesn't wait is not a target.
		return targetUnit.isWait();
	}
}
);

var QuickItemAI = defineObject(BaseItemAI,
{
	getItemScore: function(unit, combination) {
		if (!combination.targetUnit.isWait()) {
			return AIValue.MIN_SCORE;
		}
		
		// The high leveled unit is more a target to act again.
		return combination.targetUnit.getLv() * 7;
	}
}
);
