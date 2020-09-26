
var RecoveryItemSelection = defineObject(BaseItemSelection,
{
}
);

var RecoveryItemUse = defineObject(BaseItemUse,
{
	_dynamicEvent: null,
	
	enterMainUseCycle: function(itemUseParent) {
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var recoveryInfo = itemTargetInfo.item.getRecoveryInfo();
		var type = itemTargetInfo.item.getRangeType();
		var plus = Calculator.calculateRecoveryItemPlus(itemTargetInfo.unit, itemTargetInfo.targetUnit, itemTargetInfo.item);
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		
		if (type !== SelectionRangeType.SELFONLY) {
			generator.locationFocus(itemTargetInfo.targetUnit.getMapX(), itemTargetInfo.targetUnit.getMapY(), true);
		}
		
		generator.hpRecovery(itemTargetInfo.targetUnit, this._getItemRecoveryAnime(itemTargetInfo),
			recoveryInfo.getRecoveryValue() + plus, recoveryInfo.getRecoveryType(), itemUseParent.isItemSkipMode());
		
		return this._dynamicEvent.executeDynamicEvent();
	},
	
	moveMainUseCycle: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_getItemRecoveryAnime: function(itemTargetInfo) {
		return itemTargetInfo.item.getItemAnime();
	}
}
);

var RecoveryItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Recovery));
		y += ItemInfoRenderer.getSpaceY();
		
		this._drawValue(x, y);
	},
	
	getInfoPartsCount: function() {
		return 2;
	},
	
	_drawValue: function(x, y) {
		var recoveryInfo = this._item.getRecoveryInfo();
		
		if (recoveryInfo.getRecoveryType() === RecoveryType.SPECIFY) {
			ItemInfoRenderer.drawKeyword(x, y, StringTable.Recovery_Value);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, recoveryInfo.getRecoveryValue());	
		}
		else {
			ItemInfoRenderer.drawKeyword(x, y, StringTable.Recovery_All);
			x += ItemInfoRenderer.getSpaceX();
		}
		
		x += 40;
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	}
}
);

var RecoveryItemPotency = defineObject(BaseItemPotency,
{
	_value: 0,
	
	setPosMenuData: function(unit, item, targetUnit) {
		var recoveryInfo = item.getRecoveryInfo();
		var plus = Calculator.calculateRecoveryItemPlus(unit, targetUnit, item);
		
		this._value = Calculator.calculateRecoveryValue(targetUnit, recoveryInfo.getRecoveryValue(), recoveryInfo.getRecoveryType(), plus);
	},
	
	drawPosMenuData: function(x, y, textui) {
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, this.getKeywordName(), -1, ColorValue.KEYWORD, font);
		NumberRenderer.drawNumber(x + 65, y, this._value);
	},
	
	getKeywordName: function() {
		return StringTable.Recovery_Value;
	}
}
);

var RecoveryItemAvailability = defineObject(BaseItemAvailability,
{
	isItemAllowed: function(unit, targetUnit, item) {
		// The unit who doesn't reduce HP is not a target.
		return targetUnit.getHp() !== ParamBonus.getMhp(targetUnit);
	}
}
);

var RecoveryItemAI = defineObject(BaseItemAI,
{
	getItemScore: function(unit, combination) {
		var value;
		var score = this._getScore(unit, combination);
		
		if (score < 0) {
			return score;
		}
		
		value = this._getValue(unit, combination);
		
		score += Miscellaneous.convertAIValue(value);
		
		return score;
	},
	
	_getValue: function(unit, combination) {
		var plus = Calculator.calculateRecoveryItemPlus(unit, combination.targetUnit, combination.item);
		var recoveryInfo = combination.item.getRecoveryInfo();
		
		return Calculator.calculateRecoveryValue(combination.targetUnit, recoveryInfo.getRecoveryValue(), recoveryInfo.getRecoveryType(), plus);
	},
	
	_getScore: function(unit, combination) {
		var baseHp;
		var maxHp = ParamBonus.getMhp(combination.targetUnit);
		var currentHp = combination.targetUnit.getHp();
		
		if (currentHp === maxHp) {
			return AIValue.MIN_SCORE;
		}
		
		// The unit who terribly reduced HP is prioritized.
		
		baseHp = Math.floor(maxHp * 0.25);
		if (currentHp < baseHp) {
			return 50;
		}
		
		baseHp = Math.floor(maxHp * 0.5);
		if (currentHp < baseHp) {
			return 30;
		}
		
		baseHp = Math.floor(maxHp * 0.75);
		if (currentHp < baseHp) {
			return 10;
		}
		
		return AIValue.MIN_SCORE;
	}
}
);
