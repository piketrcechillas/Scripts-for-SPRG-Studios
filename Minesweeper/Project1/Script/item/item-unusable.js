
var UnusableItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Unusable));
	},
	
	getInfoPartsCount: function() {
		return 1;
	}
}
);

var UnusableItemPotency = defineObject(BaseItemPotency,
{
}
);

var UnusableItemAvailability = defineObject(BaseItemAvailability,
{
	isItemAvailableCondition: function(unit, item) {
		return false;
	}
}
);

var UnusableItemAI = defineObject(BaseItemAI,
{
}
);