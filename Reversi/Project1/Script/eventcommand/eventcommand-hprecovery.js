
var HpRecoveryMode = {
	ANIME: 0,
	WINDOW: 1
};

var HpRecoveryEventCommand = defineObject(BaseEventCommand,
{
	_targetUnit: null,
	_recoveryValue: 0,
	_recoveryWindow: null,
	_dynamicAnime: null,
	
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
		
		if (mode === HpRecoveryMode.ANIME) {
			result = this._moveAnime();
		}
		else if (mode === HpRecoveryMode.WINDOW) {
			result = this._moveWindow();
		}
		
		return result;
	},
	
	drawEventCommandCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === HpRecoveryMode.ANIME) {
			this._drawAnime();
		}
		else if (mode === HpRecoveryMode.WINDOW) {
			this._drawWindow();
		}
	},
	
	mainEventCommand: function() {
		var unit = this._targetUnit;
		var hp = unit.getHp();
		var maxMhp = ParamBonus.getMhp(unit);
		
		hp += this._recoveryValue;
		if (hp > maxMhp) {
			hp = maxMhp;
		}
		
		unit.setHp(hp);
	},
	
	_prepareEventCommandMemberData: function() {
		this._targetUnit = root.getEventCommandObject().getTargetUnit();
		if (this._targetUnit !== null) {
			this._recoveryValue = this._getRecoveyValue();
		}
		this._recoveryWindow = createWindowObject(RecoveryWindow, this);
		this._dynamicAnime = createObject(DynamicAnime);
	},
	
	_checkEventCommand: function() {
		if (this._targetUnit === null || this._targetUnit.getAliveState() !== AliveType.ALIVE) {
			return false;
		}
		
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		this._recoveryWindow.setRecoveryUnit(this._targetUnit);
		this._startHpRecoveryAnime();
		this.changeCycleMode(HpRecoveryMode.ANIME);
		
		return EnterResult.OK;
	},
	
	_moveAnime: function() {
		var isNextMode = false;
		
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			isNextMode = true;
		}
		
		if (this._isAsyncAnime()) {
			// Check if the current frame index has exceeded the half of frame number.
			if (this._dynamicAnime.getFrameIndex() > (this._dynamicAnime.getFrameCount() / 2)) {
				isNextMode = true;
			}	
		}
		
		if (isNextMode) {
			this._recoveryWindow.startRecovery(this._recoveryValue);
			this.changeCycleMode(HpRecoveryMode.WINDOW);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveWindow: function() {
		if (this._isAsyncAnime()) {
			this._dynamicAnime.moveDynamicAnime();
		}
		
		if (this._recoveryWindow.moveWindow() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawAnime: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_drawWindow: function() {
		var width = this._recoveryWindow.getWindowWidth();
		var height = this._recoveryWindow.getWindowHeight();
		var x = LayoutControl.getUnitBaseX(this._targetUnit, width);
		var y = LayoutControl.getUnitBaseY(this._targetUnit, height);
		
		if (this._isAsyncAnime()) {
			this._dynamicAnime.drawDynamicAnime();
		}
		
		this._recoveryWindow.drawWindow(x, y);
	},
	
	_isAsyncAnime: function() {
		// HP recovery event often occurs with a purpose of the exp.
		// For instance, it makes the enemy to use auto recovery of "Terrain" and attack many times,
		// or has an intention to be attacked by the enemy and recovers with items many times etc.
		// If doing such acts, the HP recovery is expected to end smoothly, so if true is turned with this method,
		// even if the recovery animation play has not ended yet, display the recovery window.
		// With this, no more wait until animation play ends.
		
		return false;
	},
	
	_getRecoveyValue: function() {
		var eventCommandData = root.getEventCommandObject();
		var value = eventCommandData.getRecoveryValue();
		var type = eventCommandData.getRecoveryType();
		
		return Calculator.calculateRecoveryValue(this._targetUnit, value, type, 0);
	},
	
	_startHpRecoveryAnime: function() {
		var x = LayoutControl.getPixelX(this._targetUnit.getMapX());
		var y = LayoutControl.getPixelY(this._targetUnit.getMapY());
		var anime = root.getEventCommandObject().getRecoveryAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
	}
}
);

var RecoveryWindowMode = {
	GAUGE: 0,
	WAIT: 1
};

var RecoveryWindow = defineObject(BaseWindow,
{
	_unit: null,
	_counter: null,
	_gaugeBar: null,
	
	setRecoveryUnit: function(unit) {
		this._unit = unit;
		this._gaugeBar = createObject(GaugeBar);
		this._gaugeBar.setGaugeInfo(unit.getHp(), ParamBonus.getMhp(unit), 1);
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(30);
		
		this.changeCycleMode(RecoveryWindowMode.GAUGE);
	},
	
	startRecovery: function(value) {
		this._playGaugeChangeSound();
		this._gaugeBar.startMove(value);
	},
	
	moveWindowContent: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RecoveryWindowMode.GAUGE) {
			result = this._moveGauge();
		}
		else if (mode === RecoveryWindowMode.WAIT) {
			result = this._moveWait();
		}
		
		return result;
	},
	
	drawWindowContent: function(xBase, yBase) {
		var unit = this._unit;
		var picGauge = root.queryUI('unit_gauge');
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = this._getTextLength();
		
		UnitRenderer.drawDefaultUnit(unit, xBase + 5, yBase + 25, null);
		TextRenderer.drawText(xBase + 70, yBase + 10, unit.getName(), length, color, font);
		this._drawHpArea(xBase + 70, yBase + 30);
		
		this._gaugeBar.drawGaugeBar(xBase + 70, yBase + 50, picGauge);
	},
	
	getWindowWidth: function() {
		return 240;
	},
	
	getWindowHeight: function() {
		return 100;
	},
	
	_moveGauge: function() {
		if (this._gaugeBar.moveGaugeBar() !== MoveResult.CONTINUE) {
			this._counter.setCounterInfo(30);
			this.changeCycleMode(RecoveryWindowMode.WAIT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveWait: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawHpArea: function(x, y) {
		var balancer = this._gaugeBar.getBalancer();
		ContentRenderer.drawHp(x, y, balancer.getCurrentValue(), balancer.getMaxValue());
	},
	
	_getTextLength: function() {
		return this.getWindowWidth() - 70;
	},
	
	_playGaugeChangeSound: function() {
		MediaControl.soundDirect('gaugechange');
	}
}
);
