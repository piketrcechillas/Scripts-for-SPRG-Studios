
var ScriptExecuteEventCommand = defineObject(BaseEventCommand,
{
	_activeEventCommand: null,
	_eventCommandArray: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (this._activeEventCommand.moveEventCommandCycle() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		this._activeEventCommand.drawEventCommandCycle();
	},
	
	isEventCommandSkipAllowed: function() {
		return this._activeEventCommand.isEventCommandSkipAllowed();
	},
	
	_prepareEventCommandMemberData: function() {
		if (this._eventCommandArray === null) {
			this._eventCommandArray = [];
			this._configureOriginalEventCommand(this._eventCommandArray);
		}
	},
	
	_checkEventCommand: function() {
		this._activeEventCommand = this._findEventObject(root.getEventCommandObject().getEventCommandName());
		if (this._activeEventCommand === null) {
			return false;
		}
		
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		return this._activeEventCommand.enterEventCommandCycle();
	},
	
	_findEventObject: function(name) {
		var i;
		var count = this._eventCommandArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._eventCommandArray[i].getEventCommandName() === name) {
				return this._eventCommandArray[i];
			}
		}
		
		return null;
	},
	
	_configureOriginalEventCommand: function(groupArray) {
	}
}
);
