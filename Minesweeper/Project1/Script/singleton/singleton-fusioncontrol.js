
// Calling getUnitStyle is done by this file only.
var FusionControl = {
	catchUnit: function(unit, targetUnit, fusionData) {
		if (!this.isFusionAllowed(unit, targetUnit, fusionData)) {
			return false;
		}
		
		unit.getUnitStyle().clearFusionInfo();
		unit.getUnitStyle().setFusionChild(targetUnit);
		unit.getUnitStyle().setFusionData(fusionData);
		
		targetUnit.getUnitStyle().clearFusionInfo();
		targetUnit.getUnitStyle().setFusionParent(unit);
		targetUnit.getUnitStyle().setFusionData(fusionData);
		
		targetUnit.setInvisible(true);
		
		return true;
	},
	
	// The caller decides the unit release position.
	releaseChild: function(unit) {
		var targetUnit = this.getFusionChild(unit);
		
		if (targetUnit === null) {
			return false;
		}
		
		unit.getUnitStyle().clearFusionInfo();
		targetUnit.getUnitStyle().clearFusionInfo();
		
		targetUnit.setInvisible(false);
		
		return true;
	},
	
	tradeChild: function(unit, targetUnit) {
		var fusionData;
		var childUnit = this.getFusionChild(unit);
		
		if (childUnit === null) {
			return false;
		}
		
		fusionData = unit.getUnitStyle().getFusionData();
		unit.getUnitStyle().clearFusionInfo();
		
		targetUnit.getUnitStyle().clearFusionInfo();
		targetUnit.getUnitStyle().setFusionChild(childUnit);
		targetUnit.getUnitStyle().setFusionData(fusionData);
		
		childUnit.getUnitStyle().clearFusionInfo();
		childUnit.getUnitStyle().setFusionParent(targetUnit);
		childUnit.getUnitStyle().setFusionData(fusionData);
		
		childUnit.setInvisible(true);
		
		return true;
	},
	
	getFusionData: function(unit) {
		return unit.getUnitStyle().getFusionData();
	},
	
	// Get the opponent (child) who fuses the unit.
	getFusionChild: function(unit) {
		return unit.getUnitStyle().getFusionChild();
	},
	
	// Get the opponent (parent) who fuses the unit.
	getFusionParent: function(unit) {
		return unit.getUnitStyle().getFusionParent();
	},
	
	// Check if the unit can fuse with targetUnit based on fusionData.
	isFusionAllowed: function(unit, targetUnit, fusionData) {
		if (!fusionData.compareUnitCapacity(unit, targetUnit)) {
			return false;
		}
		
		if (!fusionData.isSrcCondition(unit)) {
			return false;
		}
		
		if (!fusionData.isDestCondition(targetUnit)) {
			return false;
		}
		
		return true;
	},
	
	isCatchable: function(unit, targetUnit, fusionData) {
		if (this.getFusionChild(targetUnit) !== null) {
			return false;
		}
		
		if (!this.isFusionAllowed(unit, targetUnit, fusionData)) {
			return false;
		}
		
		return FilterControl.isBestUnitTypeAllowed(unit.getUnitType(), targetUnit.getUnitType(), fusionData.getFilterFlag());
	},
	
	isAttackable: function(unit, targetUnit, fusionData) {
		return this.isCatchable(unit, targetUnit, fusionData);
	},
	
	isControllable: function(unit, targetUnit, fusionData) {
		var result;
		
		if (fusionData.getFusionType() === FusionType.NORMAL) {
			result = this.isCatchable(unit, targetUnit, fusionData);
		}
		else {
			result = this.isAttackable(unit, targetUnit, fusionData);
		}
		
		return result;
	},
	
	isItemAllowed: function(unit, targetUnit, fusionData) {
		return true;
	},
	
	// "Fusion Attack" which is not the item should be adjacent with each other.
	isRangeAllowed: function(unit, targetUnit, fusionData) {
		var i;
		var x = unit.getMapX();
		var y = unit.getMapY();
		var x2 = targetUnit.getMapX();
		var y2 = targetUnit.getMapY();
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			if (x + XPoint[i] === x2 && y + YPoint[i] === y2) {
				return true;
			}
		}
		
		return false;
	},
	
	isUnitTradable: function(unit) {
		var data = unit.getUnitStyle().getFusionData();
		
		if (data === null) {
			return false;
		}
		
		return data.isUnitTradable();
	},
	
	isItemTradable: function(unit) {
		var data = unit.getUnitStyle().getFusionData();
		
		if (data === null) {
			return false;
		}
		
		return data.isItemTradable();
	},
	
	clearFusion: function(unit) {
		unit.getUnitStyle().clearFusionInfo();
	},
	
	getFusionAttackData: function(unit) {
		return unit.getUnitStyle().getFusionAttackData();
	},
	
	startFusionAttack: function(unit, fusionData) {
		unit.getUnitStyle().startFusionAttack(fusionData);
	},
	
	endFusionAttack: function(unit) {
		unit.getUnitStyle().endFusionAttack();
	},
	
	isExperienceDisabled: function(unit) {
		var fusionData = unit.getUnitStyle().getFusionAttackData();
		
		if (fusionData === null) {
			return false;
		}
		
		// If processing after release is "Fusion Attack" which is not "Erase", don't allow to obtain the exp.
		// After release, re-catch it to prevent to earn the exp unlimitedly.
		return fusionData.getFusionReleaseType() !== FusionReleaseType.ERASE;
	},
	
	getLastValue: function(unit, index, n) {
		var childValue;
		var value = n;
		var calc = null;
		var child = null;
		var fusionData = FusionControl.getFusionData(unit);
		var isChildCheck = false;
		
		if (fusionData !== null) {
			// If normal fusion, get "Correction while fusion".
			calc = fusionData.getStatusCalculation();
			child = FusionControl.getFusionChild(unit);
			if (child === null) {
				calc = null;
			}
			else {
				isChildCheck = calc.isChildCheck(index);
			}
		}
		else {
			fusionData = FusionControl.getFusionAttackData(unit);
			if (fusionData !== null) {
				// If it's "Fusion Attack", get "Fusion Attack Correction".
				calc = fusionData.getAttackCalculation();
			}
		}
		
		if (calc !== null) {
			index = ParamGroup.getParameterType(index);
			if (isChildCheck) {
				childValue = SymbolCalculator.calculateEx(child, index, calc);
				value = SymbolCalculator.calculate(n, childValue, calc.getOperatorSymbol(index));
			}
			else {
				value = SymbolCalculator.calculate(n, calc.getValue(index), calc.getOperatorSymbol(index));
			}
		}
		
		return value;
	},
	
	getFusionArray: function(unit) {
		var i, list, skillArray, skill, fusionData;
		var fusionArray = [];
		var refList = root.getMetaSession().getDifficulty().getFusionReferenceList();
		var count = refList.getTypeCount();
		
		// Check "Default Enabled Fusion".
		for (i = 0; i < count; i++) {
			fusionData = refList.getTypeData(i);
			if (!this._isUsed(fusionArray, fusionData)) {
				fusionArray.push(fusionData);
			}
		}
		
		list = root.getBaseData().getFusionList();
		
		// If check the fusion skill, a weapon is specified null.
		// This skill cannot be possessed as a weapon skill.
		skillArray = SkillControl.getSkillMixArray(unit, null, SkillType.FUSION, '');
		count = skillArray.length;
		for (i = 0; i < count; i++) {
			skill = skillArray[i].skill;
			fusionData = list.getDataFromId(skill.getSkillValue());
			if (fusionData !== null && !this._isUsed(fusionArray, fusionData)) {
				fusionArray.push(fusionData);
			}
		}
		
		return fusionArray;
	},
	
	_isUsed: function(arr, obj) {
		var i;
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			if (arr[i].getId() === obj.getId()) {
				return true;
			}
		}
		
		return false;
	}
};

