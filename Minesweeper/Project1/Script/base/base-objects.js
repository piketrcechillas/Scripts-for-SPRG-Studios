
var BaseEventCommand = defineObject(BaseObject,
{
	enterEventCommandCycle: function() {
		return EnterResult.NOTENTER;
	},
	
	moveEventCommandCycle: function() {
		// If the screen is not active, but some animation processing is needed, override this method.
		return MoveResult.END;
	},
	
	drawEventCommandCycle: function() {
	},
	
	backEventCommandCycle: function() {
		return MoveResult.CONTNUE;
	},
	
	mainEventCommand: function() {
	},
	
	isEventCommandContinue: function() {
		// Currently, if the event is a skip state, end by executing only main processing.
		// Even if graphics are not needed to be displayed, end by executing only a main processing.
		if (this.isSystemSkipMode()) {
			this.mainEventCommand();
			// Notify that event command processing should not be continued with the return false because main processing has ended.
			return false;
		}
		
		return true;
	},
	
	stopEventSkip: function() {
		root.setEventSkipMode(false);
	},
	
	isEventCommandSkipAllowed: function() {
		// The event command (such as Choice Show) which doesn't allow skip, return false.
		return true;
	},
	
	isSystemSkipMode: function() {
		// Skip has 2 kinds, event skip and turn skip.
		// Event skip occurs when skip key is pressed in the event and is to skip the event only.
		// It means that turn itself is not skipped.
		
		// Meanwhile, turn event is to skip the enemy's and player's turn themselves.
		// So each player's unit motion as well as the event occurs within the turn are skipped.
		// It means that turn skip includes the event skip, so specifies the isEventSkipMode.  
		return root.isEventSkipMode() || CurrentMap.isTurnSkipMode();
	},
	
	getEventCommandName: function() {
		// If implement original event command, return the name.
		return '';
	}
}
);

var BaseScene = defineObject(BaseObject,
{
	setSceneData: function(screenParam) {
	},
	
	moveSceneCycle: function() {
		return MoveResult.END;
	},
	
	moveBackSceneCycle: function() {
		// If the screen is not active, but some animation processing is needed, override this method.
		return MoveResult.END;
	},
	
	drawSceneCycle: function() {
	}
}
);

var BaseScreen = defineObject(BaseObject,
{
	setScreenData: function(screenParam) {
	},
	
	moveScreenCycle: function() {
		return MoveResult.END;
	},
	
	moveBackScreenCycle: function() {
		// If the screen is not active, but some animation processing is needed, override this method.
		return MoveResult.END;
	},
	
	drawScreenCycle: function() {
	},
	
	drawScreenTopText: function(textui) {
		if (textui === null) {
			return;
		}
		
		TextRenderer.drawScreenTopText(this.getScreenTitleName(), textui);
	},
	
	drawScreenBottomText: function(textui) {
		if (textui === null) {
			return;
		}
		
		TextRenderer.drawScreenBottomTextCenter('', textui);
	},
	
	getScreenInteropData: function() {
		return null;
	},
	
	getScreenTitleName: function() {
		var interopData = this.getScreenInteropData();
		
		if (interopData === null) {
			return '';
		}
		
		return interopData.getScreenTitleName();
	},
	
	getScreenBackgroundImage: function() {
		var interopData = this.getScreenInteropData();
		
		if (interopData === null) {
			return null;
		}
		
		return interopData.getScreenBackgroundImage();
	},
	
	getScreenMusicHandle: function() {
		var interopData = this.getScreenInteropData();
		
		if (interopData === null) {
			return root.createEmptyHandle();
		}
		
		return interopData.getScreenMusicHandle();
	},
	
	getScreenResult: function() {
		return true;
	},
	
	notifyChildScreenClosed: function() {
	}
}
);

