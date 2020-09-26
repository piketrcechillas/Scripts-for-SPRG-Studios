
var SkillChangeEventCommand = defineObject(BaseEventCommand,
{
	_targetUnit: null,
	_targetSkill: null,
	_increaseType: null,
	_skillChangeView: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (this._skillChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._skillChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._skillChangeView.getNoticeViewHeight());
		
		this._skillChangeView.drawNoticeView(x, y);
	},
	
	mainEventCommand: function() {
		SkillChecker.arrangeSkill(this._targetUnit, this._targetSkill, this._increaseType);
	},
	
	_prepareEventCommandMemberData: function() {
		this._targetUnit = root.getEventCommandObject().getTargetUnit();
		this._targetSkill = root.getEventCommandObject().getTargetSkill();
		this._increaseType = root.getEventCommandObject().getIncreaseValue();
		this._skillChangeView = createWindowObject(SkillChangeNoticeView, this);
	},
	
	_checkEventCommand: function() {
		if (this._targetUnit === null || this._targetSkill === null) {
			return false;
		}
		
		if (this._increaseType === IncreaseType.ALLRELEASE) {
			this.mainEventCommand();
			return false;
		}
		
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		this._skillChangeView.setSkillChangeData(this._targetSkill, this._increaseType);
		
		return EnterResult.OK;
	}
}
);

var SkillChangeNoticeView = defineObject(BaseNoticeView,
{
	_targetSkill: null,
	_increaseType: 0,
	_titlePartsCount: 0,
	_text: '',
	
	setSkillChangeData: function(skill, type) {
		this._targetSkill = skill;
		this._increaseType = type;
		
		this._setTitlePartsCount();
		
		if (this._increaseType === IncreaseType.INCREASE) {
			this._playSkillChangeSound();
		}
	},
	
	setNoticeText: function(text) {
		this._text = text;
	},
	
	drawNoticeViewContent: function(x, y) {
		var width;
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = this._text;
		var infoColor = this._increaseType === IncreaseType.INCREASE ? ColorValue.KEYWORD : ColorValue.INFO;
		
		if (text === '') {
			text = this._increaseType === IncreaseType.INCREASE ? StringTable.GetTitle_SkillChange : StringTable.LostTitle_SkillChange;
		}
		width = TextRenderer.getTextWidth(text, font) + 5;
		
		TextRenderer.drawKeywordText(x, y, text, -1, infoColor, font);
		SkillRenderer.drawSkill(x + width, y, this._targetSkill, color, font);
	},
	
	getTitlePartsCount: function() {
		return this._titlePartsCount;
	},
	
	_setTitlePartsCount: function() {
		var font = this.getTitleTextUI().getFont();
		var textWidth = TextRenderer.getTextWidth(this._targetSkill.getName(), font) + 100 + (TitleRenderer.getTitlePartsWidth() * 2);
		
		this._titlePartsCount = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
	},
	
	_playSkillChangeSound: function() {
		MediaControl.soundDirect('itemget');
	}
}
);
