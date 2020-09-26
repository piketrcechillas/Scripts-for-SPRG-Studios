
// Control the unit state.
var StateControl = {
	// Check if he unit includes the specific BadStateOption.
	isBadStateOption: function(unit, option) {
		var i, state;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			state = list.getData(i).getState();
			if (state.getBadStateOption() === option) {
				return true;
			}
		}
		
		return false;
	},
	
	// Check if he unit includes the specific BadStateFlag.
	isBadStateFlag: function(unit, flag) {
		var i, state;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			state = list.getData(i).getState();
			if (state.getBadStateFlag() & flag) {
				return true;
			}
		}
		
		return false;
	},
	
	// Check if the unit includes the specified state.
	getTurnState: function(unit, state) {
		var i, turnState;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			turnState = list.getData(i);
			if (turnState.getState() === state) {
				return turnState;
			}
		}
		
		return null;
	},
	
	// Get the value of "Automatic Recovery".
	getHpValue: function(unit) {
		var i, state;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		var recoveryValue = 0;
		
		for (i = 0; i < count; i++) {
			state = list.getData(i).getState();
			recoveryValue += state.getAutoRecoveryValue();
		}
		
		return recoveryValue;
	},
	
	// Calculate if the state can be activated.
	checkStateInvocation: function(active, passive, obj) {
		var stateInvocation = obj.getStateInvocation();
		var state = stateInvocation.getState();
		
		if (this.isStateBlocked(passive, active, state)) {
			// If the state can be disabled, return null.
			return null;
		}
		
		if (Probability.getInvocationProbability(active, stateInvocation.getInvocationType(), stateInvocation.getInvocationValue())) {
			// If the state can be activated, return the state.
			return state;
		}
		
		return null;
	},
	
	// Add or deactivate the state for the unit.
	arrangeState: function(unit, state, increaseType) {
		var turnState = null;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		var editor = root.getDataEditor();
		
		if (increaseType === IncreaseType.INCREASE) {
			turnState = this.getTurnState(unit, state);
			if (turnState !== null) {
				// If the state has already been added, update the turn number.
				turnState.setTurn(state.getTurn());
			}
			else {
				if (count < DataConfig.getMaxStateCount()) {
					turnState = editor.addTurnStateData(list, state);
				}
			}
		}
		else if (increaseType === IncreaseType.DECREASE) {
			editor.deleteTurnStateData(list, state);
		}
		else if (increaseType === IncreaseType.ALLRELEASE) {
			editor.deleteAllTurnStateData(list);
		}
		
		MapHpControl.updateHp(unit);
		
		return turnState;
	},
	
	// Get the parameter value which includes "Consume each Turn".
	getStateParameter: function(unit, index) {
		var i;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		var value = 0;
		
		for (i = 0; i < count; i++) {
			value += ParamGroup.getDopingParameter(list.getData(i), index);
		}
		
		return value;
	},
	
	// Decrease the turn of the state which is set at the unit.
	decreaseTurn: function(list) {
		var i, j, count, count2, unit, arr, list2, turn, turnState;
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			arr = [];
			unit = list.getData(i);
			list2 = unit.getTurnStateList();
			count2 = list2.getCount();
			for (j = 0; j < count2; j++) {
				turnState = list2.getData(j);
				turn = turnState.getTurn();
				if (turn <= 0) {
					continue;
				}
				
				// Decrease the turn by 1 and newly set.
				turn--;
				turnState.setTurn(turn);
				if (turn <= 0) {
					// Save at array so as to deactivate the state later.
					arr.push(turnState.getState());
				}
			}
			
			count2 = arr.length;
			for (j = 0; j < count2; j++) {
				this.arrangeState(unit, arr[j], IncreaseType.DECREASE);
			}
		}
	},
	
	// Check if it disables that the unit receives the state.
	isStateBlocked: function(unit, targetUnit, state) {
		var i, count, item, stateGroup;
		
		if (state === null) {
			return false;
		}
		
		if (state.isBadState()) {
			// Check if the unit disables the bad state.
			if (unit.isBadStateGuard()) {
				return true;
			}
			
			// Check if the skill disables the bad state.
			if (SkillControl.getBattleSkillFromFlag(unit, targetUnit, SkillType.INVALID, InvalidFlag.BADSTATE) !== null) {
				return true;
			}
		}
		
		count = UnitItemControl.getPossessionItemCount(unit);
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item.isWeapon()) {
				continue;
			}
			
			// Check the "Guard State" of the item.
			stateGroup = item.getStateGroup();
			if (this.isStateGroupEnabled(state, stateGroup)) {
				return true;
			}
		}
		
		return false;
	},
	
	// Check if stateGroup can recover the state which is set at the unit.
	isStateRecoverable: function(unit, stateGroup) {
		var i, state;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			state = list.getData(i).getState();
			if (this.isStateGroupEnabled(state, stateGroup)) {
				return true;
			}
		}
		
		return false;
	},
	
	// Check if stateGroup can process the state.
	isStateGroupEnabled: function(state, stateGroup) {
		var i, count, refList;
		
		// If the state is the bad state, check if "Target All Bad States" is set.
		if (state.isBadState() && stateGroup.isAllBadState()) {
			return true;
		}
		else {
			refList = stateGroup.getStateReferenceList();
			count = refList.getTypeCount();
			for (i = 0; i < count; i++) {
				if (state === refList.getTypeData(i)) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	// If "Prohibit to act", "Berserk" or "Auto AI" is included, decide the unit is uncontrollable.
	isTargetControllable: function(unit) {
		var i, state, option;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			state = list.getData(i).getState();
			option = state.getBadStateOption();
			if (option === BadStateOption.NOACTION || option === BadStateOption.BERSERK || option === BadStateOption.AUTO) {
				return false;
			}
		}
		
		return true;
	}
};
