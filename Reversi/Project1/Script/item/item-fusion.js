
var FusionItemSelection = defineObject(BaseItemSelection,
{
	isPosSelectable: function() {
		var fusionData = this._item.getFusionInfo().getFusionData();
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		if (targetUnit === null) {
			return false;
		}
		
		return FusionControl.isItemAllowed(this._unit, targetUnit, fusionData) && FusionControl.isControllable(this._unit, targetUnit, fusionData);
	}
}
);

var FusionItemUse = defineObject(BaseItemUse,
{
	_itemUseParent: null,
	_easyMapUnit: null,
	
	enterMainUseCycle: function(itemUseParent) {
		this._itemUseParent = itemUseParent;
		
		if (!this._isAllowed()) {
			return EnterResult.NOTENTER;
		}
		
		if (this._isProbability()) {
			this.mainAction();
			return EnterResult.NOTENTER;
		}
		
		if (itemUseParent.isItemSkipMode()) {
			return EnterResult.NOTENTER;
		}
		
		this._startAvoid();
		
		return EnterResult.OK;
	},
	
	moveMainUseCycle: function() {
		this._easyMapUnit.moveMapUnit();
		if (this._easyMapUnit.isActionLast()) {
			this._itemUseParent.getItemTargetInfo().targetUnit.setInvisible(false);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawMainUseCycle: function() {
		this._easyMapUnit.drawMapUnit();
	},
	
	mainAction: function() {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var fusionData = itemTargetInfo.item.getFusionInfo().getFusionData();
		
		if (fusionData.getFusionType() === FusionType.ATTACK) {
			DamageControl.setCatchState(itemTargetInfo.targetUnit, true);
		}
		
		FusionControl.catchUnit(itemTargetInfo.unit, itemTargetInfo.targetUnit, fusionData);
	},
	
	getItemAnimePos: function(itemUseParent, animeData) {
		return this.getUnitBasePos(itemUseParent, animeData);
	},
	
	_isAllowed: function() {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var fusionData = itemTargetInfo.item.getFusionInfo().getFusionData();
		
		if (itemTargetInfo.unit === itemTargetInfo.targetUnit) {
			return false;
		}
		
		if (FusionControl.getFusionChild(itemTargetInfo.unit) !== null) {
			return false;
		}
		
		return FusionControl.isItemAllowed(itemTargetInfo.unit, itemTargetInfo.targetUnit, fusionData) && FusionControl.isControllable(itemTargetInfo.unit, itemTargetInfo.targetUnit, fusionData);
	},
	
	_isProbability: function() {
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var unit = itemTargetInfo.unit;
		var fusionInfo = itemTargetInfo.item.getFusionInfo();
		
		return Probability.getInvocationProbability(unit, fusionInfo.getInvocationType(), fusionInfo.getInvocationValue());
	},
	
	_startAvoid: function() {
		var targetUnit = this._itemUseParent.getItemTargetInfo().targetUnit;
		
		this._easyMapUnit = createObject(EvasionMapUnit);
		this._easyMapUnit.setupEvasionMapUnit(targetUnit, true);
		this._easyMapUnit.startEvasion(targetUnit);
		targetUnit.setInvisible(true);
	}
}
);

var FusionItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Fusion));
		y += ItemInfoRenderer.getSpaceY();
		this._drawValue(x, y);
	},
	
	getInfoPartsCount: function() {
		return 2;
	},
	
	_drawValue: function(x, y) {
		var fusionInfo = this._item.getFusionInfo();
		var text = InvocationRenderer.getInvocationText(fusionInfo.getInvocationValue(), fusionInfo.getInvocationType());
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, StringTable.FusionWord_Success, -1,ColorValue.KEYWORD, font);
		TextRenderer.drawKeywordText(x + ContentLayout.ITEM_SPACE, y, text, -1, color, font);
	}
}
);

var FusionItemPotency = defineObject(BaseItemPotency,
{
	setPosMenuData: function(unit, item, targetUnit) {
		var fusionInfo = item.getFusionInfo();
		var fusionData = fusionInfo.getFusionData();
		
		if (FusionControl.isFusionAllowed(unit, targetUnit, fusionData)) {
			this._value = Probability.getInvocationPercent(unit, fusionInfo.getInvocationType(), fusionInfo.getInvocationValue());
		}
		else {
			this._value = 0;
		}
	},
	
	drawPosMenuData: function(x, y, textui) {
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, this.getKeywordName(), -1, ColorValue.KEYWORD, font);
		NumberRenderer.drawNumber(x + 65, y, this._value);
		TextRenderer.drawKeywordText(x + 76, y + 1, StringTable.SignWord_Percent, -1, textui.getColor(), font);
	},
	
	getKeywordName: function() {
		return StringTable.FusionWord_Success;
	}
}
);

var FusionItemAvailability = defineObject(BaseItemAvailability,
{
	isItemAllowed: function(unit, targetUnit, item) {
		var fusionData = item.getFusionInfo().getFusionData();
		
		return FusionControl.isItemAllowed(unit, targetUnit, fusionData) && FusionControl.isControllable(unit, targetUnit, fusionData);
	}
}
);

var FusionItemAI = defineObject(BaseItemAI,
{
	getItemScore: function(unit, combination) {
		var score = 160;
		var fusionData = combination.item.getFusionInfo().getFusionData();
		
		if (!FusionControl.isControllable(unit, combination.targetUnit, fusionData)) {
			return AIValue.MIN_SCORE;
		}
		
		score += combination.targetUnit.getLv();
		
		if (fusionData.getFusionType() === FusionType.ATTACK) {
			score += 50;
		}
		
		return score;
	}
}
);
