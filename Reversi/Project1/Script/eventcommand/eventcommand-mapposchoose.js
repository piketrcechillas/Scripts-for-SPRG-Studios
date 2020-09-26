
var MapPosChooseMode = {
	SELECT: 0,
	QUESTION: 1
};

var MapPosChooseEventCommand = defineObject(BaseEventCommand,
{
	_posSelector: null,
	_questionWindow: null,
	_targetUnit: null,
	_isUnitOnlyMode: false,
	_isQuestionDisplayable: false,
	_isCancelAllowed: false,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === MapPosChooseMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === MapPosChooseMode.QUESTION) {
			result = this._moveQuestion();
		}
		
		return result;
	},
	
	drawEventCommandCycle: function() {
		this._posSelector.drawPosCursor();
		
		if (this.getCycleMode() === MapPosChooseMode.QUESTION) {
			this._drawQuestion();
			return;
		}
		
		if (root.getEventCommandObject().isWindowDisplayable()) {
			this._posSelector.drawPosMenu();
		}
	},
	
	isEventCommandSkipAllowed: function() {
		return false;
	},
	
	_prepareEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._posSelector = createObject(PosSelector);
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._targetUnit = eventCommandData.getTargetUnit();
		this._isUnitOnlyMode = eventCommandData.isUnitOnlyMode();
		this._isQuestionDisplayable = eventCommandData.isQuestionDisplayable();
		this._isCancelAllowed = !eventCommandData.isCancelDisabled();
	},
	
	_checkEventCommand: function() {
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		var unit = this._getPosWindowUnit();
		var item = this._getPosWindowItem();
		var piData = this._createPositionIndexData();
		var indexArray = PositionIndexArray.getIndexArray(piData);
		
		this._posSelector.setPosSelectorType(PosSelectorType.FREE);
		this._posSelector.setPosOnly(unit, item, indexArray, PosMenuType.Item);
		
		this.changeCycleMode(MapPosChooseMode.SELECT);
		
		return EnterResult.OK;
	},
	
	_createPositionIndexData: function() {
		var piData = {};
		var eventCommandData = root.getEventCommandObject();
		var baseUnit = eventCommandData.getBaseUnit();
		var baseClass = null;
		var pos = this._getFocusPos();
		
		if (baseUnit !== null) {
			baseClass = baseUnit.getClass();
		}
		
		piData.targetUnit = this._targetUnit;
		piData.isUnitOnlyMode = this._isUnitOnlyMode;
		piData.x = pos.x;
		piData.y = pos.y;
		piData.rangeType = eventCommandData.getRangeType();
		piData.rangeValue = eventCommandData.getRangeValue();
		piData.filter = eventCommandData.getFilterFlag();
		piData.type = eventCommandData.getPosChooseType();
		piData.baseUnit = baseUnit;
		piData.baseClass = baseClass;
		piData.eventCommandData = eventCommandData;
		
		return piData;
	},
	
	_getPosWindowUnit: function() {
		return this._targetUnit;
	},
	
	_getPosWindowItem: function() {
		return ItemControl.getEquippedWeapon(this._targetUnit);
	},
	
	_moveSelect: function() {
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				if (!this._isQuestionDisplayable) {
					this._doEndAction();
					return MoveResult.END;
				}
				else {
					this._changeQuestion();
				}
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			if (this._isCancelAllowed) {
				this._doCancelAction();
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveQuestion: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._doEndAction();
				return MoveResult.END;
			}
			else {
				this.changeCycleMode(MapPosChooseMode.SELECT);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawQuestion: function() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	},
	
	_isPosSelectable: function() {
		var result;
		
		if (this._isUnitOnlyMode) {
			result = this._posSelector.getSelectorTarget(true) !== null;
		}
		else {
			result = this._posSelector.getSelectorPos(true) !== null;
		}
		
		return result;
	},
	
	_doEndAction: function() {
		var eventCommandData = root.getEventCommandObject();
		var pos = this._posSelector.getSelectorPos(true);
		var unit = this._posSelector.getSelectorTarget(true);
		
		if (pos !== null) {
			eventCommandData.setXToVariable(pos.x);
			eventCommandData.setYToVariable(pos.y);
		}
		else {
			eventCommandData.setXToVariable(-1);
			eventCommandData.setYToVariable(-1);
		}
		
		if (unit !== null) {
			eventCommandData.setUnitIdToVariable(unit.getId());
		}
		else {
			eventCommandData.setUnitIdToVariable(-1);
		}
		
		this._posSelector.endPosSelector();
		this._doFlagAction(false);
	},
	
	_doCancelAction: function() {
		this._posSelector.endPosSelector();
		this._doFlagAction(true);
	},
	
	_doFlagAction: function(isSet) {
		if (this._isCancelAllowed) {
			root.setSelfSwitch(root.getEventCommandObject().getSelfSwitchId(), isSet);
		}
		
		UnitEventChecker.setCancelFlag(isSet);
	},
	
	_changeQuestion: function() {
		var text = this._isUnitOnlyMode ? StringTable.MapPosChoose_Unit : StringTable.MapPosChoose_Pos;
		
		this._questionWindow.setQuestionMessage(text);
		this._questionWindow.setQuestionActive(true);
		this.changeCycleMode(MapPosChooseMode.QUESTION);
	},
	
	_getFocusPos: function() {
		var x, y, unit;
		var eventCommandData = root.getEventCommandObject();
		
		if (eventCommandData.isPosBase()) {
			x = eventCommandData.getX();
			y = eventCommandData.getY();
		}
		else {
			unit = eventCommandData.getTargetUnit();
			if (unit !== null) {
				x = unit.getMapX();
				y = unit.getMapY();
			}
			else {
				x = -1;
				y = -1;
			}
		}
		
		return createPos(x, y);
	}
}
);

