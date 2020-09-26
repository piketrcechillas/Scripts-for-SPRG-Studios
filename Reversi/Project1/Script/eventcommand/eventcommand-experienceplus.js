
var ExperiencePlusMode = {
	EXP: 0,
	LEVEL: 1
};

var ExperiencePlusType = {
	VALUE: 0,
	LEVEL: 1
};

// Even if the unit has a skill to increase the exp, ignore it at this event.

var ExperiencePlusEventCommand = defineObject(BaseEventCommand,
{
	_getExp: 0,
	_type: 0,
	_targetUnit: null,
	_levelupView: null,
	_experienceNumberView: null,
	_growthArray: null,
	_isMaxLv: false,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ExperiencePlusMode.EXP) {
			result = this._moveExp();
		}
		else if (mode === ExperiencePlusMode.LEVEL) {
			result = this._moveLevel();
		}
		
		return result;
	},
	
	drawEventCommandCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === ExperiencePlusMode.EXP) {
			this._drawExp();
		}
		else if (mode === ExperiencePlusMode.LEVEL) {
			this._drawLevel();
		}
	},
	
	mainEventCommand: function() {
		var i, levelCount;
		
		if (this._type === ExperiencePlusType.VALUE) {
			if (this._growthArray !== null) {
				ExperienceControl.plusGrowth(this._targetUnit, this._growthArray);
				ExperienceControl.obtainData(this._targetUnit);
			}
		}
		else {
			levelCount = this._getExp;
			for (i = 0; i < levelCount; i++) {
				ExperienceControl.directGrowth(this._targetUnit, 100);
				if (this._targetUnit.getLv() >= Miscellaneous.getMaxLv(this._targetUnit)) {
					break;
				}
			}
			
			ExperienceControl.obtainData(this._targetUnit);
		}
	},
	
	_prepareEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._getExp = eventCommandData.getExperienceValue();
		this._type = eventCommandData.getExperiencePlusType();
		this._targetUnit = eventCommandData.getTargetUnit();
		this._levelupView = createObject(LevelupView);
		this._experienceNumberView = createWindowObject(ExperienceNumberView, this);
		this._growthArray = null;
		this._isMaxLv = false;
		
		if (this._targetUnit !== null) {
			this._isMaxLv = this._targetUnit.getLv() >= Miscellaneous.getMaxLv(this._targetUnit);
			if (!this._isMaxLv && this._type === ExperiencePlusType.VALUE) {
				this._growthArray = ExperienceControl.obtainExperience(this._targetUnit, this._getExp);
			}
		}
	},
	
	_checkEventCommand: function() {
		if (this._targetUnit === null || this._isMaxLv) {
			return false;
		}
		
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		this._experienceNumberView.setExperienceNumberData(this._targetUnit, this._getExp);
		
		this.changeCycleMode(ExperiencePlusMode.EXP);
		
		return EnterResult.OK;
	},
	
	_moveExp: function() {
		var levelupViewParam;
		
		if (this._experienceNumberView.moveNumberView() !== MoveResult.CONTINUE) {
			if (this._growthArray !== null) {
				levelupViewParam = this._createLevelupViewParam();
				this._levelupView.enterLevelupViewCycle(levelupViewParam);
				
				this.changeCycleMode(ExperiencePlusMode.LEVEL);
			}
			else {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveLevel: function() {
		if (this._levelupView.moveLevelupViewCycle() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawExp: function() {
		var x = LayoutControl.getCenterX(-1, this._experienceNumberView.getNumberViewWidth());
		var y = LayoutControl.getCenterY(-1, this._experienceNumberView.getNumberViewHeight());
		
		if (!Miscellaneous.isPrepareScene()) {
			y = LayoutControl.getNotifyY();
		}
		
		this._experienceNumberView.drawNumberView(x, y);
	},
	
	_drawLevel: function() {
		this._levelupView.drawLevelupViewCycle();
	},
	
	_createLevelupViewParam: function() {
		var x, y, size, pos;
		var anime = root.queryAnime('easylevelup');
		var levelupViewParam = StructureBuilder.buildLevelupViewParam();
		
		if (Miscellaneous.isPrepareScene()) {
			size = Miscellaneous.getFirstKeySpriteSize(anime, 0);
			x = LayoutControl.getCenterX(-1, size.width);
			y = LayoutControl.getCenterY(-1, size.height);
			pos = createPos(x, y);
		}
		else {
			x = LayoutControl.getPixelX(this._targetUnit.getMapX());
			y = LayoutControl.getPixelY(this._targetUnit.getMapY());
			pos = LayoutControl.getMapAnimationPos(x, y, anime);
		}
		
		levelupViewParam.targetUnit = this._targetUnit;
		levelupViewParam.getExp = this._getExp;
		levelupViewParam.xAnime = pos.x;
		levelupViewParam.yAnime = pos.y;
		levelupViewParam.anime = anime;
		levelupViewParam.growthArray = this._growthArray;
		
		return levelupViewParam;
	}
}
);

var LevelupViewMode = {
	ANIME: 0,
	GROWTH: 1,
	FLOW: 2
};

var LevelupView = defineObject(BaseObject,
{
	_targetUnit: null,
	_getExp: null,
	_xAnime: 0,
	_yAnime: 0,
	_anime: 0,
	_growthArray: null,
	_experienceParameterWindow: null,
	_dynamicAnime: null,
	_straightFlow: null,
	
	enterLevelupViewCycle: function(levelupViewParam) {
		this._prepareMemberData(levelupViewParam);
		this._completeMemberData(levelupViewParam);
		
		return EnterResult.OK;
	},
	
	moveLevelupViewCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === LevelupViewMode.ANIME) {
			result = this._moveAnime();
		}
		else if (mode === LevelupViewMode.GROWTH) {
			result = this._moveGrowth();
		}
		else if (mode === LevelupViewMode.FLOW) {
			result = this._moveFlow();
		}
		
		return result;
	},
	
	drawLevelupViewCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === LevelupViewMode.ANIME) {
			this._drawAnime();
		}
		else if (mode === LevelupViewMode.GROWTH) {
			this._drawGrowth();
		}
		else if (mode === LevelupViewMode.FLOW) {
			this._drawFlow();
		}
	},
	
	_prepareMemberData: function(levelupViewParam) {
		this._targetUnit = levelupViewParam.targetUnit;
		this._getExp = levelupViewParam.getExp;
		this._xAnime = levelupViewParam.xAnime;
		this._yAnime = levelupViewParam.yAnime;
		this._anime = levelupViewParam.anime;
		this._growthArray = levelupViewParam.growthArray;
		this._experienceParameterWindow = createWindowObject(ExperienceParameterWindow, this);
		this._dynamicAnime = createObject(DynamicAnime);
		this._straightFlow = createObject(StraightFlow);
	},
	
	_completeMemberData: function(levelupViewParam) {
		this._straightFlow.setStraightFlowData(levelupViewParam);
		this._pushFlowEntries(this._straightFlow);
		
		this._experienceParameterWindow.setExperienceParameterData(this._targetUnit, this._growthArray);
		this._dynamicAnime.startDynamicAnime(this._anime, this._xAnime, this._yAnime);
		this.changeCycleMode(LevelupViewMode.ANIME);
	},
	
	_moveAnime: function() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.changeCycleMode(LevelupViewMode.GROWTH);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveGrowth: function() {
		if (this._experienceParameterWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._straightFlow.enterStraightFlow() === EnterResult.NOTENTER) {
				return MoveResult.END;
			}
			this.changeCycleMode(LevelupViewMode.FLOW);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveFlow: function() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawAnime: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_drawGrowth: function() {
		var x = LayoutControl.getCenterX(-1, this._experienceParameterWindow.getWindowWidth());
		var y = LayoutControl.getNotifyY();
		
		this._experienceParameterWindow.drawWindow(x, y);
	},
	
	_drawFlow: function() {
		this._straightFlow.drawStraightFlow();
	},
	
	_pushFlowEntries: function(straightFlow) {
		straightFlow.pushFlowEntry(NewSkillFlowEntry);
	}
}
);

