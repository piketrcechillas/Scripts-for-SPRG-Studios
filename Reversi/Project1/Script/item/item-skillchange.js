
var SkillChangeItemSelection = defineObject(BaseItemSelection,
{
}
);

var SkillChangeItemUse = defineObject(BaseItemUse,
{
	_dynamicEvent: null,
	
	enterMainUseCycle: function(itemUseParent) {
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var info = itemTargetInfo.item.getSkillChangeInfo();
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.skillChange(itemTargetInfo.targetUnit, info.getSkill(), info.getSkillControlType(), itemUseParent.isItemSkipMode());
		
		return this._dynamicEvent.executeDynamicEvent();
	},
	
	moveMainUseCycle: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	getItemAnimePos: function(itemUseParent, animeData) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}
}
);

var SkillChangeItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_SkillChange));
		y += ItemInfoRenderer.getSpaceY();
		
		this._drawValue(x, y);
	},
	
	getInfoPartsCount: function() {
		return 2;
	},
	
	_drawValue: function(x, y) {
		var info = this._item.getSkillChangeInfo();
		var skill = info.getSkill();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
			
		TextRenderer.drawKeywordText(x, y, skill.getName(), -1, color, font);
	}
}
);

var SkillChangeItemPotency = defineObject(BaseItemPotency,
{
}
);

var SkillChangeItemAvailability = defineObject(BaseItemAvailability,
{
}
);

var SkillChangeItemAI = defineObject(BaseItemAI,
{
}
);
