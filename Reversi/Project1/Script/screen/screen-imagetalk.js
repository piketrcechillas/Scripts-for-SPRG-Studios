
var ImageTalkMode = {
	AUTOEVENTCHECK: 0,
	SELECT: 1,
	EVENT: 2
};

var ImageTalkScreen = defineObject(BaseScreen,
{
	_eventChecker: null,
	_imageTalkWindow: null,
	_capsuleEvent: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ImageTalkMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === ImageTalkMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === ImageTalkMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		if (root.getRestPreference().isTalkGraphicsEnabled()) {
			this._drawTalkImage();
			this._drawBottomWindow();
		}
		else {
			this._drawCenterWindow();
		}
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('ImageTalk');
	},
	
	_drawCenterWindow: function() {
		var x = LayoutControl.getCenterX(-1, this._imageTalkWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._imageTalkWindow.getWindowHeight());
		
		this._imageTalkWindow.drawWindow(x, y);
	},
	
	_drawBottomWindow: function() {
		var x = LayoutControl.getCenterX(-1, this._imageTalkWindow.getWindowWidth());
		var height = root.getGameAreaHeight();
		var dy = Math.floor(height * 0.125);
		var y = height - this._imageTalkWindow.getWindowHeight() - dy;
		
		this._imageTalkWindow.drawWindow(x, y);
	},
	
	_drawTalkImage: function() {
		var info, x, y, pos;
		var image = null;
		var entry = this._imageTalkWindow.getChildScrollbar().getObject();
		
		if (entry === null) {
			return;
		}
		
		info = entry.event.getRestEventInfo();
		image = info.getTalkImage();
		if (image === null) {
			return;
		}
		
		x = this._getIllustX(image);
		
		pos = info.getPos();
		if (pos === MessagePos.TOP) {
			y = this._getIllustTopY(image);
		}
		else if (pos === MessagePos.CENTER) {
			y = this._getIllustCenterY(image);
		}
		else {
			y = this._getIllustBottomY(image);
		}
		
		image.draw(x, y);
	},
	
	_getIllustX: function(image) {
		return LayoutControl.getCenterX(-1, image.getWidth());
	},
	
	_getIllustTopY: function(image) {
		return 60;
	},
	
	_getIllustCenterY: function(image) {
		return LayoutControl.getCenterY(-1, image.getHeight());
	},
	
	_getIllustBottomY: function(image) {
		var height = root.getGameAreaHeight();
		var y = Math.floor(height * 0.165);
		
		return y;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._eventChecker = createObject(RestAutoEventChecker);
		this._imageTalkWindow = createWindowObject(ImageTalkWindow, this);
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._imageTalkWindow.setWindowData(this._getEventList());
		this._rebuildTalkEventList();
		this._changeEventMode();
	},
	
	_rebuildTalkEventList: function() {
		var i, count, data, entry;
		var list = this._getEventList();
		var scrollbar = this._imageTalkWindow.getChildScrollbar();
		var indexPrev = scrollbar.getIndex();
		var countPrev = scrollbar.getObjectCount();
		var xScrollPrev = scrollbar.getScrollXValue();
		var yScrollPrev = scrollbar.getScrollYValue();
		
		scrollbar.resetScrollData();
		
		// After executing the event, there is a possibility that another event may be displayed/not displayed, so rebuild it.
		count = list.getCount();
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (this._isEvent(data)) {
				entry = {};
				entry.event = data;
				entry.isLock = false;
				scrollbar.objectSet(entry);
			}
		}
		
		scrollbar.objectSetEnd();
		
		count = scrollbar.getObjectCount();
		if (count === countPrev) {
			// Get the scroll position back.
			scrollbar.setScrollXValue(xScrollPrev);
			scrollbar.setScrollYValue(yScrollPrev);
		}
		else if (indexPrev >= count) {
			scrollbar.setIndex(0);
		}
		else {
			scrollbar.setIndex(indexPrev);
		}
	},
	
	_moveAutoEventCheck: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ImageTalkMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveSelect: function() {
		var input = this._imageTalkWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startTalkEvent();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this._endTalkEvent();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_startTalkEvent: function() {
		var entry;
		var isExecuteMark = true;
		
		entry = this._imageTalkWindow.getChildScrollbar().getObject();
		if (entry === null) {
			return;
		}
		
		// If the event has already been executed, don't continue.
		if (entry.event.getExecutedMark() === EventExecutedType.EXECUTED) {
			return;
		}	
		
		// Initialize it so that the event name can be grayish after the event ends.
		entry.isLock = true;
		
		this._capsuleEvent.enterCapsuleEvent(entry.event, isExecuteMark);
		
		this.changeCycleMode(ImageTalkMode.EVENT);
	},
	
	_endTalkEvent: function() {
		this._rebuildTalkEventList();
		this.changeCycleMode(ImageTalkMode.SELECT);
	},
	
	_getEventList: function() {
		return root.getCurrentSession().getTalkEventList();
	},
	
	_isEvent: function(event) {
		return event.isEvent();
	},
	
	_changeEventMode: function() {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), RestAutoType.TALK);
		if (result === EnterResult.NOTENTER) {
			this.changeCycleMode(ImageTalkMode.SELECT);
		}
		else {
			this.changeCycleMode(ImageTalkMode.AUTOEVENTCHECK);
		}
	}
}
);

var ImageTalkWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function(eventList) {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 4);
		
		this._scrollbar = createScrollbarObject(ImageTalkScrollbar, this);
		this._scrollbar.checkIcon(eventList);
		this._scrollbar.setScrollFormation(3, count);
		this._scrollbar.setActive(true);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
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
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}
);

var ImageTalkScrollbar = defineObject(BaseScrollbar,
{
	_isIconVisible: false,
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawName(x, y, object, isSelect, index);
	},
	
	checkIcon: function(eventList) {
		var i, event;
		var count = eventList.getCount();
		
		for (i = 0; i < count; i++) {
			event = eventList.getData(i);
			if (!event.getIconResourceHandle().isNullHandle()) {
				this._isIconVisible = true;
				return;
			}
		}
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
		var dx = this._isIconVisible ? GraphicsFormat.ICON_WIDTH + 5 : 0;
		return DefineControl.getTextPartsWidth() + dx;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_drawName: function(x, y, object, isSelect, index) {
		var format, handle;
		var textui = this.getParentTextUI();
		var color = this._getEventColor(object, textui);
		var font = textui.getFont();
		var alpha = 255;
		var length = this.getObjectWidth();
		var range = createRangeObject(x, y + 0, this.getObjectWidth(), this.getObjectHeight());
		
		if (this._isIconVisible) {
			handle = object.event.getIconResourceHandle();
			if (!handle.isNullHandle()) {
				GraphicsRenderer.drawImage(range.x, range.y, handle, GraphicsType.ICON);
			}
			range.x += GraphicsFormat.ICON_WIDTH + 5;
			length -= GraphicsFormat.ICON_WIDTH - 5;
			format = TextFormat.LEFT;
		}
		else {
			format = TextFormat.CENTER;
		}
		
		TextRenderer.drawRangeAlphaText(range, format, object.event.getName(), length, color, alpha, font);
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
