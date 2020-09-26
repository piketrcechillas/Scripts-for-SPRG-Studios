
var ParamGroup = {
	_objectArray: null,
	
	initSingleton: function() {
		this._objectArray = [];
		this._configureUnitParameters(this._objectArray);
	},
	
	// Get the parameter such as the unit HP or power etc.
	getUnitValue: function(unit, i) {
		return this._objectArray[i].getUnitValue(unit);
	},
	
	setUnitValue: function(unit, i, value) {
		this._objectArray[i].setUnitValue(unit, value);
	},
	
	// Get the parameter including class bonus.
	getClassUnitValue: function(unit, i) {
		var value = this._objectArray[i].getUnitValue(unit) + this._objectArray[i].getParameterBonus(unit.getClass());
		
		return this.getValidValue(unit, value, i);
	},
	
	// Get the parameter bonus such as items etc.
	getParameterBonus: function(obj, i) {
		return this._objectArray[i].getParameterBonus(obj);
	},
	
	// Get the growth value bonus of items etc.
	getGrowthBonus: function(obj, i) {
		return this._objectArray[i].getGrowthBonus(obj);
	},
	
	// Get the doping value of the doping item.
	getDopingParameter: function(obj, i) {
		return this._objectArray[i].getDopingParameter(obj);
	},
	
	getAssistValue: function(obj, i) {
		return this._objectArray[i].getAssistValue(obj);
	},
	
	getValidValue: function(unit, value, i) {
		var max = this.getMaxValue(unit, i);
		var min = this.getMinValue(unit, i);
		
		if (value > max) {
			// If it's greater than the parameter's maximum value, include in the maximum value.
			value = max;
		}
		else if (value < min) {
			// If it's less than the parameter's minimum value, include in the minimum value.
			value = min;
		}
		
		return value;
	},
	
	// Get the maximum value of parameter.
	getMaxValue: function(unit, i) {
		return this._objectArray[i].getMaxValue(unit);
	},
	
	// Get the minimum value of parameter.
	getMinValue: function(unit, i) {
		return this._objectArray[i].getMinValue(unit);
	},
	
	// Get the parameter name.
	getParameterName: function(i) {
		return this._objectArray[i].getParameterName();
	},
	
	getParameterType: function(i) {
		return this._objectArray[i].getParameterType();
	},
	
	isParameterDisplayable: function(unitStatusType, i) {
		return this._objectArray[i].isParameterDisplayable(unitStatusType);
	},
	
	isParameterRenderable: function(i) {
		return this._objectArray[i].isParameterRenderable();
	},
	
	drawUnitParameter: function(x, y, statusEntry, isSelect, i) {
		return this._objectArray[i].drawUnitParameter(x, y, statusEntry, isSelect);
	},
	
	// Get the total amount of parameter.
	getParameterCount: function(i) {
		return this._objectArray.length;
	},
	
	// Get the parameter bonus of weapon or possession item.
	getUnitTotalParamBonus: function(unit, i, weapon) {
		return this._objectArray[i].getUnitTotalParamBonus(unit, weapon);
	},
	
	// Get the growth value bonus of weapon or possession item.
	getUnitTotalGrowthBonus: function(unit, i, weapon) {
		return this._objectArray[i].getUnitTotalGrowthBonus(unit, weapon);
	},
	
	getParameterIndexFromType: function(type) {
		var i;
		var count = this.getParameterCount();
		
		for (i = 0; i < count; i++) {
			if (this.getParameterType(i) === type) {
				return i;
			}
		}
		
		return -1;
	},
	
	// This method cannot call getValidValue, so the return value can exceed "Parameter Limit".
	getLastValue: function(unit, index, weapon) {
		var n = this.getClassUnitValue(unit, index) + this.getUnitTotalParamBonus(unit, index, weapon) + StateControl.getStateParameter(unit, index);
		
		n = FusionControl.getLastValue(unit, index, n);
		
		return n;
	},
	
	_configureUnitParameters: function(groupArray) {
		groupArray.appendObject(UnitParameter.MHP);
		groupArray.appendObject(UnitParameter.POW);
		groupArray.appendObject(UnitParameter.MAG);
		groupArray.appendObject(UnitParameter.SKI);
		groupArray.appendObject(UnitParameter.SPD);
		groupArray.appendObject(UnitParameter.LUK);
		groupArray.appendObject(UnitParameter.DEF);
		groupArray.appendObject(UnitParameter.MDF);
		groupArray.appendObject(UnitParameter.MOV);
		groupArray.appendObject(UnitParameter.WLV);
		groupArray.appendObject(UnitParameter.BLD);
	}
};