var NewSkillFlowEntry = defineObject(BaseFlowEntry,
{
	_unit: null,
	_skillChangeView: null,
	_skillIndex: 0,
	
	enterFlowEntry: function(levelupViewParam) {
		this._unit = levelupViewParam.targetUnit;
		
		if (this.isFlowSkip()) {
			SkillChecker.addAllNewSkill(this._unit);
			return EnterResult.NOTENTER;
		}
		
		this._skillChangeView = createWindowObject(SkillChangeNoticeView, this);
		
		if (!this._checkNewSkill()) {
			return EnterResult.NOTENTER;
		}
		
		return EnterResult.OK;
	},
	
	moveFlowEntry: function() {
		if (this._skillChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			if (!this._checkNewSkill()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		var x = LayoutControl.getCenterX(-1, this._skillChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._skillChangeView.getNoticeViewHeight());
		
		this._skillChangeView.drawNoticeView(x, y);
	},
	
	_checkNewSkill: function() {
		var i, newSkill;
		var count = this._unit.getNewSkillCount();
		
		for (i = this._skillIndex; i < count; i++) {
			newSkill = this._unit.getNewSkill(i);
			if (SkillChecker.addNewSkill(this._unit, newSkill)) {
				if (newSkill.getNewSkillType() === NewSkillType.NEW) {
					this._skillChangeView.setNoticeText(StringTable.GetTitle_NewSkill);
				}
				else {
					this._skillChangeView.setNoticeText(StringTable.GetTitle_PowerupSkill);
				}
				this._skillChangeView.setSkillChangeData(newSkill.getSkill(), IncreaseType.INCREASE);
				break;
			}
		}
		
		if (i === count) {
			return false;
		}
		
		this._skillIndex = i + 1;
		
		return true;
	}
}
);

var ExperienceNumberMode = {
	COUNT: 0,
	WAIT: 1
};

var ExperienceNumberView = defineObject(BaseObject,
{
	_unit: null,
	_exp: 0,
	_balancer: null,
	_counter: null,
	
	setExperienceNumberData: function(unit, exp) {
		var max;
		
		if (exp === 1) {
			// Even if the obtained exp is 1, play the sound.
			max = 0;
		}
		else {
			max = 2;
		}
		
		this._unit = unit;
		this._exp = exp;
		
		this._balancer = createObject(SimpleBalancer);
		this._balancer.setBalancerInfo(0, 100);
		this._balancer.setBalancerSpeed(10);
		this._balancer.startBalancerMove(exp);
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(max);
		this.changeCycleMode(ExperienceNumberMode.COUNT);
	},
	
	moveNumberView: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ExperienceNumberMode.COUNT) {
			result = this._moveCount();	
		}
		else if (mode === ExperienceNumberMode.WAIT) {
			result = this._moveWait();
		}
		
		return result;
	},
	
	drawNumberView: function(x, y) {
		this._drawExp(x, y);
	},
	
	getNumberViewWidth: function() {
		return (this._getTitlePartsCount() + 2) * TitleRenderer.getTitlePartsWidth();
	},
	
	getNumberViewHeight: function() {
		return TitleRenderer.getTitlePartsHeight();
	},
	
	_moveCount: function() {
		this._playNumberCount();
	
		if (this._balancer.moveBalancer() !== MoveResult.CONTINUE) {
			this._counter.setCounterInfo(30);
			this.changeCycleMode(ExperienceNumberMode.WAIT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveWait: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawExp: function(x, y) {
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = this._getTitlePartsCount();
		var exp = this._balancer.getCurrentValue();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);
		
		x += 55;
		y += 18;
		NumberRenderer.drawAttackNumber(x, y, exp);
		TextRenderer.drawText(x + 75, y + 5, StringTable.GetTitle_ExperiencePlus, -1, color, font);
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('support_title');
	},
	
	_getTitlePartsCount: function() {
		return 6;
	},
	
	_playNumberCount: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			MediaControl.soundDirect('numbercount');
		}
	}
}
);

var ExperienceParameterWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setExperienceParameterData: function(targetUnit, growthArray) {
		var i;
		var count = growthArray.length;
		var arr = [];
		
		for (i = 0; i < count; i++) {
			arr[i] = growthArray[i];
		}
		
		this._scrollbar = createScrollbarObject(StatusScrollbar, this);
		this._scrollbar.enableStatusBonus(true);
		this._scrollbar.setStatusFromUnit(targetUnit);
		this._scrollbar.setStatusBonus(arr);
	},
	
	moveWindowContent: function() {
		// If decide with this._scrollbar.moveInput() === ScrollbarInput.SELECT, detect the decision sound.
		this._scrollbar.moveScrollbarCursor();
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}
}
);
