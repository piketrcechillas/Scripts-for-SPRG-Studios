
var MapCommand = defineObject(BaseListCommandManager,
{
	getPositionX: function() {
		return LayoutControl.getRelativeX(8);
	},
	
	getPositionY: function() {
		return LayoutControl.getRelativeY(12);
	},
	
	getCommandTextUI: function() {
		return root.queryTextUI('mapcommand_title');
	},
	
	configureCommands: function(groupArray) {
		var mixer = createObject(CommandMixer);
		
		mixer.pushCommand(MapCommand.TurnEnd, CommandActionType.TURNEND);
		
		mixer.mixCommand(CommandLayoutType.MAPCOMMAND, groupArray, BaseListCommand);
	}
}
);

MapCommand.TurnEnd = defineObject(BaseListCommand,
{
	openCommand: function() {
		if (root.getBaseScene() === SceneType.FREE) {
			this._saveCursor();
		}
		TurnControl.turnEnd();
	},
	
	moveCommand: function() {
		return MoveResult.END;
	},
	
	drawCommand: function() {
	},
	
	_saveCursor: function() {
		var playerTurnObject = SceneManager.getActiveScene().getTurnObject();
		
		playerTurnObject.setAutoCursorSave(false);
	}
}
);
