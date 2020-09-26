
var BackgroundChangeMode = {
	FADEOUT: 0,
	FADEIN: 1
};

var BackgroundChangeEventCommand = defineObject(BaseEventCommand,
{
	_transition: null,
	_isBackgroundChange: false,
	
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
		
		if (mode === BackgroundChangeMode.FADEOUT) {
			result = this._moveFadeout();
		}
		else if (mode === BackgroundChangeMode.FADEIN) {
			result = this._moveFadein();
		}
		
		return result;
	},
	
	drawEventCommandCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === BackgroundChangeMode.FADEOUT || mode === BackgroundChangeMode.FADEIN) {
			this._transition.drawTransition();
		}
	},
	
	mainEventCommand: function() {
		var eventCommandData = root.getEventCommandObject();
		
		if (!this._isBackgroundChange) {
			root.startBackgroundChange();
		}
		
		if (eventCommandData.getBackgroundChangeType() === BackgroundChangeType.END) {
			SceneManager.setEffectAllRange(true);
		}
		else {
			if (this._transition !== null && eventCommandData.getBackgroundTransitionType() !== BackgroundTransitionType.NONE) {
				// Don't keep the fadeout/fadein state.
				this._transition.resetTransition();
			}
		}
	},
	
	_prepareEventCommandMemberData: function() {
		this._isBackgroundChange = false;
		this._transition = createObject(SystemTransition);
	},
	
	_checkEventCommand: function() {
		if (this.isSystemSkipMode() || root.getEventCommandObject().getBackgroundTransitionType() === BackgroundTransitionType.NONE) {
			this.mainEventCommand();
			return false;
		}
		
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		if (root.getEventCommandObject().getBackgroundTransitionType() === BackgroundTransitionType.BLACK) {
			this._transition.setFadeSpeed(this._getChangeSpeed());
		}
		else {
			this._transition.setFadeColor(0xffffff);
			this._transition.setFadeSpeed(5);
		}
		
		this._transition.setDestOut();
		this.changeCycleMode(BackgroundChangeMode.FADEOUT);
		
		return EnterResult.OK;
	},
	
	_moveFadeout: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			result = this._changeBackground();
		}
		
		return result;
	},
	
	_moveFadein: function() {
		return this._transition.moveTransition();
	},
	
	_changeBackground: function() {
		var result;
		
		root.startBackgroundChange();
		
		this._isBackgroundChange = true;
		
		if (root.getEventCommandObject().getBackgroundChangeType() === BackgroundChangeType.END) {
			result = MoveResult.END;
		}
		else {
			this._transition.setDestIn();
			this.changeCycleMode(BackgroundChangeMode.FADEIN);
			
			result = MoveResult.CONTINUE;
		}
		
		return result;
	},
	
	_getChangeSpeed: function() {
		return root.getEventCommandObject().getBackgroundChangeType() === BackgroundChangeType.END ? 8 : 15;
	}
}
);
