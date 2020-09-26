
var TurnChangeStartMode = {
	TOP: 0,
	EVENT: 1
};

var BaseTurnChange = defineObject(BaseObject,
{
	_straightFlow: null,
	_eventChecker: null,
	
	enterTurnChangeCycle: function() {
		this._prepareMemberData();
		return this._completeMemberData();
	},
	
	moveTurnChangeCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === TurnChangeStartMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === TurnChangeStartMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	},
	
	drawTurnChangeCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === TurnChangeStartMode.TOP) {
			this._straightFlow.drawStraightFlow();
		}
	},
	
	doLastAction: function() {
	},
	
	getStartEndType: function() {
		return 0;
	},
	
	pushFlowEntries: function(straightFlow) {
	},
	
	_prepareMemberData: function() {
		this._straightFlow = createObject(StraightFlow);
		this._eventChecker = createObject(EventChecker);
	},
	
	_completeMemberData: function() {
		var result;
		
		this._straightFlow.setStraightFlowData(this);
		this.pushFlowEntries(this._straightFlow);
		
		result = this._straightFlow.enterStraightFlow();
		if (result === EnterResult.NOTENTER) {
			if (this._enterEvent() === EnterResult.NOTENTER) {
				this.doLastAction();
				return EnterResult.NOTENTER;
			}
			this.changeCycleMode(TurnChangeStartMode.EVENT);
		}
		else {
			this.changeCycleMode(TurnChangeStartMode.TOP);
		}
		
		return EnterResult.OK;
	},
	
	_enterEvent: function() {
		var startEndType = this.getStartEndType();
		
		root.getCurrentSession().setStartEndType(startEndType);
		
		return this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), EventType.AUTO);
	},
	
	_moveTop: function() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			if (this._enterEvent() === EnterResult.NOTENTER) {
				this.doLastAction();
				return MoveResult.END;
			}
			
			this.changeCycleMode(TurnChangeStartMode.EVENT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this.doLastAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}
}
);

var TurnChangeStart = defineObject(BaseTurnChange,
{
	doLastAction: function() {
		this._checkStateTurn();
	},
	
	getStartEndType: function() {
		var startEndType = StartEndType.PLAYER_START;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			startEndType = StartEndType.PLAYER_START;
		}
		else if (turnType === TurnType.ENEMY) {
			startEndType = StartEndType.ENEMY_START;
		}
		else if (turnType === TurnType.ALLY) {
			startEndType = StartEndType.ALLY_START;
		}
		
		return startEndType;
	},
	
	pushFlowEntries: function(straightFlow) {
		// Prioritize the turn display.
		if (this._isTurnAnimeEnabled()) {
			straightFlow.pushFlowEntry(TurnAnimeFlowEntry);
		}
		else {
			straightFlow.pushFlowEntry(TurnMarkFlowEntry);
		}
		straightFlow.pushFlowEntry(RecoveryAllFlowEntry);
		straightFlow.pushFlowEntry(MetamorphozeCancelFlowEntry);
		straightFlow.pushFlowEntry(BerserkFlowEntry);
	},
	
	_checkStateTurn: function() {
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			StateControl.decreaseTurn(this._getPlayerList());
			StateControl.decreaseTurn(EnemyList.getAliveList());
			StateControl.decreaseTurn(AllyList.getAliveList());
		}
	},
	
	_isTurnAnimeEnabled: function() {
		if (root.queryAnime('playerturn_anime') !== null) {
			return true;
		}
		
		if (root.queryAnime('enemyturn_anime') !== null) {
			return true;
		}
		
		if (root.queryAnime('partnerturn_frame') !== null) {
			return true;
		}
		
		return false;
	},
	
	_getPlayerList: function() {
		// If decrease the turn for the unit who is fused, call PlayerList.getSortieDefaultList.
		return PlayerList.getSortieList();
	}
}
);

