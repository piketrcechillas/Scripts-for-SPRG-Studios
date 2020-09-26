
var MultiClassChangeMode = {
	TOP: 0,
	HELP: 1,
	CHANGEQUESTION: 2,
	ANIME: 3,
	NOCHANGE: 4
};

var MultiClassChangeScreen = defineObject(BaseScreen,
{
	_unit: null,
	_isMapCall: false,
	_classInfoWindow: null,
	_classParameterWindow: null,
	_classSelectWindow: null,
	_infoWindow: null,
	_questionWindow: null,
	_dynamicAnime: null,
	_classEntryArray: null,
	_currentIndex: 0,
	_returnData: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === MultiClassChangeMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === MultiClassChangeMode.HELP) {
			result = this._moveHelp();
		}
		else if (mode === MultiClassChangeMode.CHANGEQUESTION) {
			result = this._moveChangeQuestion();
		}
		else if (mode === MultiClassChangeMode.ANIME) {
			result = this._moveAnime();	
		}
		else if (mode === MultiClassChangeMode.NOCHANGE) {
			result = this._moveNoChangeMode();
		}
		
		this._moveInfoParameter();
		
		return result;
	},
	
	drawScreenCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode !== MultiClassChangeMode.NOCHANGE) {
			this._drawMainWindow();
		}
		
		this._drawSubWindow();
		
		if (mode === MultiClassChangeMode.ANIME) {
			this._drawAnime();	
		}
	},
	
	drawScreenBottomText: function(textui) {
		var text, classEntry;
		
		if (this._classEntryArray === null) {
			return;
		}
		
		if (this._classInfoWindow.getSkillInteraction().isInteraction()) {
			text = this._classInfoWindow.getSkillInteraction().getHelpText();
		}
		else {
			classEntry = this._classEntryArray[this._currentIndex];
			if (classEntry.isChange) {
				text = classEntry.cls.getDescription();
			}
			else {
				text = '';
			}
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('ClassChange');
	},
	
	getScreenResult: function() {
		return this._returnData;
	},
	
	getTotalWindowHeight: function() {
		return this._classInfoWindow.getWindowHeight() + this._classParameterWindow.getWindowHeight();
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._unit = screenParam.unit;
		this._isMapCall = screenParam.isMapCall;
		this._classInfoWindow = createWindowObject(MultiClassInfoWindow, this);
		this._classParameterWindow = createWindowObject(MultiClassParameterWindow, this);
		this._classSelectWindow = createWindowObject(MultiClassSelectWindow, this);
		this._infoWindow = createWindowObject(InfoWindow, this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._dynamicAnime = createWindowObject(DynamicAnime, this);
		this._classEntryArray = null;
		this._currentIndex = 0;
		this._returnData = null;
	},
	
	_completeScreenMemberData: function(screenParam) {
		var classEntryArray = this._getClassEntryArray(screenParam);
		
		if (classEntryArray.length > 0) {
			this._questionWindow.setQuestionMessage(this._getQuestionMessage());
			this._classSelectWindow.setClassSelectData(this._unit, classEntryArray);
			this._classInfoWindow.setClassInfoData(this._unit, classEntryArray[0]);
			this._classParameterWindow.setClassParameterData(this._unit, classEntryArray[0]);
			
			this._classEntryArray = classEntryArray;
			this.changeCycleMode(MultiClassChangeMode.TOP);
		}
		else {
			// If class group doesn't exist, or class group is blank, class cannot be changed.
			this._infoWindow.setInfoMessage(StringTable.ClassChange_UnableClassChange);
			this.changeCycleMode(MultiClassChangeMode.NOCHANGE);
		}
	},
	
	_moveTop: function() {
		var index, input, recentlyInput;
		var result = MoveResult.CONTINUE;
		
		input = this._classSelectWindow.moveWindow();
		if (input === ScrollbarInput.SELECT) {
			if (this._classEntryArray[this._currentIndex].isChange) {
				this._classSelectWindow.enableSelectCursor(false);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(MultiClassChangeMode.CHANGEQUESTION);
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._isMapCall) {
				this._returnData = null;
			}
				
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.NONE) {
			recentlyInput = this._classSelectWindow.getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				this._setHelpMode();
			}
			else {
				index = this._classSelectWindow.getClassEntryIndex();
				if (index !== this._currentIndex) {
					this._currentIndex = index;
					this._classInfoWindow.setClassInfoData(this._unit, this._classEntryArray[index]);
					this._classParameterWindow.setBonusStatus(this._unit, this._classEntryArray[index]);
				}
			}
		}
		
		return result;
	},
	
	_moveHelp: function() {
		if (!this._classInfoWindow.getSkillInteraction().isHelpMode()) {
			this._classSelectWindow.enableSelectCursor(true);
			this.changeCycleMode(MultiClassChangeMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveChangeQuestion: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				if (this._isMapCall) {
					this._setScreenResult();
					// Class change animation is displayed on the map, so end it here.
					return MoveResult.END;
				}
				
				this._startAnime();
				
				this.changeCycleMode(MultiClassChangeMode.ANIME);
			}
			else {
				this._classSelectWindow.enableSelectCursor(true);
				this.changeCycleMode(MultiClassChangeMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAnime: function() {
		var cls = this._classEntryArray[this._currentIndex];
		
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this._classInfoWindow.setClass(cls);
			this._classParameterWindow.notifyNewClass(this._unit, cls);
			this._classSelectWindow.enableSelectCursor(true);
			this.changeCycleMode(MultiClassChangeMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveNoChangeMode: function() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			this._playCancelSound();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveInfoParameter: function() {
		var mode = this.getCycleMode();
		
		if (mode !== MultiClassChangeMode.NOCHANGE) {
			this._classInfoWindow.moveWindow();
			this._classParameterWindow.moveWindow();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawAnime: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_drawMainWindow: function() {
		var width = this._classSelectWindow.getWindowWidth() + this._classParameterWindow.getWindowWidth();
		var height = this._classSelectWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		width = this._classSelectWindow.getWindowWidth();
		height = this._classParameterWindow.getWindowHeight();
		
		this._classSelectWindow.drawWindow(x, y);
		this._classParameterWindow.drawWindow(x + width, y);
		this._classInfoWindow.drawWindow(x + width, y + height);
	},
	
	_drawSubWindow: function() {
		var x, y;
		var mode = this.getCycleMode();
		
		if (mode === MultiClassChangeMode.CHANGEQUESTION) {
			x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
			this._questionWindow.drawWindow(x, y);
		}
		else if (mode === MultiClassChangeMode.NOCHANGE) {
			x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
			this._infoWindow.drawWindow(x, y);
		}
	},
	
	_startAnime: function() {
		var anime = root.queryAnime('classchange');
		var pos = this._classInfoWindow.getClassChangeAnimePos();
		var width = this._classSelectWindow.getWindowWidth();
		var height =  this._classSelectWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._dynamicAnime.startDynamicAnime(anime, x + pos.x, y + pos.y + this._classParameterWindow.getWindowHeight());
	},
	
	_setHelpMode: function() {
		var classEntry;
		
		if (this._classEntryArray === null) {
			return;
		}
		
		classEntry = this._classEntryArray[this._currentIndex];
		if (!classEntry.isChange) {
			return;
		}
		
		if (this._classInfoWindow.getSkillInteraction().setHelpMode()) {
			this._classSelectWindow.enableSelectCursor(false);
			this.changeCycleMode(MultiClassChangeMode.HELP);
		}
	},
	
	_setScreenResult: function() {
		this._returnData = this._classEntryArray[this._currentIndex].cls;
	},
	
	_getClassEntryArray: function(screenParam) {
		return ClassChangeChecker.getClassEntryArray(screenParam.unit, screenParam.isMapCall);
	},
	
	_getQuestionMessage: function() {
		return StringTable.ClassChange_UnitClassChange;
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	}
}
);

var MultiClassInfoWindowMode = {
	TOP: 0,
	SKILL: 1
};

var MultiClassInfoWindow = defineObject(BaseWindow,
{
	_unit: null,
	_targetClass: null,
	_motionId: 0,
	_isClassDraw: false,
	_animeData: null,
	_animeSimple: null,
	_animeRenderParam: null,
	_unitRenderParam: null,
	_isHelpMode: false,
	_handle: null,
	_skillInteraction: null,
	
	initialize: function() {
		this._skillInteraction = createObject(SkillInteraction);
	},
	
	setClassInfoData: function(unit, classEntry) {
		this._unit = unit;
		this._targetClass = classEntry.cls;
		this._isClassDraw = classEntry.isChange;
		this._setSkillData();
		this._setBattleMotionGraphics();
		
		this._handle = this._getTargetHandle();
		
		this.changeCycleMode(MultiClassInfoWindowMode.TOP);
	},
	
	moveWindowContent: function() {
		this._skillInteraction.moveInteraction();
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		var textui = root.queryTextUI('decoration_title');
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		WeaponTypeRenderer.drawTitle(x + 220, y - 10, color, font, pic);
		SkillRenderer.drawTitle(x + 220, y + 70, color, font, pic);
		
		if (this._isClassDraw) {
			WeaponTypeRenderer.drawClassWeaponList(x + 220, y + 50, this._targetClass);
			this._skillInteraction.getInteractionScrollbar().drawScrollbar(x + 220, y + 130);
			
			this._drawClassGraphics(x, y);
		}
		else {
			TextRenderer.drawText(x + 60, y + 80, StringTable.HideData_Unknown, -1, color, font);
		}
		
		if (this._skillInteraction.isInteraction()) {
			this._skillInteraction.getInteractionWindow().drawWindow(x, y);
		}
	},
	
	getWindowWidth: function() {
		return 450;
	},
	
	getWindowHeight: function() {
		return 190;
	},
	
	// It's called when class change is executed.
	setClass: function(classEntry) {
		if (this._animeRenderParam !== null) {
			this._animeRenderParam.alpha = 255;
		}
		else {
			this._unitRenderParam.alpha = 255;
		}
		
		Miscellaneous.changeClass(this._unit, classEntry.cls);
		this._unit.setHp(ParamBonus.getMhp(this._unit));
	},
	
	getClassChangeAnimePos: function() {
		return createPos(-50, 0);
	},
	
	getSkillInteraction: function() {
		return this._skillInteraction;
	},
	
	_setBattleMotionGraphics: function() {
		var alpha = 255;
		var animeData = BattlerChecker.findBattleAnime(this._targetClass, null);
		
		if (this._unit.getClass() !== this._targetClass) {
			alpha = 128;
		}
		
		if (DataConfig.isMotionGraphicsEnabled() && animeData !== null) {
			this._motionId = this._getMotionId();
			this._animeData = animeData;
			
			this._animeSimple = createObject(NonBattleAnimeSimple);
			this._animeSimple.setAnimeData(animeData);
			this._animeSimple.setMotionId(this._motionId);
			
			this._animeRenderParam = StructureBuilder.buildAnimeRenderParam();
			this._animeRenderParam.alpha = alpha;
			this._animeRenderParam.isRight = true;
			this._animeRenderParam.motionColorIndex = Miscellaneous.getMotionColorIndex(this._unit);
		}
		else {
			this._unitRenderParam = StructureBuilder.buildUnitRenderParam();
			this._unitRenderParam.alpha = alpha;
			this._unitRenderParam.handle = this._getTargetHandle();
		}
	},
	
	_setSkillData: function() {
		var i;
		var refList = this._targetClass.getSkillReferenceList();
		var count = refList.getTypeCount();
		var arr = [];
		var skillEntry;
		
		for (i = 0; i < count; i++) {
			data = refList.getTypeData(i);
			if (!data.isHidden()) {
				skillEntry = StructureBuilder.buildMixSkillEntry();
				skillEntry.skill = data;
				skillEntry.objecttype = ObjectType.CLASS;
				arr.push(skillEntry);
			}
		}
		
		this._skillInteraction.setSkillArray(arr);
	},
	
	_drawClassGraphics: function(x, y) {
		var frameIndex, spriteIndex;
		var animeCoordinates = StructureBuilder.buildAnimeCoordinates();
		
		if (this._animeSimple !== null) {
			frameIndex = 0;
			spriteIndex = this._animeData.getSpriteIndexFromType(this._motionId, frameIndex, SpriteType.KEY);
			animeCoordinates.xBase = x + 96;
			animeCoordinates.yBase = y + 145;
			this._animeSimple.drawMotion(frameIndex, spriteIndex, this._animeRenderParam, animeCoordinates);
		}
		else {
			UnitRenderer.drawDefaultUnit(this._unit, x + 80, y + 85, this._unitRenderParam);
		}
	},
	
	_getTargetHandle: function() {
		var xSrc, ySrc;
		var handle = this._targetClass.getCharChipResourceHandle();
		var isRuntime = handle.getHandleType() === ResourceHandleType.RUNTIME;
		var id = handle.getResourceId();
		var colorIndex = handle.getColorIndex();
		
		handle = this._unit.getCharChipResourceHandle();
		xSrc = handle.getSrcX();
		ySrc = handle.getSrcY();
		
		return root.createResourceHandle(isRuntime, id, colorIndex, xSrc, ySrc);
	},
	
	_getMotionId: function() {
		return MotionIdControl.getWaitId(this._unit, null);
	}
}
);

var MultiClassParameterWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setClassParameterData: function(targetUnit, classEntry) {
		this._scrollbar = createScrollbarObject(StatusScrollbar, this);
		this._scrollbar.enableStatusBonus(true);
		this._scrollbar.setStatusFromUnit(targetUnit);
		this.setBonusStatus(targetUnit, classEntry);
	},
	
	moveWindowContent: function() {
		// Call moveScrollbarContent, not moveScrollbarCursor.
		// Obj MultiClassChangeScreen._classSelectWindow is speed up if the cursor move is occurred.
		this._scrollbar.moveScrollbarContent();
		
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
	},
	
	setBonusStatus: function(unit, targetClassEntry) {
		var i, bonusArray, bonusArrayTarget;
		var newBonusArray = [];
		var count = ParamGroup.getParameterCount();
		
		if (targetClassEntry.isChange) {
			bonusArray = this.getClassBonusArray(unit.getClass());
			bonusArrayTarget = this.getClassBonusArray(targetClassEntry.cls);
			for (i = 0; i < count; i++) {
				newBonusArray[i] = bonusArrayTarget[i] - bonusArray[i];
			}
		}
		else {
			for (i = 0; i < count; i++) {
				newBonusArray[i] = 0;
			}
		}
		
		this._scrollbar.setStatusBonus(newBonusArray);
	},
	
	getClassBonusArray: function(cls) {
		var i;
		var count = ParamGroup.getParameterCount();
		var bonusArray = [];
		
		for (i = 0; i < count; i++) {
			bonusArray[i] = ParamGroup.getParameterBonus(cls, i);
		}
		
		return bonusArray;
	},
	
	notifyNewClass: function(unit, cls) {
		this._scrollbar.setStatusFromUnit(unit);
		this.setBonusStatus(unit, cls);
	}
}
);

var MultiClassSelectWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setClassSelectData: function(unit, classEntryArray) {
		var i, count;
		
		this._scrollbar = createScrollbarObject(MultiClassSelectScrollbar, this);
		this._scrollbar.setScrollFormation(1, 7);
		this._scrollbar.resetScrollData();
		
		count = classEntryArray.length;
		for (i = 0; i < count; i++) {
			this._scrollbar.objectSet(classEntryArray[i]);
		}
		
		this._scrollbar.objectSetEnd();
		
		this._scrollbar.setActive(true);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return 160;
	},
	
	getWindowHeight: function() {
		return SceneManager.getLastScreen().getTotalWindowHeight();
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	},
	
	getRecentlyInputType: function() {
		return this._scrollbar.getRecentlyInputType();
	},
	
	getClassEntryIndex: function() {
		return this._scrollbar.getIndex();
	}
}
);

var MultiClassSelectScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (!object.isChange) {
			color = ColorValue.DISABLE;
		}
		
		TextRenderer.drawKeywordText(x, y, object.name, length, color, font);
	},
	
	playSelectSound: function() {
		var object = this.getObject();
		var isSelect = true;
		
		if (!object.isChange) {
			isSelect = false;
		}
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	},
	
	getObjectWidth: function() {
		return DefineControl.getTextPartsWidth();
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);


//------------------------------------------------------------------


var MetamorphozeScreen = defineObject(MultiClassChangeScreen,
{
	drawScreenBottomText: function(textui) {
		var text, classEntry;
		
		if (this._classEntryArray === null) {
			return;
		}
		
		if (this._classInfoWindow.getSkillInteraction().isInteraction()) {
			text = this._classInfoWindow.getSkillInteraction().getHelpText();
		}
		else {
			classEntry = this._classEntryArray[this._currentIndex];
			if (classEntry.isChange && classEntry.metamorphozeData !== null) {
				text = classEntry.metamorphozeData.getDescription();
			}
			else {
				text = '';
			}
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Metamorphoze');
	},
	
	_setScreenResult: function() {
		this._returnData = this._classEntryArray[this._currentIndex].metamorphozeData;
	},
	
	_getClassEntryArray: function(screenParam) {
		var i, classEntry, metamorphozeData;
		var unit = screenParam.unit;
		var count = screenParam.refList.getTypeCount();
		var classEntryArray = [];
		
		for (i = 0; i < count; i++) {
			metamorphozeData = screenParam.refList.getTypeData(i);
			
			classEntry = StructureBuilder.buildMultiClassEntry();
			classEntry.cls = metamorphozeData.getClass();
			classEntry.isChange = MetamorphozeControl.isMetamorphozeAllowed(unit, metamorphozeData);
			if (classEntry.isChange) {
				classEntry.name = metamorphozeData.getName();
			}
			else {
				classEntry.name = StringTable.HideData_Question;
			}
			
			classEntry.metamorphozeData = metamorphozeData;
			
			classEntryArray.push(classEntry);
		}
		
		return classEntryArray;
	},
	
	_getQuestionMessage: function() {
		return StringTable.Metamorphoze_Change;
	}
}
);
