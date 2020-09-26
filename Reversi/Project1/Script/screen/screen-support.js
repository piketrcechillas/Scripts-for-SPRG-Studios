
var SupportScreenMode = {
	SENDER: 0,
	RECIVER: 1
};

var SupportDataSize = {
	HEIGHT: 56
};

// This screen is displayed when "Display the memories screen as a Unit Icon List" is enabled in the game option.

var SupportScreen = defineObject(BaseScreen,
{
	_senderWindow: null,
	_receiverWindow: null,
	_descriptionChanger: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === SupportScreenMode.SENDER) {
			result = this._moveSender();
		}
		else if (mode === SupportScreenMode.RECIVER) {
			result = this._moveReciver();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var width = this._senderWindow.getWindowWidth() + this._receiverWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._senderWindow.getWindowHeight());
		
		this._senderWindow.drawWindow(x, y);
		this._receiverWindow.drawWindow(x + this._senderWindow.getWindowWidth(), y);
	},
	
	drawScreenTopText: function(textui) {
		TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
	},
	
	drawScreenBottomText: function(textui) {
		var entity, scrollbar, event;
		var text = '';
		
		if (this.getCycleMode() === SupportScreenMode.RECIVER) {
			entity = this._receiverWindow.getEntity();
			scrollbar = entity.getSubScrollbar();
			event = scrollbar.getObject();
			
			if (scrollbar.isEventEnabled(event)) {
				text = event.getDescription();
			}
		}
		
		this._descriptionChanger.drawBottomDescriptionEx(textui, text);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('SupportList');
	},
	
	getExtraDisplayName: function() {
		return this.getScreenTitleName();
	},
	
	getExtraDescription: function() {
		return StringTable.Extra_Recollection;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._senderWindow = createWindowObject(SupportSenderWindow, this);
		this._receiverWindow = createWindowObject(SupportReciverWindow, this);
		this._descriptionChanger = createObject(DescriptionChanger);
	},
	
	_completeScreenMemberData: function(screenParam) {
		var receiverArray = SupportReciverBuilder.createArray();
		var senderArray = SupportSenderBuilder.createArray(receiverArray);
		
		this._receiverWindow.setWindowData();
		
		this._senderWindow.setWindowData();
		this._senderWindow.setSenderArray(senderArray);
		this._senderWindow.enableSelectCursor(true);
		
		this._receiverWindow.changeReciverList(this._senderWindow.getSender());
		this.changeCycleMode(SupportScreenMode.SENDER);
		
		this._descriptionChanger.setDescriptionData();
	},
	
	_moveSender: function() {
		var input = this._senderWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startReciverMode();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			if (this._senderWindow.isIndexChanged()) {
				this._receiverWindow.changeReciverList(this._senderWindow.getSender());
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveReciver: function() {
		var result = this._receiverWindow.moveWindow();
		
		if (result !== MoveResult.CONTINUE) {
			this._returnSenderMode();
			return MoveResult.CONTINUE;
		}
	
		return MoveResult.CONTINUE;
	},
	
	_startReciverMode: function() {
		var entity = this._receiverWindow.getEntity();
		var sender = this._senderWindow.getSender();
		
		if (!sender.isEnabled) {
			// If isEnabled is false, it means that the unit has never belonged to the player even once.
			// If so, suppose that it cannot select and don't continue to process.
			this._playOperationBlockSound();
			return;
		}
		
		entity.startReciverEntity(true);
		this._senderWindow.enableSelectCursor(false);
		this.changeCycleMode(SupportScreenMode.RECIVER);
	},
	
	_returnSenderMode: function() {
		var entity = this._receiverWindow.getEntity();
		
		entity.startReciverEntity(false);
		this._senderWindow.enableSelectCursor(true);
		this.changeCycleMode(SupportScreenMode.SENDER);
	},
	
	_playOperationBlockSound: function() {
		MediaControl.soundDirect('operationblock');
	}
}
);

var SupportReciverWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(SupportDataSize.HEIGHT, 7);
		
		this._scrollbar = createScrollbarObject(SupportReciverScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
	},
	
	changeReciverList: function(sender) {
		var i, entity, count;
		var arr = [];
		
		if (sender === null || !sender.isEnabled) {
			// If the unit has never belonged to the player,
			// the collaborator who the unit can support is also not displayed.
			this._scrollbar.setObjectArray([]);
			return;
		}
		
		count = sender.receiverArray.length;
		for (i = 0; i < count; i++) {
			entity = createObject(SupportReciverEntity);
			arr.push(entity);
			entity.setParentData(sender.unit, sender.receiverArray[i], this);
		}
		
		this._scrollbar.setObjectArray(arr);
	},
	
	moveWindowContent: function() {
		var object;
		var result = MoveResult.CONTINUE;
		
		object = this._scrollbar.getObject();
		if (object.getCycleMode() !== SupportReciverEntityMode.SELECT) {
			result = object.moveReciverEntity();
			// If the confirmation message etc. is displayed, to disable to input up/down, don't continue to process.
			return result;
		}
		
		if (InputControl.isCancelAction()) {
			this._playCancelSound();
			result = MoveResult.END;
		}
		else if (InputControl.isInputState(InputType.UP) || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			this._moveUpDown();
		}
		else if (InputControl.isInputState(InputType.DOWN) || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			this._moveUpDown();
		}
		else {
			this._checkTracingScrollbar();
			
			object = this._scrollbar.getObject();
			result = object.moveReciverEntity();
		}
		
		this._scrollbar.getEdgeCursor().moveCursor();
		MouseControl.checkScrollbarEdgeAction(this._scrollbar);
		
		return result;
	},
	
	getEntity: function() {
		return this._scrollbar.getObject();
	},
	
	drawWindowContent: function(x, y) {
		var object;
		
		this._scrollbar.drawScrollbar(x, y);
		
		object = this._scrollbar.getObject();
		if (object !== null) {
			object.drawActiveReciverEntity();
		}
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('supportlist_window');
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	_moveUpDown: function() {
		var object = this._scrollbar.getObject();
		
		object.getSubScrollbar().setActiveSingle(false);
		this._scrollbar.moveScrollbarCursor();
		
		object = this._scrollbar.getObject();
		object.getSubScrollbar().setActiveSingle(true);
	},
	
	_checkTracingScrollbar: function() {
		var object;
		var objectPrev = this._scrollbar.getObject();
		
		if (MouseControl.moveScrollbarMouse(this._scrollbar)) {
			objectPrev.getSubScrollbar().setActiveSingle(false);
			object = this._scrollbar.getObject();
			object.getSubScrollbar().setActiveSingle(true);
			
			MouseControl.moveScrollbarMouse(object.getSubScrollbar());
		}
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	}
}
);

var SupportReciverScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		object.drawReciverEntity(x, y, index === this.getIndex());
	},
	
	drawCursor: function(x, y, isActive) {
	},
	
	getObjectWidth: function() {
		return 340;
	},
	
	getObjectHeight: function() {
		return SupportDataSize.HEIGHT;
	},
	
	getDescriptionTextUI: function() {
		return root.queryTextUI('extraexplanation_title');
	}
}
);

var SupportReciverEntityMode = {
	SELECT: 0,
	QUESTION: 1,
	EVENT: 2
};

