
var EnemyTurnMode = {
	TOP: 1,
	PREACTION: 2,
	AUTOACTION: 3,
	AUTOEVENTCHACK: 4,
	END: 5,
	IDLE: 6
};

// EnemyTurn can automatically move the enemy one by one.
// Get with getOrderUnit which unit will move next and save it as a _orderUnit.
// The _orderUnit acts according to the act pattern which was set by the game editor.
// For instance, if it's attack pattern, the flow is after moving to the specific position, and then attack.
// These units of move and attack are treated as AutoAction.
// _autoArray is an array of AutoAction, and _autoIndex accesses the array.
// For instance, if the contents of the array are [MoveAction, WeaponAction],
// and if _autoIndex is 0, _autoArray[_autoIndex] returns MoveAction.
// If the action has ended, execute _autoActionIndex++, but the next time, execute WeaponAction,
// which realized the flow from move to attack.

var EnemyTurn = defineObject(BaseTurn,
{
	_orderIndex: 0,
	_orderUnit: null,
	_autoActionIndex: 0,
	_autoActionArray: null,
	_straightFlow: null,
	_idleCounter: null,
	_eventChecker: null,
	_orderCount: 0,
	_orderMaxCount: 0,
	
	openTurnCycle: function() {
		this._prepareTurnMemberData();
		this._completeTurnMemberData();
	},
	
	moveTurnCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		// If _isSkipAllowed returns true, check the skip.
		// With this, the skip at the battle doesn't affect the skip for turn.
		if (this._isSkipAllowed() && InputControl.isStartAction()) {
			CurrentMap.setTurnSkipMode(true);
		}
		
		if (mode === EnemyTurnMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === EnemyTurnMode.AUTOACTION) {
			result = this._moveAutoAction();
		}
		else if (mode === EnemyTurnMode.PREACTION) {
			result = this._movePreAction();
		}
		else if (mode === EnemyTurnMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === EnemyTurnMode.END) {
			result = this._moveEndEnemyTurn();
		}
		else if (mode === EnemyTurnMode.IDLE) {
			result = this._moveIdle();
		}
		
		return result;
	},
	
	drawTurnCycle: function() {
		var mode = this.getCycleMode();
		
		MapLayer.drawUnitLayer();
		
		if (mode === EnemyTurnMode.PREACTION) {
			this._drawPreAction();
		}
		else if (mode === EnemyTurnMode.AUTOACTION) {
			this._drawAutoAction();
		}
		else if (mode === EnemyTurnMode.AUTOEVENTCHACK) {
			this._drawAutoEventCheck();
		}
		
		if (this._isSkipProgressDisplayable()) {
			this._drawProgress();
		}
	},
	
	getOrderUnit: function() {
		return this._orderUnit;
	},
	
	_prepareTurnMemberData: function() {
		this._orderIndex = 0;
		this._orderUnit = null;
		this._autoActionIndex = 0;
		this._autoActionArray = [];
		this._straightFlow = createObject(StraightFlow);
		this._idleCounter = createObject(IdleCounter);
		this._eventChecker = createObject(EventChecker);
	},
	
	_completeTurnMemberData: function() {
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		
		this._resetOrderMark();
		this.changeCycleMode(EnemyTurnMode.TOP);
		
		// There is a possibility that the reinforcements appear when the player's turn ends,
		// execute the marking when the enemy's turn starts.
		MapLayer.getMarkingPanel().updateMarkingPanel();
	},
	
	_checkNextOrderUnit: function() {
		var i, unit;
		var list = this._getActorList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (!this._isOrderAllowed(unit)) {
				continue;
			}
			
			if (unit.getOrderMark() === OrderMarkType.FREE) {
				this._orderCount++;
				unit.setOrderMark(OrderMarkType.EXECUTED);
				return unit;
			}
		}
		
		return null;
	},
	
	_isOrderAllowed: function(unit) {
		if (unit.isActionStop() || unit.isWait() || unit.isInvisible() || StateControl.isBadStateOption(unit, BadStateOption.NOACTION)) {
			return false;
		}
		
		return true;
	},
	
	_resetOrderMark: function() {
		var i, unit;
		var list = this._getActorList();
		var count = list.getCount();
		
		// Set a state in which nobody moves. 
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			unit.setOrderMark(OrderMarkType.FREE);
		}
		
		this._orderMaxCount = count;
	},
	
	_moveTop: function() {
		var result;
		
		for (;;) {
			// Change a mode because the event occurs.
			if (this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), EventType.AUTO) === EnterResult.OK) {
				this.changeCycleMode(EnemyTurnMode.AUTOEVENTCHECK);
				return MoveResult.CONTINUE;
			}
			
			if (GameOverChecker.isGameOver()) {
				GameOverChecker.startGameOver();
			}
			
			// When the event is executed and if the scene itself has been changed,
			// don't continue. For instance, when the game is over etc.
			if (root.getCurrentScene() !== SceneType.FREE) {
				return MoveResult.CONTINUE;
			}
			
			// Get the unit who should move.
			this._orderUnit = this._checkNextOrderUnit();
			if (this._orderUnit === null) {
				// No more enemy exists, so enter to end the return.
				this.changeCycleMode(EnemyTurnMode.END);
				break;
			}
			else {
				// It's possible to refer to the control character of \act at the event.
				root.getCurrentSession().setActiveEventUnit(this._orderUnit);
				
				this._straightFlow.resetStraightFlow();
				
				// Execute a flow of PreAction.
				// PreAction is an action before the unit moves or attacks,
				// such as ActivePatternFlowEntry.
				result = this._straightFlow.enterStraightFlow();
				if (result === EnterResult.NOTENTER) {
					if (this._startAutoAction()) {
						// Change a mode because graphical action starts.
						this.changeCycleMode(EnemyTurnMode.AUTOACTION);
						break;
					}
					
					// If this method returns false, it means to loop, so the next unit is immediately checked.
					// If there are many units, looping for a long time and the busy state occurs.
					if (this._isSkipProgressDisplayable()) {
						this.changeCycleMode(EnemyTurnMode.TOP);
						break;
					}
				}
				else {
					// Change a mode because PreAction exists.
					this.changeCycleMode(EnemyTurnMode.PREACTION);
					break;
				}
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAutoAction: function() {
		// Check if action which is identified with this._autoActionIndex has ended.
		if (this._autoActionArray[this._autoActionIndex].moveAutoAction() !== MoveResult.CONTINUE) {
			if (!this._countAutoActionIndex()) {
				this._changeIdleMode(EnemyTurnMode.TOP, this._getIdleValue());
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_movePreAction: function() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			if (this._startAutoAction()) {
				// Change a mode because graphical action starts.
				this.changeCycleMode(EnemyTurnMode.AUTOACTION);
			}
			else {
				this.changeCycleMode(EnemyTurnMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAutoEventCheck: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			if (!this._isSkipMode()) {
				MapLayer.getMarkingPanel().updateMarkingPanel();
			}
			this.changeCycleMode(EnemyTurnMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEndEnemyTurn: function() {
		TurnControl.turnEnd();
		MapLayer.getMarkingPanel().updateMarkingPanel();
		this._orderCount = 0;
		return MoveResult.CONTINUE;
	},
	
	_moveIdle: function() {
		var nextmode;
		
		if (this._idleCounter.moveIdleCounter() !== MoveResult.CONTINUE) {
			nextmode = this._idleCounter.getNextMode();
			this.changeCycleMode(nextmode);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawPreAction: function() {
		this._straightFlow.drawStraightFlow();
	},
	
	_drawAutoAction: function() {
		this._autoActionArray[this._autoActionIndex].drawAutoAction();
	},
	
	_drawAutoEventCheck: function() {
		this._eventChecker.drawEventChecker();
	},
	
	_drawProgress: function() {
		var n;
		var textui = root.queryTextUI('single_window');
		var pic  = textui.getUIImage();
		var width = 130;
		var height = 74;
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		if (this._orderCount >= this._orderMaxCount) {
			n = 100;
		}
		else {
			n = Math.floor(100 * (this._orderCount / this._orderMaxCount));
		}
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += DefineControl.getWindowXPadding();
		y += DefineControl.getWindowYPadding();
		
		TextRenderer.drawText(x, y, StringTable.SkipProgress, -1, textui.getColor(), textui.getFont());
		NumberRenderer.drawNumber(x + 44, y + 20, n);
		TextRenderer.drawKeywordText(x + 58, y + 21, StringTable.SignWord_Percent, -1, textui.getColor(), textui.getFont());
	},
	
	_isActionAllowed: function() {
		// Call createAIPattern only here so as always to return the same pattern at the subsequent getAIPattern.
		// At this method to check the pattern every time, if the probability is condition, the pattern which can be gotten isn't unequal.
		// If there is no allowed page even one page, return null. 
		return this._orderUnit.createAIPattern() !== null;
	},
	
	_startAutoAction: function() {
		var result;
		
		if (!this._isActionAllowed()) {
			return false;
		}
		
		// If AutoAction cannot be created, check the next unit.
		if (!this._createAutoAction()) {
			return false;
		}
		
		while (this._autoActionIndex < this._autoActionArray.length) {
			result = this._autoActionArray[this._autoActionIndex].enterAutoAction();
			if (result === EnterResult.OK) {
				return true;
			}
			
			this._autoActionIndex++;
		}
		
		this._autoActionIndex = 0;
		
		// Return false means to check the next unit immediately.
		return false;
	},
	
	_countAutoActionIndex: function() {
		var result;
		
		// Increase the index for the next action.
		this._autoActionIndex++;
		
		while (this._autoActionIndex < this._autoActionArray.length) {
			result = this._autoActionArray[this._autoActionIndex].enterAutoAction();
			if (result === EnterResult.OK) {
				return true;
			}
			
			this._autoActionIndex++;
		}
		
		this._autoActionIndex = 0;
		
		return false;
	},
	
	_createAutoAction: function() {
		var keyword;
		var patternType = this._orderUnit.getAIPattern().getPatternType();
		
		this._autoActionArray = [];
		
		if (patternType === PatternType.APPROACH) {
			AutoActionBuilder.buildApproachAction(this._orderUnit, this._autoActionArray);
		}
		else if (patternType === PatternType.WAIT) {
			AutoActionBuilder.buildWaitAction(this._orderUnit, this._autoActionArray);
		}
		else if (patternType === PatternType.MOVE) {
			AutoActionBuilder.buildMoveAction(this._orderUnit, this._autoActionArray);
		}
		else if (patternType === PatternType.CUSTOM) {
			keyword = this._orderUnit.getAIPattern().getCustomKeyword();
			AutoActionBuilder.buildCustomAction(this._orderUnit, this._autoActionArray, keyword);
		}
		
		return true;
	},
	
	_getActorList: function() {
		return TurnControl.getActorList();
	},
	
	_isSkipMode: function() {
		return CurrentMap.isTurnSkipMode();
	},
	
	_isSkipProgressDisplayable: function() {
		return this._isSkipMode() && DataConfig.isEnemyTurnOptimized();
	},
	
	_getIdleValue: function() {
		return 10;
	},
	
	_isSkipAllowed: function() {
		var mode = this.getCycleMode();
		
		if (mode === EnemyTurnMode.AUTOACTION) {
			return this._autoActionArray[this._autoActionIndex].isSkipAllowed();
		}
		
		return true;
	},
	
	_changeIdleMode: function(nextmode, value) {
		this._idleCounter.setIdleInfo(value, nextmode);
		this.changeCycleMode(EnemyTurnMode.IDLE);
	},
	
	_pushFlowEntries: function(straightFlow) {
		straightFlow.pushFlowEntry(ActivePatternFlowEntry);
	}
}
);

// Process when the "Active Turn" of the enemy unit event.
var ActivePatternFlowEntry = defineObject(BaseFlowEntry,
{
	_capsuleEvent: null,
	
	enterFlowEntry: function(enemyTurn) {
		this._prepareMemberData(enemyTurn);
		return this._completeMemberData(enemyTurn);
	},
	
	moveFlowEntry: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return result;
	},
	
	_prepareMemberData: function(enemyTurn) {
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeMemberData: function(enemyTurn) {
		var event = UnitEventChecker.getUnitEvent(enemyTurn.getOrderUnit(), UnitEventType.ACTIVETURN);
		
		return this._capsuleEvent.enterCapsuleEvent(event, true);
	}
}
);

// It's used If the unit who has a state of "Berserk" or "Auto AI" in the player exists.
var PlayerBerserkTurn = defineObject(EnemyTurn,
{
	_moveEndEnemyTurn: function() {
		var i, unit;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
				unit.setWait(false);
			}
			else if (StateControl.isBadStateOption(unit, BadStateOption.AUTO)) {
				unit.setWait(false);
			}
		}
		
		CurrentMap.setTurnSkipMode(false);
		
		return MoveResult.END;
	},
	
	_isOrderAllowed: function(unit) {
		if (!EnemyTurn._isOrderAllowed.call(this, unit)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
			return true;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.AUTO)) {
			return true;
		}
		
		return false;
	}
}
);

//------------------------------------------------------

var AutoActionBuilder = {
	buildApproachAction: function(unit, autoActionArray) {
		var combination;
		
		// Get the best combination in the unit who can attack from the current position.
		combination = CombinationManager.getApproachCombination(unit, true);
		if (combination === null) {
			// Search the opponent to widen the range because no unit who can be attacked from the current position exists.
			// However, before that, check if the attack within a range was set.
			if (unit.getAIPattern().getApproachPatternInfo().isRangeOnly()) {
				// Do nothing because attack is set only within a range.
				// There is no problem because it has already checked that it's impossible to attack within a range. 
				return this._buildEmptyAction();
			}
			else {
				// Get which enemy to be targeted because there is no opponent who can be attacked at the current position.
				combination = CombinationManager.getEstimateCombination(unit);
				if (combination === null) {
					return this._buildEmptyAction();
				}
				else {
					// Set the target position to move.
					this._pushMove(unit, autoActionArray, combination);
					
					// Set it so as to wait after move.
					this._pushWait(unit, autoActionArray, combination);
				}
			}
		}
		else {
			this._pushGeneral(unit, autoActionArray, combination);
		}
		
		return true;
	},
	
	buildWaitAction: function(unit, autoActionArray) {
		var combination;
		var isWaitOnly = unit.getAIPattern().getWaitPatternInfo().isWaitOnly();
		
		if (isWaitOnly) {
			return this._buildEmptyAction();
		}
		else {
			// Get the best combination in the unit who can attack from the current position.
			combination = CombinationManager.getWaitCombination(unit);
			if (combination === null) {
				// Do nothing because it cannot attack.
				return this._buildEmptyAction();
			}
			else {
				this._pushGeneral(unit, autoActionArray, combination);
			}
		}
		
		return true;
	},
	
	buildMoveAction: function(unit, autoActionArray) {
		var x, y, targetUnit;
		var combination = null;
		var patternInfo = unit.getAIPattern().getMovePatternInfo();
		
		if (patternInfo.getMoveGoalType() === MoveGoalType.POS) {
			x = patternInfo.getMoveGoalX();
			y = patternInfo.getMoveGoalY();
		}
		else {
			targetUnit = patternInfo.getMoveGoalUnit();
			if (targetUnit === null) {
				return this._buildEmptyAction();
			}
			
			x = targetUnit.getMapX();
			y = targetUnit.getMapY();
		}
		
		// Check if it has already reached at goal.
		if (unit.getMapX() === x && unit.getMapY() === y) {
			// Attack if it can attack.
			if (patternInfo.getMoveAIType() === MoveAIType.APPROACH) {
				combination = CombinationManager.getWaitCombination(unit);
				if (combination !== null) {
					this._pushGeneral(unit, autoActionArray, combination);
					return true;
				}
			}
		}
		else {
			combination = CombinationManager.getMoveCombination(unit, x, y, patternInfo.getMoveAIType());
			if (combination === null) {
				return this._buildEmptyAction();
			}
			
			if (combination.item !== null) {
				this._pushGeneral(unit, autoActionArray, combination);
				return true;
			}
			else {
				this._pushMove(unit, autoActionArray, combination);
			}
		}
		
		if (combination !== null) {
			this._pushWait(unit, autoActionArray, combination);
		}
		
		return true;
	},
	
	buildCustomAction: function(unit, autoActionArray, keyword) {
		return false;
	},
	
	_buildEmptyAction: function() {
		// If wait is needed, execute the following processing.
		// pushWait(unit, this._autoActionArray, null);
		return false;
	},
	
	_pushGeneral: function(unit, autoActionArray, combination) {
		// Set the target position to move.
		this._pushMove(unit, autoActionArray, combination);
		
		if (combination.skill !== null) {
			this._pushSkill(unit, autoActionArray, combination);
		}
		else if (combination.item !== null) {
			if (combination.item.isWeapon()) {
				this._pushAttack(unit, autoActionArray, combination);
			}
			else {
				this._pushItem(unit, autoActionArray, combination);
			}
		}
		else {
			this._pushCustom(unit, autoActionArray, combination);
		}
		
		this._pushWait(unit, autoActionArray, combination);
	},
	
	_pushMove: function(unit, autoActionArray, combination) {
		var autoAction;
		
		this._pushScroll(unit, autoActionArray, combination);
		
		if (combination.cource.length === 0) {
			return;
		}
		
		autoAction = createObject(MoveAutoAction);
		autoAction.setAutoActionInfo(unit, combination);
		autoActionArray.push(autoAction);
	},
	
	_pushAttack: function(unit, autoActionArray, combination) {
		var autoAction = createObject(WeaponAutoAction);
		
		autoAction.setAutoActionInfo(unit, combination);
		autoActionArray.push(autoAction);
	},
	
	_pushItem: function(unit, autoActionArray, combination) {
		var autoAction = createObject(ItemAutoAction);
		
		autoAction.setAutoActionInfo(unit, combination);
		autoActionArray.push(autoAction);
	},
	
	_pushSkill: function(unit, autoActionArray, combination) {
		var autoAction = createObject(SkillAutoAction);
		
		autoAction.setAutoActionInfo(unit, combination);
		autoActionArray.push(autoAction);
	},
	
	_pushWait: function(unit, autoActionArray, combination) {
		var autoAction = createObject(WaitAutoAction);
		
		autoAction.setAutoActionInfo(unit, combination);
		autoActionArray.push(autoAction);
	},
	
	_pushScroll: function(unit, autoActionArray, combination) {
		var autoAction;
		
		if (CurrentMap.isCompleteSkipMode()) {
			return;
		}
		
		if (EnvironmentControl.getScrollSpeedType() === SpeedType.HIGH) {
			MapView.setScroll(unit.getMapX(), unit.getMapY());
		}
		else {
			autoAction = createObject(ScrollAutoAction);
			autoAction.setAutoActionInfo(unit, combination);
			autoActionArray.push(autoAction);
		}
	},
	
	_pushCustom: function(unit, autoActionArray, combination) {
	}
};

var CombinationManager = {
	getApproachCombination: function(unit, isShortcutEnabled) {
		var combinationArray, combinationIndex, combination;
		var misc = CombinationBuilder.createMisc(unit, root.getCurrentSession().createMapSimulator());
		var isRange = true;
		
		misc.isShortcutEnabled = isShortcutEnabled;
		
		// The range to detect is within a range of the unit mov.
		misc.simulator.startSimulation(unit, ParamBonus.getMov(unit));
		
		// Create combinations of an array about the action.
		combinationArray = CombinationBuilder.createApproachCombinationArray(misc);
		if (combinationArray.length === 0) {
			combinationArray = this._getShortcutCombinationArray(misc);
			if (combinationArray.length === 0) {
				return null;
			}
			isRange = false;
		}
		
		// Get the best combination of an array.
		combinationIndex = CombinationSelector.getCombinationIndex(unit, combinationArray);
		if (combinationIndex < 0) {
			return null;
		}
		
		// With this processing, store the best combination.
		combination = combinationArray[combinationIndex];
		
		if (isRange) {
			// Create a move course from the unit current position until the position which combination.posIndex indicates.
			combination.cource = CourceBuilder.createRangeCource(unit, combination.posIndex, combination.simulator);
		}
		else {
			combination.cource = CourceBuilder.createExtendCource(unit, combination.posIndex, combination.simulator);
		}
		
		return combination;
	},
	
	getWaitCombination: function(unit) {
		var combinationArray, combinationIndex, combination;
		var simulator = root.getCurrentSession().createMapSimulator();
		var misc = CombinationBuilder.createMisc(unit, simulator);
		
		// If it's wait, mov is 0.
		simulator.startSimulation(unit, 0);
		
		// Create an array to combine related to the action.
		combinationArray = CombinationBuilder.createWaitCombinationArray(misc);
		if (combinationArray.length === 0) {
			return null;
		}
		
		// Get the best combination of an array.
		combinationIndex = CombinationSelector.getCombinationIndex(unit, combinationArray);
		if (combinationIndex < 0) {
			return null;
		}
		
		// With this processing, store the best combination.
		combination = combinationArray[combinationIndex];
		
		// A course is blank due to no move.
		combination.cource = [];
		
		return combination;
	},
	
	getMoveCombination: function(unit, x, y, moveAIType) {
		var simulator, goalIndex, blockUnitArray, data, moveCource, combination;
		
		if (unit.getMapX() === x && unit.getMapY() === y) {
			// If the current position is a goal, don't move.
			return StructureBuilder.buildCombination();
		}
		
		simulator = root.getCurrentSession().createMapSimulator();
		simulator.startSimulation(unit, CurrentMap.getWidth() * CurrentMap.getHeight());
		
		goalIndex = CurrentMap.getIndex(x, y);
		blockUnitArray = [];
		
		if (this._getBlockUnit(unit, x, y) !== null) {
			// The opponent unit (if the ally, it's the enemy, if the enemy, it's the player or the ally) exists at the goal, so don't create a course.
			// The same category unit is adjusted by createExtendCource, so don't treat.
			moveCource = [];
		}
		else {
			moveCource = CourceBuilder.createExtendCource(unit, goalIndex, simulator);
		}
		
		if (moveCource.length === 0) {
			// Get the closer position to goalIndex instead, because cannot move to the position of goalIndex.
			data = CourceBuilder.getValidGoalIndex(unit, goalIndex, simulator, moveAIType);
			if (goalIndex !== data.goalIndex) {
				// Save because new goal was found.
				goalIndex = data.goalIndex;
				// Create a course based on new goal.
				moveCource = CourceBuilder.createExtendCource(unit, goalIndex, simulator);
			}
			
			// Save a range of unit who blocked the course until the goal.
			blockUnitArray = data.blockUnitArray;
		}
		
		if (moveAIType === MoveAIType.MOVEONLY || this._isReached(unit, x, y, moveCource)) {
			// If it's "Move Only" or it can reach the goal,
			// move only is executed by subsequent process.
		}
		else if (moveAIType === MoveAIType.BLOCK) {
			// Process "Attack when Unreachable".
			combination = this._getBlockCombination(unit, blockUnitArray);
			if (combination !== null) {
				return combination;
			}
		}
		else if (moveAIType === MoveAIType.APPROACH) {
			// If "Attack as Possible", it's possible to immediately call getApproachCombination,
			// but if there is the unit who blocks, call _getBlockCombination to aim it as a priority.
			combination = this._getBlockCombination(unit, blockUnitArray);
			if (combination !== null) {
				return combination;
			}
			
			combination = this.getApproachCombination(unit, false);
			if (combination !== null) {
				return combination;
			}
		}
		
		combination = StructureBuilder.buildCombination();
		combination.cource = moveCource;
		
		return combination;
	},
	
	getEstimateCombination: function(unit) {
		var combinationArray, combinationIndex, combination;
		var simulator = root.getCurrentSession().createMapSimulator();
		var misc = CombinationBuilder.createMisc(unit, simulator);
			
		// A range to scan is the entire map.
		simulator.startSimulation(unit, CurrentMap.getWidth() * CurrentMap.getHeight());
		
		// Create combinations of an array about move.
		combinationArray = CombinationBuilder.createMoveCombinationArray(misc);
		if (combinationArray.length === 0) {
			combinationArray = this._getChaseCombinationArray(misc);
			if (combinationArray.length === 0) {
				return null;
			}
		}
		
		// Get the best combination of an array.
		combinationIndex = CombinationSelectorEx.getEstimateCombinationIndex(unit, combinationArray);
		if (combinationIndex < 0) {
			return null;
		}
		
		// With this processing, store the best combination.
		combination = combinationArray[combinationIndex];
		
		// At the combination.posIndex, index is stored to show the position to move.
		// Create with createExtendCource how to move the course to reach the position which that index indicates.
		combination.cource = CourceBuilder.createExtendCource(unit, combination.posIndex, simulator);
		
		return combination;
	},
	
	_getBlockCombination: function(unit, blockUnitArray) {
		var combinationArray, combinationIndex, combination;
		var simulator = root.getCurrentSession().createMapSimulator();
		var misc = CombinationBuilder.createMisc(unit, simulator);
		
		// A range to scan is within the range of the unit mov.
		simulator.startSimulation(unit, ParamBonus.getMov(unit));
		
		misc.blockList = StructureBuilder.buildDataList();
		misc.blockList.setDataArray(blockUnitArray);
		
		// Create combinations of an array about action.
		combinationArray = CombinationBuilder.createBlockCombinationArray(misc);
		if (combinationArray.length === 0) {
			return null;
		}
		
		// Get the best combination of an array.
		combinationIndex = CombinationSelector.getCombinationIndex(unit, combinationArray);
		if (combinationIndex < 0) {
			return null;
		}
		
		// With this processing, store the best combination.
		combination = combinationArray[combinationIndex];
		
		// Create a route from the unit current position until the position which combination.posIndex indicates.
		combination.cource = CourceBuilder.createRangeCource(unit, combination.posIndex, simulator);
		
		return combination;
	},
	
	_getBlockUnit: function(unit, x, y) {
		var type, targetType;
		var targetUnit = PosChecker.getUnitFromPos(x, y);
		
		if (targetUnit === null) {
			return null;
		}
		
		type = unit.getUnitType();
		targetType = targetUnit.getUnitType();
		
		if (type === UnitType.PLAYER || type === UnitType.ALLY) {
			if (targetType === UnitType.PLAYER || targetType === UnitType.ALLY) {
				return null;
			}
		}
		else {
			if (targetType === UnitType.ENEMY) {
				return null;
			}
		}
		
		return targetUnit;
	},
	
	_isTargetBlock: function(unit, xGoal, yGoal) {
		var type, targetType;
		var targetUnit = PosChecker.getUnitFromPos(xGoal, yGoal);
		
		if (targetUnit === null) {
			return false;
		}
		
		type = unit.getUnitType();
		targetType = targetUnit.getUnitType();
		
		if (type === UnitType.PLAYER || type === UnitType.ALLY) {
			if (targetType === UnitType.PLAYER || targetType === UnitType.ALLY) {
				return false;
			}
		}
		else {
			if (targetType === UnitType.ENEMY) {
				return false;
			}
		}
		
		return true;
	},
	
	_isReached: function(unit, xGoal, yGoal, moveCource) {
		var i, direction;
		var count = moveCource.length;
		var x = unit.getMapX();
		var y = unit.getMapY();
		
		for (i = 0; i < count; i++) {
			direction = moveCource[i];
			x += XPoint[direction];
			y += YPoint[direction];
		}
		
		return x === xGoal && y === yGoal;
	},
	
	_getChaseCombinationArray: function(misc) {
		// This method is called if the unit cannot attack when the unit moves anywhere.
		// For instance, when 2 units hit each other on a narrow road etc.
		// If so, wait is possible without doing anything,
		// but it's decided that it's better to approach the enemy as close as possible,
		// so process for that. Visually, with this method, it seems that the unit caused congestion in a narrow place.
		// But if it's described as below, no pursue and no congestion will occur.
		// return [];
		
		misc.isForce = true;
		
		return CombinationBuilder.createMoveCombinationArray(misc);
	},
	
	_getShortcutCombinationArray: function(misc) {
		var count = misc.costArrayUnused.length;
		
		// If count is 0, originally cannot attack an enemy, so don't continue.
		// If func is false, don't continue because a close position is not searched.
		if (count === 0 || !misc.isShortcutEnabled) {
			return [];
		}
		
		// If count is not 0, originally can attack an enemy,
		// but it overlaps the player, that means couldn't attack.
		// If so, move the closest position to the overlap position as possible,
		// so misc.isForce is true.
		misc.isForce = true;
		
		return CombinationBuilder.createApproachCombinationArray(misc);
	}
};

var CombinationBuilder = {
	createApproachCombinationArray: function(misc) {
		return this._createCombinationArray(misc);
	},
	
	createWaitCombinationArray: function(misc) {
		return this._createCombinationArray(misc);
	},
	
	createMoveCombinationArray: function(misc) {
		return this._createCombinationArray(misc);
	},
	
	createBlockCombinationArray: function(misc) {
		return this._createCombinationArray(misc);
	},
	
	createMisc: function(unit, simulator) {
		var misc = {};
		
		misc.unit = unit;
		misc.simulator = simulator;
		misc.disableFlag = unit.getAIPattern().getDisableFlag();
		misc.blockList = null;
		misc.combinationArray = [];
		misc.costArrayUnused = [];
		misc.isShortcutEnabled = true;
		
		return misc;
	},
	
	_resetMisc: function(misc) {
		misc.item = null;
		misc.skill = null;
		misc.actionTargetType = 0;
		misc.indexArray = [];
		misc.targetUnit = null;
		misc.costArray = [];
		misc.posIndex = 0;
		misc.movePoint = 0;
	},
	
	_createCombinationArray: function(misc) {
		var i, count, builder;
		var groupArray = [];
		
		this._configureCombinationCollector(groupArray);
		
		count = groupArray.length;
		for (i = 0; i < count; i++) {
			this._resetMisc(misc);
			builder = groupArray[i];
			// Create combination object and add it in misc.combinationArray.
			builder.collectCombination(misc);
		}
		
		return misc.combinationArray;
	},
	
	_configureCombinationCollector: function(groupArray) {
		groupArray.appendObject(CombinationCollector.Weapon);
		groupArray.appendObject(CombinationCollector.Item);
		groupArray.appendObject(CombinationCollector.Skill);
	}
};

// CombinationBuilder creates the combinations of an array such as where to move, which weapon to choose, and which opponent to attack etc.
// And CombinationSelector selects the best combination of the array.
var CombinationSelector = {
	_scorerArray: null,
	
	// Get the best index from combinationArray.
	getCombinationIndex: function(unit, combinationArray) {
		var index, combination, costIndex, costData;
		
		// Get which combination is used.
		index = this._getBestCombinationIndex(unit, combinationArray);
		if (index < 0) {
			return -1;
		}
		
		combination = combinationArray[index];
		
		if (combination.costArray.length === 0) {
			combination.posIndex = CurrentMap.getIndex(unit.getMapX(), unit.getMapY());
			combination.movePoint = 0;
			return index;
		}
		
		// Get which position is used.
		costIndex = this._getBestCostIndex(unit, combination);
		if (costIndex < 0) {
			return -1;
		}
		
		// Set the decided position as a combination.
		costData = combination.costArray[costIndex];
		combination.posIndex = costData.posIndex;
		combination.movePoint = costData.movePoint;
		
		return index;
	},
	
	_getBestCombinationIndex: function(unit, combinationArray) {
		var i, count, totalScore;
		var scoreArray = [];
		
		// Prepare necessary object to process the first stage.
		// At the first stage, decide with which weapon and who will be attacked.
		this._scorerArray = [];
		this._configureScorerFirst(this._scorerArray);
		
		count = combinationArray.length;
		for (i = 0; i < count; i++) {
			totalScore = this._getTotalScore(unit, combinationArray[i]);
			scoreArray.push(totalScore);
		}
		
		return this._getBestIndexFromScore(scoreArray);
	},
	
	_getBestCostIndex: function(unit, combination) {
		var i, count, totalScore, costData;
		var scoreArray = [];
		
		// Prepare necessary object to process the second stage.
		// At the first stage, decide a weapon and the opponent,
		// but not decided about from which position will attack the opponent.
		// At the second stage, decide the position.
		this._scorerArray = [];
		this._configureScorerSecond(this._scorerArray);
		
		// combination.costArray is an array to store the position of attack possible, so loop as the number.
		count = combination.costArray.length;
		for (i = 0; i < count; i++) {
			// Due to processing inside of _getTotalScore, set the position and consume mov temporarily.
			costData = combination.costArray[i];
			combination.posIndex = costData.posIndex;
			combination.movePoint = costData.movePoint;
			
			totalScore = this._getTotalScore(unit, combination);
			scoreArray.push(totalScore);
		}
		
		return this._getBestIndexFromScore(scoreArray);
	},
	
	_getBestIndexFromScore: function(scoreArray) {
		var i;
		var max = -1;
		var index = -1;
		var count = scoreArray.length;
		
		for (i = 0; i < count; i++) {
			// Save the largest score.
			if (scoreArray[i] > max) {
				max = scoreArray[i];
				index = i;
			}
		}
		
		return index;
	},
	
	_getTotalScore: function(unit, combination) {
		var i;
		var totalScore = 0;
		var count = this._scorerArray.length;
		
		for (i = 0; i < count; i++) {
			totalScore += this._scorerArray[i].getScore(unit, combination);
		}
		
		return totalScore;
	},
	
	_configureScorerFirst: function(groupArray) {
		groupArray.appendObject(AIScorer.Weapon);
		groupArray.appendObject(AIScorer.Item);
		groupArray.appendObject(AIScorer.Skill);
	},
	
	_configureScorerSecond: function(groupArray) {
		groupArray.appendObject(AIScorer.Counterattack);
		groupArray.appendObject(AIScorer.Avoid);
	}
};

// Decide which combination is used when aim to the distant opponent.
var CombinationSelectorEx = {
	getEstimateCombinationIndex: function(unit, combinationArray) {
		var i, index, combination;
		var count = combinationArray.length;
		var data = this._createEstimateData();
		
		for (i = 0; i < count; i++) {
			combination = combinationArray[i];
			if (this._isDistanceBase(unit, combination)) {
				this._checkDistanceBaseIndex(unit, combination, data, i);
			}
			else {
				this._checkScoreBaseIndex(unit, combination, data, i);
			}
		}
		
		if (data.recheckIndex !== -1) {
			this._checkDistanceBaseIndex(unit, combinationArray[data.recheckIndex], data, data.recheckIndex);
		}
		
		index = data.combinationIndex;
		if (index < 0) {
			return -1;
		}
		
		combinationArray[index].posIndex = data.posIndex;
		combinationArray[index].movePoint = data.min;
		
		return index;
	},
	
	_checkDistanceBaseIndex: function(unit, combination, data, combinationIndex) {
		var i, costData, isSet;
		var value = -1;
		var count = combination.costArray.length;
		
		for (i = 0; i < count; i++) {
			costData = combination.costArray[i];
			isSet = false;
			
			// If combination.isPriority is enabled, even if it has a distance, prioritize it.
			if (combination.isPriority) {
				// If detect first time, isSet is true without condition.
				if (!data.isPriority) {
					data.isPriority = true;
					isSet = true;
				}
				else if (costData.movePoint < data.min) {
					isSet = true;
				}
			}
			else if (data.isPriority) {
				// If detect the place event even once, don't allow the normal action.
				isSet = false;
			}
			else if (costData.movePoint < data.min) {
				isSet = true;
			}
			
			if (isSet) {
				// isSet is true means that the current costData should be marked as a target position to move,
				// but do it with _getCombinationScore because decision whether move towards is needed.
				// It's also possible to call _getCombinationScore before the loop of costArray,
				// but it has a tendency to take time to process, so call it only if isSet is checked.
				if (value === -1) {
					// 1 or 0 is stored at value, so this processing is executed only once.
					value = this._getCombinationScore(unit, combination) >= 0 ? 1 : 0;
				}
				
				if (value === 1) {
					data.min = costData.movePoint;
					data.posIndex = costData.posIndex;
					data.combinationIndex = combinationIndex;
				}
			}
		}
	},
	
	_checkScoreBaseIndex: function(unit, combination, data, combinationIndex) {
		var score = this._getCombinationScore(unit, combination);
		
		if (score > data.score) {
			data.score = score;
			data.recheckIndex = combinationIndex;
		}
	},
	
	_getCombinationScore: function(unit, combination) {
		var subject, score;
		
		// If a course until goal is blocked, set null.
		if (combination.item === null) {
			if (combination.skill !== null) {
				subject = createObject(AIScorer.Skill);
				score = subject.getScore(unit, combination);
			}
			else {
				// Set AIValue.MIN_SCORE if no need to move.
				score = 0;
			}
			
			return score;
		}
		
		if (combination.item.isWeapon()) {
			if (this._isZeroWeaponAllowed()) {
				score = 0;
			}
			else {
				// If atk or hit is 0, it shouldn't move towards the unit.
				subject = createObject(AIScorer.Weapon);
				score = subject.getScore(unit, combination);
			}
		}
		else {
			// Check if it's the opponent to use the item.
			// For instance, if HP is not reduced,
			// no need to use the recovery item.
			subject = createObject(AIScorer.Item);
			score = subject.getScore(unit, combination);
		}
		
		return score;
	},
	
	_isDistanceBase: function(unit, combination) {
		var d = combination.rangeMetrics.endRange - combination.rangeMetrics.startRange;
		
		// To decide combinations, there are a distance type and a score type.
		// A distance type means to aim the close opponent, and a score type means to aim the opponent who has high scores.
		// To decide which way to check, decide it how distant of scope the unit has.
		// If it's distant attack (recovery), there are many positions which can attack (recover) for the opponent,
		// so it takes time to check which position is the closest.
		
		return d <= 6;
	},
	
	_isZeroWeaponAllowed: function() {
		return DataConfig.isAIDamageZeroAllowed() && DataConfig.isAIHitZeroAllowed();
	},
	
	_createEstimateData: function() {
		var data = {};
		
		data.isPriority = false;
		data.combinationIndex = -1;
		data.posIndex = 0;
		data.min = AIValue.MAX_MOVE;
		
		data.score = -1;
		data.recheckIndex = -1;
		
		return data;
	}
};
