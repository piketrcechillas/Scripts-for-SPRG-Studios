
var TrophyChangeEventCommand = defineObject(BaseEventCommand,
{
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		return MoveResult.END;
	},
	
	drawEventCommandCycle: function() {
	},
	
	mainEventCommand: function() {
		this._setTrophy();
	},
	
	_prepareEventCommandMemberData: function() {
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		this._setTrophy();
		
		return EnterResult.NOTENTER;
	},
	
	_setTrophy: function() {
		var targetUnit;
		var eventCommandData = root.getEventCommandObject();
		var trophy = eventCommandData.getTrophy();
		var type = eventCommandData.getTrophyTargetType();
		var increaseType = eventCommandData.getIncreaseValue();
		var trophyCollector = createObject(TrophyCollector);
		
		if (type === TrophyTargetType.POOL) {
			trophyCollector.prepareTrophy(null);
		}
		else {
			targetUnit = eventCommandData.getTargetUnit();
			trophyCollector.prepareTrophy(targetUnit);
		}
		
		if (increaseType === IncreaseType.INCREASE) {
			trophyCollector.addTrophy(trophy);
		}
		else if (increaseType === IncreaseType.DECREASE) {
			trophyCollector.deleteTrophy(trophy);
		}
		else {
			trophyCollector.deleteAllTrophy();
		}
	}
}
);