var SupportReciverEntity = defineObject(BaseObject,
{
	_senderUnit: null,
	_receiver: null,
	_scrollbar: null,
	_capsuleEvent: null,
	_questionWindow: null,
	_parentWindow: null,
	
	setParentData: function(senderUnit, receiver, parentWindow) {
		this._senderUnit = senderUnit;
		this._receiver = receiver;
		
		this._scrollbar = createScrollbarObject(SupportRankScrollbar, this);
		// Row is fixed at 1. Because SupportReciverWindow detects up and down keys.
		this._scrollbar.setScrollFormation(this._getMaxCol(), 1);
		this._scrollbar.setObjectArray(receiver.eventArray);
		
		this._questionWindow = createScrollbarObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(this._getQuestionMessage());
		
		this._parentWindow = parentWindow;
		
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	startReciverEntity: function(isStart) {
		// It's not enableSelectCursor.
		this._scrollbar.setActive(isStart);
		this.changeCycleMode(SupportReciverEntityMode.SELECT);
	},
	
	moveReciverEntity: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === SupportReciverEntityMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === SupportReciverEntityMode.QUESTION) {
			result = this._moveQuestion();
		}
		else if (mode === SupportReciverEntityMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	},
	
	drawReciverEntity: function(x, y, isActive) {
		this._drawCharChip(x, y, isActive);
		this._drawRank(x, y, isActive);
		this._drawName(x, y, isActive);
	},
	
	drawActiveReciverEntity: function() {
		if (this.getCycleMode() === SupportReciverEntityMode.QUESTION) {
			this._drawQuestion();
		}
	},
	
	getSubScrollbar: function() {
		return this._scrollbar;
	},
	
	_moveSelect: function() {
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			if (this._scrollbar.isEventEnabled(this._scrollbar.getObject())) {
				this._capsuleEvent.enterCapsuleEvent(this._scrollbar.getObject(), true);
				this.changeCycleMode(SupportReciverEntityMode.EVENT);
			}
			else {
				if (this._isQuestion()) {
					this._scrollbar.enableSelectCursor(false);
					this._questionWindow.setQuestionActive(true);
					this.changeCycleMode(SupportReciverEntityMode.QUESTION);
				}
				else {
					this._playOperationBlockSound();
				}
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._scrollbar.setForceSelect(-1);
			this._scrollbar.setActive(false);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveQuestion: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._doQuestionEndAction();
				this._capsuleEvent.enterCapsuleEvent(this._scrollbar.getObject(), true);
				this.changeCycleMode(SupportReciverEntityMode.EVENT);
			}
			else {
				this._questionWindow.setQuestionActive(false);
				this._scrollbar.enableSelectCursor(true);
				this.changeCycleMode(SupportReciverEntityMode.SELECT);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this._scrollbar.enableSelectCursor(true);
			this.changeCycleMode(SupportReciverEntityMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawCharChip: function(x, y, isActive) {
		var unit = this._getUnit();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var alpha = this._receiver.isEnabled ? 255 : 128;
		
		unitRenderParam.alpha = alpha;
		UnitRenderer.drawDefaultUnit(unit, x + 10, y + 10, unitRenderParam);
	},
	
	_drawName: function(x, y, isActive) {
		var length = 150;
		var textui = this._parentWindow.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var unit = this._getUnit();
		var name = this._receiver.isEnabled ? unit.getName() : StringTable.HideData_Question;
		
		TextRenderer.drawKeywordText(x + 220, y + 18, name, length, color, font);
	},
	
	_drawRank: function(x, y, isActive) {
		x += 65;
		this._drawRankTitle(x, y - 3, '');
		this._scrollbar.drawScrollbar(x + 31, y + 15);
	},
	
	_drawRankTitle: function(x, y, title) {
		var textui = this._getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		TextRenderer.drawFixedTitleText(x, y, title, color, font, TextFormat.LEFT, pic, this._getTitlePartsCount());
	},
	
	_getTextUI: function(x, y, title) {
		return root.queryTextUI('supportrank_title');
	},
	
	_drawQuestion: function() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	},
	
	_getUnit: function() {
		if (this._senderUnit.getId() === this._receiver.unit1.getId()) {
			return this._receiver.unit2;
		}
		
		return this._receiver.unit1;
	},
	
	_getMaxCol: function() {
		return SupportReciverBuilder.getMaxRank();
	},
	
	_getTitlePartsCount: function() {
		return 3;
	},
	
	_playOperationBlockSound: function() {
		MediaControl.soundDirect('operationblock');
	},
	
	_isQuestion: function() {
		// If it's not SceneType.TITLE, use some cost to leave some space to view the event.
		return false;
	},
	
	_getQuestionMessage: function() {
		return '';
	},
	
	_doQuestionEndAction: function() {
	}
}
);

var SupportRankScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var alpha = this.isEventEnabled(object) ? 255 : 128;
		var colorIndex = 0;
		
		NumberRenderer.drawNumberColor(x, y, index + 1, colorIndex, alpha);
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	getObjectWidth: function() {
		var width = 38;
		
		if (this._col === 4) {
			width = 26;
		}
		else if (this._col === 5) {
			width = 19;
		}
		
		return width;
	},
	
	getObjectHeight: function() {
		return 24;
	},
	
	isEventEnabled: function(event) {
		return root.getStoryPreference().isTestPlayPublic() || event.getExecutedMark() === EventExecutedType.EXECUTED;
	}
}
);

var SupportSenderWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(SupportDataSize.HEIGHT, 7);
		
		this._scrollbar = createScrollbarObject(SupportSenderScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
	},
	
	setSenderArray: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('supportlist_window');
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	getListIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	getSender: function() {
		return this._scrollbar.getObject();
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}
);

var SupportSenderScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var length = this._getTextLength() - 40;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var unit = object.unit;
		var alpha = 255;
		var name = unit.getName();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		
		if (!object.isEnabled) {
			name = StringTable.HideData_Question;
			alpha = 0;
		}
		
		unitRenderParam.alpha = alpha;
		UnitRenderer.drawDefaultUnit(unit, x + 10, y + 10, unitRenderParam);
		y += 20;
		x += 60;
		
		TextRenderer.drawKeywordText(x, y, name, length, color, font);
	},
	
	getDescriptionTextUI: function() {
		return root.queryTextUI('extraexplanation_title');
	},
	
	getObjectWidth: function() {
		var width = DefineControl.getTextPartsWidth() + 32;
		
		return DataConfig.isHighResolution() ? width + 16 : width;
	},
	
	getObjectHeight: function() {
		return SupportDataSize.HEIGHT;
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);

