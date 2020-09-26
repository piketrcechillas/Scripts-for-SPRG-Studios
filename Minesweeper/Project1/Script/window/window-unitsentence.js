
var UnitSentenceWindow = defineObject(BaseWindow,
{
	_unit: null,
	_weapon: null,
	_totalStatus: null,
	_groupArray: null,
	
	setUnitData: function(unit) {
		var i, count;
		
		this._unit = unit;
		
		// Obtain in advance because the calling cost is high.
		this._weapon = ItemControl.getEquippedWeapon(unit);
		this._totalStatus = SupportCalculator.createTotalStatus(unit);
		
		this._groupArray = [];
		this._configureSentence(this._groupArray);
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].setParentWindow(this);
			this._groupArray[i].setCalculatorValue(unit, this._weapon, this._totalStatus);
		}
	},
	
	moveWindowContent: function() {
		var i, count;
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].moveUnitSentence();
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		var i;
		var count = this._groupArray.length;
		
		for (i = 0; i < count; i++) {
			this._groupArray[i].drawUnitSentence(x, y, this._unit, this._weapon, this._totalStatus);
			y += this._groupArray[i].getUnitSentenceCount(this._unit) * this.getUnitSentenceSpaceY();
		}
	},
	
	getWindowWidth: function() {
		return 130;
	},
	
	getWindowHeight: function() {
		return DefineControl.getFaceWindowHeight() + DefineControl.getUnitMenuBottomWindowHeight();
	},
	
	getUnitSentenceSpaceY: function() {
		return 25;
	},
	
	_configureSentence: function(groupArray) {
		groupArray.appendObject(UnitSentence.Power);
		groupArray.appendObject(UnitSentence.Hit);
		groupArray.appendObject(UnitSentence.Critical);
		groupArray.appendObject(UnitSentence.Avoid);
		groupArray.appendObject(UnitSentence.Range);
		if (DataConfig.isItemWeightDisplayable()) {
			groupArray.appendObject(UnitSentence.Agility);
		}
		groupArray.appendObject(UnitSentence.Fusion);
		groupArray.appendObject(UnitSentence.State);
		groupArray.appendObject(UnitSentence.Support);
	}
}
);

var BaseUnitSentence = defineObject(BaseObject,
{
	_unitSentenceWindow: null,
	
	setParentWindow: function(unitSentenceWindow) {
		this._unitSentenceWindow = unitSentenceWindow;
	},
	
	setCalculatorValue: function(unit, weapon, totalStatus) {
	},
	
	moveUnitSentence: function() {
		return MoveResult.CONTINUE;
	},
	
	drawUnitSentence: function(x, y, unit, weapon) {
	},
	
	drawAbilityText: function(x, y, text, value, isValid) {
		var textui = this.getUnitSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var colorIndex = 1;
		var length = -1;
		
		TextRenderer.drawKeywordText(x, y, text, length, color, font);
		
		x += 78;
		
		if (isValid) {
			if (value < 0) {
				TextRenderer.drawSignText(x - 37, y, ' - ');
				value *= -1;
			}
			NumberRenderer.drawNumberColor(x, y, value, colorIndex, 255);
		}
		else {
			TextRenderer.drawSignText(x - 5, y, StringTable.SignWord_Limitless);
		}
	},
	
	getUnitSentenceCount: function(unit) {
		return 1;
	},
	
	getUnitSentenceTextUI: function() {
		return root.queryTextUI('default_window');
	}
}
);

var UnitSentence = {};

UnitSentence.Power = defineObject(BaseUnitSentence,
{
	_value: 0,
	
	setCalculatorValue: function(unit, weapon, totalStatus) {
		if (weapon !== null) {
			// Save so as not to call with the drawUnitSentence every time.
			this._value = AbilityCalculator.getPower(unit, weapon) + totalStatus.powerTotal;
		}
	},
	
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var value = 0;
		var isValid = false;
		
		if (weapon !== null) {
			value = this._value;
			if (value < 0) {
				value = 0;
			}
			
			isValid = true;
		}
		
		this.drawAbilityText(x, y, root.queryCommand('attack_capacity'), value, isValid);
	}
}
);

UnitSentence.Hit = defineObject(BaseUnitSentence,
{
	_value: 0,
	
	setCalculatorValue: function(unit, weapon, totalStatus) {
		if (weapon !== null) {
			this._value = AbilityCalculator.getHit(unit, weapon) + totalStatus.hitTotal;
		}
	},
	
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var value = 0;
		var isValid = false;
		
		if (weapon !== null) {
			value = this._value;
			if (value < 0) {
				value = 0;
			}
			
			isValid = true;
		}
		
		this.drawAbilityText(x, y, root.queryCommand('hit_capacity'), value, isValid);
	}
}
);

UnitSentence.Critical = defineObject(BaseUnitSentence,
{
	_value: 0,
	
	setCalculatorValue: function(unit, weapon, totalStatus) {
		if (weapon !== null) {
			this._value = AbilityCalculator.getCritical(unit, weapon) + totalStatus.criticalTotal;
		}
	},
	
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var value = 0;
		var isValid = false;
		
		if (weapon !== null) {
			if (Miscellaneous.isCriticalAllowed(unit, null)) {
				value = this._value;
				if (value < 0) {
					value = 0;
				}
			}
			
			isValid = true;
		}
		
		this.drawAbilityText(x, y, root.queryCommand('critical_capacity'), value, isValid);
	}
}
);