var TurnChangeEnd = defineObject(BaseTurnChange,
{
	doLastAction: function() {
		this._startNextTurn();
	},
	
	getStartEndType: function() {
		var startEndType = StartEndType.PLAYER_END;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			startEndType = StartEndType.PLAYER_END;
		}
		else if (turnType === TurnType.ENEMY) {
			startEndType = StartEndType.ENEMY_END;
		}
		else if (turnType === TurnType.ALLY) {
			startEndType = StartEndType.ALLY_END;
		}
		
		return startEndType;
	},
	
	pushFlowEntries: function(straightFlow) {
		straightFlow.pushFlowEntry(ReinforcementAppearFlowEntry);
	},
	
	_startNextTurn: function() {
		var nextTurnType;
		var turnType = root.getCurrentSession().getTurnType();
		
		this._checkActorList();
		
		if (turnType === TurnType.PLAYER) {
			// If a number of the enemy is 0 at this moment, it is also possible that the enemy turn is not executed.
			// However, in this case, the enemy turn related cannot be detected with an event condition,
			// always switch it to the enemy turn.
			// If a number of the enemy is 0, images and background music are not changed,
			// so it doesn't seem that it's switched to the enemy turn.
			nextTurnType = TurnType.ENEMY;
		}
		else if (turnType === TurnType.ENEMY) {
			nextTurnType = TurnType.ALLY;
		}
		else {
			nextTurnType = TurnType.PLAYER;
		}
		
		root.getCurrentSession().setTurnType(nextTurnType);
	},
	
	_checkActorList: function() {
		var i, unit;
		var list = TurnControl.getActorList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			this._removeWaitState(unit);
			
			unit = FusionControl.getFusionChild(unit);
			if (unit !== null) {
				// Deactivate a wait state of the units who are fused.
				this._removeWaitState(unit);
			}
		}
	},
	
	_removeWaitState: function(unit) {
		var reactionTurnCount = unit.getReactionTurnCount();
		
		if (reactionTurnCount > 0) {
			unit.setReactionTurnCount(reactionTurnCount - 1);
		}
		
		unit.setWait(false);
	}
}
);

var TurnChangeMapStart = defineObject(BaseTurnChange,
{
	doLastAction: function() {
		var turnType = TurnType.PLAYER;
		
		if (PlayerList.getSortieList().getCount() > 0) {
			turnType = TurnType.PLAYER;
		}
		else if (EnemyList.getAliveList().getCount() > 0) {
			turnType = TurnType.ENEMY;
		}
		else if (AllyList.getAliveList().getCount() > 0) {
			turnType = TurnType.ALLY;
		}
		
		root.getCurrentSession().setTurnCount(0);
		root.getCurrentSession().setTurnType(turnType);
	},
	
	getStartEndType: function() {
		return StartEndType.MAP_START;
	}
}
);

var BaseTurnLogoFlowEntry = defineObject(BaseFlowEntry,
{
	_turnChange: null,
	
	doMainAction: function(isMusic) {
		var startEndType;
	
		// Count a turn number if the player turn starts up.
		if (root.getCurrentSession().getTurnType() === TurnType.PLAYER) {
			root.getCurrentSession().setTurnCount(root.getCurrentSession().getTurnCount() + 1);
			
			// Count a relative turn.
			root.getCurrentSession().increaseRelativeTurn();
		}
		
		if (isMusic) {
			this._changeMusic();
		}
		
		startEndType = this._turnChange.getStartEndType();
		if (startEndType === StartEndType.PLAYER_START) {
			// If the player's turn starts up, no auto skip.
			CurrentMap.setTurnSkipMode(false);
		}
		else {
			// If it's the enemy or the ally, check the auto turn skip.
			CurrentMap.setTurnSkipMode(this._isAutoTurnSkip());
		}
		
		CurrentMap.enableEnemyAcceleration(true);
	},
	
	_changeMusic: function() {
		var handle;
		var handleActive = root.getMediaManager().getActiveMusicHandle();
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			handle = mapInfo.getPlayerTurnMusicHandle();
		}
		else if (turnType === TurnType.ALLY) {
			handle = mapInfo.getAllyTurnMusicHandle();
		}
		else {
			handle = mapInfo.getEnemyTurnMusicHandle();
		}
		
		// Play only if it's music which differs from the current music.
		if (!handle.isEqualHandle(handleActive)) {
			MediaControl.resetMusicList();
			MediaControl.musicPlayNew(handle);
		}
	},
	
	_isAutoTurnSkip: function() {
		return EnvironmentControl.getAutoTurnSkipType() === 0;
	},
	
	_isTurnGraphicsDisplayable: function() {
		var count;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			count = PlayerList.getSortieList().getCount();
		}
		else if (turnType === TurnType.ENEMY) {
			count = EnemyList.getAliveList().getCount();
		}
		else {
			count = AllyList.getAliveList().getCount();
		}
		
		return count > 0;
	}
}
);

