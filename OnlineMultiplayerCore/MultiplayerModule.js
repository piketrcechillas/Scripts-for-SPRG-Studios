TitleCommand.CreateRoom = defineObject(BaseTitleCommand,
{
	_transition: null,
	_straightFlow: null,
	connecting: false,
	_http: null,
	openCommand: function() {
		this._createSubObject();
		this.changeCycleMode(NewGameMode.BLACKOUT);
		this.createHTTPObject();
		this._http.open('GET', "https://srpgstudioserver.azurewebsites.net/rest/connect/create", false);
		this._http.send('');
		
	},
	
	moveCommand: function() {
	
    	this.connecting = true;

		//root.log(this._http.readyState);
			if(this._http.readyState == 4){
    			//root.log("Response code: " + this._http.status);
    			//root.log(this._http.responseText)
    			Eval.setGlobal(this._http.responseText)
    		}
        	
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === NewGameMode.BLACKOUT) {
			result = this._moveBlackOut();
		}
		else if (mode === NewGameMode.FLOW) {
			result = this._moveFlow();
		}
		
		return result;
	},

	getCommandName: function() {
		if(!this.connecting)
			return 'Create Room';
		else
			return 'Connecting...';
	},

	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === NewGameMode.BLACKOUT) {
			this._drawBlackOut();
		}
		else if (mode === NewGameMode.FLOW) {
			this._drawFlow();
		}
	},
	
	isSelectable: function() {
		return true;
	},
	
	_createSubObject: function() {
		this._transition = createObject(FadeTransition);
		this._transition.setDestOut();
		this._transition.setFadeSpeed(5);
		
		this._straightFlow = createObject(StraightFlow);
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
	},
	
	_moveBlackOut: function() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			if (!this._changeFlow()) {
				this._doEndAction();
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveFlow: function() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawBlackOut: function() {
		this._transition.drawTransition();
	},
	
	_drawFlow: function() {
		this._straightFlow.drawStraightFlow();
	},
	
	_changeFlow: function() {
		if (this._straightFlow.enterStraightFlow() === EnterResult.NOTENTER) {
			return false;
		}
		
		this.changeCycleMode(NewGameMode.FLOW);
		
		return true;
	},
	
	_doEndAction: function() {
		MediaControl.resetMusicList();
		
		// If this method is called, root.changeScene(SceneType.BATTLESETUP) is called inside.
		root.getSceneController().newGame();
	},
	
	_pushFlowEntries: function(straightFlow) {
		straightFlow.pushFlowEntry(MultiplayerCreationFlowEntry);
		straightFlow.pushFlowEntry(ClearPointFlowEntry);
	},

	createHTTPObject: function() {
		this._http = new ActiveXObject("Msxml2.XMLHTTP.6.0");
	}
}
);


var alias1 = TitleScene._configureTitleItem;
TitleScene._configureTitleItem = function(groupArray) {
	alias1.call(this, groupArray);
	
	groupArray.insertObject(TitleCommand.CreateRoom, 2);
	groupArray.insertObject(TitleCommand.JoinRoom, 3);
	//groupArray.insertObject(TitleCommand.UploadFile, 4);
	//groupArray.insertObject(TitleCommand.DownloadFile, 5);
	
};