var BaseWindow = defineObject(BaseObject,
{
	_isWindowEnabled: true,
	_drawParentData: null,
	
	initialize: function() {
	},
	
	moveWindow: function() {
		return this.moveWindowContent();
	},
	
	moveWindowContent: function() {
		return MoveResult.CONTINUE;
	},
	
	drawWindow: function(x, y) {
		var width = this.getWindowWidth();
		var height = this.getWindowHeight();
		
		if (!this._isWindowEnabled) {
			return;
		}
		
		this._drawWindowInternal(x, y, width, height);
		
		if (this._drawParentData !== null) {
			this._drawParentData(x, y);
		}
		
		// The move method enables to refer to the coordinate with a mouse.
		this.xRendering = x + this.getWindowXPadding();
		this.yRendering = y + this.getWindowYPadding();
		
		this.drawWindowContent(x + this.getWindowXPadding(), y + this.getWindowYPadding());
		
		this.drawWindowTitle(x, y, width, height);
	},
	
	drawWindowContent: function(x, y) {
	},
	
	drawWindowTitle: function(x, y, width, height) {
		var color, font, pic, titleWidth, dx;
		var titleCount = 3;
		var textui = this.getWindowTitleTextUI();
		var text = this.getWindowTitleText();
		
		if (textui === null || text === '') {
			return;
		}
		
		color = textui.getColor();
		font = textui.getFont();
		pic = textui.getUIImage();
		titleWidth = TitleRenderer.getTitlePartsWidth() * (titleCount + 2);
		dx = Math.floor((width - titleWidth) / 2);
		TextRenderer.drawFixedTitleText(x + dx, y - 40, text, color, font, TextFormat.CENTER, pic, titleCount);
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	getWindowTitleTextUI: function() {
		return null;
	},
	
	getWindowTitleText: function() {
		return '';
	},
	
	getWindowWidth: function() {
		return 100;
	},
	
	getWindowHeight: function() {
		return 100;
	},
	
	getWindowXPadding: function() {
		return DefineControl.getWindowXPadding();
	},
	
	getWindowYPadding: function() {
		return DefineControl.getWindowYPadding();
	},
	
	enableWindow: function(isWindowEnabled) {
		this._isWindowEnabled = isWindowEnabled;
	},
	
	setDrawingMethod: function(method) {
		this._drawParentData = method;
	},
	
	_drawWindowInternal: function(x, y, width, height) {
		var pic = null;
		var textui = this.getWindowTextUI();
		
		if (textui !== null) {
			pic = textui.getUIImage();
		}
		
		if (pic !== null) {
			WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		}
	}
}
);

var BaseWindowManager = defineObject(BaseObject,
{
	initialize: function() {
	},
	
	moveWindowManager: function() {
		return MoveResult.CONTINUE;
	},
	
	drawWindowManager: function() {
	},
	
	getTotalWindowWidth: function() {
		return 0;
	},
	
	getTotalWindowHeight: function() {
		return 0;
	},
	
	getPositionWindowX: function() {
		return 0;
	},
	
	getPositionWindowY: function() {
		return 0;
	}
}
);

var BaseNoticeView = defineObject(BaseObject,
{
	moveNoticeView: function() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawNoticeView: function(x, y) {
		var textui = this.getTitleTextUI();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = this.getTitlePartsCount();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);
		
		x += 30;
		y += 18;
		this.drawNoticeViewContent(x, y);
	},
	
	drawNoticeViewContent: function(x, y) {
	},
	
	getNoticeViewWidth: function() {
		return (this.getTitlePartsCount() + 2) * TitleRenderer.getTitlePartsWidth();
	},
	
	getNoticeViewHeight: function() {
		return TitleRenderer.getTitlePartsHeight();
	},
	
	getTitleTextUI: function() {
		return root.queryTextUI('support_title');
	},
	
	getTitlePartsCount: function() {
		return 6;
	}
}
);

var BaseFlowEntry = defineObject(BaseObject,
{
	enterFlowEntry: function(flowData) {
		return EnterResult.NOTENTER;
	},
	
	moveFlowEntry: function() {
		return MoveResult.END;
	},
	
	moveBackFlowEntry: function() {
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
	},
	
	isFlowSkip: function() {
		return CurrentMap.isCompleteSkipMode();
	}
}
);

var BaseTurn = defineObject(BaseObject,
{
	initialize: function() {
	},
	
	openTurnCycle: function() {
	},
	
	moveTurnCycle: function() {
		return MoveResult.END;
	},
	
	drawTurnCycle: function() {
	}
}
);