var BaseUnitParameter = defineObject(BaseObject,
{
	getUnitValue: function(unit) {
		return unit.getParamValue(this.getParameterType());
	},
	
	setUnitValue: function(unit, value) {
		unit.setParamValue(this.getParameterType(), value);
	},
	
	// Obj is the unit, class, or weapon etc.
	getParameterBonus: function(obj) {
		return this._getAssistValue(obj.getParameterBonus());
	},
	
	// Obj is the unit, class, or weapon etc.
	getGrowthBonus: function(obj) {
		return this._getAssistValue(obj.getGrowthBonus());
	},
	
	// Obj is CommandParameterChange, Item, State, or TurnState.
	getDopingParameter: function(obj) {
		return this._getAssistValue(obj.getDopingParameter());
	},
	
	getMaxValue: function(unit) {
		if (DataConfig.isClassLimitEnabled()) {
			// Return "Parameter Limit" of the class.
			return unit.getClass().getMaxParameter(this.getParameterType());
		}
		else {
			// Return "Parameter Limit" of the config.
			return DataConfig.getMaxParameter(this.getParameterType());
		}
	},
	
	getMinValue: function(unit) {
		return 0;
	},
	
	getParameterName: function() {
		return root.queryCommand(this.getSignal() + '_param');
	},
	
	getParameterType: function() {
		return -1;
	},
	
	isParameterDisplayable: function(unitStatusType) {
		return true;
	},
	
	isParameterRenderable: function() {
		return false;
	},
	
	drawUnitParameter: function(x, y, statusEntry, isSelect) {
	},
	
	getUnitTotalParamBonus: function(unit, weapon) {
		var i, count, objectFlag, skill;
		var d = 0;
		var arr = [];
		
		// Weapon parameter bonus
		if (weapon !== null) {
			d += this.getParameterBonus(weapon);
		}
		
		// Item parameter bonus
		d += this._getItemBonus(unit, true);
		
		// Check the skill of parameter bonus.
		// The weapon and the item set the direct parameter bonus,
		// not the parameter bonus skill.
		objectFlag = ObjectFlag.UNIT | ObjectFlag.CLASS | Object.STATE | ObjectFlag.TERRAIN;
		arr = SkillControl.getSkillObjectArray(unit, weapon, SkillType.PARAMBONUS, '', objectFlag);
		count = arr.length;
		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			d += this.getParameterBonus(skill);
		}
		
		return d;
	},
	
	getUnitTotalGrowthBonus: function(unit, weapon) {
		var d = this.getGrowthBonus(unit.getClass());
		
		if (weapon !== null) {
			d += this.getGrowthBonus(weapon);
		}
		
		return d + this._getItemBonus(unit, false);
	},
	
	_getAssistValue: function(parameterObject) {
		return parameterObject.getAssistValue(this.getParameterType());
	},
	
	_getItemBonus: function(unit, isParameter) {
		var i, item, n;
		var d = 0;
		var checkerArray = [];
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (!ItemIdentityChecker.isItemReused(checkerArray, item)) {
				continue;
			}
			
			if (isParameter) {
				n = this.getParameterBonus(item);
			}
			else {
				n = this.getGrowthBonus(item);
			}
			
			// Correction is not added for the unit who cannot use the item.
			if (n !== 0 && ItemControl.isItemUsable(unit, item)) {
				d += n;
			}
		}
		
		return d;
	}
}
);

var ItemIdentityChecker = {
	isItemReused: function(arr, item) {
		var obj;
		
		if (item === null || item.isWeapon()) {
			return false;
		}
		
		if (!this._checkIdAndType(arr, item)) {
			return false;
		}
		
		obj = {};
		obj.itemId = item.getId();
		obj.weaponType = item.getWeaponType();
		arr.push(obj);
		
		return true;
	},
	
	_checkIdAndType: function(arr, item) {
		var i, availableCount, typeId;
		var count = arr.length;
		var availableArray = [];
		var itemId = item.getId();
		var weaponType = item.getWeaponType();
		
		for (i = 0; i < count; i++) {
			if (arr[i].itemId === itemId) {
				return false;
			}
			
			availableCount = arr[i].weaponType.getAvailableCount();
			if (availableCount > 0 && arr[i].weaponType === weaponType) {
				typeId = weaponType.getId();
				if (typeof availableArray[typeId] === 'undefined') {
					availableArray[typeId] = 1;
				}
				
				if (availableArray[typeId] === availableCount) {
					return false;
				}
				availableArray[typeId]++;
			}
		}
		
		return true;
	}
};

var UnitParameter = {};

UnitParameter.MHP = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.MHP;
	},
	
	getSignal: function() {
		return 'hp';
	},
	
	getMinValue: function(unit) {
		// The minimum value of the maximum HP is 1.
		// The unit doesn't die with a change of the parameter.
		return 1;
	},
	
	isParameterDisplayable: function(unitStatusType) {
		// Display if it's not the unit menu.
		return unitStatusType !== UnitStatusType.UNITMENU;
	}
}
);

UnitParameter.POW = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.POW;
	},
	
	getSignal: function() {
		return 'pow';
	}
}
);

UnitParameter.MAG = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.MAG;
	},
	
	getSignal: function() {
		return 'mag';
	}
}
);