var TurnMarkFlowEntry = defineObject(BaseTurnLogoFlowEntry,
{
	_counter: null,
	
	enterFlowEntry: function(turnChange) {
		this._prepareMemberData(turnChange);
		return this._completeMemberData(turnChange);
	},
	
	moveFlowEntry: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this.doMainAction(true);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		var alpha;
		var width = Math.floor(UIFormat.SCREENFRAME_WIDTH / 2);
		var height = UIFormat.SCREENFRAME_HEIGHT;
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		var dy = Math.floor(height / 2);
		var dx = Math.floor(this._counter.getCounter() * 1.5);
		var pic = this._getTurnFrame();
		
		if (pic === null) {
			return;
		}
		
		alpha = 255 - (this._counter.getCounter() * 7);
		if (alpha < 0) {
			alpha = 0;
		}
		
		pic.setAlpha(alpha);
		pic.drawStretchParts(x - dx, y - dy, width, height, 0, 0, width, height);
		
		pic.setAlpha(alpha);
		pic.drawStretchParts(x + dx, y + dy, width, height, width, 0, width, height);
	},
	
	_prepareMemberData: function(turnChange) {
		this._turnChange = turnChange;
		this._counter = createObject(CycleCounter);
	},
	
	_completeMemberData: function(turnChange) {
		if (!this._isTurnGraphicsDisplayable()) {
			// If the unit doesn't exist, even one unit,
			// process to end without displaying images.
			this.doMainAction(false);
			return EnterResult.NOTENTER;
		}
		
		this._counter.disableGameAcceleration();
		this._counter.setCounterInfo(36);
		this._playTurnChangeSound();
		
		return EnterResult.OK;
	},
	
	_getTurnFrame: function() {
		var pic;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			pic = root.queryUI('playerturn_frame');
		}
		else if (turnType === TurnType.ENEMY) {
			pic = root.queryUI('enemyturn_frame');
		}
		else {
			pic = root.queryUI('partnerturn_frame');
		}
		
		return pic;
	},
	
	_playTurnChangeSound: function() {
		MediaControl.soundDirect('turnchange');
	}
}
);

var TurnAnimeFlowEntry = defineObject(BaseTurnLogoFlowEntry,
{
	_dynamicAnime: null,
	
	enterFlowEntry: function(turnChange) {
		this._prepareMemberData(turnChange);
		return this._completeMemberData(turnChange);
	},
	
	moveFlowEntry: function() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.doMainAction(true);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_prepareMemberData: function(turnChange) {
		this._turnChange = turnChange;
		this._dynamicAnime = createObject(DynamicAnime);
	},
	
	_completeMemberData: function(turnChange) {
		var pos;
		var animeData = this._getTurnAnime();
		
		if (!this._isTurnGraphicsDisplayable() || animeData === null) {
			// If the unit doesn't exist, even one unit,
			// process to end without displaying images.
			this.doMainAction(false);
			return EnterResult.NOTENTER;
		}
		
		pos = this._getAnimePos(animeData);
		
		this._dynamicAnime.startDynamicAnime(animeData, pos.x, pos.y);
		
		return EnterResult.OK;
	},
	
	_getTurnAnime: function() {
		var animeData;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			animeData = root.queryAnime('playerturn_anime');
		}
		else if (turnType === TurnType.ENEMY) {
			animeData = root.queryAnime('enemyturn_anime');
		}
		else {
			animeData = root.queryAnime('partnerturn_anime');
		}
		
		return animeData;
	},
	
	_getAnimePos: function(animeData) {
		var size = Miscellaneous.getFirstKeySpriteSize(animeData, 0);
		var x = LayoutControl.getCenterX(-1, size.width);
		var y = LayoutControl.getCenterY(-1, size.height);
		
		return createPos(x, y);
	}
}
);

var RecoveryAllFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicEvent: null,
	
	enterFlowEntry: function(turnChange) {
		this._prepareMemberData(turnChange);
		return this._completeMemberData(turnChange);
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(turnChange) {
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(turnChange) {
		var i, unit, recoveryValue;
		var commandCount = 0;
		var isSkipMode = CurrentMap.isTurnSkipMode();
		var generator = this._dynamicEvent.acquireEventGenerator();
		var list = TurnControl.getActorList();
		var count = list.getCount();
		
		for (i = 0 ; i < count; i++) {
			unit = list.getData(i);
			
			recoveryValue = this._getRecoveryValue(unit);
			if (recoveryValue > 0) {
				// Recover if HP is reduced.
				if (unit.getHp() < ParamBonus.getMhp(unit)) {
					// Cursor display is always skipped by specifying true.
					generator.locationFocus(unit.getMapX(), unit.getMapY(), true); 
					generator.hpRecovery(unit, this._getTurnRecoveryAnime(), recoveryValue, RecoveryType.SPECIFY, isSkipMode);
					commandCount++;
				}
			}
			else if (recoveryValue < 0) {
				generator.locationFocus(unit.getMapX(), unit.getMapY(), true);
				recoveryValue *= -1;
				recoveryValue = this._arrangeValue(unit, recoveryValue);
				generator.damageHit(unit, this._getTurnDamageAnime(), recoveryValue, DamageType.FIXED, {}, isSkipMode);
				commandCount++;
			}
		}
		
		if (commandCount === 0) {
			return EnterResult.NOTENTER;
		}
		
		return this._dynamicEvent.executeDynamicEvent();
	},
	
	_getRecoveryValue: function(unit) {
		var skill, terrain;
		var recoveryValue = 0;
		
		skill = SkillControl.getBestPossessionSkill(unit, SkillType.AUTORECOVERY);
		if (skill !== null) {
			recoveryValue += skill.getSkillValue();
		}
		
		terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
		if (terrain !== null) {
			recoveryValue += terrain.getAutoRecoveryValue();
		}
		
		recoveryValue += StateControl.getHpValue(unit);
		
		return recoveryValue;
	},
	
	_arrangeValue: function(unit, recoveryValue) {
		if (DataConfig.isTurnDamageFinishAllowed()) {
			return recoveryValue;
		}
		
		if (unit.getHp() - recoveryValue <= 0) {
			recoveryValue = unit.getHp() - 1;
		}
		
		return recoveryValue;
	},
	
	_getTurnRecoveryAnime: function() {
		return root.queryAnime('easyrecovery');
	},
	
	_getTurnDamageAnime: function() {
		return root.queryAnime('easydamage');
	}
}
);

var MetamorphozeCancelFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicEvent: null,
	
	enterFlowEntry: function(turnChange) {
		this._prepareMemberData(turnChange);
		return this._completeMemberData(turnChange);
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(turnChange) {
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(turnChange) {
		var i, unit, turn, metamorphozeData;
		var commandCount = 0;
		var isSkipMode = CurrentMap.isTurnSkipMode();
		var generator = this._dynamicEvent.acquireEventGenerator();
		var list = TurnControl.getActorList();
		var count = list.getCount();
		
		for (i = 0 ; i < count; i++) {
			unit = list.getData(i);
			metamorphozeData = MetamorphozeControl.getMetamorphozeData(unit);
			if (metamorphozeData === null || !(metamorphozeData.getCancelFlag() & MetamorphozeCancelFlag.AUTO)) {
				continue;
			}
			
			turn = MetamorphozeControl.getMetamorphozeTurn(unit);
			if (--turn === 0) {
				generator.locationFocus(unit.getMapX(), unit.getMapY(), true); 
				generator.unitMetamorphoze(unit, {}, MetamorphozeActionType.CANCEL, isSkipMode);
				// Process if the unit who was deactivated acts first.
				generator.wait(10);
				commandCount++;
			}
			
			MetamorphozeControl.setMetamorphozeTurn(unit, turn);
		}
		
		if (commandCount === 0) {
			return EnterResult.NOTENTER;
		}
		
		return this._dynamicEvent.executeDynamicEvent();
	}
}
);

var BerserkFlowEntry = defineObject(BaseFlowEntry,
{
	_berserkTurn: null,
	
	enterFlowEntry: function(turnChange) {
		this._prepareMemberData(turnChange);
		return this._completeMemberData(turnChange);
	},
	
	moveFlowEntry: function() {
		return this._berserkTurn.moveTurnCycle();
	},
	
	drawFlowEntry: function() {
		this._berserkTurn.drawTurnCycle();
	},
	
	_prepareMemberData: function(turnChange) {
		this._berserkTurn = createObject(PlayerBerserkTurn);
	},
	
	_completeMemberData: function(turnChange) {
		if (!this._isBerserkTurn()) {
			return EnterResult.NOTENTER;
		}
		
		this._berserkTurn.openTurnCycle();
		
		return EnterResult.OK;
	},
	
	_isBerserkTurn: function() {
		var i, unit;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		if (root.getCurrentSession().getTurnType() !== TurnType.PLAYER) {
			return false;
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
				return true;
			}
			else if (StateControl.isBadStateOption(unit, BadStateOption.AUTO)) {
				return true;
			}
		}
		
		return false;
	}
}
);

