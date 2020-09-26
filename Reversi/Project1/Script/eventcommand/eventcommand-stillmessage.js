
var StillMessageEventCommand = defineObject(BaseEventCommand,
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
		if (this._messageView !== null) {
			this._messageView.drawMessageView();
		}
	},
	
	mainEventCommand: function() {
		if (this._messageView !== null) {
			this._messageView.endMessageView();
		}
	},
	
	_prepareEventCommandMemberData: function() {
		this._messageView = createObject(StillView);
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		var messageViewParam = this._createMessageViewParam();
		
		this._messageView.setupMessageView(messageViewParam);
		
		return EnterResult.OK;
	},
	
	_createMessageViewParam: function() {
		var eventCommandData = root.getEventCommandObject();
		var messageViewParam = StructureBuilder.buildMessageViewParam();
		
		messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.STILL);
		messageViewParam.text = eventCommandData.getText();
		messageViewParam.pos = MessagePos.BOTTOM;
		messageViewParam.speakerType = eventCommandData.getSpeakerType();
		messageViewParam.unit = eventCommandData.getUnit();
		messageViewParam.npc = eventCommandData.getNpc();
		messageViewParam.facialExpressionId = eventCommandData.getFacialExpressionId();
		
		return messageViewParam;
	}
}
);