var BaseBattle = defineObject(BaseObject,
{
	_battleTable: null,
	_attackFlow: null,
	_order: null,
	_attackInfo: null,
	_battlerRight: null,
	_battlerLeft: null,
	_effectArray: null,
	
	initialize: function() {
	},
	
	openBattleCycle: function() {
	},
	
	moveBattleCycle: function() {
		return MoveResult.END;
	},
	
	drawBattleCycle: function() {
	},
	
	backBattleCycle: function() {
	},
	
	eraseRoutine: function() {
	},
	
	notifyStopMusic: function() {
	},
	
	endBattle: function() {
	},
	
	getBattleTable: function() {
		return this._battleTable;
	},
	
	isSyncopeErasing: function() {
		return true;
	},
	
	isBattleSkipAllowed: function() {
		return true;
	},
	
	getAttackFlow: function() {
		return this._attackFlow;
	},
	
	getAttackOrder: function() {
		return this._order;
	},
	
	getAttackInfo: function() {
		return this._attackInfo;
	},
	
	getBattler: function(isRight) {
		var battler;
		
		if (isRight) {
			battler = this._battlerRight;
		}
		else {
			battler = this._battlerLeft;
		}
		
		return battler;
	},
	
	// Active unit is the unit to attack from now on.
	// Active unit can be on the right side and on the left side.  
	getActiveBattler: function() {
		var unit = this._order.getActiveUnit();
		
		if (unit === this._battlerRight.getUnit()) {
			return this._battlerRight;
		}
		
		return this._battlerLeft;
	},
	
	// Passive unit is the unit to be attacked from now on.
	getPassiveBattler: function() {
		var unit = this._order.getPassiveUnit();
		
		if (unit === this._battlerRight.getUnit()) {
			return this._battlerRight;
		}
		
		return this._battlerLeft;
	},
	
	createEffect: function(anime, x, y, right, isHitCheck) {
		var effect = createObject(RealEffect);
		
		if (anime === null) {
			return null;
		}
		
		effect.setupRealEffect(anime, x, y, right, this);
		effect.setHitCheck(isHitCheck);
		
		this._effectArray.push(effect);
		
		return effect;
	},
	
	createEasyEffect: function(anime, x, y) {
		var effect = createObject(RealEffect);
		
		if (anime === null) {
			return null;
		}
		
		effect.setupRealEffect(anime, x, y, true, this);
		effect.setEasyFlag(true);
		
		this._effectArray.push(effect);
		
		return effect;
	},
	
	pushCustomEffect: function(object) {
		this._effectArray.push(object);
	},
	
	getEffectArray: function() {
		return this._effectArray;
	},
	
	_moveEffect: function() {
		var i, effect;
		var count = this._effectArray.length;
		
		for (i = 0; i < count; i++) {
			effect = this._effectArray[i];
			effect.moveEffect();
			if (effect.isEffectLast()) {
				i--;
				count--;
				this._removeEffect(effect);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAsyncEffect: function() {
		var i, effect;
		var count = this._effectArray.length;
		
		for (i = 0; i < count; i++) {
			effect = this._effectArray[i];
			if (!effect.isAsync()) {
				continue;
			}
			
			effect.moveEffect();
			if (effect.isEffectLast()) {
				i--;
				count--;
				this._removeEffect(effect);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawEffect: function() {
		var i, effect;
		var effectArray = this._effectArray;
		var count = effectArray.length;
		
		for (i = 0; i < count; i++) {
			effect = effectArray[i];
			effect.drawEffect(0, 0, false);
		}
	},
	
	_removeEffect: function(effect) {
		var i;
		var count = this._effectArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._effectArray[i] === effect) {
				this._effectArray.splice(i, 1);
				break;
			}
		}
	},
	
	_isSyncEffectLast: function() {
		var i;
		var count = this._effectArray.length;
		
		for (i = 0; i < count; i++) {
			if (!this._effectArray[i].isAsync()) {
				return false;
			}
		}
		
		return true;
	}
}
);

var BaseCustomEffect = defineObject(BaseObject,
{
	_isLast: false,
	_isAsync: false,
	
	moveEffect: function() {
		return MoveResult.CONTINUE;
	},
	
	drawEffect: function(xScroll, yScroll) {
	},
	
	endEffect: function() {
		this._isLast = true;
	},
	
	isEffectLast: function() {
		return this._isLast;
	},
	
	getEffectX: function() {
		return 0;
	},
	
	getEffectY: function() {
		return 0;
	},
	
	setAsync: function(isAsync) {
		this._isAsync = isAsync;
	},
	
	isAsync: function() {
		return this._isAsync;
	},
	
	getAnimeMotion: function() {
		return null;
	}
}
);
