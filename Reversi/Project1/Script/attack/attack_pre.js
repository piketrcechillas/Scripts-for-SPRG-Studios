
var PreAttackMode = {
	START: 0,
	CORE: 1,
	END: 2
};

// The battle is started by calling PreAttack.enterPreAttackCycle.
// PreAttack leaves the specific battle processing to CoreAttack,
// and processes before the battle and after the battle on the map.
var PreAttack = defineObject(BaseObject,
{
	_attackParam: null,
	_coreAttack: null,
	_startStraightFlow: null,
	_endStraightFlow: null,
	
	enterPreAttackCycle: function(attackParam) {
		this._prepareMemberData(attackParam);
		return this._completeMemberData(attackParam);
	},
	
	movePreAttackCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === PreAttackMode.START) {
			result = this._moveStart();
		}
		else if (mode === PreAttackMode.CORE) {
			result = this._moveCore();
		}
		else if (mode === PreAttackMode.END) {
			result = this._moveEnd();
		}
		
		return result;
	},
	
	drawPreAttackCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === PreAttackMode.START) {
			this._drawStart();
		}
		else if (mode === PreAttackMode.CORE) {
			this._drawCore();
		}
		else if (mode === PreAttackMode.END) {
			this._drawEnd();
		}
	},
	
	backPreAttackCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === PreAttackMode.CORE) {
			this._coreAttack.backCoreAttackCycle();
		}
	},
	
	getActiveUnit: function() {
		var order = this._coreAttack.getAttackFlow().getAttackOrder();
		
		return order.getActiveUnit();
	},
	
	getPassiveUnit: function() {
		var order = this._coreAttack.getAttackFlow().getAttackOrder();
		
		return order.getPassiveUnit();
	},
	
	isUnitLostEventShown: function() {
		return this._coreAttack.isUnitLostEventShown();
	},
	
	recordUnitLostEvent: function(isShown) {
		this._coreAttack.recordUnitLostEvent(isShown);
	},
	
	isPosMenuDraw: function() {
		return this.getCycleMode() === PreAttackMode.START;
	},
	
	getCoreAttack: function() {
		return this._coreAttack;
	},
	
	getAttackParam: function() {
		return this._attackParam;
	},
	
	_prepareMemberData: function(attackParam) {
		this._attackParam = attackParam;
		this._coreAttack = createObject(CoreAttack);
		this._startStraightFlow = createObject(StraightFlow);
		this._endStraightFlow = createObject(StraightFlow);
		
		AttackControl.setPreAttackObject(this);
		BattlerChecker.setUnit(attackParam.unit, attackParam.targetUnit);
	},
	
	_completeMemberData: function(attackParam) {
		this._doStartAction();
		
		if (CurrentMap.isCompleteSkipMode()) {
			if (this._skipAttack()) {
				this._doEndAction();
				return EnterResult.NOTENTER;
			}
		}
		else {
			this._startStraightFlow.enterStraightFlow();
			this.changeCycleMode(PreAttackMode.START);
		}
		
		return EnterResult.OK;
	},
	
	_moveStart: function() {
		if (this._startStraightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._coreAttack.enterCoreAttackCycle(this._attackParam, false);
			this.changeCycleMode(PreAttackMode.CORE);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveCore: function() {
		if (this._coreAttack.moveCoreAttackCycle() !== MoveResult.CONTINUE) {
			this._endStraightFlow.enterStraightFlow();
			this.changeCycleMode(PreAttackMode.END);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEnd: function() {
		if (this._endStraightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawStart: function() {
		this._startStraightFlow.drawStraightFlow();
	},
	
	_drawCore: function() {
		this._coreAttack.drawCoreAttackCycle();
	},
	
	_drawEnd: function() {
		this._endStraightFlow.drawStraightFlow();
	},
	
	_skipAttack: function() {
		// Return false if the processing cannot be skipped completely.
		// The caller who detects false, switches the mode to call movePreAttackCycle/drawPreAttackCycle.
		
		if (this._startStraightFlow.enterStraightFlow() === EnterResult.OK) {
			this.changeCycleMode(PreAttackMode.START);
			return false;
		}
		
		// This method can be completely skipped.
		// It means, when the method returns control, the battle ends.
		this._coreAttack.enterCoreAttackCycle(this._attackParam);
		
		if (this._endStraightFlow.enterStraightFlow() === EnterResult.OK) {
			this.changeCycleMode(PreAttackMode.END);
			// This mode can restart the processing.
			return false;
		}
		
		return true;
	},
	
	_doStartAction: function() {
		this._startStraightFlow.setStraightFlowData(this);
		this._pushFlowEntriesStart(this._startStraightFlow);
		
		this._endStraightFlow.setStraightFlowData(this);
		this._pushFlowEntriesEnd(this._endStraightFlow);
		
		if (this._attackParam.fusionAttackData !== null) {
			FusionControl.startFusionAttack(this._attackParam.unit, this._attackParam.fusionAttackData);
		}
	},
	
	_doEndAction: function() {
		var passive = this.getPassiveUnit();
		
		if (this._attackParam.fusionAttackData !== null) {
			FusionControl.endFusionAttack(this._attackParam.unit);
		}
		
		if (passive.getHp() === 0) {
			// If this deactivation processing is done at the time of dead setting (DamageControl.setDeathState), the state etc.,
			// cannot be specified in the condition of the dead event, so execute with this method. 
			StateControl.arrangeState(passive, null, IncreaseType.ALLRELEASE);
			MetamorphozeControl.clearMetamorphoze(passive);
		}
		
		AttackControl.setPreAttackObject(null);
		BattlerChecker.setUnit(null, null);
	},
	
	_pushFlowEntriesStart: function(straightFlow) {
	},
	
	_pushFlowEntriesEnd: function(straightFlow) {
		// LoserMessageFlowEntry checks the dead event.
		// This checking is done at the CoreAttack.UnitDeathFlowEntry,
		// but checking of CoreAttack can also be skipped,
		// so if the unit is dead, there's a possibility that nothing is displayed.
		// To prevent it, LoserMessageFlowEntry is prepared.
		straightFlow.pushFlowEntry(LoserMessageFlowEntry);
		
		// WeaponValidFlowEntry should be processed before DropFlowEntry.
		straightFlow.pushFlowEntry(WeaponValidFlowEntry);
		straightFlow.pushFlowEntry(DropFlowEntry);
		straightFlow.pushFlowEntry(ImportantItemFlowEntry);
		straightFlow.pushFlowEntry(ReleaseFusionFlowEntry);
		straightFlow.pushFlowEntry(CatchFusionFlowEntry);
	}
}
);

var LoserMessageFlowEntry = defineObject(BaseFlowEntry,
{
	_capsuleEvent: null,
	
	enterFlowEntry: function(preAttack) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	},
	
	moveFlowEntry: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			// It's a countermeasure if the unit continuously dies with damage of the terrain.
			EventCommandManager.eraseMessage(MessageEraseFlag.ALL);
			return MoveResult.END;
		}
		
		return result;
	},
	
	_prepareMemberData: function(preAttack) {
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeMemberData: function(preAttack) {
		var result, isEventStoppable, active;
		var isEventSkip = false;
		var unit = preAttack.getPassiveUnit();
		
		if (unit.getHp() !== 0) {
			return EnterResult.NOTENTER;
		}
		
		// Check if the dead event is displayed with CoreAttack.
		if (preAttack.isUnitLostEventShown()) {
			// If processed with CoreAttack, PreAttack doesn't need to process.
			return EnterResult.NOTENTER;
		}
		
		active = preAttack.getActiveUnit();
		if (active === null) {
			active = {};
		}
		root.getSceneController().notifyBattleEnd(active, unit);
		
		isEventStoppable = this._isEventStoppable(unit);
		if (isEventStoppable) {
			// Before skip is disabled, save the current skip state.
			isEventSkip = CurrentMap.isCompleteSkipMode();
			CurrentMap.setTurnSkipMode(false);
		}
		
		result = this._capsuleEvent.enterCapsuleEvent(UnitEventChecker.getUnitLostEvent(unit), false);
		if (result === EnterResult.NOTENTER) {
			if (isEventStoppable) {
				// Skip state is restored because it wasn't an event accompanied with image display.
				CurrentMap.setTurnSkipMode(isEventSkip);
			}
		}
		
		return result;
	},
	
	_isEventStoppable: function(unit) {
		// The player who is not a guest can stop skip.
		return unit.getUnitType() === UnitType.PLAYER && !unit.isGuest();
	}
}
);

var WeaponValidFlowEntry = defineObject(BaseFlowEntry,
{
	enterFlowEntry: function(preAttack) {
		this._checkDelete(preAttack.getActiveUnit());
		this._checkDelete(preAttack.getPassiveUnit());
		
		return EnterResult.NOTENTER;
	},
	
	_checkDelete: function(unit) {
		var weapon = BattlerChecker.getBaseWeapon(unit);
		
		if (weapon === null) {
			return;
		}
		
		if (ItemControl.isItemBroken(weapon)) {
			ItemControl.lostItem(unit, weapon);
		
			if (unit.getUnitType() !== UnitType.PLAYER && DataConfig.isDropTrophyLinked()) {
				// The drop trophy disappears due to weapon destroyed.
				ItemControl.deleteTrophy(unit, weapon);
			}
		}
	}
}
);

var DropFlowEntry = defineObject(BaseFlowEntry,
{
	_trophyCollector: null,
	
	enterFlowEntry: function(preAttack) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	},
	
	moveFlowEntry: function() {
		return this._trophyCollector.moveTrophyCollector();
	},
	
	_prepareMemberData: function(preAttack) {
		this._trophyCollector = createObject(TrophyCollector);
	},
	
	_completeMemberData: function(preAttack) {
		var result;
		var active = preAttack.getActiveUnit();
		var passive = preAttack.getPassiveUnit();
		
		if (active !== null) {
			if (!this._isDrop(preAttack)) {
				return EnterResult.NOTENTER;
			}
		}
		
		this._startTrophyCheck(active, passive);
		result = this._enterTrophyCollector(active, passive);
		this._endTrophyCheck(active, passive);
		
		return result;
	},
	
	_isDrop: function(preAttack) {
		var winner;
		var active = preAttack.getActiveUnit();
		var passive = preAttack.getPassiveUnit();
		
		if (active.getHp() !== 0 && passive.getHp() !== 0) {
			return false;
		}
		
		if (passive.getHp() === 0) {
			winner = active;
		}
		else {
			winner = passive;
		}
		
		// No drop check is done if the winner is the enemy.
		if (winner.getUnitType() === UnitType.ENEMY || winner.getUnitType() === UnitType.ALLY) {
			return false;
		}
		
		return true;
	},
	
	_startTrophyCheck: function(winner, loser) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(loser);
		
		if (!DamageControl.isSyncope(loser)) {
			return;
		}
		
		// At the "Fusion Attack" can steal the opponent item
		// so delete the drop trophy which links to the opponent's possession item.
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(loser, i);
			if (item === null) {
				continue;
			}
			
			ItemControl.deleteTrophy(loser, item);
		}
	},
	
	_enterTrophyCollector: function(winner, loser) {
		var i, trophy;
		var list = loser.getDropTrophyList();
		var count = list.getCount();
		
		this._trophyCollector.prepareTrophy(winner);
		
		// Set the drop trophy as TrophyCollector.
		for (i = 0; i < count; i++) {
			trophy = list.getData(i);
			if ((trophy.getFlag() & TrophyFlag.ITEM) && DataConfig.isDropTrophyLinked()) {
				// If "Delete drop trophies if weapons break" is ticked,
				// weapon durability affects the drop trophy.
				this._copyItemLimit(loser, trophy);
			}
			this._trophyCollector.addTrophy(trophy);
		}
		
		return this._trophyCollector.enterTrophyCollector();
	},
	
	_copyItemLimit: function(loser, trophy) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(loser);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(loser, i);
			if (item === null) {
				continue;
			}
			
			if (ItemControl.compareItem(item, trophy.getItem())) {
				// To inherit item durability, the drop trophy is not always in a new state to be obtained.
				trophy.setLimit(item.getLimit());
				break;
			}
		}
	},
	
	_endTrophyCheck: function(winner, loser) {
		var list = loser.getDropTrophyList();
		var editor = root.getCurrentSession().getTrophyEditor();
		
		editor.deleteAllTrophy(list);
	}
}
);

var ImportantItemFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicEvent: null,
	
	enterFlowEntry: function(preAttack) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(preAttack) {
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(preAttack) {
		var generator;
		var unit = preAttack.getPassiveUnit();
		
		// If it's not the player, no need to check important items.
		if (unit.getUnitType() !== UnitType.PLAYER) {
			return EnterResult.NOTENTER;
		}
		
		// Check not only HP, but also death state.
		// If injury, important items are not sent to the stock.
		if (unit.getHp() !== 0 || unit.getAliveState() !== AliveType.DEATH) {
			return EnterResult.NOTENTER;
		}
		
		generator = this._dynamicEvent.acquireEventGenerator();
		
		if (!this._checkImportantItem(unit, generator)) {
			return EnterResult.NOTENTER;
		}
		
		return this._dynamicEvent.executeDynamicEvent();
	},
	
	_checkImportantItem: function(unit, generator) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		var isDataAdd = false;
		var isSkipMode = true;
		
		// If the player unit is dead, check if the unit has important items.
		// The reason is if losing important items, there is a possibility that the game cannot be completed.
		// So if having important items, add them into a stock.
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			// Check if items are important items.
			if (item !== null && item.isImportance()) {
				// Send it to the stock only if it's not prohibited to trade.
				// Otherwise, the trade is satisfied through the items which have been set to the stock.
				if (!item.isTradeDisabled()) {
					isDataAdd = true;
					generator.stockItemChange(item, IncreaseType.INCREASE, isSkipMode);
					generator.unitItemChange(unit, item, IncreaseType.DECREASE, isSkipMode);
				}
			}
		}
		
		return isDataAdd;
	}
}
);