var MetamorphozeControl = {
	startMetamorphoze: function(unit, metamorphozeData) {
		var mhpPrev;
		
		if (!this.isMetamorphozeAllowed(unit, metamorphozeData)) {
			return false;
		}
		
		mhpPrev = ParamBonus.getMhp(unit);
		
		unit.getUnitStyle().setMetamorphozeData(metamorphozeData);
		unit.getUnitStyle().setMetamorphozeTurn(metamorphozeData.getCancelTurn());
		
		Miscellaneous.changeHpBonus(unit, mhpPrev);
		
		return true;
	},
	
	clearMetamorphoze: function(unit) {
		var mhpPrev = ParamBonus.getMhp(unit);
		
		unit.getUnitStyle().clearMetamorphozeData();
		this._deleteMetamorphozeItem(unit);
		
		Miscellaneous.changeHpBonus(unit, mhpPrev);
	},
	
	getMetamorphozeData: function(unit) {
		return unit.getUnitStyle().getMetamorphozeData();
	},
	
	getMetamorphozeTurn: function(unit) {
		return unit.getUnitStyle().getMetamorphozeTurn();
	},
	
	setMetamorphozeTurn: function(unit, turn) {
		unit.getUnitStyle().setMetamorphozeTurn(turn);
	},
	
	isMetamorphozeAllowed: function(unit, metamorphozeData) {
		return metamorphozeData.isParameterCondition(unit) && metamorphozeData.isDataCondition(unit);
	},
	
	_deleteMetamorphozeItem: function(unit) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (!item.isWeapon() && item.getItemType() === ItemType.METAMORPHOZE) {
				if (item.getLimit() === WeaponLimitValue.BROKEN) {
					UnitItemControl.cutItem(unit, i);
					break;
				}
			}
		}
	}
};