var ReinforcementAppearFlowEntry = defineObject(BaseFlowEntry,
{
	_reinforceChecker: null,
	
	enterFlowEntry: function(turnChange) {
		this._prepareMemberData(turnChange);
		return this._completeMemberData(turnChange);
	},
	
	moveFlowEntry: function() {
		return this._reinforceChecker.moveReinforcementChecker();
	},
	
	drawFlowEntry: function() {
		this._reinforceChecker.drawReinforcementChecker();
	},
	
	_prepareMemberData: function(turnChange) {
		this._reinforceChecker = createObject(ReinforcementChecker);
	},
	
	_completeMemberData: function(turnChange) {
		var result = this._reinforceChecker.enterReinforcementChecker(this.isFlowSkip());
		
		if (result === EnterResult.OK) {
			this._reinforceChecker.startMove();
		}
		
		return result;
	}
}
);

var ReinforcementCheckerMode = {
	TOP: 0,
	WAIT: 1
};

var ReinforcementChecker = defineObject(BaseObject,
{
	_xScroll: 0,
	_yScroll: 0,
	_waitCounter: null,
	_reinforceUnitArray: null,
	_divisionAreaIndex: 0,
	_divisionAreaArray: null,
	
	enterReinforcementChecker: function(isSkipMode) {
		this._prepareMemberData(isSkipMode);
		return this._completeMemberData(isSkipMode);
	},
	
	moveReinforcementChecker: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ReinforcementCheckerMode.MOVE) {
			result = this._moveTop();
		}
		else if (mode === ReinforcementCheckerMode.WAIT) {
			result = this._moveWait();
		}
		
		return result;
	},
	
	drawReinforcementChecker: function() {
		var i, reinforceUnit, unitRenderParam;
		var count = this._reinforceUnitArray.length;
		
		for (i = 0; i < count; i++) {
			reinforceUnit = this._reinforceUnitArray[i];
			
			unitRenderParam = StructureBuilder.buildUnitRenderParam();
			unitRenderParam.direction = reinforceUnit.direction;
			unitRenderParam.animationIndex = reinforceUnit.unitCounter.getAnimationIndexFromUnit(reinforceUnit.unit);
			unitRenderParam.isScroll = true;
			UnitRenderer.drawScrollUnit(reinforceUnit.unit, reinforceUnit.xPixel, reinforceUnit.yPixel, unitRenderParam);
		}
	},
	
	startMove: function() {
		this._waitCounter.setCounterInfo(20);
		this._setMapScroll();
		this.changeCycleMode(ReinforcementCheckerMode.MOVE);
	},
	
	_prepareMemberData: function(isSkipMode) {
		this._xScroll = 0;
		this._yScroll = 0;
		this._waitCounter = createObject(CycleCounter);
		this._reinforceUnitArray = null;
		this._divisionAreaIndex = 0;
		this._divisionAreaArray = null;
	},
	
	_completeMemberData: function(isSkipMode) {
		// Don't continue if the reinforcements are disabled.
		if (!root.getCurrentSession().isMapState(MapStateType.REINFORCE)) {
			return EnterResult.NOTENTER;
		}
		
		if (isSkipMode) {
			// If it's in a skip state, end to process at this moment.
			this._doSkipAction();
			return EnterResult.NOTENTER;
		}
		
		this._divisionAreaArray = CurrentMap.getDivisionAreaArray();
		
		if (!this._checkDivisionArea()) {
			return EnterResult.NOTENTER;
		}
		
		return EnterResult.OK;
	},
	
	_checkDivisionArea: function() {
		var divisionArea;
		var count = this._divisionAreaArray.length;
		
		while (this._divisionAreaIndex < count) {
			divisionArea = this._divisionAreaArray[this._divisionAreaIndex];
			this._divisionAreaIndex++;
			if (this._checkReinforcementPos(divisionArea)) {
				this._xScroll = divisionArea.xEnd - CurrentMap.getCol();
				this._yScroll = divisionArea.yEnd - CurrentMap.getRow();
				return true;
			}
		}
		
		return false;
	},
	
	_checkReinforcementPos: function(divisionArea) {
		var i, x, y, posData;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var count = mapInfo.getReinforcementPosCount();
		
		this._reinforceUnitArray = [];
		
		for (i = 0; i < count; i++) {
			posData = mapInfo.getReinforcementPos(i);
			x = posData.getX();
			y = posData.getY();
			if (!this._isPosEnabled(x, y)) {
				continue;
			}
			
			if (divisionArea.x <= x && divisionArea.xEnd - 1 >= x) {
				if (divisionArea.y <= y && divisionArea.yEnd - 1 >= y) {
					// If the following code is executed, it means that x, y exist within a range.
					this._checkReinforcementPage(posData, this._reinforceUnitArray);
				}
			}
		}
		
		// All units have already appeared, so set non visible setting.
		// If non visible is set with _createReinforcementUnit,
		// the non visible unit is excluded by root.getCurrentSession().getUnitFromPos,
		// so sometimes the space where the unit exists is recognized to be blank.
		count = this._reinforceUnitArray.length;
		for (i = 0; i < count; i++) {
			this._reinforceUnitArray[i].unit.setInvisible(true);
		}
		
		return this._reinforceUnitArray.length > 0;
	},
	
	_isPosEnabled: function(x, y) {
		// If blank is totally ignored, calling func with this method is possible.
		return true;
	},
	
	_checkReinforcementPage: function(posData, arr) {
		var i, pageData, turnCount;
		var turnType = root.getCurrentSession().getTurnType();
		var count = posData.getReinforcementPageCount();
		
		for (i = 0; i < count; i++) {
			pageData = posData.getReinforcementPage(i);
			turnCount = this._getTurnCount(pageData);
			// Check if a condition such as "Start Turn" is satisfied.
			if (pageData.getStartTurn() <= turnCount && pageData.getEndTurn() >= turnCount && turnType === pageData.getTurnType()) {
				// Check if the event condition is satisfied.
				if (pageData.isCondition()) {
					// Appear.
					this._createReinforcementUnit(posData, pageData, arr);
					break;
				}
			}
		}
	},
	
	_createReinforcementUnit: function(posData, pageData, arr) {
		var x, y, unit, dx, dy, reinforceUnit;
		var pos = this._getTargetPos(posData, pageData);
		
		if (pos === null) {
			return;
		}
		
		x = pos.x;
		y = pos.y;
		unit = this._appearUnit(pageData, x, y);
		if (unit === null) {
			return;
		}
			
		dx = this._getPointX(pageData.getDirectionType()) * GraphicsFormat.MAPCHIP_WIDTH;
		dy = this._getPointY(pageData.getDirectionType()) * GraphicsFormat.MAPCHIP_HEIGHT;
		
		// Create an object for drawing.
		reinforceUnit = StructureBuilder.buildReinforcementUnit();
		reinforceUnit.x = x;
		reinforceUnit.y = y;
		reinforceUnit.xPixel = (x * GraphicsFormat.MAPCHIP_WIDTH) + dx;
		reinforceUnit.yPixel = (y * GraphicsFormat.MAPCHIP_HEIGHT) + dy;
		reinforceUnit.direction = pageData.getDirectionType();
		reinforceUnit.unit = unit;
		reinforceUnit.isMoveFinal = false;
		reinforceUnit.unitCounter = createObject(UnitCounter);
		reinforceUnit.moveCount = 0;
		
		arr.push(reinforceUnit);
	},
	
	_getTargetPos: function(posData, pageData) {
		var pos = createPos(posData.getX(), posData.getY());
		var isForce = pageData.isForce();
		var unit = pageData.getSourceUnit();
		
		if (PosChecker.getUnitFromPos(pos.x, pos.y) !== null) {
			if (isForce) {
				pos = PosChecker.getNearbyPosFromSpecificPos(pos.x, pos.y, unit, null);
			}
			else {
				return null;
			}
		}
		
		return pos;
	},
	
	_moveTop: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._moveReinforcementUnit() !== MoveResult.CONTINUE) {
			// If an appearance within the current range ends, check the next range.
			if (this._checkDivisionArea()) {
				// Before processing the next reinforcements, wait for a certain time.
				// That's because if a switch is quickly done, it's hard to check reinforcements.
				this.changeCycleMode(ReinforcementCheckerMode.WAIT);
			}
			else {
				// If no more reinforcements to appear exist, end it.
				result = MoveResult.END;
			}
		}
		
		return result;
	},
	
	_moveWait: function() {
		if (this._waitCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this._setMapScroll();
			this.changeCycleMode(ReinforcementCheckerMode.MOVE);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveReinforcementUnit: function() {
		var i, dx, dy, reinforceUnit;
		var count = this._reinforceUnitArray.length;
		var result = MoveResult.END;
		
		for (i = 0; i < count; i++) {
			reinforceUnit = this._reinforceUnitArray[i];
			if (!reinforceUnit.isMoveFinal) {
				dx = (this._getPointX(reinforceUnit.direction) * 4) * -1;
				dy = (this._getPointY(reinforceUnit.direction) * 4) * -1;
				
				reinforceUnit.xPixel += dx;
				reinforceUnit.yPixel += dy;
				
				if (++reinforceUnit.moveCount === 8) {
					reinforceUnit.isMoveFinal = true;
					reinforceUnit.unit.setInvisible(false);
					this._playMovingSound(reinforceUnit.unit);
				}
				
				result = MoveResult.CONTINUE;
			}
			
			reinforceUnit.unitCounter.moveUnitCounter();
		}
		
		return result;
	},
	
	_setMapScroll: function() {
		var session = root.getCurrentSession();
		
		session.setScrollPixelX(this._xScroll * GraphicsFormat.MAPCHIP_WIDTH);
		session.setScrollPixelY(this._yScroll * GraphicsFormat.MAPCHIP_HEIGHT);
	},
	
	_getPointX: function(direction) {
		var point = 0;

		if (direction === DirectionType.LEFT) {
			point = 1;
		}
		else if (direction === DirectionType.RIGHT) {
			point = -1;
		}

		return point;
	},
	
	_getPointY: function(direction) {
		var point = 0;

		if (direction === DirectionType.TOP) {
			point = 1;
		}
		else if (direction === DirectionType.BOTTOM) {
			point = -1;
		}

		return point;
	},
	
	_getTurnCount: function(pageData) {
		var count;
		
		if (pageData.isRelativeTurn()) {
			count = root.getCurrentSession().getRelativeTurnCount();
		}
		else {
			count = root.getCurrentSession().getTurnCount();
		}
		
		return count;
	},
	
	_doSkipAction: function() {
		var i, j, x, y, posData, pageData, pageCount, turnCount, pos;
		var turnType = root.getCurrentSession().getTurnType();
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var posCount = mapInfo.getReinforcementPosCount();
		
		for (i = 0; i < posCount; i++) {
			posData = mapInfo.getReinforcementPos(i);
			x = posData.getX();
			y = posData.getY();
			if (!this._isPosEnabled(x, y)) {
				continue;
			}
			
			pageCount = posData.getReinforcementPageCount();
			for (j = 0; j < pageCount; j++) {
				pageData = posData.getReinforcementPage(j);
				turnCount = this._getTurnCount(pageData);
				if (pageData.getStartTurn() <= turnCount && pageData.getEndTurn() >= turnCount && turnType === pageData.getTurnType()) {
					if (pageData.isCondition()) {
						pos = this._getTargetPos(posData, pageData);
						if (pos !== null) {
							this._appearUnit(pageData, pos.x, pos.y);
							break;
						}
					}
				}
			}
		}
	},
	
	_appearUnit: function(pageData, x, y) {
		var unit;
		var list = EnemyList.getAliveList();
		
		if (list.getCount() >= DataConfig.getMaxAppearUnitCount()) {
			// Don't appear by exceeding "Max Map Enemy".
			return null;
		}
		
		// It means that the unit has appeared with this following method.
		unit = root.getObjectGenerator().generateUnitFromRefinforcementPage(pageData);
		if (unit !== null) {
			unit.setMapX(x);
			unit.setMapY(y);
			UnitProvider.setupFirstUnit(unit);
		}
		
		return unit;
	},
	
	_playMovingSound: function(unit) {
		Miscellaneous.playFootstep(unit.getClass());
	}
}
);
