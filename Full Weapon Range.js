//by piketrcechillas
//This scripts will display the full range of the weapon, instead of only attackable targets like before
//usage: just throw into the plugin folder and it'll work


var WeaponPosSelector = defineObject(BaseObject,
{
	_posMenu: null,
	_indexArray: null,
	_filter: null,
	_posCursor: null,
	_selectorType: 0,
	_isFusionIncluded: false,
	
	drawRange: function(allyArray, enemyArray, indexArray){
		MapLayer.getMapChipLight().setIndexArray(indexArray);
		MapLayer.getAllyRangePanel().setIndexArray(allyArray);
		MapLayer.getEnemyRangePanel().setIndexArray(enemyArray);
	},

	initialize: function() {
		this._mapCursor = createObject(MapCursor);
		this._posMenu = createObject(PosMenu);
		this._selectorType = this._getDefaultSelectorType();
	},
	
	setPosOnly: function(unit, item, indexArray, type) {
		this._unit = unit;
		this._indexArray = indexArray;
		MapLayer.getMapChipLight().setIndexArray(indexArray);
		this._setPosMenu(unit, item, type);
		this._posCursor = createObject(this._getObjectFromType(this._selectorType));
		this._posCursor.setParentSelector(this);
	},
	
	setUnitOnly: function(unit, item, allyArray, enemyArray, indexArray, type, filter) {
		this._unit = unit;
		this._indexArray = indexArray;
		this._allyArray = allyArray;
		this._enemyArray = enemyArray;
		this._filter = filter;
		this.drawRange(allyArray, enemyArray, indexArray);
		this._setPosMenu(unit, item, type);
		this._posCursor = createObject(this._getObjectFromType(this._selectorType));
		this._posCursor.setParentSelector(this);
	},
	
	includeFusion: function() {
		this._isFusionIncluded = true;
	},
	
	movePosSelector: function() {
		var result = PosSelectorResult.NONE;
		
		if (InputControl.isSelectAction()) {
			this._playSelectSound();
			result = PosSelectorResult.SELECT;
		}
		else if (InputControl.isCancelAction()) {
			this._playCancelSound();
			result = PosSelectorResult.CANCEL;
		}
		else {
			this._posCursor.checkCursor();
		}
		
		return result;
	},
	
	drawPosSelector: function() {
		if (this._posCursor === null) {
			return;
		}
		
		this.drawPosCursor();
		this.drawPosMenu();
		MouseControl.drawMapEdge();
	},
	
	drawPosCursor: function() {
		this._posCursor.drawCursor();
	},
	
	drawPosMenu: function() {
		this._posMenu.drawWindowManager();
	},
	
	setPosSelectorType: function(type) {
		this._selectorType = type;
	},
	
	getSelectorTarget: function(isIndexArray) {
		var child;
		var unit = this._posCursor.getUnitFromCursor();
		
		if (this._unit === unit) {
			if (this._isFusionIncluded) {
				child = FusionControl.getFusionChild(unit);
				if (child !== null) {
					return child;
				}
				else {
					return null;
				}
			}
			else {
				// Myself cannot be selected.
				return null;
			}
		}
		
		// Check if the unit exists at the cursor position and the unit exists within a range.
		if (unit !== null && isIndexArray) {
			// If it doesn't exist within a range, return null.
			if (!IndexArray.findUnit(this._indexArray, unit)) {
				unit = null;
			}
		}
		
		return unit;
	},
	
	getSelectorPos: function(isIndexArray) {
		var x = this._posCursor.getX();
		var y = this._posCursor.getY();
		
		if (isIndexArray) {
			if (!IndexArray.findPos(this._indexArray, x, y)) {
				return null;
			}
		}
		
		return createPos(x, y);
	},
	
	setFirstPos: function() {
		this._posCursor.setFirstPos(this);
	},
	
	endPosSelector: function() {
		MapLayer.getMapChipLight().endLight();
		MapLayer.getAllyRangePanel().endLight();
		MapLayer.getEnemyRangePanel().endLight();
	},
	
	getIndexArray: function() {
		return this._indexArray;
	},
	
	setNewTarget: function() {
		this._posMenu.changePosTarget(this.getSelectorTarget(true));
	},
	
	_setPosMenu: function(unit, item, type) {
		this._posMenu.createPosMenuWindow(unit, item, type);
		this._posMenu.changePosTarget(null);
	},
	
	_getObjectFromType: function(type) {
		var obj = PosJumpCursor;
		
		if (type === PosSelectorType.JUMP) {
			obj = PosJumpCursor;
		}
		else if (type === PosSelectorType.FREE) {
			obj = PosFreeCursor;
		}
		
		return obj;
	},
	
	_getDefaultSelectorType: function() {
		return EnvironmentControl.isMouseOperation() ? PosSelectorType.FREE : PosSelectorType.JUMP;
	},
	
	_checkFilter: function(unit, filter) {
		var type = unit.getUnitType();
		
		if (filter & UnitFilterFlag.PLAYER) {
			if (type === UnitType.PLAYER) {
				return true;
			}
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			if (type === UnitType.ENEMY) {
				return true;
			}
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			if (type === UnitType.ALLY) {
				return true;
			}
		}
		
		return false;
	},
	
	_playSelectSound: function() {
		MediaControl.soundDirect('commandselect');
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	}
}
);