var SupportReciverBuilder = {
	_maxRank: 0,
	
	createArray: function() {
		var i, event, info, unit1, unit2, rank, receiver;
		var list = root.getBaseData().getRecollectionEventList();
		var count = list.getCount();
		var receiverArray = [];
		
		// Build the recollection event as an array of receiver.
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			info = event.getRecollectionEventInfo();
			unit1 = info.getFirstUnit();
			unit2 = info.getSecondUnit();
			rank = info.getRank();
			
			receiver = this._getReciver(unit1, unit2, receiverArray);
			if (receiver !== null) {
				// The receiver, which has used both unit1 and unit2, has already been created, so update only rank and event.
				receiver.rankArray.push(rank);
				receiver.eventArray.push(event);
			}
			else {
				receiver = {};
				receiver.isEnabled = false;
				receiver.unit1 = unit1;
				receiver.unit2 = unit2;
				receiver.rankArray = [];
				receiver.rankArray.push(rank);
				receiver.eventArray = [];
				receiver.eventArray.push(event);
				receiverArray.push(receiver);
			}
			
			if (this._maxRank < rank) {
				this._maxRank = rank;
			}
		}
		
		this._checkEvent(receiverArray);
		
		return receiverArray;
	},
	
	getMaxRank: function() {
		if (this._maxRank > 5) {
			return 5;
		}
		
		if (this._maxRank < 3) {
			return 3;
		}
		
		return this._maxRank;
	},

	_getReciver: function(unit1, unit2, receiverArray) {
		var i, receiver;
		var count = receiverArray.length;

		for (i = 0; i < count; i++) {
			receiver = receiverArray[i];
			if (this._compareUnit(receiver.unit1, unit1) && this._compareUnit(receiver.unit2, unit2)) {
				return receiver;
			}
			if (this._compareUnit(receiver.unit1, unit2) && this._compareUnit(receiver.unit2, unit1)) {
				return receiver;
			}
		}

		return null;
	},
	
	_checkEvent: function(receiverArray) {
		var i, receiver;
		var count = receiverArray.length;
		
		for (i = 0; i < count; i++) {
			receiver = receiverArray[i];
			if (SupportUnitChecker.isRegistered(receiver.unit1) && SupportUnitChecker.isRegistered(receiver.unit2)) {
				receiver.isEnabled = true;
			}
		}
	},
	
	_compareUnit: function(unit1, unit2) {
		if (unit1 === null || unit2 === null) {
			return false;
		}
		
		return unit1.getId() === unit2.getId();
	}
};

var SupportSenderBuilder = {
	createArray: function(receiverArray) {
		var i, unit, sender;
		var senderArray = [];
		var list = this._getPlayerList();
		var count = list.getCount();
		
		// Build the unit as an array of sender.
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			// Check if there's something including the unit for  "Unit1" or "Unit2" of all recollection events.
			if (!this._checkUnit(unit, receiverArray)) {
				// There is no recollection event in associated with the unit, the unit is not included in the list.
				continue;
			}
			
			sender = {};
			sender.unit = unit;
			sender.receiverArray = [];
			senderArray.push(sender);
			
			// Specify the element in associated with the sender from receiverArray, and record it in sender.receiverArray.
			this._checkReciverArray(sender, receiverArray);
			
			sender.isEnabled = this._isSenderEnabled(sender);
		}
		
		return senderArray;
	},
	
	_checkReciverArray: function(sender, receiverArray) {
		var i, receiver;
		var count = receiverArray.length;
		
		for (i = 0; i < count; i++) {
			receiver = receiverArray[i];
			if (this._compareUnit(sender.unit, receiver.unit1) || this._compareUnit(sender.unit, receiver.unit2)) {
				sender.receiverArray.push(receiver);
			}
		}
	},
	
	_checkUnit: function(unit, receiverArray) {
		var i, receiver;
		var count = receiverArray.length;
		
		for (i = 0; i < count; i++) {
			receiver = receiverArray[i];
			if (this._compareUnit(unit, receiver.unit1) || this._compareUnit(unit, receiver.unit2)) {
				return true;
			}
		}
		
		return false;
	},
	
	_isSenderEnabled: function(sender) {
		if (root.getBaseScene() === SceneType.TITLE) {
			// Check if the unit is registered at the environment file.
			// If it's not SceneType.TITLE, the unit belongs to the player, so return true without condition.
			if (!SupportUnitChecker.isRegistered(sender.unit)) {
				return false;
			}
		}
		
		return true;
	},
	
	_compareUnit: function(unit1, unit2) {
		if (unit1 === null || unit2 === null) {
			return false;
		}
		
		return unit1.getId() === unit2.getId();
	},
	
	_getPlayerList: function() {
		return root.getBaseScene() === SceneType.TITLE ? root.getBaseData().getPlayerList() : PlayerList.getMainList();
	}
};

var SupportUnitChecker = {
	isRegistered: function(unit) {
		return root.getStoryPreference().isTestPlayPublic() || root.getExternalData().isUnitRegistered(unit);
	}
};
