
var MessagePager = defineObject(BaseObject,
{
	_picUnderLine: null,
	_charHeight: 0,
	_isScrollLocked: false,
	_edgeCursor: null,
	_totalWidth: 0,
	_totalHeight: 0,
	_containerIndex: 0,
	_containerArray: null,
	
	setMessagePagerText: function(text, messagePagerParam) {
		var messageAnalyzerParam = this._createMessageAnalyzerParam(messagePagerParam);
		
		this._messageAnalyzer = createObject(MessageAnalyzer);
		this._messageAnalyzer.setMessageAnalyzerParam(messageAnalyzerParam);
		this._messageAnalyzer.setMaxRowCount(messagePagerParam.rowCount);
		this._messageAnalyzer.setMessageAnalyzerText(text);
		
		this._containerArray = this._messageAnalyzer.getCoreAnalyzer().createTextContainerArray();
		this._messageAnalyzer.getCoreAnalyzer().setTextLineArray(this._containerArray[0]);
		
		return this._containerArray[0];
	},
	
	setSize: function(width, height) {
		this._totalWidth = width;
		this._totalHeight = height;
		this._edgeCursor = createObject(EdgeCursor);
		this._edgeCursor.setEdgeRange(this._totalWidth, this._totalHeight);
	},
	
	moveMessagePager: function() {
		var index = -1;
		
		if (this._edgeCursor === null) {
			return MoveResult.CONTINUE;
		}
		
		if (InputControl.isInputAction(InputType.UP) || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			index = this._changePage(false);
		}
		else if (InputControl.isInputAction(InputType.DOWN) || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			index = this._changePage(true);
		}
		
		if (index !== -1) {
			this._messageAnalyzer.getCoreAnalyzer().setTextLineArray(this._containerArray[index]);
			this._containerIndex = index;
		}
		
		if (this._edgeCursor !== null) {
			this._edgeCursor.moveCursor();
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawMessagePager: function(x, y) {
		if (this._picUnderLine !== null) {
			this._drawLine(x, y);
		}
		
		this._messageAnalyzer.drawMessageAnalyzer(x, y, -1, -1, null);
		
		if (this._edgeCursor !== null) {
			this._drawCursor(x, y);
		}
	},
	
	getPagerWidth: function() {
		return this._totalWidth;
	},
	
	getPagerHeight: function() {
		return this._totalHeight;
	},
	
	getTextContainerArray: function() {
		return this._containerArray;
	},
	
	_drawLine: function(x, y) {
		var i;
		var textLineArray = this._containerArray[this._containerIndex];
		var count = textLineArray.length;
		var titleCount = 10;
		
		for (i = 0; i < count; i++) {
			TitleRenderer.drawTitle(this._picUnderLine, x, y - 20, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), titleCount);
			y += this._charHeight + this._getSpaceInterval();
		}
	},
	
	_drawCursor: function(x, y) {
		var isUp = this._isUp();
		var isDown = this._isDown();
		
		this._edgeCursor.drawVertCursor(x, y - 0, isUp, isDown);
	},
	
	_isUp: function() {
		if (this._isScrollLocked) {
			return false;
		}
		
		return this._containerIndex > 0;
	},
	
	_isDown: function() {
		if (this._isScrollLocked) {
			return false;
		}
		
		return this._containerIndex < this._containerArray.length - 1;
	},
	
	_getSpaceInterval: function() {
		return 10;
	},
	
	_createMessageAnalyzerParam: function(messagePagerParam) {
		var messageAnalyzerParam = StructureBuilder.buildMessageAnalyzerParam();
		
		messageAnalyzerParam.color = messagePagerParam.color;
		messageAnalyzerParam.font = messagePagerParam.font;
		messageAnalyzerParam.messageSpeedType = SpeedType.DIRECT;
		
		this._charHeight = messagePagerParam.font.getSize();
		this._picUnderLine = messagePagerParam.picUnderLine;
		
		return messageAnalyzerParam;
	},
	
	_changePage: function(isNext) {
		var count = this._containerArray.length;
		var index = this._containerIndex;
		
		if (isNext) {
			if (++index > count - 1) {
				index = 0;
			}
		}
		else {
			if (--index < 0) {
				index = count - 1;
			}
		}
		
		this._playMenuPageChangeSound();
		
		return index;
	},
	
	_playMenuPageChangeSound: function() {
	}
}
);

var HorizontalPageChanger = defineObject(BaseObject,
{
	_counter: null,
	_pageCount: 0,
	_activePageIndex: 0,
	_cursorIndex: 0,
	_totalWidth: 0,
	_totalHeight: 0,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(20);
		this._counter.disableGameAcceleration();
	},
	
	setPageData: function(pageCount, width, height) {
		this._activePageIndex = 0;
		this._pageCount = pageCount;
		this._totalWidth = width;
		this._totalHeight = height;
	},
	
	movePage: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			if (this._cursorIndex === 0) {
				this._cursorIndex = 1;
			}
			else {
				this._cursorIndex = 0;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawPage: function(x, y) {
		var range;
		
		// The move method enables to refer to the coordinate with a mouse.
		this.xRendering = x;
		this.yRendering = y;
		
		range = this._getLeftRange(x, y);
		this._drawPageCursor(range, true);
		
		range = this._getRightRange(x, y);
		this._drawPageCursor(range, false);
	},
	
	checkPage: function() {
		var result = false;
		var xStart = this.xRendering;
		var yStart = this.yRendering;
		
		if (InputControl.isInputAction(InputType.LEFT)) {
			result = this._changePage(false);
		}
		else if (InputControl.isInputAction(InputType.RIGHT)) {
			result = this._changePage(true);
		}
		else if (root.isMouseAction(MouseType.LEFT)) {
			if (MouseControl.isHovering(this._getLeftRange(xStart, yStart))) {
				result = this._changePage(false);
			}
			else if (MouseControl.isHovering(this._getRightRange(xStart, yStart))) {
				result = this._changePage(true);
			}
		}
		
		return result;
	},
	
	setPageIndex: function(index) {
		this._activePageIndex = index;
		this._playMenuPageChangeSound();
	},
	
	getPageIndex: function() {
		return this._activePageIndex;
	},
	
	_drawPageCursor: function(range, isLeft) {
		var srcWidth = 32;
		var srcHeight = 32;
		var xSrc = this._cursorIndex * srcWidth;
		var ySrc = isLeft ? 0 : 64;
		var pic = this._getCursorUI();
		
		if (pic === null || this._pageCount <= 1) {
			return;
		}
		
		pic.drawParts(range.x, range.y, xSrc, ySrc, srcWidth, srcHeight);
	},
	
	_changePage: function(isNext) {
		var index = this._activePageIndex;
		var count = this._pageCount;
		
		if (isNext) {
			if (++index === count) {
				index = 0;
			}
		}
		else {
			if (--index === -1) {
				index = count - 1;
			}
		}
		
		this._activePageIndex = index;
		
		if (count > 1) {
			this._playMenuPageChangeSound();
			return true;
		}
		
		return false;
	},
	
	_getLeftRange: function(xStart, yStart) {
		var xHalf = 16;
		var yHalf = 16;
		var x = xStart - xHalf - xHalf;
		var y = Math.floor(((yStart + this._totalHeight) + yStart) / 2) - yHalf;
		
		return this._createEdgeRange(x, y);
	},
	
	_getRightRange: function(xStart, yStart) {
		var xHalf = 16;
		var yHalf = 16;
		var x = xStart + this._totalWidth - xHalf;
		var y = Math.floor(((yStart + this._totalHeight) + yStart) / 2) - yHalf;
		
		return this._createEdgeRange(x, y);
	},
	
	_createEdgeRange: function(x, y) {
		return createRangeObject(x, y, 32, 32);
	},
	
	_getCursorUI: function() {
		return root.queryUI('pagescrollcursor');
	},
	
	_playMenuPageChangeSound: function() {
		MediaControl.soundDirect('menutargetchange');
	}
}
);

var VerticalDataChanger = defineObject(BaseObject,
{	
	checkDataIndex: function(list, data) {
		var index = -1;
		
		if (InputControl.isInputAction(InputType.UP) || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			index = this._changePage(list, data, false);
		}
		else if (InputControl.isInputAction(InputType.DOWN) || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			index = this._changePage(list, data, true);
		}
		
		return index;
	},
	
	_changePage: function(list, data, isNext) {
		var i, count;
		var index = -1;
		
		if (data === null) {
			index = list.getIndex();
			count = list.getObjectCount();
		}
		else {
			count = list.getCount();
			for (i = 0; i < count; i++) {
				if (list.getData(i) === data) {
					index = i;
					break;
				}
			}
		}
		
		if (count === 1 || index === -1) {
			return -1;
		}
		
		if (isNext) {
			if (++index > count - 1) {
				index = 0;
			}
		}
		else {
			if (--index < 0) {
				index = count - 1;
			}
		}
		
		this._playMenuPageChangeSound();
		
		return index;
	},
	
	_playMenuPageChangeSound: function() {
		MediaControl.soundDirect('menutargetchange');
	}
}
);