var MapLightType = {
	NORMAL: 0,
	MOVE: 1,
	RANGE: 2,
	ALLY: 3,
	ENEMY: 4
};

MapLayer.AllyRangePanel = null;
MapLayer.EnemyRangePanel = null;

MapLayer.getAllyRangePanel = function() {
	return this.AllyRangePanel;
};

MapLayer.getEnemyRangePanel = function() {
	return this.EnemyRangePanel;
}
var alias2 = MapLayer.prepareMapLayer;
MapLayer.prepareMapLayer = function() {
	this.OT_HealingRangePanel = createObject(MapChipLight);
	this.OT_HealingRangePanel.setLightType(MapLightType.ALLY);

	this.OT_EffectRangePanel = createObject(MapChipLight);
	this.OT_EffectRangePanel.setLightType(MapLightType.RANGE);

	this._counter = createObject(UnitCounter);
	this._unitRangePanel = createObject(UnitRangePanel);
		
	this._mapChipLight = createObject(MapChipLight);
	this.AllyRangePanel = createObject(MapChipLight);
	this.EnemyRangePanel = createObject(MapChipLight);

	this._mapChipLight.setLightType(MapLightType.NORMAL);
	this.AllyRangePanel.setLightType(MapLightType.NORMAL);
	this.EnemyRangePanel.setLightType(MapLightType.RANGE);

	this._markingPanel = createObject(MarkingPanel);
	
	
};

var alias3 = MapLayer.moveMapLayer;
MapLayer.moveMapLayer = function() {
	this.OT_HealingRangePanel.moveLight();
	this.OT_EffectRangePanel.moveLight();
	this.AllyRangePanel.moveLight();
	this.EnemyRangePanel.moveLight();
	this._counter.moveUnitCounter();
	this._unitRangePanel.moveRangePanel();
	this._mapChipLight.moveLight();
	this._markingPanel.moveMarkingPanel();
		
	return MoveResult.END;
};

var alias4 = MapLayer.drawUnitLayer;
MapLayer.drawUnitLayer =  function() {
		var index = this._counter.getAnimationIndex();
		var index2 = this._counter.getAnimationIndex2();
		var session = root.getCurrentSession();
		
		this._markingPanel.drawMarkingPanel();
		
		this._unitRangePanel.drawRangePanel();
		this._mapChipLight.drawLight();
		this.AllyRangePanel.drawLight();
		this.EnemyRangePanel.drawLight();
		this.OT_EffectRangePanel.drawLight();
		this.OT_HealingRangePanel.drawLight();

		if (session !== null) {
			session.drawUnitSet(true, true, true, index, index2);
		}
		
		this._drawColor(EffectRangeType.MAPANDCHAR);
		
		if (this._effectRangeType === EffectRangeType.MAPANDCHAR) {
			this._drawScreenColor();
		}
	
};

