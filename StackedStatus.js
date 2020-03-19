/*
Stacked Status, by piketrcechillas

If you want a status to prolong its turn instead of refreshing when applied again, use the custom parameter {stack: true} inside the status

If you want a status to upgrade to a stronger version when applied again, follow these instructions:

First you need 2 states, 1 state is "base state", 1 is "upgraded state"
Then add these custom parameters into base state:

{upgrade: true,
    id: 1,
    chain: 1}

Add these into upgraded state:

{upgrade: true,
    id: 1,
    chain: 2}

If you want further chain, it also works: chain 3, chain 4 and so on.

Different state chains have different id, example, burn > superburn: id: 1, poison > toxic: id: 2

Note: lower status will always +1 your chain. For example, let's say you have a chain of 3 status: 
poison > toxic > envenomated, if you are afflicted with toxic , then both poison and toxic will
upgrade your status to envenomated


*/




StateControl.arrangeState =  function(unit, state, increaseType) {
		var turnState = null;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		var editor = root.getDataEditor();
		
		if (increaseType === IncreaseType.INCREASE) {
			turnState = this.getTurnState(unit, state);
			if (turnState !== null) {
				// If the state has already been added, update the turn number.
				if(state.custom.stack){
					turnState.setTurn(turnState.getTurn() + state.getTurn());
					root.log("stacked");}

				else if(state.custom.upgrade){
					root.log("duplicated");
					    ID = state.custom.id;
						i = state.custom.chain;
						var stateList = root.getBaseData().getStateList();
						var stateCount = stateList.getCount();
						for(m = 0; m < stateCount; m++){
							checkState = stateList.getDataFromID(m);
							checkID = checkState.custom.id;
							checkChain = checkState.custom.chain;
							root.log(checkState.getName());
							if(checkID != null && checkID == ID && checkChain != null && checkChain == i+1){
								root.log("Success")
								turnState = editor.addTurnStateData(list, checkState);
								break;
							}
						}
					StateControl.arrangeState(unit, state, IncreaseType.DECREASE);
					}

				else {

						turnState.setTurn(state.getTurn());
					

					
				}
			}
			else {
				if (count < DataConfig.getMaxStateCount()) {

					ID = state.custom.id;
					flag = false;
					upFlag = false;

					for (i = 0; i < count; i++) {
						checkTurnState = list.getData(i).getState();
						if (checkTurnState.custom.id == ID) {

							var stateList = root.getBaseData().getStateList();
							var stateCount = stateList.getCount();

							for(m = 0; m < stateCount; m++){
								checkState = stateList.getDataFromID(m);
								checkID = checkState.custom.id;
								checkChain = checkState.custom.chain;
								root.log(checkState.getName());
								if(checkID != null && checkID == ID && checkChain != null && checkChain == checkTurnState.custom.chain+1){
									root.log("Success")
									turnState = editor.addTurnStateData(list, checkState);
									flag = true;
									upFlag = true;
									break;
								}
							}

						if(upFlag)
							StateControl.arrangeState(unit, checkTurnState, IncreaseType.DECREASE);
						else{
							root.log("flag_down")
							currentTurnState = this.getTurnState(unit, checkTurnState);
							currentTurnState.setTurn(checkTurnState.getTurn());
							flag = true;
							break;
						}

						
						}
					}



					if(!flag)
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
	}