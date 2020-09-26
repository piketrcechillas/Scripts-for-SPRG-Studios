
var ScrollbarInput = {
	SELECT: 0,
	CANCEL: 1,
	NONE: 2,
	OPTION: 3,
	START: 4
};

var BaseScrollbar = defineObject(BaseObject,
{
	_col: 0,
	_rowCount: 0,
	_showRowCount: 0,
	_objectWidth: 0,
	_objectHeight: 0,
	_xScroll: 0,
	_yScroll: 0,
	_edgeCursor: null,
	_commandCursor: null,
	_objectArray: null,
	_isActive: false,
	_forceSelectIndex: -1,
	_isPageChange: false,
	_inputType: -1,
	_prevIndex: -1,
	
	initialize: function() {
	},
	
	moveInput: function() {
		var input;
		
		if (root.isInputAction(InputType.BTN1) || this._isScrollbarObjectPressed()) {
			this.playSelectSound();
			input = ScrollbarInput.SELECT;
		}
		else if (InputControl.isCancelAction()) {
			this.playCancelSound();
			input = ScrollbarInput.CANCEL;
		}
		else if (InputControl.isOptionAction()) {
			this.playOptionSound();
			input = ScrollbarInput.OPTION;
		}
		else if (InputControl.isStartAction()) {
			this.playStartSound();
			input = ScrollbarInput.START;
		}
		else {
			this.moveScrollbarCursor();
			input = ScrollbarInput.NONE;
		}
		
		return input;
	},
	
	moveScrollbarCursor: function() {
		var inputType = this._commandCursor.moveCursor();
		
		if (this._rowCount === 1) {
			// Processing when only horizontal entries line.
			this._xScroll = this._changeScrollValue(inputType, this._xScroll, true);
		}
		else {
			// Processing when vertical entries also line.
			this._yScroll = this._changeScrollValue(inputType, this._yScroll, false);
		}
		
		if (this._isPageChange) {
			this._checkPage(inputType);
		}
		this._edgeCursor.moveCursor();
		
		MouseControl.checkScrollbarEdgeAction(this);
		MouseControl.checkScrollbarWheel(this);
		
		this.moveScrollbarContent();
		
		if (inputType === InputType.NONE) {
			inputType = MouseControl.moveScrollbarMouse(this);
		}
		
		this._inputType = inputType;
		
		return inputType;
	},
	
	moveScrollbarContent: function() {
		return true;
	},
	
	drawScrollbar: function(xStart, yStart) {
		var i, j, x, y, isSelect;
		var isLast = false;
		var objectCount = this.getObjectCount();
		var width = this._objectWidth + this.getSpaceX();
		var height = this._objectHeight + this.getSpaceY();
		var index = (this._yScroll * this._col) + this._xScroll;
		
		xStart += this.getScrollXPadding();
		yStart += this.getScrollYPadding();
		
		// The data shouldn't be updated with draw functions, but exclude so as to enable to refer to the position with move functions.
		this.xRendering = xStart;
		this.yRendering = yStart;
		MouseControl.saveRenderingPos(this);
		
		for (i = 0; i < this._rowCount; i++) {
			y = yStart + (i * height);
			
			this.drawDescriptionLine(xStart, y);
			
			for (j = 0; j < this._col; j++) {
				x = xStart + (j * width);
				
				isSelect = index === this.getIndex();
				this.drawScrollContent(x, y, this._objectArray[index], isSelect, index);
				if (isSelect && this._isActive) {
					this.drawCursor(x, y, true);
				}
				
				if (index === this._forceSelectIndex) {
					this.drawCursor(x, y, false);
				}
				
				if (++index === objectCount) {
					isLast = true;
					break;
				}
			}
			if (isLast) {
				break;
			}
		}
		
		if (this._isActive) {
			this.drawEdgeCursor(xStart, yStart);
		}
	},
	
	getScrollableData: function() {
		var d;
		var isLeft = false;
		var isTop = false;
		var isRight = false;
		var isBottom = false;
		
		if (this._rowCount === 1) {
			d = this._col + this._xScroll;
			
			// If even one is scrolled, display the left-pointing cursor.
			isLeft = this._xScroll > 0;
			
			isRight = d < this._objectArray.length;
		}
		else {
			// Add a range to be seen and a range not to be seen without scroll.
			d = (this._showRowCount * this._col) + (this._col * this._yScroll);
			
			// If even one is scrolled, display the up-pointing cursor.
			isTop = this._yScroll > 0;
			
			isBottom = d < this._objectArray.length;
		}
		
		return {
			isLeft: isLeft,
			isTop: isTop,
			isRight: isRight,
			isBottom: isBottom
		};
	},
	
	getRecentlyInputType: function() {
		return this._inputType;
	},
	
	drawCursor: function(x, y, isActive) {
		var pic = this.getCursorPicture();
		
		y = y - (32 - this._objectHeight) / 2;
		
		this._commandCursor.drawCursor(x, y, isActive, pic);
	},
	
	drawEdgeCursor: function(x, y) {
		var scrollableData = this.getScrollableData();
		
		this._edgeCursor.drawHorzCursor(x - this.getScrollXPadding(), y - this.getScrollYPadding(), scrollableData.isLeft, scrollableData.isRight);
		this._edgeCursor.drawVertCursor(x - this.getScrollXPadding(), y - this.getScrollYPadding(), scrollableData.isTop, scrollableData.isBottom);
	},
	
	drawDescriptionLine: function(x, y) {
		var count;
		var textui = this.getDescriptionTextUI();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		
		if (pic !== null) {
			count = Math.floor(this.getScrollbarWidth() / width) - 1;
			TitleRenderer.drawTitle(pic, x - 14, y + this._objectHeight - 47, width, height, count);
		}
	},
	
	drawScrollContent: function(x, y, object, isSelect, index) {
	},
	
	setScrollFormation: function(col, showRowCount) {
		this._objectArray = [];
		this.setScrollFormationInternal(col, showRowCount);
	},
	
	setScrollFormationInternal: function(col, showRowCount) {
		this._commandCursor = createObject(CommandCursor);
		
		this._col = col;
		this._showRowCount = showRowCount;
		
		this._objectWidth = this.getObjectWidth();
		this._objectHeight = this.getObjectHeight();
		
		this._edgeCursor = createObject(EdgeCursor);
		this._edgeCursor.setEdgeRange(this.getScrollbarWidth(), this.getScrollbarHeight());
	},
	
	resetScrollData: function() {
		this._objectArray = [];
		this._xScroll = 0;
		this._yScroll = 0;
		this._rowCount = 0;
	},
	
	objectSet: function(obj) {
		this._objectArray.push(obj);
	},
	
	objectSetEnd: function() {
		var objectCount = this._objectArray.length;
		
		if (this._col === 1) {
			this._commandCursor.setCursorUpDown(objectCount);
		}
		else if (this._showRowCount === 1) {
			this._commandCursor.setCursorLeftRight(objectCount);
		}
		else {
			this._commandCursor.setCursorCross(objectCount, this._col);
		}
		
		this._rowCount = Math.ceil(objectCount / this._col);
		if (this._rowCount > this._showRowCount) {
			this._rowCount = this._showRowCount;
		}
		
		// Check if the number of previous index doesn't exceed the new count.
		this._commandCursor.validate(); 
	},
	
	setObjectArray: function(objectArray) {
		var i;
		var length = objectArray.length;
		
		this.resetScrollData();
		
		for (i = 0; i < length; i++) {
			this.objectSet(objectArray[i]);
		}
		
		this.objectSetEnd();
	},
	
	setDataList: function(list) {
		var i, count, data;
		
		this.resetScrollData();
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			this.objectSet(data);
		}
		
		this.objectSetEnd();
	},
	
	cut: function(index) {
		this._objectArray.splice(index, 1);
	},
	
	getIndex: function() {
		return this._commandCursor.getCommandCursorIndex();
	},
	
	setIndex: function(index) {
		var pos;
		
		this._commandCursor.setCommandCursorIndex(index);
		
		if (this._rowCount === 1) {
			// Processing when only horizontal entries line.
			pos = index + 1;
			if (pos > this._col) {
				this._xScroll = pos - this._col;
			}
			else {
				this._xScroll = 0;
			}
		}
		else {
			// Processing when vertical entries also line.
			pos = Math.floor(index / this._col) + 1;
			if (pos > this._rowCount) {
				this._yScroll = pos - this._rowCount;
			}
			else {
				this._yScroll = 0;
			}
		}
	},
	
	getObject: function() {
		return this.getObjectFromIndex(this.getIndex());
	},
	
	getObjectFromIndex: function(index) {
		if (this._objectArray === null || this._objectArray.length === 0) {
			return null;
		}
		
		return this._objectArray[index];
	},
	
	getIndexFromObject: function(object) {
		var i;
		var count = this._objectArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._objectArray[i] === object) {
				return i;
			}
		}
		
		return -1;
	},
	
	getObjectCount: function() {
		return this._objectArray.length;
	},
	
	getCol: function() {
		return this._col;
	},
	
	getRowCount: function() {
		return this._rowCount;
	},
	
	getShowRowCount: function() {
		return this._showRowCount;
	},
	
	getCursorPicture: function() {
		return root.queryUI('menu_selectCursor');
	},
	
	enableSelectCursor: function(isActive) {
		if (isActive) {
			this.setForceSelect(-1);
		}
		else {
			this.setForceSelect(this.getIndex());
		}
		
		this.setActive(isActive);
	},
	
	setActive: function(isActive) {
		if (isActive) {
			MouseControl.setActiveScrollbar(this);
		}
		
		this._isActive = isActive;
	},
	
	setActiveSingle: function(isActive) {
		this._isActive = isActive;
	},
	
	setForceSelect: function(index) {
		this._forceSelectIndex = index;
	},
	
	getForceSelectIndex: function() {
		return this._forceSelectIndex;
	},
	
	enablePageChange: function() {
		this._isPageChange = true;
	},
	
	getScrollXValue: function() {
		return this._xScroll;
	},
	
	getScrollYValue: function() {
		return this._yScroll;
	},
	
	setScrollXValue: function(x) {
		this._xScroll = x;
	},
	
	setScrollYValue: function(y) {
		this._yScroll = y;
	},
	
	getScrollXPadding: function() {
		return 0;
	},
	
	getScrollYPadding: function() {
		return 0;
	},
	
	getSpaceX: function() {
		return 0;
	},
	
	getSpaceY: function() {
		return 0;
	},
	
	getObjectWidth: function() {
		return 0;
	},
	
	getObjectHeight: function() {
		return 0;
	},
	
	getScrollbarWidth: function() {
		return (this._col * this._objectWidth) + ((this._col - 1) * this.getSpaceX());
	},
	
	getScrollbarHeight: function() {
		return (this._showRowCount * this._objectHeight) + ((this._showRowCount - 1) * this.getSpaceY());
	},
	
	getParentTextUI: function() {
		return this.getParentInstance().getWindowTextUI();
	},
	
	getDescriptionTextUI: function() {
		return root.queryTextUI('description_title');
	},
	
	playSelectSound: function() {
		MediaControl.soundDirect('commandselect');
	},
	
	playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	},
	
	playPageCursorSound: function() {
		MediaControl.soundDirect('commandcursor');
	},
	
	playOptionSound: function() {
		// Sound effect related to the 'Option' can have an appropriate one depending on the time, so don't implement here.
	},
	
	playStartSound: function() {
		// Sound effect related to the 'Start' can have an appropriate one depending on the time, so don't implement here.
	},

	getEdgeCursor: function() {
		return this._edgeCursor;
	},
	
	getCommandCursor: function() {
		return this._commandCursor;
	},
	
	saveScroll: function() {
		this._saveScrollY = this._yScroll;
	},
	
	restoreScroll: function() {
		if ((this._saveScrollY - 1) + this._showRowCount <= this.getIndex()) {
			// To prevent cursor from disappearing, don't lower the scroll value.
		}
		else if (this._saveScrollY > 0) {
			this._saveScrollY--;
		}
		
		this._yScroll = this._saveScrollY;
	},
	
	checkAndUpdateIndex: function() {
		var index = this.getIndex();
		var isChanged = this._prevIndex !== index;
		
		if (isChanged) {
			this._prevIndex = index;
		}
		
		return isChanged;
	},
	
	resetPreviousIndex: function() {
		this._prevIndex = -1;
	},
	
	_changeScrollValue: function(input, scrollValue, isHorz) {
		var showRange, div, pos, max;
		var objectCount = this._objectArray.length;
		
		if (isHorz) {
			showRange = this._col;
			div = 1;
			pos = this._commandCursor.getCommandCursorIndex();
		}
		else {
			showRange = this._showRowCount;
			div = this._col;
			pos = Math.floor(this._commandCursor.getCommandCursorIndex() / this._col);
		}
		
		if (input === DirectionType.LEFT || input === DirectionType.TOP) {
			if (pos + 1 === scrollValue) {
				// Scroll because it reached the top of the display range.
				scrollValue--;
			}
			else if (this._commandCursor.getCommandCursorIndex() === objectCount - 1) {
				// The index is the maximum value, so the scroll value is also the maximum value.
				max = objectCount - (showRange * div);
				if (max < 0) {
					scrollValue = 0;
				}
				else {
					scrollValue = Math.ceil(max / div);
				}
			}
		}
		else if (input === DirectionType.RIGHT || input === DirectionType.BOTTOM) {
			if (pos === showRange + scrollValue) {
				// Scroll because it reached the bottom of the display range.
				scrollValue++;
			}
			else if (this._commandCursor.getCommandCursorIndex() === 0) {
				// Because the index value is the initial value, the scroll value is also the initial value.
				scrollValue = 0;
			}
		}
		
		return scrollValue;
	},
	
	_checkPage: function(inputType) {
		var d;
		var isChange = false;
		var index = this.getIndex();
		var yScroll = this.getScrollYValue();
		var showRowCount = this.getShowRowCount();
		
		if (inputType === InputType.LEFT) {
			if (this.getObjectCount() > showRowCount) {
				d = this._getPageValue(yScroll, showRowCount * -1);
				yScroll -= d;
				index -= d;
				isChange = true;
			}
		}
		else if (inputType === InputType.RIGHT) {
			if (this.getObjectCount() > showRowCount) {
				d = this._getPageValue(yScroll, showRowCount);
				yScroll += d;
				index += d;
				isChange = true;
			}
		}
		
		if (isChange) {
			if (index !== this.getIndex()) {
				this.setIndex(index);
				this.setScrollYValue(yScroll);
				this.playPageCursorSound();
			}
		}
	},
	
	_getPageValue: function(yScroll, n) {
		var d;
		var yMin = 0;
		var yMax = this.getObjectCount() - this.getShowRowCount();
		
		if (n < 0 && yScroll === yMin) {
			// Move to the last page.
			return -yMax;
		}
		else if (n > 0 && yScroll === yMax) {
			// Move to the first page.
			return -yMax;
		}
		
		d = yScroll + n;
		if (yMin >= d) {
			d = yScroll;
		}
		else if (yMax < d) {
			d = yMax - yScroll;
		}
		else {
			d = this.getShowRowCount();
		}
		
		return d;
	},
	
	_isScrollbarObjectPressed: function() {
		return MouseControl.isScrollbarObjectPressed(this);
	}
}
);
