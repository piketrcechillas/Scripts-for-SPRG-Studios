
var InputType = {
	NONE: -1,
	MOUSE: -2,
	LEFT: 0,
	UP: 1,
	RIGHT: 2,
	DOWN: 3,
	BTN1: 4,
	BTN2: 5,
	BTN3: 6,
	BTN4: 7,
	BTN5: 8,
	BTN6: 9,
	BTN7: 10,
	BTN8: 11
};

var InputControl = {
	_counter: null,
	_counterHigh: null,
	_blanckCounter: null,
	_prevInputType: -1,
	_isWait: false,
	
	initSingleton: function() {
		this._counterHigh = createObject(CycleCounter);
		this._counterHigh.setCounterInfo(0);
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(4);
		this._counter.disableGameAcceleration();
		
		this._blanckCounter = createObject(CycleCounter);
		this._blanckCounter.setCounterInfo(2);
		this._counter.disableGameAcceleration();
	},
	
	isSelectState: function() {
		return root.isInputState(InputType.BTN1);
	},
	
	isSelectAction: function() {
		return root.isInputAction(InputType.BTN1) || root.isMouseAction(MouseType.LEFT);
	},
	
	isCancelState: function() {
		return root.isInputState(InputType.BTN2) || root.isMouseAction(MouseType.DOWNWHEEL);
	},
	
	isCancelAction: function() {
		return root.isInputAction(InputType.BTN2) || root.isMouseAction(MouseType.RIGHT);
	},
	
	isOptionAction: function() {
		return root.isInputAction(InputType.BTN3);
	},
	
	isOptionAction2: function() {
		return root.isInputAction(InputType.BTN4);
	},
	
	isLeftPadAction: function() {
		return root.isInputAction(InputType.BTN5) || root.isMouseAction(MouseType.UPWHEEL);
	},
	
	isRightPadAction: function() {
		return root.isInputAction(InputType.BTN6) || root.isMouseAction(MouseType.DOWNWHEEL);
	},
	
	isSystemState: function() {
		return root.isInputState(InputType.BTN7);
	},
	
	isStartAction: function() {
		var type = EnvironmentControl.getSkipControlType();
		
		if (type === 0 || !root.isSystemSettings(SystemSettingsType.SKIP)) {
			return false;
		}
		
		if (root.isInputAction(InputType.BTN8)) {
			if (type === 1 && root.isMouseAction(MouseType.RIGHT)) {
				return false;
			}
			
			return true;
		}
		
		return false;
	},
	
	isInputState: function(type) {
		return root.isInputState(type);
	},
	
	isInputAction: function(type) {
		return root.isInputAction(type);
	},
	
	getDirectionState: function() {
		var inputType;
		var result = InputType.NONE;
		
		inputType = this.getInputType();
		
		// Check if the current state is no input.
		if (inputType === InputType.NONE) {
			this._prevInputType = inputType;
			this._isWait = false;
			return inputType;
		}
		
		// Check if the previous state is no input, or the current input differs from the previous one.
		if (inputType !== this._prevInputType || this._prevInputType === InputType.NONE) { 
			this._prevInputType = inputType;
			this._isWait = true;
			this._counter.resetCounterValue();
			this._blanckCounter.resetCounterValue();
			return inputType;
		}
		
		// Current input and previous input are identical.
		// It means that the key is continuously pressed.
		
		if (this._isWait) {
			if (this._blanckCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
				this._isWait = false;
			}
		}
		else {
			if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
				// Allow to input.
				result = inputType;
			}
		}
		
		return result;
	},
	
	getDirectionStateHigh: function() {
		var inputType = InputType.NONE;
		
		if (DataConfig.isHighPerformance()) {
			if (this._counterHigh.moveCycleCounter() !== MoveResult.CONTINUE) {
				inputType = this.getInputType();
			}
		}
		else {
			inputType = this.getInputType();
		}
		
		return inputType;
	},
	
	getInputType: function() {
		var inputType = InputType.NONE;
		
		if (root.isInputState(InputType.LEFT)) {
			inputType = InputType.LEFT;
		}
		else if (root.isInputState(InputType.UP)) {
			inputType = InputType.UP;
		}
		else if (root.isInputState(InputType.RIGHT)) {
			inputType = InputType.RIGHT;
		}
		else if (root.isInputState(InputType.DOWN)) {
			inputType = InputType.DOWN;
		}
			
		return inputType;
	}
};