var MultiplayerCreationFlowEntry = defineObject(BaseFlowEntry,
{
	_messageAnalyzer: null,
	_scrollbar: null,
	_difficultyIndex: 0,
	_difficultyArray: null,
	_roomNo: null,
	_activate: "N",
	
	enterFlowEntry: function(newGameCommand) {
		this._prepareMemberData(newGameCommand);
		
		return this._completeMemberData(newGameCommand);
	},
	
	moveFlowEntry: function() {
		var input = this._scrollbar.moveInput();
		
		
		if (input === ScrollbarInput.SELECT) {

			var id = root.getMetaSession().global.multiplayerID;
			var http = new ActiveXObject("Msxml2.XMLHTTP.6.0")
			http.open('GET', "https://srpgstudioserver.azurewebsites.net/rest/connect/checkPlayerJoined?id=" + id, false);
			http.send('');


 
    		if(http.readyState == 4){
    			root.log(http.responseText)
    			this._activate = http.responseText;
    			delete http;
    		}      
    		root.log("Current status: " + this._activate)
    		if(this._activate == "Y"){
    			root.log("Passed")	
				this._startSession(0);
				root.getMetaSession().getVariableTable(4).setVariable(1, id);	
				root.getMetaSession().getVariableTable(4).setVariable(0, 0);	
				root.log("Current Player ID: " + root.getMetaSession().getVariableTable(4).getVariable(0))	
				return MoveResult.END;
				
				}


				return MoveResult.CONTINUE;
		}

		

		/*
		else if (input === ScrollbarInput.NONE) {
			this._checkIndexAndText();
		}*/

		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		var pic  = this.getWindowTextUI().getUIImage();
		var width = this._getWindowWidth();
		var height = this._getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		root.getGraphicsManager().fill(0x0);
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += DefineControl.getWindowXPadding();
		y += DefineControl.getWindowYPadding();
		this._drawContent(x, y);
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('single_window');
	},
	
	_prepareMemberData: function(newGameCommand) {
		this._scrollbar = createScrollbarObject(MultiplayerScrollbar, this);
		this._createMessageAnalyzer();
		this._createDifficultyArray();
	},
	
	_completeMemberData: function(newGameCommand) {
		this._setScrollbarData();
		this._checkIndexAndText();
		
		return EnterResult.OK;
	},
	
	_isDifficultyEnabled: function() {
		// If the several difficulties exist, it can be selected.
		return this._difficultyArray.length > 1;
	},
	
	_startSession: function(index) {
		var difficulty = this._difficultyArray[index];
		
		root.getSceneController().initializeMetaSession(this._difficultyArray[0]);
	},
	
	_getWindowWidth: function() {
		return 450;
	},
	
	_getWindowHeight: function() {
		return 200;
	},
	
	_createMessageAnalyzer: function() {
		//var messageAnalyzerParam = this._createMessageAnalyzerParam();
		
		//this._messageAnalyzer = createObject(MessageAnalyzer);
		//this._messageAnalyzer.setMessageAnalyzerParam(messageAnalyzerParam);
		//this._messageAnalyzer.setMaxRowCount(3);
	},
	
	_createMessageAnalyzerParam: function() {
		var textui = this.getWindowTextUI();
		var messageAnalyzerParam = StructureBuilder.buildMessageAnalyzerParam();
		
		messageAnalyzerParam.color = ColorValue.INFO;
		messageAnalyzerParam.font = textui.getFont();
		messageAnalyzerParam.messageSpeedType = SpeedType.DIRECT;
		
		return messageAnalyzerParam;
	},
	
	_createDifficultyArray: function() {
		var i, difficulty;
		var list = root.getBaseData().getDifficultyList();
		var count = list.getCount();
		
		this._difficultyArray = [];
		this._roomNo = [];

		var id =  root.getMetaSession().global.multiplayerID;
		for (i = 0; i < count; i++) {
			difficulty = list.getData(i);
			if (difficulty.isGlobalSwitchOn()) {
				this._difficultyArray.push(difficulty);
			}
		}
		
		if (this._difficultyArray.length === 0) {
			difficulty = list.getData(0);
			this._difficultyArray.push(difficulty);
		}

		this._roomNo.push("Check Other Player");


	},
	
	_setScrollbarData: function() {
		var max = this._getVisibleCount();
		var count = this._difficultyArray.length;
		
		if (count > max) {
			count = max;
		}
		
		this._scrollbar.setScrollFormation(1, 1);
		this._scrollbar.setObjectArray(this._roomNo);
		this._scrollbar.setActive(true);
	},
	
	_checkIndexAndText: function() {
		var text;
	},
	
	_drawContent: function(x, y) {
		this._drawTitleArea(x, y);
		this._drawDifficultyArea(x, y);
		this._drawDivisionLine(x, y);
		this._drawDescriptionArea(x, y);
		var id =  root.getMetaSession().global.multiplayerID;
		

	},
	
	_drawTitleArea: function(x, y) {
		var range;
		var text = this._getSelectMessage();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var id =  root.getMetaSession().global.multiplayerID;
	
		range = createRangeObject(x - 16, y, this._getWindowWidth(), 23);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text + id, -1, color, font);
	},
	
	_drawDifficultyArea: function(x, y) {
		var width = this._getWindowWidth() - this._scrollbar.getScrollbarWidth();
		var dx = Math.floor(width / 2) - DefineControl.getWindowXPadding();
		
		this._scrollbar.drawScrollbar(x + dx, y + 50);
	},
	
	_drawDescriptionArea: function(x, y) {
		y += 50;
		y += this._scrollbar.getScrollbarHeight() + 10;
		
		//this._messageAnalyzer.drawMessageAnalyzer(x, y, -1, -1, null);
	},
	
	_drawDivisionLine: function(x, y) {
		var textui = root.queryTextUI('description_title');
		var pic = textui.getUIImage();
		var count = Math.floor(this._getWindowWidth() / 30) - 3;
		
		TitleRenderer.drawTitle(pic, x, y, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), count);
	},
	
	_getSelectMessage: function() {
		return "Room Number: ";
	},
	
	_getVisibleCount: function() {
		return 4;
	}
}
);

var MultiplayerScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var range;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		
		range = createRangeObject(x, y + 20, length, this.getObjectHeight());
		this._drawRange(range, isSelect, index);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, object, length, color, font);
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	playCancelSound: function() {
	},
	
	getObjectWidth: function() {
		return DefineControl.getTextPartsWidth() - 32;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_drawRange: function(range, isSelect, index) {
		// root.getGraphicsManager().fillRange(range.x, range.y, range.width, range.height, 0xffffff - (index * 8000), 128);
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);

