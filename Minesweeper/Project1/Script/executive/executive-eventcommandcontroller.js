
var EventCommandController = {
	_commandTypeTemporarySkip: null,
	_isTemporarySkip: false,
	
	enterEventCommandControllerCycle: function(eventContainer) {
		var eventCommandData, result;
		
		this._isTemporarySkip = false;
		
		if (!eventContainer.isSystemSkipMode()) {
			// Check if the current event command is a type which includes the 'Ignore UI' as a data.
			if (this.isGraphicsSkipEnabled()) {
				// Check if the 'Ignore UI' is checked at the event command.
				// If not checked, the isGraphicsSkip returns true.
				eventCommandData = root.getEventCommandObject();
				if (eventCommandData.isGraphicsSkip()) {
					this._isTemporarySkip = true;
					this._commandTypeTemporarySkip = root.getEventCommandType();
					root.setEventSkipMode(true);
				}
			}
		}
		
		// Keep the event command in the state undone by setting EventResult.PENDING.
		root.setEventExitCode(EventResult.PENDING);
		
		result = eventContainer.enterEventCommandCycle();
		if (result === EnterResult.NOTENTER) {
			// Show that the event ended.
			this.closeEventCommand(EventResult.OK);
		}
		else if (result === EnterResult.OK) {
			// Stop a skip because result is EnterResult.OK which means to enter the cycle.
			eventContainer.stopEventSkip();
		}
		
		return result;
	},
	
	moveEventCommandControllerCycle: function(eventContainer) {
		var result, exitCode;
		
		// If the skip key is pressed, it ends to execute the main processing (mainEventCommand) at that event.
		// However, check if it allows to skip by calling isEventCommandSkipAllowed.
		if (eventContainer.isEventCommandSkipAllowed() && !MessageViewControl.isBacklog() && (InputControl.isStartAction() || root.isEventSkipMode())) {
			exitCode = eventContainer.mainEventCommand();
			this._doEventSkipAction();
			root.endEventCommand(exitCode);
			return MoveResult.END;
		}
		
		result = eventContainer.moveEventCommandCycle();
		if (result === MoveResult.END) {
			// Show that the event ended.
			this.endEventCommand(EventResult.OK);
		}
		
		return result;
	},
	
	drawEventCommandControllerCycle: function(eventContainer, commandType) {
		var isOriginAccess = this.isOriginAccess(commandType);
		
		if (isOriginAccess) {
			root.getGraphicsManager().enableMapClipping(false);
		}
		
		eventContainer.drawEventCommandCycle();
		
		if (isOriginAccess) {
			root.getGraphicsManager().enableMapClipping(true);
		}
	},
	
	backEventCommandControllerCycle: function(eventContainer) {
		eventContainer.backEventCommandCycle();
	},
	
	closeEventCommand: function(exitCode) {
		this.endTemporarySkip();
		root.setEventExitCode(exitCode);
	},
	
	endEventCommand: function(exitCode) {
		this.endTemporarySkip();
		
		// root.setEventExitCode is called, so setEventExitCode is not called.
		root.endEventCommand(exitCode);
	},
	
	endTemporarySkip: function() {
		// If the event which triggered a temporary skip ends, the temporary skip will suspend, too.
		if (this._isTemporarySkip && this._commandTypeTemporarySkip === root.getEventCommandType()) {
			root.setEventSkipMode(false);
			this._commandTypeTemporarySkip = null;
		}
	},
	
	isGraphicsSkipEnabled: function() {
		var commandType = root.getEventCommandType();
		var isSkipEnabled = false;
		
		if (commandType === EventCommandType.GOLDCHANGE ||
			commandType === EventCommandType.ITEMCHANGE ||
			commandType === EventCommandType.PARAMATERCHANGE ||
			commandType === EventCommandType.HPRECOVERY ||
			commandType === EventCommandType.EXPERIENCEPLUS ||
			commandType === EventCommandType.CLASSCHANGE ||
			commandType === EventCommandType.DAMAGEHIT ||
			commandType === EventCommandType.LOCATIONFOCUS ||
			commandType === EventCommandType.ITEMUSE ||
			commandType === EventCommandType.SKILLCHANGE ||
			commandType === EventCommandType.BONUSCHANGE ||
			commandType === EventCommandType.DURABILITYCHANGE ||
			commandType === EventCommandType.UNITSTATEADDITION ||
			commandType === EventCommandType.UNITSLIDE ||
			commandType === EventCommandType.UNITFUSION ||
			commandType === EventCommandType.UNITMETAMORPHOZE
		) {
			isSkipEnabled = true;
		}
		
		return isSkipEnabled;
	},
	
	isOriginAccess: function(commandType) {
		if (commandType === EventCommandType.MESSAGESHOW ||
			commandType === EventCommandType.MESSAGETEROP ||
			commandType === EventCommandType.STILLMESSAGE ||
			commandType === EventCommandType.BACKGROUNDCHANGE
		) {
			// In these event commands, even though the size of the map is less than the screen resolution,
			// draw it like the top left of the screen is the origin. 
			return true;
		}
		
		if (commandType === EventCommandType.MESSAGETITLE ||
			commandType === EventCommandType.INFOWINDOW
		) {
			// In these event commands, even though the size of the map is less than the screen resolution,
			// draw it like the top left of the screen is the origin. 
			return root.getEventCommandObject().isBackTarget();
		}
		
		return false;
	},
	
	_doEventSkipAction: function() {
		// Set in a skip state.
		// Don't call the CurrentMap.setTurnSkipMode(true).
		root.setEventSkipMode(true);
		
		MessageViewControl.setHidden(false);
		MapLayer.setEffectMotion(null);	
	}
};
