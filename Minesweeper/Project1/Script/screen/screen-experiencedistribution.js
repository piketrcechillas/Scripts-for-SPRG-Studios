
var ExperienceDistributionScreenMode = {
	TOP: 0,
	INPUT: 1,
	LEVEL: 2,
	HELP: 3
};

var ExperienceDistributionScreen = defineObject(BaseScreen,
{
	_levelupUnitWindow: null,
	_itemUserWindow: null,
	_bonusPointWindow: null,
	_bonusInputWindow: null,
	_restrictedLevelupObject: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ExperienceDistributionScreenMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ExperienceDistributionScreenMode.INPUT) {
			result = this._moveInput();
		}
		else if (mode === ExperienceDistributionScreenMode.LEVEL) {
			result = this._moveLevel();
		}
		else if (mode === ExperienceDistributionScreenMode.HELP) {
			result = this._moveHelp();
		}
		
		this._itemUserWindow.moveWindow();
		
		return result;
	},
	
	drawScreenCycle: function() {
		var xInfo, yInfo, window;
		var mode = this.getCycleMode();
		var width = this._levelupUnitWindow.getWindowWidth() + this._itemUserWindow.getWindowWidth();
		var height = this._itemUserWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._levelupUnitWindow.drawWindow(x, y);
		this._itemUserWindow.drawWindow(x + this._levelupUnitWindow.getWindowWidth(), y);
		
		xInfo = (x + width) - this._bonusPointWindow.getWindowWidth();
		yInfo = (y - this._bonusPointWindow.getWindowHeight());
		this._bonusPointWindow.drawWindow(xInfo, yInfo);
		
		if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
			window = this._itemUserWindow.getSkillInteraction().getInteractionWindow();
			// xInfo = (x + this._levelupUnitWindow.getWindowWidth()) - window.getWindowWidth();
			xInfo = x;
			yInfo = (y + height) - window.getWindowHeight();
			window.drawWindow(xInfo, yInfo);
		}
		
		if (mode === ExperienceDistributionScreenMode.INPUT) {
			x = LayoutControl.getCenterX(-1, this._bonusInputWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._bonusInputWindow.getWindowHeight());
			this._bonusInputWindow.drawWindow(x, y);
		}
		
		if (mode === ExperienceDistributionScreenMode.LEVEL) {
			this._restrictedLevelupObject.drawRestrictedLevelupObject();
		}
	},
	
	drawScreenBottomText: function(textui) {
		var text = '';
		
		if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
			text = this._itemUserWindow.getSkillInteraction().getHelpText();
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('ExperienceDistribution');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._levelupUnitWindow = createWindowObject(LevelupUnitWindow, this);
		this._itemUserWindow = createWindowObject(ItemUserWindow, this);
		this._bonusInputWindow = createWindowObject(BonusInputWindow, this);
		this._bonusPointWindow = createWindowObject(BonusPointWindow, this);
		this._restrictedLevelupObject = createObject(RestrictedLevelupObject);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._levelupUnitWindow.setLevelupUnitData();
		this._itemUserWindow.setItemUserData(this._levelupUnitWindow.getTargetUnit());
		
		this._processMode(ExperienceDistributionScreenMode.TOP);
	},
	
	_moveTop: function() {
		var recentlyInput;
		var input = this._levelupUnitWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._processMode(ExperienceDistributionScreenMode.INPUT);
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			recentlyInput = this._levelupUnitWindow.getChildScrollbar().getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				if (this._itemUserWindow.getSkillInteraction().setHelpMode()) {
					this._processMode(ExperienceDistributionScreenMode.HELP);
				}
			}
			
			if (this._levelupUnitWindow.isIndexChanged()) {
				this._itemUserWindow.setItemUserData(this._levelupUnitWindow.getTargetUnit());
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveInput: function() {
		if (this._bonusInputWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._bonusInputWindow.getInputExp() === -1) {
				this._processMode(ExperienceDistributionScreenMode.TOP);
			}
			else {
				this._processMode(ExperienceDistributionScreenMode.LEVEL);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveLevel: function() {
		if (this._restrictedLevelupObject.moveRestrictedLevelupObject() !== MoveResult.CONTINUE) {
			this._itemUserWindow.setItemUserData(this._levelupUnitWindow.getTargetUnit());
			this._processMode(ExperienceDistributionScreenMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveHelp: function() {
		if (!this._itemUserWindow.getSkillInteraction().isHelpMode()) {
			this._processMode(ExperienceDistributionScreenMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_processMode: function(mode) {
		if (mode === ExperienceDistributionScreenMode.TOP) {
			this._levelupUnitWindow.enableSelectCursor(true);
		}
		else if (mode === ExperienceDistributionScreenMode.INPUT) {
			this._levelupUnitWindow.enableSelectCursor(false);
			this._bonusInputWindow.setUnit(this._levelupUnitWindow.getTargetUnit());
		}
		else if (mode === ExperienceDistributionScreenMode.LEVEL) {
			this._restrictedLevelupObject.setUnitAndExp(this._levelupUnitWindow.getTargetUnit(), this._bonusInputWindow.getInputExp());
		}
		else if (mode === ExperienceDistributionScreenMode.HELP) {
			this._levelupUnitWindow.enableSelectCursor(false);
		}
		
		this.changeCycleMode(mode);
	}
}
);

var RestrictedLevelupObjectMode = {
	TOP: 0,
	LEVEL: 1
};

var RestrictedLevelupObject = defineObject(BaseObject,
{
	_targetUnit: null,
	_exp: 0,
	_levelupView: null,
	_growthArray: null,
	_experienceNumberView: null,
	
	initialize: function() {
		this._levelupView = createObject(LevelupView);
		this._experienceNumberView = createWindowObject(ExperienceNumberView, this);
	},
	
	setUnitAndExp: function(targetUnit, exp) {
		this._targetUnit = targetUnit;
		this._exp = exp;
		this._experienceNumberView.setExperienceNumberData(this._targetUnit, this._exp);
		
		this.changeCycleMode(RestrictedLevelupObjectMode.TOP);
	},

	moveRestrictedLevelupObject: function() {
		var result;
		
		if (this.getCycleMode() === RestrictedLevelupObjectMode.TOP) {
			result = this._moveTop();
		}
		else {
			result = this._moveLevel();
		}
		
		return result;
	},
	
	drawRestrictedLevelupObject: function() {
		if (this.getCycleMode() === RestrictedLevelupObjectMode.TOP) {
			this._drawTop();
		}
		else {
			this._drawLevel();
		}
	},
	
	_moveTop: function() {
		var levelupViewParam;
		
		if (this._experienceNumberView.moveNumberView() !== MoveResult.CONTINUE) {
			this._growthArray = RestrictedExperienceControl.obtainExperience(this._targetUnit, this._exp);
			if (this._growthArray === null) {
				return MoveResult.END;
			}
			
			levelupViewParam = this._createLevelupViewParam();
			this._levelupView.enterLevelupViewCycle(levelupViewParam);
			
			this.changeCycleMode(RestrictedLevelupObjectMode.LEVEL);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveLevel: function() {
		if (this._levelupView.moveLevelupViewCycle() !== MoveResult.CONTINUE) {
			ExperienceControl.plusGrowth(this._targetUnit, this._growthArray);
			ExperienceControl.obtainData(this._targetUnit);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawTop: function() {
		var x = LayoutControl.getCenterX(-1, this._experienceNumberView.getNumberViewWidth());
		var y = LayoutControl.getCenterY(-1, this._experienceNumberView.getNumberViewHeight());
		
		this._experienceNumberView.drawNumberView(x, y);
	},
	
	_drawLevel: function() {
		this._levelupView.drawLevelupViewCycle();
	},
	
	_createLevelupViewParam: function() {
		var anime = root.queryAnime('easylevelup');
		var size = Miscellaneous.getFirstKeySpriteSize(anime, 0);
		var levelupViewParam = StructureBuilder.buildLevelupViewParam();
		
		levelupViewParam.targetUnit = this._targetUnit;
		levelupViewParam.getExp = this._exp;
		levelupViewParam.xAnime = LayoutControl.getCenterX(-1, size.width);
		levelupViewParam.yAnime = LayoutControl.getCenterY(-1, size.height);
		levelupViewParam.anime = anime;
		levelupViewParam.growthArray = this._growthArray;
		
		return levelupViewParam;
	}
}
);

var BonusInputWindowMode = {
	NONE: 0,
	INPUT: 1
};

var BonusInputWindow = defineObject(BaseWindow,
{
	_unit: null,
	_isMaxLv: false,
	_exp: 0,
	_max: 0,
	_commandCursor: null,
	
	initialize: function() {
		this._commandCursor = createObject(CommandCursor);
		this._commandCursor.setCursorUpDown(2);
	},
	
	setUnit: function(unit) {
		var bonus = root.getMetaSession().getBonus();
		
		this._unit = unit;
		this._isMaxLv = unit.getLv() === Miscellaneous.getMaxLv(unit);
		
		if (this._isExperienceValueAvailable()) {
			// At a rate of 10 with 500 bonus, a maximum of 50 Exp can be gained.
			this._max = Math.floor(bonus / this._getRate());
			if (this._max > DefineControl.getBaselineExperience()) {
				this._max = DefineControl.getBaselineExperience();
			}
			
			this._exp = 1;
			this.changeCycleMode(BonusInputWindowMode.INPUT);
		}
		else {
			this._exp = -1;
			this.changeCycleMode(BonusInputWindowMode.NONE);
		}
	},
	
	moveWindowContent: function() {
		var result;
		
		if (this.getCycleMode() === BonusInputWindowMode.INPUT) {
			result = this._moveInput();
		}
		else {
			result = this._moveNone();
		}
		
		return result;
	},
	
	drawWindowContent: function(x, y) {
		if (this.getCycleMode() === BonusInputWindowMode.INPUT) {
			this._drawInput(x, y);
		}
		else {
			this._drawNone(x, y);
		}
	},
	
	getWindowWidth: function() {
		return this.getCycleMode() === BonusInputWindowMode.INPUT ? 140 : 260;
	},
	
	getWindowHeight: function() {
		return 56;
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('sub_window');
	},
	
	getInputExp: function() {
		return this._exp;
	},
	
	_moveInput: function() {
		var inputType;
		
		if (InputControl.isSelectAction()) {
			this._changeBonus();
			return MoveResult.END;
		}
		
		if (InputControl.isCancelAction()) {
			this._cancelExp();
			return MoveResult.END;
		}
		
		inputType = this._commandCursor.moveCursor();
		if (inputType === InputType.UP || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			if (++this._exp > this._max) {
				this._exp = 1;
			}
		}
		else if (inputType === InputType.DOWN || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			if (--this._exp < 1) {
				this._exp = this._max;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveNone: function() {
		if (InputControl.isSelectAction() || InputControl.isCancelAction()) {
			this._cancelExp();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawInput: function(x, y) {
		NumberRenderer.drawAttackNumberCenter(x + 50, y, this._exp);
		
		this._commandCursor.drawCursor(x + 5, y, true, this._getCursorPicture());
	},
	
	_drawNone: function(x, y) {
		var range;
		var text = this._getMessage();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var width = this.getWindowWidth() - (this.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (this.getWindowYPadding() * 2);
		
		range = createRangeObject(x, y, width, height);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
	},
	
	_cancelExp: function() {
		this._exp = -1;
		this._playCancelSound();
	},
	
	_changeBonus: function() {
		var bonus = root.getMetaSession().getBonus();
		var n = Math.floor(this._exp * this._getRate());
		
		bonus -= n;
		
		root.getMetaSession().setBonus(bonus);
	},
	
	// Refer to this._unit if the rate is changed for each unit.
	_getRate: function() {
		// If the rate is 1, 1 bonus can grant 1 Exp.
		// If the rate is 10, 10 bonus can grant 1 Exp.
		return root.getUserExtension().getExperienceRate();
	},
	
	// Exp cannot be granted if bonus in possession is less than rate.
	_isExperienceValueAvailable: function() {
		// Exp cannot be granted if bonus in possession is less than rate.
		if (root.getMetaSession().getBonus() < this._getRate()) {
			return false;
		}
		
		if (this._isMaxLv) {
			return false;
		}
		
		return true;
	},
	
	_getMessage: function() {
		return this._isMaxLv ? StringTable.ExperienceDistribution_CannotLevelup : StringTable.ExperienceDistribution_BonusShortage;
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	},
	
	_getCursorPicture: function() {
		return root.queryUI('menu_selectCursor');
	}
}
);

var BonusPointWindow = defineObject(BaseWindow,
{
	moveWindowContent: function() {
		return MoveResult.END;
	},
	
	drawWindowContent: function(x, y) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, this._getCurrencySign(), -1, color, font);
		
		NumberRenderer.drawNumber(x + 90, y, root.getMetaSession().getBonus());
	},
	
	getWindowWidth: function() {
		return 140;
	},
	
	getWindowHeight: function() {
		return 50;
	},
	
	_getCurrencySign: function() {
		return StringTable.CurrencySign_Bonus;
	}
}
);

var LevelupUnitWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setLevelupUnitData: function() {
		this._scrollbar = createScrollbarObject(LevelupUnitScrollbar, this);
		this._scrollbar.setScrollFormation(1, DataConfig.isHighResolution() ? 8 : 6);
		this._scrollbar.setDataList(PlayerList.getAliveList());
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	getTargetUnit: function() {
		return this._scrollbar.getObject();
	}
}
);

var LevelupUnitScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = this._getTextLength();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		
		UnitRenderer.drawDefaultUnit(object, x, y + 4, unitRenderParam);
		TextRenderer.drawKeywordText(x + 60, y + 8, object.getName(), length, color, font);
		
		this._drawLevelInfo(x, y, object);
	},
	
	getObjectWidth: function() {
		return 260;
	},
	
	getObjectHeight: function() {
		return DataConfig.isHighResolution() ? 46 : 48;
	},
	
	_drawLevelInfo: function(x, y, object) {
		var x2 = (x + this.getObjectWidth()) - 56;
		
		y += 8;
		
		if (this._isLevelDisplayable(object)) {
			TextRenderer.drawSignText(x2, y, StringTable.Status_Level);
			NumberRenderer.drawNumber(x2 + 36, y, object.getLv());
		}
		else {
			TextRenderer.drawSignText(x2, y, StringTable.Status_Experience);
			NumberRenderer.drawNumber(x2 + 36, y, object.getExp());
			
			if (this._isCursorDisplayable(object)) {
				this._drawCursor(x2, y);
			}
		}
	},
	
	_drawCursor: function(x, y) {
		var ySrc = 0;
		var pic = root.queryUI('parameter_risecursor');
		var width = UIFormat.RISECURSOR_WIDTH / 2;
		var height = UIFormat.RISECURSOR_HEIGHT / 2;
		
		if (pic !== null) {
			pic.drawParts(x + 38, y - 4, 0, ySrc, width, height);	
		}
	},
	
	_getTextLength: function() {
		return this.getObjectWidth() - 90;
	},
	
	_isLevelDisplayable: function(object) {
		return false;
	},
	
	_isCursorDisplayable: function(object) {
		return object.getExp() >= Math.floor(DefineControl.getBaselineExperience() * 0.9);
	}
}
);
