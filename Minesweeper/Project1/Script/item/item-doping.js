
var DopingItemSelection = defineObject(BaseItemSelection,
{
}
);

var DopingItemUse = defineObject(BaseItemUse,
{
	_itemUseParent: null,
	_parameterChangeWindow: null,
	
	enterMainUseCycle: function(itemUseParent) {
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		
		if (itemUseParent.isItemSkipMode()) {
			this.mainAction();
			return EnterResult.NOTENTER;
		}
		
		this._parameterChangeWindow = createWindowObject(ParameterChangeWindow, this);
		this._parameterChangeWindow.setParameterChangeData(itemTargetInfo.targetUnit, itemTargetInfo.item);
		
		return EnterResult.OK;
	},
	
	moveMainUseCycle: function() {
		if (InputControl.isSelectAction()) {
			this.mainAction();
			return MoveResult.END;
		}
		else {
			this._parameterChangeWindow.moveWindow();
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawMainUseCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._parameterChangeWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._parameterChangeWindow.getWindowHeight());
		
		this._parameterChangeWindow.drawWindow(x, y);
	},
	
	mainAction: function() {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		
		ParameterControl.addDoping(itemTargetInfo.targetUnit, itemTargetInfo.item);
	},
	
	getItemAnimePos: function(itemUseParent, animeData) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}
}
);

var DopingItemPotency = defineObject(BaseItemPotency,
{
}
);

var DopingItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Doping));
		y += ItemInfoRenderer.getSpaceY();
		
		ItemInfoRenderer.drawDoping(x, y, this._item, false);
	},
	
	getInfoPartsCount: function() {
		return 1 + ItemInfoRenderer.getDopingCount(this._item, false);
	}
}
);

var DopingItemAvailability = defineObject(BaseItemAvailability,
{
}
);

var DopingItemAI = defineObject(BaseItemAI,
{
}
);
