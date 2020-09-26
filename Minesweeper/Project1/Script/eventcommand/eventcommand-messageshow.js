
var MessageShowEventCommand = defineObject(BaseEventCommand,
{
	_messageView: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (this._messageView.moveMessageView() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		// It differs from the other drawEventCommandCycle, this method is always called while having event.
		if (this._messageView !== null) {
			this._messageView.drawMessageView();
		}
	},
	
	mainEventCommand: function() {
		if (this._messageView !== null) {
			this._messageView.endMessageView();
		}
	},
	
	eraseMessage: function(value) {
		if (this._messageView !== null) {
			this._messageView.eraseMessage(value);
		}
	},
	
	_prepareEventCommandMemberData: function() {
		if (this._messageView === null) {
			this._messageView = createObject(FaceView);
		}
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		var messageViewParam;
		
		messageViewParam = this._createMessageViewParam();
		this._messageView.setupMessageView(messageViewParam);
		
		return EnterResult.OK;
	},
	
	_createMessageViewParam: function() {
		var eventCommandData = root.getEventCommandObject();
		var messageViewParam = StructureBuilder.buildMessageViewParam();
		
		messageViewParam.text = eventCommandData.getText();
		messageViewParam.pos = eventCommandData.getTextPosValue();
		messageViewParam.speakerType = eventCommandData.getSpeakerType();
		messageViewParam.unit = eventCommandData.getUnit();
		messageViewParam.npc = eventCommandData.getNpc();
		messageViewParam.facialExpressionId = eventCommandData.getFacialExpressionId();
		
		return messageViewParam;
	}
}
);