// If the enemy is beaten with "Fusion Attack", catch the unit.
var CatchFusionFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicEvent: null,
	
	enterFlowEntry: function(preAttack) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(preAttack) {
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(preAttack) {
		var generator;
		var active = preAttack.getActiveUnit();
		var passive = preAttack.getPassiveUnit();
		var fusionData = FusionControl.getFusionAttackData(active);
		var direction = PosChecker.getSideDirection(active.getMapX(), active.getMapY(), passive.getMapX(), passive.getMapY());
		
		if (fusionData === null) {
			return EnterResult.NOTENTER;
		}
		
		if (!DamageControl.isSyncope(passive)) {
			return EnterResult.NOTENTER;
		}
		
		DamageControl.setCatchState(passive, true);
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.unitFusion(active, passive, fusionData, direction, FusionActionType.CATCH, false);
		
		return this._dynamicEvent.executeDynamicEvent();
	}
}
);

// If the parent unit of fusion cannot battle, the child unit is released.
var ReleaseFusionFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicEvent: null,
	
	enterFlowEntry: function(preAttack) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_prepareMemberData: function(preAttack) {
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(preAttack) {
		var generator, parentUnit, childUnit;
		var unit = preAttack.getPassiveUnit();
		
		if (unit.getHp() !== 0) {
			return EnterResult.NOTENTER;
		}
		
		parentUnit = FusionControl.getFusionParent(unit);
		if (parentUnit !== null) {
			// The unit is fused, so separate from the parents.
			FusionControl.releaseChild(parentUnit);
			return EnterResult.NOTENTER;
		}
		
		// The unit is not fused, so don't continue to process.
		childUnit = FusionControl.getFusionChild(unit);
		if (childUnit === null) {
			return EnterResult.NOTENTER;
		}
		
		// The unit who was caught with a "Fusion Attack" is returned to the normal state. 
		childUnit.setSyncope(false);
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.unitFusion(unit, {}, {}, DirectionType.NULL, FusionActionType.RELEASE, false);
		
		return this._dynamicEvent.executeDynamicEvent();
	}
}
);

