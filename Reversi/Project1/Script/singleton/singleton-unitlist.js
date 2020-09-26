
// Decide when the unit list is gotten.
// No decision is made such as alive etc. at the time when the unit from the unit list is obtained.
// For DefaultList method, include the unit who is fused.
var AllUnitList = {
	getAliveList: function(list) {
		var funcCondition = function(unit) {
			return unit.getAliveState() === AliveType.ALIVE && FusionControl.getFusionParent(unit) === null;
		};
		
		return this.getList(list, funcCondition);
	},
	
	getAliveDefaultList: function(list) {
		var funcCondition = function(unit) {
			return unit.getAliveState() === AliveType.ALIVE;
		};
		
		return this.getList(list, funcCondition);
	},
	
	getDeathList: function(list) {
		var funcCondition = function(unit) {
			return unit.getAliveState() === AliveType.DEATH;
		};
		
		return this.getList(list, funcCondition);
	},
	
	getSortieList: function(list) {
		var funcCondition = function(unit) {
			return unit.getSortieState() === SortieType.SORTIE && unit.getAliveState() === AliveType.ALIVE && FusionControl.getFusionParent(unit) === null;
		};
		
		return this.getList(list, funcCondition);
	},
	
	getSortieDefaultList: function(list) {
		var funcCondition = function(unit) {
			return unit.getSortieState() === SortieType.SORTIE && unit.getAliveState() === AliveType.ALIVE;
		};
		
		return this.getList(list, funcCondition);
	},
	
	getSortieOnlyList: function(list) {
		var funcCondition = function(unit) {
			return unit.getSortieState() === SortieType.SORTIE;
		};
		
		return this.getList(list, funcCondition);
	},
	
	getList: function(list, funcCondition) {
		var i, unit, obj;
		var arr = [];
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (funcCondition(unit)) {
				arr.push(unit);
			}
		}
		
		obj = StructureBuilder.buildDataList();
		obj.setDataArray(arr);
		
		return obj;
	}
};

var PlayerList = {
	getAliveList: function() {
		return AllUnitList.getAliveList(this.getMainList());
	},
	
	getAliveDefaultList: function() {
		return AllUnitList.getAliveDefaultList(this.getMainList());
	},
	
	getDeathList: function() {
		return AllUnitList.getDeathList(this.getMainList());
	},
	
	getSortieList: function() {
		return AllUnitList.getSortieList(this.getMainList());
	},
	
	getSortieDefaultList: function() {
		return AllUnitList.getSortieDefaultList(this.getMainList());
	},
	
	getSortieOnlyList: function() {
		return AllUnitList.getSortieOnlyList(this.getMainList());
	},
	
	getMainList: function() {
		return root.getMetaSession().getTotalPlayerList();
	}
};

var EnemyList = {
	getAliveList: function() {
		return AllUnitList.getAliveList(this.getMainList());
	},
	
	getAliveDefaultList: function() {
		return AllUnitList.getAliveDefaultList(this.getMainList());
	},
	
	getDeathList: function() {
		return AllUnitList.getDeathList(this.getMainList());
	},
	
	getMainList: function() {
		return root.getCurrentSession().getEnemyList();
	}
};

var AllyList = {
	getAliveList: function() {
		return AllUnitList.getAliveList(this.getMainList());
	},
	
	getAliveDefaultList: function() {
		return AllUnitList.getAliveDefaultList(this.getMainList());
	},
	
	getDeathList: function() {
		return AllUnitList.getDeathList(this.getMainList());
	},
	
	getMainList: function() {
		return root.getCurrentSession().getAllyList();
	}
};

var TurnControl = {
	turnEnd: function() {
		// There is a possibility to be called from the event, call getBaseScene, not getCurrentScene.
		if (root.getBaseScene() === SceneType.FREE) {
			SceneManager.getActiveScene().turnEnd();
		}
	},
	
	getActorList: function() {
		var list = null;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			list = PlayerList.getSortieList();
		}
		else if (turnType === TurnType.ENEMY) {
			list = EnemyList.getAliveList();
		}
		else if (turnType === TurnType.ALLY) {
			list = AllyList.getAliveList();
		}
		
		return list;
	},
	
	getTargetList: function() {
		var list = null;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			list = EnemyList.getAliveList();
		}
		else if (turnType === TurnType.ENEMY) {
			list = PlayerList.getSortieList();
		}
		else if (turnType === TurnType.ALLY) {
			list = EnemyList.getAliveList();
		}
		
		return list;
	}
};

