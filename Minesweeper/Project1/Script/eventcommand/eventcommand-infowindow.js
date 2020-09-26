
var InfoWindowEventCommand = defineObject(BaseEventCommand,
{
	_infoWindow: null,
	_xStart: 0,
	_yStart: 0,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		var x, y;
		
		if (this._xStart === -1 && this._xStart === -1) {
			x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
		}
		else {
			x = this._xStart;
			y = this._yStart;
		}
		
		this._infoWindow.drawWindow(x, y);
	},
	
	_prepareEventCommandMemberData: function() {
		this._infoWindow = createWindowObject(InfoWindow, this);
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._infoWindow.setInfoMessageAndType(eventCommandData.getMessage(), eventCommandData.getInfoType());
		
		if (eventCommandData.isCenterShow()) {
			this._xStart = -1;
			this._yStart = -1;
		}
		else {
			this._xStart = eventCommandData.getX();
			this._yStart = eventCommandData.getY();
		}
		
		return EnterResult.OK;
	}
}
);
