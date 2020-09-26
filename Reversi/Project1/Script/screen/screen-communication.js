
var CommunicationMode = {
	TOP: 0,
	EVENT: 1
};

var CommunicationScreen = defineObject(BaseScreen,
{
	_scrollbar: null,
	_capsuleEvent: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === CommunicationMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === CommunicationMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var pic  = this.getWindowTextUI().getUIImage();
		var width = this._scrollbar.getScrollbarWidth() + (DefineControl.getWindowXPadding() * 2);
		var height = this._scrollbar.getScrollbarHeight() + (DefineControl.getWindowYPadding() * 2);
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		// Display the window always to remove the strange feeling when getting the screen back to the map.
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		if (this._scrollbar.getObjectCount() === 0) {
			this._drawNoDataText(x, y, width, height);
		}
		else {
			this._scrollbar.drawScrollbar(x + DefineControl.getWindowXPadding(), y + DefineControl.getWindowYPadding());
		}
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Communication');
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	getCommunicationEventType: function(object) {
		var info;
		
		if (root.getBaseScene() === SceneType.REST) {
			info = object.event.getRestEventInfo();
		}
		else {
			info = object.event.getCommunicationEventInfo();
		}
		
		return info.getCommunicationEventType();
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._scrollbar = createScrollbarObject(CommunicationScrollbar, this);
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeScreenMemberData: function(screenParam) {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
		
		this._rebuildCommunicationEventList();
		
		this.changeCycleMode(CommunicationMode.TOP);
	},
	
	_rebuildCommunicationEventList: function() {
		var i, count, data, entry;
		var arr = EventCommonArray.createArray(root.getCurrentSession().getCommunicationEventList(), EventType.COMMUNICATION);
		var indexPrev = this._scrollbar.getIndex();
		var countPrev = this._scrollbar.getObjectCount();
		var xScrollPrev = this._scrollbar.getScrollXValue();
		var yScrollPrev = this._scrollbar.getScrollYValue();
		
		this._scrollbar.resetScrollData();
		
		// After executing the event, there is a possibility that another event may be displayed/not displayed, so rebuild it.
		count = arr.length;
		for (i = 0; i < count; i++) {
			data = arr[i];
			if (this._isEvent(data)) {
				entry = {};
				entry.event = data;
				entry.isLock = false;
				this._scrollbar.objectSet(entry);
			}
		}
		
		this._scrollbar.objectSetEnd();
		
		count = this._scrollbar.getObjectCount();
		if (count === countPrev) {
			// Get the scroll position back.
			this._scrollbar.setScrollXValue(xScrollPrev);
			this._scrollbar.setScrollYValue(yScrollPrev);
		}
		else if (indexPrev >= count) {
			this._scrollbar.setIndex(0);
		}
		else {
			this._scrollbar.setIndex(indexPrev);
		}
	},
	
	_moveTop: function() {
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			this._startEvent();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this._endCommunicationEvent();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawNoDataText: function(x, y, width, height) {
		var range;
		var text = StringTable.Communication_NoData;
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		range = createRangeObject(x, y, width, height);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
	},
	
	_startEvent: function() {
		var type, entry;
		var isExecuteMark = true;
		
		entry = this._scrollbar.getObject();
		if (entry === null) {
			return;
		}
		
		// If the event has already been executed, don't continue.
		if (entry.event.getExecutedMark() === EventExecutedType.EXECUTED) {
			return;
		}	
		
		// Initialize it so that the event name can be grayish after the event ends.
		entry.isLock = true;
		
		type = this.getCommunicationEventType(entry);
		if (type === CommunicationEventType.INFORMATION) {
			// If a type is "Information", the "Executed" is not recorded.
			isExecuteMark = false;
		}			
		this._capsuleEvent.enterCapsuleEvent(entry.event, isExecuteMark);
		
		this.changeCycleMode(CommunicationMode.EVENT);
	},
	
	_endCommunicationEvent: function() {
		// There is a possibility that new event may occur by which the event changed a switch etc.,
		// so update a list.
		this._rebuildCommunicationEventList();
		this.changeCycleMode(CommunicationMode.TOP);
	},
	
	_isEvent: function(event) {
		return event.isEvent();
	}
}
);

var CommunicationScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawName(x, y, object, isSelect, index);
		this._drawIcon(x, y, object, isSelect, index);
	},
	
	playSelectSound: function() {
		var object = this.getObject();
		var isSelect = this._isSelectable(object);
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	},
	
	getObjectWidth: function() {
		return 400;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_drawName: function(x, y, object, isSelect, index) {
		var textui = this.getParentTextUI();
		var color = this._getEventColor(object, textui);
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, object.event.getName(), -1, color, font);
	},
	
	_drawIcon: function(x, y, object, isSelect, index) {
		var handle = this._getIconResourceHandle(object);
		
		if (handle.isNullHandle()) {
			return;
		}
		
		x += this.getObjectWidth() - (GraphicsFormat.ICON_WIDTH * 2);
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
	},
	
	_getIconResourceHandle: function(object) {
		var text, type;
		var handle = object.event.getIconResourceHandle();
		
		if (!handle.isNullHandle()) {
			return handle;
		}
		
		type = this.getParentInstance().getCommunicationEventType(object);
		if (type === CommunicationEventType.INFORMATION) {
			text = 'infoicon';
		}
		else if (type === CommunicationEventType.TALK) {
			text = 'talkicon';
		}
		else if (type === CommunicationEventType.TROPHY) {
			text = 'trophyicon';
		}
		else if (type === CommunicationEventType.UNIT) {
			text = 'uniticon';
		}
		else if (type === CommunicationEventType.PRIVATE) {
			text = 'privateicon';
		}
		else {
			return root.createEmptyHandle();
		}
		
		return root.queryGraphicsHandle(text);
	},
	
	_getEventColor: function(object, textui) {
		var color;
		
		if (object.isLock || this._isSelectable(object)) {
			color = textui.getColor();
		}
		else {
			color = ColorValue.DISABLE;
		}
		
		return color;
	},
	
	_isSelectable: function(object) {
		if (object === null || object.event === null) {
			return false;
		}
		
		// If the event is not executed, choices are possible.
		return object.event.getExecutedMark() === EventExecutedType.FREE;
	}
}
);