MapChipLight.drawLight = function() {
		if (this._type === MapLightType.NORMAL) {
			root.drawFadeLight(this._indexArray, this._getColor(), this._getAlpha());
		}
		else if (this._type === MapLightType.ALLY) {
			root.drawWavePanel(this._indexArray, this._getHealImage(), this._wavePanel.getScrollCount());
		}
		else if (this._type === MapLightType.ENEMY) {
			root.drawFadeLight(this._indexArray, 0xff0000, 140);
		}
		else if (this._type === MapLightType.MOVE) {
			root.drawWavePanel(this._indexArray, this._getMoveImage(), this._wavePanel.getScrollCount());
		}
		else if (this._type === MapLightType.RANGE) {
			root.drawWavePanel(this._indexArray, this._getRangeImage(), this._wavePanel.getScrollCount());
		}
	}

MapChipLight._getHealImage = function() {
	return root.getBaseData().getUIResourceList(UIType.PANEL, false).getDataFromId(0);
}


UnitCommand.Attack._prepareCommandMemberData = function() {
		this._weaponSelectMenu = createObject(WeaponSelectMenu);
		this._posSelector = createObject(WeaponPosSelector);
		this._isWeaponSelectDisabled = false;
	}

UnitCommand.Attack._startSelection = function(weapon) {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getIndexArray(unit, weapon);
		var allyArray = this._getAllyRange(unit, weapon);
		var enemyArray = this._getEnemyRange(unit, weapon);
		var attackRange = this._getAttackRange(unit, weapon);
		
		// Equip with the selected item.
		ItemControl.setEquippedWeapon(unit, weapon);
		
		this._posSelector.setUnitOnly(unit, weapon, allyArray, enemyArray, attackRange, PosMenuType.Attack, filter);
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(AttackCommandMode.SELECTION);
	}

UnitCommand.Attack._getAttackRange = function(unit, weapon) {
	return AttackChecker.getRangeAttackIndexArray(unit, weapon, false);}

UnitCommand.Attack._getAllyRange = function(unit, weapon) {
	return AttackChecker.getAllyIndexArray(unit, weapon, false);}

UnitCommand.Attack._getEnemyRange = function(unit, weapon) {
	return AttackChecker.getEnemyIndexArray(unit, weapon, false);}

AttackChecker.getRangeAttackIndexArray = function(unit, weapon, isSingleCheck) {
		var i, index, x, y, targetUnit;
		var indexArrayNew = [];
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if(targetUnit == null) {
				indexArrayNew.push(index);
			}
			if (targetUnit !== null && unit !== targetUnit) {
				if (FilterControl.isReverseUnitTypeAllowed(unit, targetUnit)) {
					indexArrayNew.push(index);
					if (isSingleCheck) {
						return indexArrayNew;
					}
				}
			}
		}
		
		return indexArrayNew;
	}

AttackChecker.getAllyIndexArray = function(unit, weapon, isSingleCheck) {
		var i, index, x, y, targetUnit;
		var indexArrayNew = [];
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit !== targetUnit) {
				if (!FilterControl.isReverseUnitTypeAllowed(unit, targetUnit)) {
					indexArrayNew.push(index);
					if (isSingleCheck) {
						return indexArrayNew;
					}
				}
			}
		}
		
		return indexArrayNew;
	}

AttackChecker.getEnemyIndexArray = function(unit, weapon, isSingleCheck) {
		var i, index, x, y, targetUnit;
		var indexArrayNew = [];
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit !== targetUnit) {
				if (FilterControl.isReverseUnitTypeAllowed(unit, targetUnit)) {
					indexArrayNew.push(index);
					if (isSingleCheck) {
						return indexArrayNew;
					}
				}
			}
		}
		
		return indexArrayNew;
	}