var FilterControl = {
	getNormalFilter: function(unitType) {
		var filter = 0;
		
		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.PLAYER;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.ENEMY;
		}
		else if (unitType === UnitType.ALLY) {
			filter = UnitFilterFlag.ALLY;
		}
		
		return filter;
	},

	getReverseFilter: function(unitType) {
		var filter = 0;
		
		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.ENEMY;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
		}
		else if (unitType === UnitType.ALLY) {
			filter = UnitFilterFlag.ENEMY;
		}
		
		return filter;
	},
	
	getBestFilter: function(unitType, filterFlag) {
		var newFlag = 0;
		
		if (unitType === UnitType.ENEMY) {
			if (filterFlag & UnitFilterFlag.PLAYER) {
				newFlag |= UnitFilterFlag.ENEMY;
			}
			if (filterFlag & UnitFilterFlag.ENEMY) {
				newFlag |= UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
			}
			
			filterFlag = newFlag;
		}
		
		return filterFlag;
	},
	
	getListArray: function(filter) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getSortieList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getAliveList());
		}
		
		return listArray;	
	},
	
	getAliveListArray: function(filter) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getAliveList());
		}
		
		return listArray;	
	},
	
	getDeathListArray: function(filter) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getDeathList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getDeathList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getDeathList());
		}
		
		return listArray;	
	},
	
	isUnitTypeAllowed: function(unit, targetUnit) {
		var unitType = unit.getUnitType();
		var targetUnitType = targetUnit.getUnitType();
		
		if (unitType === UnitType.PLAYER) {
			return targetUnitType === UnitType.PLAYER;
		}
		else if (unitType === UnitType.ENEMY) {
			return targetUnitType === UnitType.ENEMY;
		}
		else if (unitType === UnitType.ALLY) {
			return targetUnitType === UnitType.ALLY;
		}
		
		return false;
	},
	
	isReverseUnitTypeAllowed: function(unit, targetUnit) {
		var unitType = unit.getUnitType();
		var targetUnitType = targetUnit.getUnitType();
		
		if (unitType === UnitType.PLAYER) {
			return targetUnitType === UnitType.ENEMY;
		}
		else if (unitType === UnitType.ENEMY) {
			return targetUnitType === UnitType.PLAYER || targetUnitType === UnitType.ALLY;
		}
		else if (unitType === UnitType.ALLY) {
			return targetUnitType === UnitType.ENEMY;
		}
		
		return false;
	},
	
	isBestUnitTypeAllowed: function(unitType, targetUnitType, filterFlag) {
		filterFlag = this.getBestFilter(unitType, filterFlag);
		
		if ((filterFlag & UnitFilterFlag.PLAYER) && (targetUnitType === UnitType.PLAYER)) {
			return true;
		}
		
		if ((filterFlag & UnitFilterFlag.ALLY) && (targetUnitType === UnitType.ALLY)) {
			return true;
		}
		
		if ((filterFlag & UnitFilterFlag.ENEMY) && (targetUnitType === UnitType.ENEMY)) {
			return true;
		}
		
		return false;
	}
};

var SimulationBlockerControl = {
	isCustomFilterApplicable: function(unit) {
		var i, count;
		var arr = [];
		var groupArray = [];
		
		this._configureBlockerRule(arr);
		
		count = arr.length;
		for (i = 0; i < count; i++) {
			if (arr[i].isRuleApplicable(unit)) {
				// Only objects that apply to the rules are consolidated into a separate array.
				groupArray.push(arr[i]);
			}
		}
		
		if (groupArray.length > 0) {
			this._scanUnitList(unit, groupArray);
			return true;
		}
		
		return false;
	},
	
	// All enemies will be treated as walls if UnitFilterFlag.ENEMY is returned by ScriptCall_GetSimulationFilterFlag,
	// but sometimes it is necessary to decide which enemy is a wall individually.
	// If UnitFilterFlag.OPTIONAL is returned from this function,
	// only units set with UnitFilterFlag.OPTIONAL will be treated as walls. 
	getCustomFilter: function(unit) {
		return UnitFilterFlag.OPTIONAL;
	},
	
	getDefaultFilter: function(unit) {
		return FilterControl.getReverseFilter(unit.getUnitType());
	},
	
	_scanUnitList: function(unit, groupArray) {
		var i, j, count, list, targetUnit;
		var filter = this._getScanFilter(unit);
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				if (unit === targetUnit) {
					continue;
				}
				
				if (this._isTargetBlocker(unit, targetUnit, groupArray)) {
					this._registerAsBlocker(unit, targetUnit, groupArray);
				}
			}
		}
	},
	
	_isTargetBlocker: function(unit, targetUnit, groupArray) {
		var i;
		var count = groupArray.length;
		
		for (i = 0; i < count; i++) {
			if (groupArray[i].isTargetBlocker(unit, targetUnit)) {
				return true;
			}
		}
		
		return false;
	},
	
	_registerAsBlocker: function(unit, targetUnit, groupArray) {
		// targetUnit will be treated as a wall by setting UnitFilterFlag.OPTIONAL.
		targetUnit.setOptionalFilterFlag(UnitFilterFlag.OPTIONAL);
	},
	
	_getScanFilter: function(unit) {
		return UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY;
		
		// The following code can be used if there is no intention of treating friends (player and ally units for player) as walls.
		// In this instance, only the opposing force would be scanned, so the _scanUnitList loop would get shorter.
		// Evaluating whether the unit is a friend in isTargetBlocker would also be unnecessary.
		// return this.getDefaultFilter(unit);
	},
	
	_configureBlockerRule: function(groupArray) {
	}
};

var BlockerRule = {};

var BaseBlockerRule = defineObject(BaseObject,
{
	isRuleApplicable: function(unit) {
		// Checks whether the unit has the ability to individually treat targets as walls.
		return false;
	},
	
	isTargetBlocker: function(unit, targetUnit) {
		// If true is returned from this function, targetUnit is treated as a wall.
		return false;
	}
}
);
