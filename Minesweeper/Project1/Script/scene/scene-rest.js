
var RestSceneMode = {
	OPENING: 0,
	AUTOEVENTCHECK: 1,
	SELECT: 2,
	ENDING: 3
};

var RestScene = defineObject(BaseScene,
{
	_restCommandManager: null,
	_eventChecker: null,
	_scrollBackground: null,
	_straightFlowOpening: null,
	_straightFlowEnding: null,
	_isRestFinal: false,
	_isBackgroundEnabled: false,
	
	setSceneData: function() {
		// Discard the old map information.
		SceneManager.resetCurrentMap();
		
		// For opening event, paint on the screen in advance.
		SceneManager.setEffectAllRange(true);
		
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	},
	
	moveSceneCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RestSceneMode.OPENING) {
			result = this._moveOpening();
		}
		else if (mode === RestSceneMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === RestSceneMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === RestSceneMode.ENDING) {
			result = this._moveEnding();
		}
		
		this._moveCommonAnimation();
		
		return result;
	},
	
	drawSceneCycle: function() {
		var mode = this.getCycleMode();
		
		if (this._isBackgroundEnabled) {
			this._drawBackground();
			this._drawAreaName();
			this._drawCommand();
		}
		
		if (mode === RestSceneMode.OPENING) {
			this._straightFlowOpening.drawStraightFlow();
		}
		else if (mode === RestSceneMode.ENDING) {
			this._straightFlowEnding.drawStraightFlow();
		}
	},
	
	moveBackSceneCycle: function() {
		this._moveCommonAnimation();
		return MoveResult.CONTINUE;
	},
	
	getRestArea: function() {
		return root.getRestPreference().getActiveRestArea();
	},
	
	endRest: function() {
		this._isRestFinal = true;
	},
	
	enableBackground: function() {
		this._isBackgroundEnabled = true;
	},
	
	_prepareSceneMemberData: function() {
		this._restCommandManager = createObject(RestCommand);
		this._eventChecker = createObject(RestAutoEventChecker);
		this._scrollBackground = createObject(ScrollBackground);
		this._straightFlowOpening = createObject(StraightFlow);
		this._straightFlowEnding = createObject(StraightFlow);
	},
	
	_completeSceneMemberData: function() {
		if (root.getSceneController().isActivatedFromSaveFile()) {
			MediaControl.resetMusicList();
		}
		
		this._restCommandManager.openListCommandManager();
		
		this._straightFlowOpening.setStraightFlowData(this);
		this._pushFlowOpeningEntries(this._straightFlowOpening);
		
		this._straightFlowEnding.setStraightFlowData(this);
		this._pushFlowEndingEntries(this._straightFlowEnding);
		
		this._changeOpening();
	},
	
	_changeOpening: function() {
		this._setBackgroundData();
		this._straightFlowOpening.enterStraightFlow();
		this.changeCycleMode(RestSceneMode.OPENING);
	},
	
	_setBackgroundData: function() {
		this._scrollBackground.startScrollBackground(this.getRestArea().getBackgroundImage());
	},
	
	_moveOpening: function() {
		if (this._straightFlowOpening.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._changeEventMode();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAutoEventCheck: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this.changeCycleMode(RestSceneMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveSelect: function() {
		var nextmode;
		var prevmode = this._restCommandManager.getCycleMode();
		
		this._restCommandManager.moveListCommandManager();
		nextmode = this._restCommandManager.getCycleMode();
		
		// When selecting a command with a command selection mode, the screen etc. is displayed.
		// Check if the screen was canceled and got back to the command mode again.
		if (prevmode === ListCommandManagerMode.OPEN && nextmode === ListCommandManagerMode.TITLE) {
			if (this._isRestFinal) {
				this._straightFlowEnding.enterStraightFlow();
				this.changeCycleMode(RestSceneMode.ENDING);
			}
			else {
				this._changeEventMode();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEnding: function() {
		if (this._straightFlowEnding.moveStraightFlow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveCommonAnimation: function() {
		this._scrollBackground.moveScrollBackground();
	},
	
	_drawBackground: function() {
		this._scrollBackground.drawScrollBackground();
	},
	
	_drawAreaName: function() {
		// Draw the location name at the upper right on the screen.
	},
	
	_drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === RestSceneMode.OPENING || mode === RestSceneMode.SELECT || mode === RestSceneMode.AUTOEVENTCHECK) {
			this._restCommandManager.drawListCommandManager();
		}
	},
	
	_changeEventMode: function() {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), RestAutoType.TOP);
		if (result === EnterResult.NOTENTER) {
			// Rebuild a command because the command display is changed by the switch control in the event.
			this._rebuildRestCommand();
			this.changeCycleMode(RestSceneMode.SELECT);
		}
		else {
			this.changeCycleMode(RestSceneMode.AUTOEVENTCHECK);
		}
	},
	
	_rebuildRestCommand: function() {
		var index = this._restCommandManager.getCommandScrollbar().getIndex();
		
		this._restCommandManager.rebuildCommand();
		this._restCommandManager.getCommandScrollbar().setIndex(index);
	},
	
	_pushFlowOpeningEntries: function(straightFlow) {
		straightFlow.pushFlowEntry(RestOpeningFlowEntry);
		straightFlow.pushFlowEntry(RestMusicFlowEntry);
	},
	
	_pushFlowEndingEntries: function(straightFlow) {
		straightFlow.pushFlowEntry(RestEndingFlowEntry);
		straightFlow.pushFlowEntry(RestNextFlowEntry);
	}
}
);

var RestOpeningMode = {
	EVENT: 0,
	FADEIN: 1
};

var RestOpeningFlowEntry = defineObject(BaseFlowEntry,
{
	_evetChecker: null,
	_transition: null,
	
	enterFlowEntry: function(restScene) {
		this._prepareMemberData(restScene);
		return this._completeMemberData(restScene);
	},
	
	moveFlowEntry: function() {
		var result = MoveResult.END;
		var mode = this.getCycleMode();
		
		if (mode === RestOpeningMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === RestOpeningMode.FADEIN) {
			result = this._moveFadein();
		}
		
		return result;
	},
	
	drawFlowEntry: function() {
		var mode = this.getCycleMode();
		
		if (mode === RestOpeningMode.FADEIN) {
			this._drawFadein();
		}
	},
	
	_prepareMemberData: function(restScene) {
		this._eventChecker = createObject(RestEventChecker);
		this._transition = createObject(SystemTransition);
	},
	
	_completeMemberData: function(restScene) {
		var result;
		
		if (root.isOpeningEventSkip()) {
			this._eventChecker.enableAllSkip();
		}
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getOpeningEventList(), EventType.OPENING);
		if (result === EnterResult.NOTENTER) {
			this._doLastAction();
		}
		else {
			this.changeCycleMode(RestOpeningMode.EVENT);
		}
		
		return EnterResult.OK;
	},
	
	_moveEvent: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this._doLastAction();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveFadein: function() {
		return this._transition.moveTransition();
	},
	
	_drawFadein: function() {
		this._transition.drawTransition();
	},
	
	_doLastAction: function() {
		SceneManager.getActiveScene().enableBackground();
		
		this._resetOpeningEventList();
		
		SceneManager.setEffectAllRange(true);
		this._transition.setFadeSpeed(10);
		this._transition.setDestIn();
		this.changeCycleMode(RestOpeningMode.FADEIN);
	},
	
	_resetOpeningEventList: function() {
		var i, event;
		var list = root.getCurrentSession().getOpeningEventList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			event.setExecutedMark(EventExecutedType.FREE);
		}
	}
}
);

