UnitFilterFlag.PLAYER2 = 0x08;
UnitType.PLAYER2 = 3;
TurnType.PLAYER2 = 3;
TurnType.DUMMY = 4;


BaseCombinationCollector._arrangeFilter = function(unit, filter) {
		// If it's "Berserk" state, the opponent becomes opposite.
		var isMulti = root.getCurrentSession().getCurrentMapInfo().custom.pvp;

		if (!StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
			return filter;
		}

		if(!isMulti) {
		
			if (filter & UnitFilterFlag.PLAYER) {
				filter = UnitFilterFlag.ENEMY;
			}
			else if (filter & UnitFilterFlag.ENEMY) {
				filter = UnitFilterFlag.PLAYER;
			}
			else if (filter & UnitFilterFlag.ALLY) {
				filter = UnitFilterFlag.ENEMY;
			}
		}
		else{
			if (filter & UnitFilterFlag.PLAYER) {
				filter = UnitFilterFlag.PLAYER2;
			}
			else if (filter & UnitFilterFlag.PLAYER2) {
				filter = UnitFilterFlag.PLAYER;
			}

		}
		
		return filter;
	}

TurnMarkFlowEntry._getTurnFrame = function() {
		var pic;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			pic = root.queryUI('playerturn_frame');
		}
		else if (turnType === TurnType.ENEMY) {
			pic = root.queryUI('enemyturn_frame');
		}
		else if (turnType === TurnType.PLAYER2) {
			 pic = root.getMetaSession().global.playerTwoFrame!=null ? root.getBaseData().getUIResourceList(UIType.SCREENFRAME, false).getDataFromId(root.getMetaSession().global.playerTwoFrame) : root.queryUI('enemyturn_frame');
		}
		else {
			pic = root.queryUI('partnerturn_frame');
		}
		
		return pic;
	}

BaseTurnLogoFlowEntry._isTurnGraphicsDisplayable = function() {
		var count;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			count = PlayerList.getSortieList().getCount();
		}
		else if (turnType === TurnType.ENEMY) {
			count = EnemyList.getAliveList().getCount();
		}
		else if (turnType === TurnType.PLAYER2) {
			count = EnemyList.getAliveList().getCount();
		}
		else {
			count = AllyList.getAliveList().getCount();
		}
		
		return count > 0;
	}



TurnChangeEnd._startNextTurn = function() {
	var nextTurnType;
	var turnType = root.getCurrentSession().getTurnType();
	var isMulti = root.getCurrentSession().getCurrentMapInfo().custom.pvp;
	
	this._checkActorList();
	

	if(!isMulti) {
		if (turnType === TurnType.PLAYER) {
			nextTurnType = TurnType.ENEMY;
		}
		else if (turnType === TurnType.ENEMY) {
			nextTurnType = TurnType.ALLY;
		}
		else if (turnType === TurnType.ALLY){
			nextTurnType = TurnType.PLAYER;
		}
	}
	else {
		if (turnType === TurnType.PLAYER) {

			var session = root.getMetaSession();
			var income = session.getVariableTable(1).getVariable(1);
			var pastGold = session.getVariableTable(0).getVariable(1);

			root.log("Income: " + income);

			session.setGold(pastGold + income);

			root.getLoadSaveManager().saveInterruptionFile(SceneType.FREE, root.getCurrentSession().getCurrentMapInfo().getId(), LoadSaveScreen._getCustomObject());
			Upload();
			wait(500);
			root.log("Current Player ID: " + root.getMetaSession().getVariableTable(4).getVariable(0))
			nextTurnType = TurnType.DUMMY;

			}
		else if (turnType === TurnType.PLAYER2) {

			var session = root.getMetaSession();
			var income = session.getVariableTable(1).getVariable(0);
			var pastGold = session.getVariableTable(0).getVariable(0);

			root.log("Income: " + income);

			session.setGold(pastGold + income);

			root.getLoadSaveManager().saveInterruptionFile(SceneType.FREE, root.getCurrentSession().getCurrentMapInfo().getId(), LoadSaveScreen._getCustomObject());
			Upload();
			wait(500);
			root.log("Current Player ID: " + root.getMetaSession().getVariableTable(4).getVariable(0))
			nextTurnType = TurnType.DUMMY;

		}


		else if (turnType === TurnType.DUMMY) {
			if(root.getMetaSession().getVariableTable(4).getVariable(0)==0){
				Download();
				root.getLoadSaveManager().loadInterruptionFile();
				root.log("Forward to Player Turn")
				nextTurnType = TurnType.PLAYER;
			}
			if(root.getMetaSession().getVariableTable(4).getVariable(0)==1){
				Download();
				root.getLoadSaveManager().loadInterruptionFile();	
				root.log("Forward to Player 2 Turn")	
				nextTurnType = TurnType.PLAYER2;
			}
		}
	}
	
	root.log(nextTurnType);
	root.getCurrentSession().setTurnType(nextTurnType);
}

