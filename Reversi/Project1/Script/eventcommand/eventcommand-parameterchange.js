
var ParameterChangeEventCommand = defineObject(BaseEventCommand,
{
	_parameterChangeWindow: null,
	_targetUnit: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (this._parameterChangeWindow.moveWindow() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._parameterChangeWindow.getWindowWidth());
		var y = LayoutControl.getNotifyY();
		
		this._parameterChangeWindow.drawWindow(x, y);
	},
	
	mainEventCommand: function() {
		ParameterControl.addDoping(this._targetUnit, root.getEventCommandObject());
	},
	
	_prepareEventCommandMemberData: function() {
		this._parameterChangeWindow = createWindowObject(ParameterChangeWindow, this);
		this._targetUnit = root.getEventCommandObject().getTargetUnit();
	},
	
	_checkEventCommand: function() {
		// If the enemy becomes the player, the event command to refer to the enemy is null,
		// so it has already checked if it's null or not.
		// Even if the event unit hasn't appeared, set null.
		if (this._targetUnit === null) {
			return EnterResult.NOTENTER;
		}
		
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		this._parameterChangeWindow.setParameterChangeData(this._targetUnit, root.getEventCommandObject());
		
		return EnterResult.OK;
	}	
}
);

var ParameterChangeWindow = defineObject(BaseWindow,
{
	_targetUnit: null,
	_scrollbar: null,
	
	setParameterChangeData: function(targetUnit, parameterChangeCommand) {
		this._scrollbar = createScrollbarObject(StatusScrollbar, this);
		this._scrollbar.enableStatusBonus(true);
		this._scrollbar.setStatusFromUnit(targetUnit);
		
		this._targetUnit = targetUnit;
		
		this._setBonusStatus(parameterChangeCommand);
		this._playParameterChangeSound();
	},
	
	moveWindowContent: function() {
		this._scrollbar.moveScrollbarCursor();
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},	
	
	drawWindowContent: function(x, y) {
		if (this._isTitleAllowed()) {
			this._drawTitleText(x, y);
		}
	
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	_setBonusStatus: function(parameterChangeCommand) {
		var i;
		var count = ParamGroup.getParameterCount();
		var bonusArray = [];
		
		for (i = 0; i < count; i++) {
			bonusArray[i] = ParamGroup.getDopingParameter(parameterChangeCommand, i);
		}
		
		this._scrollbar.setStatusBonus(bonusArray);
	},
	
	_drawTitleText: function(x, y) {
		var text = this._targetUnit.getName();
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		x -= 15;
		y -= 62;
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, 5);
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('objective_title');
	},
	
	_isTitleAllowed: function() {
		return true;
	},
	
	_playParameterChangeSound: function() {
		MediaControl.soundDirect('parameterchange');
	}
}
);