var RestMusicFlowEntry = defineObject(BaseFlowEntry,
{
	enterFlowEntry: function(restScene) {
		this._prepareMemberData(restScene);
		return this._completeMemberData(restScene);
	},
	
	moveFlowEntry: function() {
		return MoveResult.END;
	},
	
	_prepareMemberData: function(restScene) {
	},
	
	_completeMemberData: function(restScene) {
		this._playSetupMusic(restScene);
		return EnterResult.NOTENTER;
	},
	
	_playSetupMusic: function(restScene) {
		MediaControl.clearMusicCache();
		MediaControl.musicPlayNew(restScene.getRestArea().getMusicHandle());
	}
}
);

var RestEndingMode = {
	FADEOUT: 0,
	EVENT: 1
};

var RestEndingFlowEntry = defineObject(BaseFlowEntry,
{
	_evetChecker: null,
	_transition: null,
	
	enterFlowEntry: function(restScene) {
		this._prepareMemberData(restScene);
		return this._completeMemberData(restScene);
	},
	
	moveFlowEntry: function() {
		var result = MoveResult.END;
		var mode = this.getCycleMode();
		
		if (mode === RestEndingMode.FADEOUT) {
			result = this._moveFadeout();
		}
		else if (mode === RestEndingMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	},
	
	drawFlowEntry: function() {
		var mode = this.getCycleMode();
		
		if (mode === RestEndingMode.FADEOUT) {
			this._drawFadeout();
		}
	},
	
	_prepareMemberData: function(restScene) {
		this._eventChecker = createObject(RestEventChecker);
		this._transition = createObject(SystemTransition);
	},
	
	_completeMemberData: function(restScene) {
		this._transition.setDestOut();
		this._transition.setFadeSpeed(5);
		this.changeCycleMode(RestEndingMode.FADEOUT);
		
		return EnterResult.OK;
	},
	
	_moveFadeout: function() {
		var result;
		
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			result = this._eventChecker.enterEventChecker(root.getCurrentSession().getEndingEventList(), EventType.ENDING);
			if (result === EnterResult.NOTENTER) {
				this._doLastAction();
				return MoveResult.END;
			}
			else {
				this.changeCycleMode(RestEndingMode.EVENT);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this._doLastAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawFadeout: function() {
		this._transition.drawTransition();
	},
	
	_doLastAction: function() {
	}
}
);

var RestNextFlowEntry = defineObject(BaseFlowEntry,
{	
	enterFlowEntry: function(restScene) {
		var mapId = root.getSceneController().getNextMapId();
		
		root.getSceneController().startNewMap(mapId);
		root.changeScene(SceneType.BATTLESETUP);
		
		return EnterResult.NOTENTER;
	}
}
);

var RestCommand = defineObject(BaseListCommandManager,
{	
	getPositionX: function() {
		return LayoutControl.getRelativeX(8);
	},
	
	getPositionY: function() {
		return LayoutControl.getRelativeY(12);
	},
	
	getCommandTextUI: function() {
		return root.queryTextUI('restcommand_title');
	},
	
	configureCommands: function(groupArray) {
		var mixer = createObject(CommandMixer);
		
		if (this._isQuestDisplayable()) {
			mixer.pushCommand(RestCommand.Quest, CommandActionType.QUEST);
		}
		if (this._isImageTalkDisplayable()) {
			mixer.pushCommand(RestCommand.ImageTalk, CommandActionType.IMAGETALK);
		}
		if (this._isNextCommandDisplayable()) {
			mixer.pushCommand(RestCommand.Next, CommandActionType.NEXT);
		}
		
		mixer.mixCommand(CommandLayoutType.REST, groupArray, BaseListCommand);
	},
	
	_checkTracingScroll: function() {
	},
	
	_playCommandOpenSound: function() {
	},
	
	_isQuestDisplayable: function() {
		var i;
		var list = root.getBaseData().getRestQuestList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			if (list.getData(i).isQuestDisplayable()) {
				return true;
			}
		}
		
		return false;
	},
	
	_isImageTalkDisplayable: function() {
		var i;
		var list = root.getCurrentSession().getTalkEventList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			if (list.getData(i).isEvent()) {
				return true;
			}
		}
		
		return false;
	},
	
	_isNextCommandDisplayable: function() {
		return root.getSceneController().getNextMapId() !== MapIdValue.COMPLETE;
	}
}
);

RestCommand.Quest = defineObject(BaseListCommand, 
{
	_questScreen: null,
	
	openCommand: function() {
		var screenParam = this._createScreenParam();
		
		this._questScreen = createObject(QuestScreen);
		SceneManager.addScreen(this._questScreen, screenParam);
	},
	
	moveCommand: function() {
		if (SceneManager.isScreenClosed(this._questScreen)) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildQuest();
		
		return screenParam;
	}
}
);

RestCommand.ImageTalk = defineObject(BaseListCommand, 
{
	_imageTalkScreen: null,
	
	openCommand: function() {
		var screenParam = this._createScreenParam();
		
		this._imageTalkScreen = createObject(ImageTalkScreen);
		SceneManager.addScreen(this._imageTalkScreen, screenParam);
	},
	
	moveCommand: function() {
		if (SceneManager.isScreenClosed(this._imageTalkScreen)) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildImageTalk();
		
		return screenParam;
	}
}
);

RestCommand.Next = defineObject(BaseListCommand,
{
	_questionWindow: null,
	
	openCommand: function() {
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(StringTable.Rest_Next);
		this._questionWindow.setQuestionActive(true);
	},
	
	moveCommand: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				SceneManager.getActiveScene().endRest();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawCommand: function() {
		var x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
		
		this._questionWindow.drawWindow(x, y);
	}
}
);