TurnChangeMapStart.doLastAction = function() {
		var turnType = TurnType.PLAYER;
		
		if (root.getMetaSession().getVariableTable(4).getVariable(0)==1) {

			turnType = TurnType.DUMMY;
		}
		
		if (root.getMetaSession().getVariableTable(4).getVariable(0)==0) {
			var session = root.getMetaSession();
			var income = session.getVariableTable(1).getVariable(0);
			var pastGold = session.getVariableTable(0).getVariable(0);

			root.log("Income: " + income);

			session.setGold(pastGold + income);
			turnType = TurnType.PLAYER;
		}
		
		root.getCurrentSession().setTurnCount(0);
		root.getCurrentSession().setTurnType(turnType);
	}
	



FilterControl.getListArray = function(filter) {
    var listArray = [];
    var isMulti = root.getCurrentSession().getCurrentMapInfo().custom.pvp;
    
    if(!isMulti){
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getSortieList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getAliveList());
		}
	}

	else {
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getSortieList());
		}
		
		if (filter & UnitFilterFlag.PLAYER2) {
			listArray.push(FactionControl.getPlayer2List());
		}
	}
    
    return listArray;	
}


TurnControl.getActorList = function() {
    var list = null;
    var turnType = root.getCurrentSession().getTurnType();
    
    if (turnType === TurnType.PLAYER) {
        list = PlayerList.getSortieList();
    }
    else if (turnType === TurnType.ENEMY) {
        list = FactionControl.getEnemyList();
    }
    else if (turnType === TurnType.ALLY) {
        list = AllyList.getAliveList();
    }
    else if (turnType == TurnType.PLAYER2) {
        list = FactionControl.getPlayer2List();
    }

     else if (turnType == TurnType.DUMMY) {
        list = PlayerList.getSortieList();
    }
    
    return list;
}


FreeAreaScene._player2TurnObject = null;

FreeAreaScene.getTurnObject = function() {
        var obj = null;
        var type = root.getCurrentSession().getTurnType();
        
        if (type === TurnType.PLAYER) {
            obj = this._playerTurnObject;
        }
        else if (type === TurnType.ENEMY) {
            obj = this._enemyTurnObject;
        }
        else if (type === TurnType.ALLY) {
            obj = this._partnerTurnObject;
        }
        else if (type === TurnType.PLAYER2) {
            obj = this._player2TurnObject;
        }
          else if (type === TurnType.DUMMY) {
            obj = this._dummyObject;
        }
        return obj;
    }


FreeAreaScene._prepareSceneMemberData = function() {
		var isMulti = root.getCurrentSession().getCurrentMapInfo().custom.pvp;

		this._turnChangeStart = createObject(TurnChangeStart);
		this._turnChangeEnd = createObject(TurnChangeEnd);
		this._playerTurnObject = createObject(PlayerTurn);
		if(isMulti)	{
			this._player2TurnObject = createObject(PlayerTurn2);
			this._dummyObject = createObject(DummyTurn)
		}
		this._enemyTurnObject = createObject(EnemyTurn);
		this._partnerTurnObject = createObject(EnemyTurn);
	}



FactionControl = {

    getUnitType: function(unit) {
    	var isMulti = root.getCurrentSession().getCurrentMapInfo().custom.pvp;

        if (isMulti) {
            if(unit.getUnitType() == UnitType.ENEMY)
            	return UnitType.PLAYER2;
        }
        else {
            return unit.getUnitType();
        }
    },

    getUnitFilter: function(unit, filter) {
        var isMulti = root.getCurrentSession().getCurrentMapInfo().custom.pvp;

        if (isMulti) {
            if(unit.getUnitType() == UnitType.ENEMY)
            	return UnitFilerFlag.PLAYER2;
        }
        else {
            return filter;
        }
    },

    getPlayer2List: function() {
        var player2List = EnemyList.getAliveList();
        var player2Array = [];
        var player2List;

        for (var i=0; i<player2List.getCount(); i++) {
            if (this.getUnitType(player2List.getData(i))==UnitType.PLAYER2) {
                player2Array.push(player2List.getData(i));
            }
        }

        player2List = StructureBuilder.buildDataList();
        player2List.setDataArray(player2Array);
        
        return player2List;
    },

    getEnemyList: function() {
        var enemyList = EnemyList.getAliveList();
        var enemyArray = [];

        for (var i=0; i<enemyList.getCount(); i++) {
            if (this.getUnitType(enemyList.getData(i))==UnitType.ENEMY) {
                enemyArray.push(enemyList.getData(i));
            }
        }

        enemyList = StructureBuilder.buildDataList();
        enemyList.setDataArray(enemyArray);

        return enemyList;
    },

    getEnemyAndNeutralList: function() {
        var enemyList = this.getEnemyList();
        var neutralList = this.getNeutralList();
        var enemyNeutralArray = [];
        var enemyNeutralList;

        for (var i=0; i<enemyList.getCount(); i++) {
            enemyNeutralArray.push(enemyList.getData(i));
        }

        for (var i=0; i<neutralList.getCount(); i++) {
            enemyNeutralArray.push(neutralList.getData(i));
        }

        enemyNeutralList = StructureBuilder.buildDataList();
        enemyNeutralList.setDataArray(enemyNeutralArray);

        return enemyNeutralList;
    }

}

