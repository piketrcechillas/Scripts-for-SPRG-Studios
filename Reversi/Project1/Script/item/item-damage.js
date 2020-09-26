
var DamageItemSelection = defineObject(BaseItemSelection,
{
}
);

var DamageItemUse = defineObject(BaseItemUse,
{
	_dynamicEvent: null,
	
	enterMainUseCycle: function(itemUseParent) {
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var damageInfo = itemTargetInfo.item.getDamageInfo();
		var type = itemTargetInfo.item.getRangeType();
		var plus = Calculator.calculateDamageItemPlus(itemTargetInfo.unit, itemTargetInfo.targetUnit, itemTargetInfo.item);
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		
		if (type !== SelectionRangeType.SELFONLY) {
			generator.locationFocus(itemTargetInfo.targetUnit.getMapX(), itemTargetInfo.targetUnit.getMapY(), true);
		}
		
		generator.damageHitEx(itemTargetInfo.targetUnit, this._getItemDamageAnime(itemTargetInfo),
			damageInfo.getDamageValue() + plus, damageInfo.getDamageType(), damageInfo.getHit(), itemTargetInfo.unit, itemUseParent.isItemSkipMode());
		
		return this._dynamicEvent.executeDynamicEvent();
	},
	
	moveMainUseCycle: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_getItemDamageAnime: function(itemTargetInfo) {
		return itemTargetInfo.item.getItemAnime();
	}
}
);

var DamageItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Damage));
		y += ItemInfoRenderer.getSpaceY();
		
		this._drawValue(x, y);
		y += ItemInfoRenderer.getSpaceY();
		
		this._drawHit(x, y);
		x += ItemInfoRenderer.getSpaceX() + 40;
		this._drawInfo(x, y);
	},
	
	getInfoPartsCount: function() {
		return 3;
	},
	
	_drawValue: function(x, y) {
		var damageInfo = this._item.getDamageInfo();
		
		ItemInfoRenderer.drawKeyword(x, y, this._getName());
		x += ItemInfoRenderer.getSpaceX();
		NumberRenderer.drawRightNumber(x, y, damageInfo.getDamageValue());
		
		x += 40;
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	},
	
	_drawHit: function(x, y) {
		var damageInfo = this._item.getDamageInfo();
		var hit = damageInfo.getHit();
		
		ItemInfoRenderer.drawKeyword(x, y, root.queryCommand('hit_capacity'));
		x += ItemInfoRenderer.getSpaceX();
		if (hit > 0) {
			NumberRenderer.drawRightNumber(x, y, hit);
		}
		else {
			TextRenderer.drawSignText(x, y, StringTable.SignWord_Limitless);
		}
	},
	
	_drawInfo: function(x, y) {
		var text;
		var damageInfo = this._item.getDamageInfo();
		var damageType = damageInfo.getDamageType();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (damageType === DamageType.FIXED) {
			text = StringTable.DamageType_Fixed;
		}
		else if (damageType === DamageType.PHYSICS) {
			text = StringTable.DamageType_Physics;
		}
		else {
			text = StringTable.DamageType_Magic;
		}
			
		ItemInfoRenderer.drawKeyword(x, y, StringTable.DamageType_Name);
		x += ItemInfoRenderer.getSpaceX();
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	},
	
	_getName: function() {
		return root.queryCommand('power_capacity');
	}
}
);

var DamageItemPotency = defineObject(BaseItemPotency,
{
	_value: 0,
	_value2: 0,
	
	setPosMenuData: function(unit, item, targetUnit) {
		var damageInfo = item.getDamageInfo();
		var plus = Calculator.calculateDamageItemPlus(unit, targetUnit, item);
		
		this._value = Calculator.calculateDamageValue(targetUnit, damageInfo.getDamageValue(), damageInfo.getDamageType(), plus);
		this._value2 = Calculator.calculateDamageHit(targetUnit, damageInfo.getHit());
	},
	
	drawPosMenuData: function(x, y, textui) {
		var text;
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		
		text = root.queryCommand('power_capacity');
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
		NumberRenderer.drawNumber(x + 50, y, this._value);
		
		x += 75;
		
		text = root.queryCommand('hit_capacity');
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
		NumberRenderer.drawNumber(x + 50, y, this._value2);
	},
	
	getKeywordName: function() {
		return StringTable.FusionWord_Success;
	}
}
);

var DamageItemAvailability = defineObject(BaseItemAvailability,
{
}
);

var DamageItemAI = defineObject(BaseItemAI,
{
	getItemScore: function(unit, combination) {
		var score;
		var isDeath = false;
		var hp = combination.targetUnit.getHp();
		var damage = this._getValue(unit, combination);
		
		hp -= damage;
		if (hp <= 0) {
			isDeath = true;
		}
		
		score = Miscellaneous.convertAIValue(damage);
		
		// If the opponent can be beaten, prioritize it. 
		if (isDeath) {
			score += 50;
		}
		
		// Add the advantage because the damaged item is definitely hit.
		score += 15;
		
		return score;
	},
	
	_getValue: function(unit, combination) {
		var plus = Calculator.calculateDamageItemPlus(unit, combination.targetUnit, combination.item);
		var damageInfo = combination.item.getDamageInfo();
		
		return Calculator.calculateDamageValue(combination.targetUnit, damageInfo.getDamageValue(), damageInfo.getDamageType(), plus);
	}
}
);
