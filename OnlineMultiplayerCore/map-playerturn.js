
var PlayerTurnMode = {
	AUTOCURSOR: 0,
	AUTOEVENTCHECK: 1,
	MAP: 2,
	AREA: 3,
	MAPCOMMAND: 4,
	UNITCOMMAND: 5,
	BOUNCEONE: 6,
	BOUNCETWO: 7,
	PROCEED: 8
};

var PlayerTurn = defineObject(BaseTurn,
{
	_targetUnit: null,
	_xCursorSave: 0,
	_yCursorSave: 0,
	_xAutoCursorSave: 0,
	_yAutoCursorSave: 0,
	_isPlayerActioned: false,
	_mapLineScroll: null,
	_mapEdit: null,
	_mapSequenceArea: null,
	_mapSequenceCommand: null,
	_mapCommandManager: null,
	_eventChecker: null,
	
	// It's called if the turn is switched.
	openTurnCycle: function() {

	if(root.getCurrentSession().getCurrentMapInfo().custom.online){
		if(root.getMetaSession().getVariableTable(4).getVariable(0)==0){
			this._prepareTurnMemberData();
			this._completeTurnMemberData();
			}
		else{
			this.changeCycleMode(PlayerTurnMode.BOUNCEONE);
		}
	}
	else
	{		
		this._prepareTurnMemberData();
		this._completeTurnMemberData();
	}
	},
	
	moveTurnCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (this._checkAutoTurnEnd()) {
			return MoveResult.CONTINUE;
		}
		
		if (mode === PlayerTurnMode.AUTOCURSOR) {
			result = this._moveAutoCursor();
		}
		else if (mode === PlayerTurnMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === PlayerTurnMode.MAP) {
			result = this._moveMap();
		}
		else if (mode === PlayerTurnMode.AREA) {
			result = this._moveArea();
		}
		else if (mode === PlayerTurnMode.MAPCOMMAND) {
			result = this._moveMapCommand();
		}
		else if (mode === PlayerTurnMode.UNITCOMMAND) {
			result = this._moveUnitCommand();
		}

		else if (mode === PlayerTurnMode.BOUNCEONE) {
			
			result = this.validationOne();
		}


		else if (mode === PlayerTurnMode.PROCEED) {
			
			result = this.proceed();
		}
			//wait(200)
			
		
		
		if (this._checkAutoTurnEnd()) {
			return MoveResult.CONTINUE;
		}
		
		return result;
	},
	
	drawTurnCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === PlayerTurnMode.AUTOCURSOR) {
			this._drawAutoCursor();
		}
		else if (mode === PlayerTurnMode.AUTOEVENTCHECK) {
			this._drawAutoEventCheck();
		}
		else if (mode === PlayerTurnMode.MAP) {
			this._drawMap();	
		}
		else if (mode === PlayerTurnMode.AREA) {
			this._drawArea();	
		}
		else if (mode === PlayerTurnMode.MAPCOMMAND) {
			this._drawMapCommand();
		}
		else if (mode === PlayerTurnMode.UNITCOMMAND) {
			this._drawUnitCommand();
		}
		else if (mode === PlayerTurnMode.BOUNCEONE) {
			
			this.drawNoticeView(270, 200);			
		}

	},

	drawNoticeView: function(x, y) {
		var textui = root.queryTextUI('support_title');
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = 6;
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);
		
		x += 30;
		y += 18;
		var color = textui.getColor();
		var font = textui.getFont();
		var text = 'Waiting for the other player...';
		var infoColor = ColorValue.KEYWORD;
		var width = TextRenderer.getTextWidth(text, font) + 5;
		
		TextRenderer.drawKeywordText(x, y, text, -1, infoColor, font);
	},

	validationOne: function() {
		var http = createObject(StatusChecker);
		var res = http.getStatus();
		if(res){
			this.changeCycleMode(PlayerTurnMode.PROCEED);
		}

		return MoveResult.CONTINUE;

	},


	proceed: function() {
		root.resetConsole();
		Download();
		wait(200)
			root.log("Downloaded")
			root.getLoadSaveManager().loadInterruptionFile();
			root.getMetaSession().getVariableTable(4).setVariable(0, 1);
			root.log("Player Side: " + root.getMetaSession().getVariableTable(4).getVariable(0));
			root.getCurrentSession().setTurnType(TurnType.PLAYER)
			TurnControl.turnEnd();

		return MoveResult.CONTINUE;

	},

	isPlayerActioned: function() {
		return this._isPlayerActioned;
	},
	
	recordPlayerAction: function(isPlayerActioned) {
		this._isPlayerActioned = isPlayerActioned;
	},
	
	notifyAutoEventCheck: function() {
		this._changeEventMode();
	},
	
	isDebugMouseActionAllowed: function() {
		return this.getCycleMode() === PlayerTurnMode.MAP;
	},
	
	setCursorSave: function(unit) {
		this._xCursorSave = unit.getMapX();
		this._yCursorSave = unit.getMapY();
	},
	
	setPosValue: function(unit) {
		unit.setMapX(this._xCursorSave);
		unit.setMapY(this._yCursorSave);
		this._mapEdit.setCursorPos(unit.getMapX(), unit.getMapY());
		MapView.setScroll(unit.getMapX(), unit.getMapY());
	},
	
	setAutoCursorSave: function(isDefault) {
		var pos, session;
		
		if (isDefault) {
			pos = this._getDefaultCursorPos();
			if (pos !== null) {
				this._xAutoCursorSave = pos.x;
				this._yAutoCursorSave = pos.y;
			}
		}
		else {
			session = root.getCurrentSession();
			this._xAutoCursorSave = session.getMapCursorX();
			this._yAutoCursorSave = session.getMapCursorY();
		}
	},

	getTurnTargetUnit: function() {
		return this._targetUnit;
	},
	
	isRepeatMoveMode: function() {
		return false;
	},
	
	clearPanelRange: function() {
		this._mapEdit.clearRange();
	},
	
	getMapEdit: function() {
		return this._mapEdit;
	},
	
	_prepareTurnMemberData: function() {
		this._targetUnit = null;
		this._xCursorSave = 0;
		this._yCursorSave = 0;
		this._isPlayerActioned = false;
		
		this._mapLineScroll = createObject(MapLineScroll);
		this._mapEdit = createObject(MapEdit);
		this._mapSequenceArea = createObject(MapSequenceArea);
		this._mapSequenceCommand = createObject(MapSequenceCommand);
		this._mapCommandManager = createObject(MapCommand);
		this._eventChecker = createObject(EventChecker);
		
		if (root.getCurrentSession().getTurnCount() === 1) {
			// For the first turn, don't ask whether having auto cursor, the cursor overlaps the unit.
			this.setAutoCursorSave(true);
		}
		
		this._setDefaultActiveUnit();
	},
	
	_completeTurnMemberData: function() {
		this._mapEdit.openMapEdit();
		this._changeAutoCursor();
		
		// There is a possibility that the unit appears at the event when the player's turn started, so execute marking.
		MapLayer.getMarkingPanel().updateMarkingPanel();
	},
	
	_moveAutoCursor: function() {
		var x, y, pos;
		
		if (this._mapLineScroll.moveLineScroll() !== MoveResult.CONTINUE) {
			pos = this._getDefaultCursorPos();
			if (pos !== null && EnvironmentControl.isAutoCursor()) {
				x = pos.x;
				y = pos.y;
			}
			else {
				x = this._xAutoCursorSave;
				y = this._yAutoCursorSave;
			}
			MapView.changeMapCursor(x, y);
			this._changeEventMode();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAutoEventCheck: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this._doEventEndAction();
			MapLayer.getMarkingPanel().updateMarkingPanel();
			this.changeCycleMode(PlayerTurnMode.MAP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveMap: function() {
		var result = this._mapEdit.moveMapEdit();
		
		if (result === MapEditResult.UNITSELECT) {
			this._targetUnit = this._mapEdit.getEditTarget();
			if (this._targetUnit !== null) {
				if (this._targetUnit.isWait()) {
					this._mapEdit.clearRange();
					
					// Pressing the decision key on the unit who waits is treated as a map command.
					this._mapCommandManager.openListCommandManager();
					this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
				}
				else {
					// Change it to the mode which displaying the unit moving range.
					this._mapSequenceArea.openSequence(this);
					this.changeCycleMode(PlayerTurnMode.AREA);
				}
			}
		}
		else if (result === MapEditResult.MAPCHIPSELECT) {
			this._mapCommandManager.openListCommandManager();
			this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveArea: function() {
		var result = this._mapSequenceArea.moveSequence();
		
		if (result === MapSequenceAreaResult.COMPLETE) {
			this._mapEdit.clearRange();
			this._mapSequenceCommand.openSequence(this);
			this.changeCycleMode(PlayerTurnMode.UNITCOMMAND);
		}
		else if (result === MapSequenceAreaResult.CANCEL) {
			this.changeCycleMode(PlayerTurnMode.MAP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveMapCommand: function() {
		if (this._mapCommandManager.moveListCommandManager() !== MoveResult.CONTINUE) {
			// If select the turn ends, don't execute.
			this._changeEventMode();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveUnitCommand: function() {
		var result = this._mapSequenceCommand.moveSequence();
		
		if (result === MapSequenceCommandResult.COMPLETE) {
			this._mapSequenceCommand.resetCommandManager();
			MapLayer.getMarkingPanel().updateMarkingPanelFromUnit(this._targetUnit);
			this._changeEventMode();
		}
		else if (result === MapSequenceCommandResult.CANCEL) {
			this._mapSequenceCommand.resetCommandManager();
			this.changeCycleMode(PlayerTurnMode.MAP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawAutoCursor: function() {
		MapLayer.drawUnitLayer();
	},
	
	_drawAutoEventCheck: function() {
		MapLayer.drawUnitLayer();
	},
	
	_drawMap: function() {
		MapLayer.drawUnitLayer();
		if (!root.isEventSceneActived()) {
			this._mapEdit.drawMapEdit();
		}
	},
	
	_drawArea: function() {
		MapLayer.drawUnitLayer();
		this._mapSequenceArea.drawSequence();
	},
	
	_drawMapCommand: function() {
		MapLayer.drawUnitLayer();
		this._mapCommandManager.drawListCommandManager();
	},
	
	_drawUnitCommand: function() {
		MapLayer.drawUnitLayer();
		this._mapSequenceCommand.drawSequence();
	},
	
	_checkAutoTurnEnd: function() {
		var i, unit;
		var isTurnEnd = true;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		// Don't let the turn change occur at the same time when selecting the auto turn end on the config screen.
		// There is also an intention that doesn't let the turn end at the same time when the alive is 0 at the battle.
		if (this.getCycleMode() !== PlayerTurnMode.MAP) {
			return false;
		}
		
		// Even if the auto turn is not enabled, if no alive exists, end the turn.
		
		if (!EnvironmentControl.isAutoTurnEnd()) {
			return false;
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			// If the all players cannot act due to the states, ending the turn is needed, so decide with the following code.
			if (!StateControl.isTargetControllable(unit)) {
				continue;
			}
			
			if (!unit.isWait()) {
				isTurnEnd = false;
				break;
			}
		}
		
		if (isTurnEnd) {
			this._isPlayerActioned = false;
			TurnControl.turnEnd();
		}
		
		return isTurnEnd;
	},
	
	_setDefaultActiveUnit: function() {
		var unit = PlayerList.getAliveList().getData(0);
		
		// If beaten with the turn damage, set null at the unit.
		if (unit !== null) {
			root.getCurrentSession().setActiveEventUnit(unit);
		}
	},
	
	_getDefaultCursorPos: function() {
		var i, unit;
		var targetUnit = null;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.getImportance() === ImportanceType.LEADER) {
				targetUnit = unit;
				break;
			}
		}
		
		if (targetUnit === null) {
			targetUnit = list.getData(0);
		}
		
		if (targetUnit !== null) {
			return createPos(targetUnit.getMapX(), targetUnit.getMapY());
		}
		
		return null;
	},
	
	_changeAutoCursor: function() {
		var x, y;
		var pos = this._getDefaultCursorPos();
		
		if (pos !== null && EnvironmentControl.isAutoCursor()) {
			x = pos.x;
			y = pos.y;
		}
		else {
			x = this._xAutoCursorSave;
			y = this._yAutoCursorSave;
		}
		
		this._mapLineScroll.startLineScroll(x, y);
		this.changeCycleMode(PlayerTurnMode.AUTOCURSOR);
	},
	
	_changeEventMode: function() {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), EventType.AUTO);
		if (result === EnterResult.NOTENTER) {
			this._doEventEndAction();
			this.changeCycleMode(PlayerTurnMode.MAP);
		}
		else {
			this.changeCycleMode(PlayerTurnMode.AUTOEVENTCHECK);
		}
	},
	
	_doEventEndAction: function() {
		// isGameOver was called with this method because need to display a map when the lost at the battle once.
		// Other than this, also having an intention not to display the terrain window.
		if (GameOverChecker.isGameOver()) {
			GameOverChecker.startGameOver();
		}
		else {
			// Countermeasure so as to restart at the script error.
			// If it's called in func, restart when the turn starts, so it looks like restart.
			RetryControl.register();
		}
	}
}
);

var MapSequenceAreaMode = {
	AREA: 0,
	MOVING: 1
};

var MapSequenceAreaResult = {
	COMPLETE: 0,
	CANCEL: 1,
	NONE: 2
};

var MapSequenceArea = defineObject(BaseObject,
{
	_parentTurnObject: null,
	_targetUnit: null,
	_mapCursor: null,
	_unitRangePanel: null,
	_mapPartsCollection: null,
	_prevUnit: null,
	_simulateMove: null,
	
	openSequence: function(parentTurnObject) {
		this._prepareSequenceMemberData(parentTurnObject);
		this._completeSequenceMemberData(parentTurnObject);
	},
	
	moveSequence: function() {
		var mode = this.getCycleMode();
		var result = MapSequenceAreaResult.NONE;
		
		if (mode === MapSequenceAreaMode.AREA) {
			result = this._moveArea();
		}
		else if (mode === MapSequenceAreaMode.MOVING) {
			result = this._moveMoving();
		}
		
		return result;
	},
	
	drawSequence: function() {
		var mode = this.getCycleMode();
		
		if (mode === MapSequenceAreaMode.AREA) {
			this._drawArea();
		}
		else if (mode === MapSequenceAreaMode.MOVING) {
			this._drawMoving();
		}
	},
	
	_prepareSequenceMemberData: function(parentTurnObject) {
		this._parentTurnObject = parentTurnObject;
		this._targetUnit = parentTurnObject.getTurnTargetUnit();
		this._mapCursor = createObject(MapCursor);
		this._unitRangePanel = MapLayer.getUnitRangePanel();
		this._mapPartsCollection = createObject(MapPartsCollection);
		this._prevUnit = null;
		this._simulateMove = createObject(SimulateMove);
	},
	
	_completeSequenceMemberData: function(parentTurnObject) {
		this._targetUnit.setDirection(this._getDefaultDirection());
		
		this._mapCursor.setPos(this._targetUnit.getMapX(), this._targetUnit.getMapY());
		
		if (parentTurnObject.isRepeatMoveMode()) {
			this._unitRangePanel.setRepeatUnit(this._targetUnit);	
		}
		else {
			this._unitRangePanel.setUnit(this._targetUnit);
		}
		
		this._mapPartsCollection.setMapCursor(this._mapCursor);
		
		this._playMapUnitSelectSound();
		
		this.changeCycleMode(MapSequenceAreaMode.AREA);
	},
	
	_moveArea: function() {
		var unit;
		var isMove = false;
		var isCancel = false;
		var result = MapSequenceAreaResult.NONE;
		
		if (InputControl.isSelectAction()) {
			// Check if it's fine whether the _targetUnit moves.
			if (this._isTargetMovable()) {
				isMove = true;
			}
			else {
				isCancel = true;
			}
		}
		else if (InputControl.isCancelAction()) {
			isCancel = true;
		}
		else {
			this._mapCursor.moveCursor();
			this._mapPartsCollection.moveMapPartsCollection();
			
			unit = this._mapCursor.getUnitFromCursor();
			
			// If the unit has been changed, newly update.
			if (unit !== this._prevUnit) {
				this._setUnit(unit);
			}
		}
		
		if (isMove) {
			// Check if it's fine whether move to the position where a cursor points.
			if (this._isPlaceSelectable()) {
				if (this._startMove()) {
					result = MapSequenceAreaResult.COMPLETE;
				}
				else {
					this.changeCycleMode(MapSequenceAreaMode.MOVING);
				}
			}
		}
		else if (isCancel) {
			this._doCancelAction();
			result = MapSequenceAreaResult.CANCEL;
		}
		
		return result;
	},
	
	_moveMoving: function() {
		var result = MapSequenceAreaResult.NONE;
		
		if (this._simulateMove.moveUnit() !== MoveResult.CONTINUE) {
			result = MapSequenceAreaResult.COMPLETE;
		}
		
		return result;
	},
	
	_drawArea: function() {
		this._mapCursor.drawCursor();
		this._mapPartsCollection.drawMapPartsCollection();
		MouseControl.drawMapEdge();
	},
	
	_drawMoving: function() {
		// Call after drawUnitLayer so that the moving unit can be displayed over the displayed unit.
		this._simulateMove.drawUnit();
	},
	
	_getDefaultDirection: function() {
		return DirectionType.RIGHT;
	},
	
	_isTargetMovable: function() {
		if (!StateControl.isTargetControllable(this._targetUnit)) {
			return false;
		}
		
		// The player who doesn't wait allows moving.
		return this._targetUnit.getUnitType() === UnitType.PLAYER && !this._targetUnit.isWait();
	},
	
	_isPlaceSelectable: function() {
		var x = this._mapCursor.getX();
		var y = this._mapCursor.getY();
		var isCurrentPos = this._targetUnit.getMapX() === x && this._targetUnit.getMapY() === y;
		var unit = PosChecker.getUnitFromPos(x, y);
		
		// The movable place is the position within a range or the current position.
		return (this._unitRangePanel.isMoveArea(x, y) > 0 && unit === null) || isCurrentPos;
	},
	
	_startMove: function() {
		var cource;
		var x = this._mapCursor.getX();
		var y = this._mapCursor.getY();
		var isCurrentPos = this._targetUnit.getMapX() === x && this._targetUnit.getMapY() === y;
		
		this._parentTurnObject.setCursorSave(this._targetUnit);
		
		// If select the unit current position, no need to move.
		if (isCurrentPos) {
			this._simulateMove.noMove(this._targetUnit);
			this._playMapUnitSelectSound();
			return true;
		}
		else {
			// Create a course and start moving.
			cource = this._simulateMove.createCource(this._targetUnit, x, y, this._unitRangePanel.getSimulator());
			this._simulateMove.startMove(this._targetUnit, cource);
		}
		
		return false;
	},
	
	_doCancelAction: function() {
		// Get the cursor back to the selected unit position.
		this._mapCursor.setPos(this._targetUnit.getMapX(), this._targetUnit.getMapY());
		
		this._targetUnit.setDirection(DirectionType.NULL);
		this._playMapUnitCancelSound();
		
		MapView.setScroll(this._targetUnit.getMapX(), this._targetUnit.getMapY());
	},
	
	_setUnit: function(unit) {
		this._mapPartsCollection.setUnit(unit);
		this._prevUnit = unit;
	},
	
	_playMapUnitSelectSound: function() {
		MediaControl.soundDirect('commandselect');
	},
	
	_playMapUnitCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	}
}
);

var MapSequenceCommandMode = {
	COMMAND: 0,
	FLOW: 1
};

var MapSequenceCommandResult = {
	COMPLETE: 0,
	CANCEL: 1,
	NONE: 2
};

var MapSequenceCommand = defineObject(BaseObject,
{
	_parentTurnObject: null,
	_targetUnit: null,
	_unitCommandManager: null,
	_straightFlow: null,
	
	openSequence: function(parentTurnObject) {
		this._prepareSequenceMemberData(parentTurnObject);
		this._completeSequenceMemberData(parentTurnObject);
	},
	
	moveSequence: function() {
		var mode = this.getCycleMode();
		var result = MapSequenceCommandResult.NONE;
		
		if (mode === MapSequenceCommandMode.COMMAND) {
			result = this._moveCommand();
		}
		else if (mode === MapSequenceCommandMode.FLOW) {
			result = this._moveFlow();
		}
		
		return result;
	},
	
	drawSequence: function() {
		var mode = this.getCycleMode();
		
		if (mode === MapSequenceCommandMode.COMMAND) {
			this._unitCommandManager.drawListCommandManager();
		}
		else if (mode === MapSequenceCommandMode.FLOW) {
			this._straightFlow.drawStraightFlow();
		}
	},
	
	resetCommandManager: function() {
		this._unitCommandManager = null;
	},
	
	_prepareSequenceMemberData: function(parentTurnObject) {
		this._parentTurnObject = parentTurnObject;
		this._targetUnit = parentTurnObject.getTurnTargetUnit();
		this._unitCommandManager = createObject(UnitCommand);
		this._straightFlow = createObject(StraightFlow);
	},
	
	_completeSequenceMemberData: function(parentTurnObject) {
		this._straightFlow.setStraightFlowData(parentTurnObject);
		this._pushFlowEntries(this._straightFlow);
		
		// Set the _targetUnit as the active unit at the event.
		root.getCurrentSession().setActiveEventUnit(this._targetUnit);
		
		this._unitCommandManager.setListCommandUnit(this._targetUnit);
		this._unitCommandManager.openListCommandManager();
		
		this.changeCycleMode(MapSequenceCommandMode.COMMAND);
	},
	
	_moveCommand: function() {
		var result;
		
		if (this._unitCommandManager.moveListCommandManager() !== MoveResult.CONTINUE) {
			result = this._doLastAction();
			if (result === 0) {
				this._straightFlow.enterStraightFlow();
				this.changeCycleMode(MapSequenceCommandMode.FLOW);
			}
			else if (result === 1) {
				return MapSequenceCommandResult.COMPLETE;
			}
			else {
				this._targetUnit.setMostResentMov(0);
				return MapSequenceCommandResult.CANCEL;
			}
		}
		
		return MapSequenceCommandResult.NONE;
	},
	
	_moveFlow: function() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			// Prevent the range left over if move again and auto turn end are enabled.
			this._parentTurnObject.clearPanelRange();
			return MapSequenceCommandResult.COMPLETE;
		}
		
		return MapSequenceCommandResult.NONE;
	},
	
	_doLastAction: function() {
		var i;
		var unit = null;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		// Check it because the unit may not exist by executing a command.
		for (i = 0; i < count; i++) {
			if (this._targetUnit === list.getData(i)) {
				unit = this._targetUnit;
				break;
			}
		}
		
		// Check if the unit doesn't die and still exists.
		if (unit !== null) {
			if (this._unitCommandManager.getExitCommand() !== null) {
				if (!this._unitCommandManager.isRepeatMovable()) {
					// If move again is not allowed, don't move again.
					this._targetUnit.setMostResentMov(ParamBonus.getMov(this._targetUnit));
				}
				
				// Set the wait state because the unit did some action.
				this._parentTurnObject.recordPlayerAction(true);
				return 0;
			}
			else {
				// Get the position and cursor back because the unit didn't act.
				this._parentTurnObject.setPosValue(unit);
			}
			
			// Face forward.
			unit.setDirection(DirectionType.NULL);
		}
		else {
			this._parentTurnObject.recordPlayerAction(true);
			return 1;
		}
		
		return 2;
	},
	
	_pushFlowEntries: function(straightFlow) {
		// If need to do something after action ends, add an object.
		straightFlow.pushFlowEntry(RepeatMoveFlowEntry);
		straightFlow.pushFlowEntry(UnitWaitFlowEntry);
		straightFlow.pushFlowEntry(ReactionFlowEntry);
	}
}
);

var RepeatMoveFlowEntry = defineObject(BaseFlowEntry,
{
	_mapSequenceArea: null,
	_playerTurn: null,
	
	enterFlowEntry: function(playerTurn) {
		this._prepareMemberData(playerTurn);
		return this._completeMemberData(playerTurn);
	},
	
	moveFlowEntry: function() {
		var result = this._mapSequenceArea.moveSequence();
		
		if (result === MapSequenceAreaResult.COMPLETE) {
			return MoveResult.END;
		}
		else if (result === MapSequenceAreaResult.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		this._mapSequenceArea.drawSequence();
	},
	
	// The following 3 methods are called by MapSequenceArea.
	getTurnTargetUnit: function() {
		return this._playerTurn.getTurnTargetUnit();
	},
	
	setCursorSave: function(unit) {
		this._playerTurn.setCursorSave(unit);
	},
	
	isRepeatMoveMode: function() {
		return true;
	},
	
	_prepareMemberData: function(playerTurn) {
		this._playerTurn = playerTurn;
		this._mapSequenceArea = createObject(MapSequenceArea);
	},
	
	_completeMemberData: function(playerTurn) {
		if (!this._isTargetMovable(playerTurn)) {
			return EnterResult.NOTENTER;
		}
		
		this._mapSequenceArea.openSequence(this);
		
		return EnterResult.OK;
	},
	
	_isTargetMovable: function(playerTurn) {
		var unit = playerTurn.getTurnTargetUnit();
		
		if (StateControl.isBadStateOption(unit, BadStateOption.NOACTION)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.AUTO)) {
			return false;
		}
		
		return unit.getMostResentMov() !== ParamBonus.getMov(unit);
	}
}
);

var UnitWaitFlowEntry = defineObject(BaseFlowEntry,
{
	_capsuleEvent: null,
	
	enterFlowEntry: function(playerTurn) {
		this._prepareMemberData(playerTurn);
		return this._completeMemberData(playerTurn);
	},
	
	moveFlowEntry: function() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_prepareMemberData: function(playerTurn) {
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeMemberData: function(playerTurn) {
		var event;
		var unit = playerTurn.getTurnTargetUnit();
		
		unit.setMostResentMov(0);
		
		// Unless it's unlimited action, then wait.
		if (!Miscellaneous.isPlayerFreeAction(unit)) {
			unit.setWait(true);
		}
		
		// Get a wait place event from the unit current position.
		event = this._getWaitEvent(unit);
		if (event === null) {
			return EnterResult.NOTENTER;
		}
		
		return this._capsuleEvent.enterCapsuleEvent(event, true);
	},
	
	_getWaitEvent: function(unit) {
		var event = PosChecker.getPlaceEventFromUnit(PlaceEventType.WAIT, unit);
		
		if (event !== null && event.isEvent() && event.getExecutedMark() === EventExecutedType.FREE) {
			return event;
		}
		
		return null;
	}
}
);

var ReactionFlowEntry = defineObject(BaseFlowEntry,
{
	_targetUnit: null,
	_dynamicAnime: null,
	_skill: null,
	
	enterFlowEntry: function(playerTurn) {
		this._prepareMemberData(playerTurn);
		return this._completeMemberData(playerTurn);
	},
	
	moveFlowEntry: function() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this._targetUnit.setReactionTurnCount(this._skill.getSkillValue());
			this._targetUnit.setWait(false);
			// The following code is for the enemy AI.
			this._targetUnit.setOrderMark(OrderMarkType.FREE);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_prepareMemberData: function(playerTurn) {
		this._targetUnit = playerTurn.getTurnTargetUnit();
		this._dynamicAnime = createObject(DynamicAnime);
	},
	
	_completeMemberData: function(playerTurn) {
		var skill;
		
		if (this._targetUnit.getHp() === 0) {
			return EnterResult.NOTENTER;
		}
		
		// Action again doesn't occur when it's unlimited action.
		if (Miscellaneous.isPlayerFreeAction(this._targetUnit)) {
			return EnterResult.NOTENTER;
		}
		
		if (this._targetUnit.getReactionTurnCount() !== 0) {
			return EnterResult.NOTENTER;
		}
		
		skill = SkillControl.getBestPossessionSkill(this._targetUnit, SkillType.REACTION);
		if (skill === null) {
			return EnterResult.NOTENTER;
		}
		
		if (!Probability.getInvocationProbabilityFromSkill(this._targetUnit, skill)) {
			return EnterResult.NOTENTER;
		}
		
		this._skill = skill;
		
		this._startReactionAnime();
		
		return EnterResult.OK;
	},
	
	_startReactionAnime: function() {
		var x = LayoutControl.getPixelX(this._targetUnit.getMapX());
		var y = LayoutControl.getPixelY(this._targetUnit.getMapY());
		var anime = root.queryAnime('reaction');
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y, anime);
	}
}
);
