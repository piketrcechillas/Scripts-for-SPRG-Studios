
var DummyTurnMode = {
	BOUNCEONE: 0,
	BOUNCETWO: 1,
	PROCEED: 2
};
var DummyTurn = defineObject(BaseTurn,
{
	_targetUnit: null,
	_xCursorSave: 0,
	_yCursorSave: 0,
	_xAutoCursorSave: 0,
	_yAutoCursorSave: 0,
	_isPlayerActioned: false,
	_mapLineScroll: null,
	_mapEdit: null,
	_mapSequenceArea: null,
	_mapSequenceCommand: null,
	_mapCommandManager: null,
	_eventChecker: null,
	_wait: 0,
	_http: null,


	// It's called if the turn is switched.
	openTurnCycle: function() {
		//this._prepareTurnMemberData();
		//this._completeTurnMemberData();
		this.changeCycleMode(DummyTurnMode.BOUNCEONE);
	},
	
	moveTurnCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === DummyTurnMode.BOUNCEONE) {
			
			result = MoveResult.CONTINUE;
		}

		if (mode === DummyTurnMode.BOUNCETWO) {
			
			result = MoveResult.CONTINUE;
		}

		if (mode === DummyTurnMode.PROCEED) {
			
			TurnControl.turnEnd();
		}
		
		
		
		return result;
	},


	drawTurnCycle: function() {
		var mode = this.getCycleMode();
		if (mode === DummyTurnMode.BOUNCEONE) {
			var http = createObject(StatusChecker);
			var res = http.getStatus();
			if(res){
				this.changeCycleMode(DummyTurnMode.PROCEED);
			}
			else{
				root.log("Bounce forth")
				wait(500);
				this.changeCycleMode(DummyTurnMode.BOUNCETWO);
			}
			this.drawNoticeView(270, 200);			
		}
		if (mode === DummyTurnMode.BOUNCETWO) {
			var http = createObject(StatusChecker);
			var res = http.getStatus();
			if(res){
				this.changeCycleMode(DummyTurnMode.PROCEED);
			}
			else{
				root.log("Bounce back")
				wait(500);
				this.changeCycleMode(DummyTurnMode.BOUNCEONE);
			}
			this.drawNoticeView(270, 200);			
		}

	},
	
	drawNoticeView: function(x, y) {
		var textui = root.queryTextUI('support_title');
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var count = 6;
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);
		
		x += 30;
		y += 18;
		var color = textui.getColor();
		var font = textui.getFont();
		var text = 'Waiting for the other player...';
		var infoColor = ColorValue.KEYWORD;
		var width = TextRenderer.getTextWidth(text, font) + 5;
		
		TextRenderer.drawKeywordText(x, y, text, -1, infoColor, font);
	}



})



var StatusChecker = defineObject(BaseObject, {
	_http: null,

	getStatus: function() {
		this.createHTTPObject();
		this._http.open('POST', "http://localhost:8080/SRPGStudioServer/rest/connect/checkStatus", false);
		this._http.send();

		if(this._http.readyState == 4){
			var result = this._http.responseText;
			root.log("Current Turn:" + this._http.responseText)
			if(result == root.getMetaSession().getVariableTable(4).getVariable(0)) 
			{
					return true;
				}	

			}
		return false;
	},


	createHTTPObject: function() {
		this._http = new ActiveXObject("Msxml2.XMLHTTP.6.0");
	}

})