// Process with an event command "Reduce Hp" if the unit is beaten.
// At the "Remove Unit" of the event command, such a processing doesn't occur.
var DamageHitFlow = defineObject(BaseObject,
{
	_unit: null,
	_targetUnit: null,
	_straightFlow: null,
	
	enterDamageHitFlowCycle: function(unit, targetUnit) {
		this._unit = unit;
		this._targetUnit = targetUnit;
		this._straightFlow = createObject(StraightFlow);
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		
		return this._straightFlow.enterStraightFlow();
	},
	
	moveDamageHitFlowCycle: function() {
		return this._straightFlow.moveStraightFlow();
	},
	
	drawDamageHitFlowCycle: function() {
		this._straightFlow.drawStraightFlow();
	},
	
	// Each type of FlowEntry is designed to receive PreAttack,
	// so the PreAttack method is implemented.
	getActiveUnit: function() {
		return this._unit;
	},
	
	getPassiveUnit: function() {
		return this._targetUnit;
	},
	
	isUnitLostEventShown: function() {
		return false;
	},
	
	recordUnitLostEvent: function(isShown) {
	},
	
	_pushFlowEntries: function(straightFlow) {
		// It's not beating by a weapon, so WeaponValidFlowEntry is not included.
		// It's not "Fusion Attack", so CatchFusionFlowEntry is not included.
		
		straightFlow.pushFlowEntry(LoserMessageFlowEntry);
		straightFlow.pushFlowEntry(DropFlowEntry);
		straightFlow.pushFlowEntry(ImportantItemFlowEntry);
		straightFlow.pushFlowEntry(ReleaseFusionFlowEntry);
	}
}
);
