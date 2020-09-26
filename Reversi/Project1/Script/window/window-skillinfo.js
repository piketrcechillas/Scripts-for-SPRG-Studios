
var SkillInfoWindow = defineObject(BaseWindow,
{
	_skill: null,
	_objecttype: 0,
	_aggregationViewer: null,
	_matchtype: 0,
	
	// Replace a property of the BaseWindow.
	_isWindowEnabled: false,
	
	setSkillInfoData: function(skill, objecttype) {
		this._skill = skill;
		if (this._skill === null) {
			// Don't allow to draw the window frame etc.
			this.enableWindow(false);
			return;
		}
		this._aggregationViewer = createObject(AggregationViewer);
		this._aggregationViewer.setEnabled(DataConfig.isAggregationVisible());
		this._aggregationViewer.setAggregationViewer(skill.getTargetAggregation());
		
		this._matchtype = skill.getTargetAggregation().getMatchType();
		
		this._objecttype = objecttype;
		
		this.enableWindow(true);
	},
	
	moveWindowContent: function() {
		if (this._aggregationViewer !== null) {
			this._aggregationViewer.moveAggregationViewer();
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		var text, skillText, count;
		var length = this._getTextLength();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this._skill === null) {
			return;
		}
		
		this._drawName(x, y, this._skill, length, color, font);
		y += ItemInfoRenderer.getSpaceY();
		
		if (this._isInvocationType()) {
			this._drawInvocationValue(x, y, this._skill, length, color, font);
			y += ItemInfoRenderer.getSpaceY();
		}
		
		if (this._aggregationViewer !== null) {
			count = this._aggregationViewer.getAggregationViewerCount();
			if (count !== 0) {
				this._aggregationViewer.drawAggregationViewer(x, y, this._getMatchName());
				y += ItemInfoRenderer.getSpaceY() * this._aggregationViewer.getAggregationViewerCount();
			}
		}
		
		text = this._getSkillTypeText();
		if (text !== '') {
			skillText = root.queryCommand('skill_object');
			TextRenderer.drawKeywordText(x, y, text + ' ' + skillText, length, ColorValue.KEYWORD, font);
		}
		else {
			text = this._getCategoryText();
			TextRenderer.drawKeywordText(x, y, text, length, ColorValue.KEYWORD, font);
		}
	},
	
	getWindowWidth: function() {
		var width = 0;
		
		if (this._objecttype === ObjectType.NULL || (this._aggregationViewer !== null && this._aggregationViewer.getAggregationViewerCount() > 0)) {
			width += 30;
		}
		
		return 210 + width;
	},
	
	getWindowHeight: function() {
		var count = 3;
		
		if (this._isInvocationType()) {
			count++;
		}
		
		if (this._aggregationViewer !== null) {
			count += this._aggregationViewer.getAggregationViewerCount();
		}
		
		return count * ItemInfoRenderer.getSpaceY();
	},
	
	getSkill: function() {
		return this._skill;
	},
	
	_drawName: function(x, y, skill, length, color, font) {
		var range = createRangeObject();
		
		range.x = x;
		range.y = y;
		range.width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		range.height = GraphicsFormat.ICON_HEIGHT;
		TextRenderer.drawRangeText(range, TextFormat.LEFT, skill.getName(), -1, color, font);
	},
	
	_drawInvocationValue: function(x, y, skill, length, color, font) {
		var text = InvocationRenderer.getInvocationText(skill.getInvocationValue(), skill.getInvocationType());
		
		TextRenderer.drawKeywordText(x, y, StringTable.SkillWord_Invocation, length, ColorValue.KEYWORD, font);
		x += ItemInfoRenderer.getSpaceX();
		
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	},
	
	_isInvocationType: function() {
		var skilltype;
		
		if (this._skill === null) {
			return false;
		}
		
		if (this._skill.getInvocationValue() === 0) {
			return false;
		}
		
		skilltype = this._skill.getSkillType();
		
		if (skilltype === SkillType.FASTATTACK ||
			skilltype === SkillType.CONTINUOUSATTACK ||
			skilltype === SkillType.COUNTERATTACKCRITICAL ||
			skilltype === SkillType.DAMAGEABSORPTION ||
			skilltype === SkillType.TRUEHIT ||
			skilltype === SkillType.STATEATTACK ||
			skilltype === SkillType.DAMAGEGUARD ||
			skilltype === SkillType.SURVIVAL ||
			skilltype === SkillType.CUSTOM
		) {
			return true;
		}
		else {
			return false;
		}
	},
	
	_getSkillTypeText: function() {
		var text = '';
		var objecttype = this._objecttype;
		
		if (objecttype === ObjectType.UNIT) {
			text = root.queryCommand('unit_object');
		}
		else if (objecttype === ObjectType.CLASS) {
			text = root.queryCommand('class_object');
		}
		else if (objecttype === ObjectType.WEAPON) {
			text = root.queryCommand('weapon_object');
		}
		else if (objecttype === ObjectType.ITEM) {
			text = root.queryCommand('item_object');
		}
		else if (objecttype === ObjectType.STATE) {
			text = root.queryCommand('state_object');
		}
		else if (objecttype === ObjectType.TERRAIN) {
			text = root.queryCommand('terrain_object');
		}
		else if (objecttype === ObjectType.FUSION) {
			text = root.queryCommand('fusion_object');
		}
		else {
			text = '';
		}
		
		return text;
	},
	
	_getTextLength: function() {
		return this.getWindowWidth();
	},
	
	_getMatchName: function() {
		var text;
		
		if (this._matchtype === MatchType.MATCH) {
			text = StringTable.Aggregation_Match;
		}
		else if (this._matchtype === MatchType.MISMATCH) {
			text = StringTable.Aggregation_Mismatch;
		}
		else if (this._matchtype === MatchType.MATCHALL) {
			text = StringTable.Aggregation_MatchAll;
		}
		else {
			text = StringTable.Aggregation_MismatchAll;
		}
		
		return text;
	},
	
	_getCategoryText: function() {
		var text;
		var skilltype = this._skill.getSkillType();
		
		if (skilltype < 10) {
			text = StringTable.SkillCategory_BattleAttack;
		}
		else if (skilltype < 20) {
			text = StringTable.SkillCategory_BattleDefence;
		}
		else if (skilltype < 30) {
			text = StringTable.SkillCategory_BattleAllowed;
		}
		else if (skilltype < 40) {
			text = StringTable.SkillCategory_Allowed;
		}
		else if (skilltype < 50) {
			text = StringTable.SkillCategory_Command;
		}
		else if (skilltype < 60) {
			text = StringTable.SkillCategory_Action;
		}
		else {
			text = StringTable.SkillCategory_Custom;
		}
		
		return '<' + text + '>';
	}
}
);

var SkillInfoWindowLong = defineObject(SkillInfoWindow,
{
	getWindowWidth: function() {
		return ItemRenderer.getItemWindowWidth();
	}
}
);