UnitSentence.Avoid = defineObject(BaseUnitSentence,
{
	_value: 0,
	
	setCalculatorValue: function(unit, weapon, totalStatus) {
		this._value = AbilityCalculator.getAvoid(unit) + totalStatus.avoidTotal;
	},
	
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var value = this._value;
		var isValid = true;
		
		this.drawAbilityText(x, y, root.queryCommand('avoid_capacity'), value, isValid);
	}
}
);

UnitSentence.Range = defineObject(BaseUnitSentence,
{
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var startRange, endRange;
		var textui = this.getUnitSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = -1;
		var colorIndex = 1;
		var alpha = 255;
		
		TextRenderer.drawKeywordText(x, y, root.queryCommand('range_capacity'), length, color, font);
		x += 78;
		
		if (weapon === null) {
			TextRenderer.drawSignText(x - 5, y, StringTable.SignWord_Limitless);
			return;
		}
		
		startRange = weapon.getStartRange();
		endRange = weapon.getEndRange();
		
		if (startRange === endRange) {
			NumberRenderer.drawNumberColor(x, y, startRange, colorIndex, alpha);
		}
		else {
			x -= 30;
			NumberRenderer.drawNumberColor(x, y, startRange, colorIndex, alpha);
			TextRenderer.drawKeywordText(x + 17, y, StringTable.SignWord_WaveDash, -1, color, font);
			NumberRenderer.drawNumberColor(x + 40, y, endRange, colorIndex, alpha);
		}
	}
}
);

UnitSentence.Agility = defineObject(BaseUnitSentence,
{
	_value: 0,
	
	setCalculatorValue: function(unit, weapon, totalStatus) {
		if (weapon !== null) {
			this._value = AbilityCalculator.getAgility(unit, weapon);
		}
	},
	
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var value = 0;
		var isValid = false;
		
		if (weapon !== null) {
			value = this._value;
			isValid = true;
		}
		
		this.drawAbilityText(x, y, root.queryCommand('agility_capacity'), value, isValid);
	}
}
);

UnitSentence.State = defineObject(BaseUnitSentence,
{
	_arr: null,
	
	setCalculatorValue: function(unit, weapon, totalStatus) {
		var i, turnState;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		
		this._arr = [];
		
		for (i = 0; i < count; i++) {
			turnState = list.getData(i);
			if (turnState.getState().isHidden()) {
				continue;
			}
			
			this._arr.push(turnState);
		}
	},
	
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var i, state, turnState;
		var count = this._arr.length;
		var xPrev = x;
		
		for (i = 0; i < count; i++) {
			turnState = this._arr[i];
			state = turnState.getState();
			GraphicsRenderer.drawImage(x, y, state.getIconResourceHandle(), GraphicsType.ICON);
			x += GraphicsFormat.ICON_WIDTH + 6;
			if (turnState.getTurn() !== 0) {
				NumberRenderer.drawNumber(x, y, turnState.getTurn());
			}
			else {
				TextRenderer.drawSignText(x, y, StringTable.SignWord_Limitless);
			}
			x += 16;
			
			if (((i + 1) % 2) === 0) {
				x = xPrev;
				y += this._unitSentenceWindow.getUnitSentenceSpaceY();
			}
		}
	},
	
	getUnitSentenceCount: function(unit) {
		var n;
		var count = this._arr.length;
		
		if (count === 0) {
			return 0;
		}
		
		n = count % 2;
		
		return n === 0 ? Math.floor(count / 2) : Math.floor(count / 2) + 1;
	}
}
);

UnitSentence.Fusion = defineObject(BaseUnitSentence,
{
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var i, count, data, targetUnit;
		var textui = this.getUnitSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = this._getTextLength();
		var fusionData = FusionControl.getFusionData(unit);
		var child = FusionControl.getFusionChild(unit);
		
		if (fusionData === null || child === null) {
			return;
		}
		
		GraphicsRenderer.drawImage(x, y, fusionData.getIconResourceHandle(), GraphicsType.ICON);
		x += GraphicsFormat.ICON_WIDTH + 6;
		TextRenderer.drawKeywordText(x, y, child.getName(), length, color, font);
	},
	
	getUnitSentenceCount: function(unit) {
		var child = FusionControl.getFusionChild(unit);
		
		return child !== null ? 1 : 0;
	},
	
	_getTextLength: function() {
		return 100;
	}
}
);

UnitSentence.Support = defineObject(BaseUnitSentence,
{
	drawUnitSentence: function(x, y, unit, weapon, totalStatus) {
		var i, count, data, targetUnit;
		var textui = this.getUnitSentenceTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var length = this._getTextLength();
		
		TextRenderer.drawKeywordText(x, y, StringTable.UnitSentence_Support, length, color, font);
		
		y += this._unitSentenceWindow.getUnitSentenceSpaceY();
		
		count = unit.getSupportDataCount();
		for (i = 0; i < count; i++) {
			data = unit.getSupportData(i);
			targetUnit = data.getUnit();
			if (targetUnit !== null && data.isGlobalSwitchOn() && data.isVariableOn()) {
				TextRenderer.drawKeywordText(x, y, targetUnit.getName(), length, color, font);
				y += this._unitSentenceWindow.getUnitSentenceSpaceY();
			}
		}
	},
	
	getUnitSentenceCount: function(unit) {
		return 1 + unit.getSupportDataCount();
	},
	
	_getTextLength: function() {
		return 130;
	}
}
);