UnitParameter.SKI = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.SKI;
	},
	
	getSignal: function() {
		return 'ski';
	}
}
);

UnitParameter.SPD = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.SPD;
	},
	
	getSignal: function() {
		return 'spd';
	}
}
);

UnitParameter.SKI = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.SKI;
	},
	
	getSignal: function() {
		return 'ski';
	}
}
);

UnitParameter.LUK = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.LUK;
	},
	
	getSignal: function() {
		return 'luk';
	}
}
);

UnitParameter.DEF = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.DEF;
	},
	
	getSignal: function() {
		return 'def';
	}
}
);

UnitParameter.MDF = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.MDF;
	},
	
	getSignal: function() {
		return 'mdf';
	}
}
);

UnitParameter.MOV = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.MOV;
	},
	
	getSignal: function() {
		return 'mov';
	}
}
);

UnitParameter.WLV = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.WLV;
	},
	
	getSignal: function() {
		return 'wlv';
	},
	
	isParameterDisplayable: function(unitStatusType) {
		return DataConfig.isWeaponLevelDisplayable();
	}
}
);

UnitParameter.BLD = defineObject(BaseUnitParameter,
{
	getParameterType: function() {
		return ParamType.BLD;
	},
	
	getSignal: function() {
		return 'bld';
	},
	
	isParameterDisplayable: function(unitStatusType) {
		return DataConfig.isBuildDisplayable();
	}
}
);

// Get the unit power etc. including bonus.
var ParamBonus = {
	getMhp: function(unit) {
		var n = this.getBonus(unit, ParamType.MHP);
		
		// Cache so as not to refer to it every time when the map unit HP displays.
		unit.saveMhp(n);
		
		return n;
	},
	
	getStr: function(unit) {
		return this.getBonus(unit, ParamType.POW);
	},
	
	getMag: function(unit) {
		return this.getBonus(unit, ParamType.MAG);
	},
	
	getSki: function(unit) {
		return this.getBonus(unit, ParamType.SKI);
	},
	
	getSpd: function(unit) {
		return this.getBonus(unit, ParamType.SPD);
	},
	
	getLuk: function(unit) {
		return this.getBonus(unit, ParamType.LUK);
	},
	
	getDef: function(unit) {
		return this.getBonus(unit, ParamType.DEF);
	},
	
	getMdf: function(unit) {
		return this.getBonus(unit, ParamType.MDF);
	},
	
	getMov: function(unit) {
		return this.getBonus(unit, ParamType.MOV);
	},
	
	getWlv: function(unit) {
		return this.getBonus(unit, ParamType.WLV);
	},
	
	getBld: function(unit) {
		return this.getBonus(unit, ParamType.BLD);
	},
	
	getBonus: function(unit, type) {
		var weapon = ItemControl.getEquippedWeapon(unit);
		
		return this.getBonusFromWeapon(unit, type, weapon);
	},
	
	getBonusFromWeapon: function(unit, type, weapon) {
		var i, typeTarget, n;
		var index = -1;
		var count = ParamGroup.getParameterCount();
		
		for (i = 0; i < count; i++) {
			typeTarget = ParamGroup.getParameterType(i);
			if (type === typeTarget) {
				index = i;
				break;
			}
		}
		
		if (index === -1) {
			return 0;
		}
		
		n = ParamGroup.getLastValue(unit, index, weapon);
		if (type === ParamType.MHP) {
			if (n < 1) {
				n = 1;
			}
		}
		else {
			if (n < 0) {
				n = 0;
			}
		}
		
		return n;
	}
};

var RealBonus = {
	getMhp: function(unit) {
		return ParamBonus.getMhp(unit);
	},
	
	getStr: function(unit) {
		return ParamBonus.getStr(unit);
	},
	
	getMag: function(unit) {
		return ParamBonus.getMag(unit);
	},
	
	getSki: function(unit) {
		return ParamBonus.getSki(unit);
	},
	
	getSpd: function(unit) {
		return ParamBonus.getSpd(unit);
	},
	
	getLuk: function(unit) {
		return ParamBonus.getLuk(unit);
	},
	
	getDef: function(unit) {
		var terrain;
		var def = 0;
		
		if (unit.getClass().getClassType().isTerrainBonusEnabled()) {
			terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
			if (terrain !== null) {
				def = terrain.getDef();
			}
		}
		
		return ParamBonus.getDef(unit) + def;
	},
	
	getMdf: function(unit) {
		var terrain;
		var mdf = 0;
		
		if (unit.getClass().getClassType().isTerrainBonusEnabled()) {
			terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
			if (terrain !== null) {
				mdf = terrain.getMdf();
			}
		}
		
		return ParamBonus.getMdf(unit) + mdf;
	},
	
	getMov: function(unit) {
		return ParamBonus.getMov(unit);
	},
	
	getWlv: function(unit) {
		return ParamBonus.getWlv(unit);
	},
	
	getBld: function(unit) {
		return ParamBonus.getBld(unit);
	}
};