var PositionIndexArray = {
	getIndexArray: function(piData) {
		var indexArray;
		
		if (piData.rangeType === SelectionRangeType.MULTI) {
			indexArray = this._getMultiIndexArray(piData);
		}
		else {
			indexArray = this._getAllIndexArray(piData);
		}
		
		return indexArray;
	},
	
	_getMultiIndexArray: function(piData) {
		var i, index, x, y, result;
		var indexArrayNew = [];
		var indexArray = IndexArray.getBestIndexArray(piData.x, piData.y, 0, piData.rangeValue);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			result = piData.isUnitOnlyMode ? this._isUnitEnabled(x, y, piData) : this._isPosEnabled(x, y, piData);
			if (result) {
				indexArrayNew.push(index);
			}
		}
		
		return indexArrayNew;
	},
	
	_getAllIndexArray: function(piData) {
		var i, index, x, y, result;
		var indexArrayNew = [];
		var count = CurrentMap.getSize();
		
		for (i = 0; i < count; i++) {
			index = i;
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			result = piData.isUnitOnlyMode ? this._isUnitEnabled(x, y, piData) : this._isPosEnabled(x, y, piData);
			if (result) {
				indexArrayNew.push(index);
			}
		}
		
		return indexArrayNew;
	},
	
	_isPosEnabled: function(x, y, piData) {
		var targetUnit = PosChecker.getUnitFromPos(x, y);
		
		if (targetUnit !== null) {
			if (!this._isUnitTypeAllowed(piData, targetUnit)) {
				return false;
			}
		}
		
		if (piData.type === PosChooseType.UNIT && piData.baseUnit !== null) {
			// Depending on the value of "Passable Conditions", delay may occur.
			if (PosChecker.getMovePointFromUnit(x, y, piData.baseUnit) === 0) {
				return false;
			}
		}
		
		if (piData.type === PosChooseType.TERRAIN) {
			if (!piData.eventCommandData.isTerrainGroupCondition(x, y)) {
				return false;
			}
		}
		
		return true;
	},
	
	_isUnitEnabled: function(x, y, piData) {
		var targetUnit = PosChecker.getUnitFromPos(x, y);
		
		if (targetUnit === null) {
			return false;
		}
		
		if (!this._isUnitAllowed(piData, targetUnit)) {
			return false;
		}
		
		if (!this._isUnitTypeAllowed(piData, targetUnit)) {
			return false;
		}
		
		if (!piData.eventCommandData.isDataCondition(targetUnit)) {
			return false;
		}
		
		return true;
	},
	
	_isUnitAllowed: function(piData, targetUnit) {
		return piData.targetUnit !== targetUnit;
	},
	
	_isUnitTypeAllowed: function(piData, targetUnit) {
		var filter = FilterControl.getNormalFilter(targetUnit.getUnitType());
		
		return filter & piData.filter;
	}
};
