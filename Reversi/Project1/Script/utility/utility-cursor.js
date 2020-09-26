
var CommandCursor = defineObject(BaseObject,
{
	_max: 0,
	_col: 0,
	_type: 0,
	_index: 0,
	_counter: null,
	_commandCursorSrcIndex: 0,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(20);
		this._counter.disableGameAcceleration();
	},
	
	setCursorLeftRight: function(max) {
		this._max = max;
		this._type = 0;
	},
	
	setCursorUpDown: function(max)	{
		this._max = max;
		this._type = 1;
	},
	
	setCursorCross: function(max, col) {
		this._max = max;
		this._col = col;
		this._type = 2;
	},
	
	moveCursor: function() {
		var d, inputType;
		
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this._commandCursorSrcIndex++;
			if (this._commandCursorSrcIndex === 2) {
				this._commandCursorSrcIndex = 0;
			}
		}
		
		inputType = InputControl.getDirectionState();
		if (inputType === InputType.NONE) {
			return InputType.NONE;
		}
		
		if (this._max < 1) {
			return InputType.NONE;
		}
		
		d = this._getIntervalValue(inputType);
		
		this._changeCursorIndex(d);
		
		return inputType;
	},
	
	drawCursor: function(x, y, isActive, pic) {
		var xSrc = 0;
		var width = UIFormat.SELECTCURSOR_WIDTH / 2;
		var height = UIFormat.SELECTCURSOR_HEIGHT / 2;
		
		if (pic === null) {
			return;
		}
		
		x -= 25;
		xSrc = this._commandCursorSrcIndex * width;
		
		if (isActive) {
			pic.drawParts(x - 0, y + 0, xSrc, 0, width, height);
		}
		else {
			xSrc = 0;
			pic.drawParts(x - 0, y + 0, xSrc, height, width, height);
		}
	},
	
	getCommandCursorIndex: function() {
		return this._index;
	},
	
	setCommandCursorIndex: function(index) {
		this._index = index;
	},
	
	validate: function() {
		if (this._index < 0) {
			this._index = 0;
		}
		else if (this._index > this._max - 1) {
			this._index = this._max - 1;
		}
	},
	
	_getIntervalValue: function(key) {
		var d = 0;
		
		if (this._type === 0) {
			if (key === InputType.LEFT) {
				d = -1;
			}
			else if (key === InputType.RIGHT) {
				d = 1;
			}
		}
		else if (this._type === 1) {
			if (key === InputType.UP) {
				d = -1;
			}
			else if (key === InputType.DOWN) {
				d = 1;
			}
		}
		else if (this._type === 2) {
			if (key === InputType.LEFT) {
				d = -1;
			}
			else if (key === InputType.RIGHT) {
				d = 1;
			}
			else if (key === InputType.UP) {
				d = this._col * -1;
			}
			else if (key === InputType.DOWN) {
				d = this._col;
			}
		}
		
		return d;
	},
	
	_changeCursorIndex: function(d) {
		var prevIndex = this._index;
		
		this._index += d;
		if (d < 0) {	
			if (this._index < 0) {
				this._index = this._max - 1;
			}
		}
		else if (d > 0) {
			if (this._index > this._max - 1) {
				this._index = 0;
			}
		}
		
		if (prevIndex !== this._index) {
			// Play a sound because a position was changed.
			this._playMoveCursorSound();
		}
	},
	
	_playMoveCursorSound: function() {
		MediaControl.soundDirect('commandcursor');
	}
}
);

var PageCursor = defineObject(BaseObject,
{
	_counter: null,
	_cursorIndex: 0,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(20);
		this._counter.disableGameAcceleration();
	},
	
	moveCursor: function() {
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
	
	drawCursor: function(x, y, pic) {
		var n = this._cursorIndex;
		var width = UIFormat.PAGECURSOR_WIDTH / 2;
		var height = UIFormat.PAGECURSOR_HEIGHT;
		
		if (pic !== null) {
			pic.drawParts(x, y, width * n, 0, width, height);
		}
	}
}
);

var PosDoubleCursor = defineObject(BaseObject,
{
	_counter: null,
	_cursorIndex: 0,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(20);
		this._counter.disableGameAcceleration();
	},
	
	moveCursor: function() {
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
	
	drawCursor: function(xSrc, ySrc, xDest, yDest) {
		var x = LayoutControl.getPixelX(xSrc);
		var y = LayoutControl.getPixelY(ySrc);
		
		this.drawSrcCursor(x, y);
		
		x = LayoutControl.getPixelX(xDest);
		y = LayoutControl.getPixelY(yDest);
		this.drawDestCursor(x, y);
	},
	
	drawSrcCursor: function(x, y) {
		var width = UIFormat.SELECTCURSOR_WIDTH / 2;
		var height = UIFormat.SELECTCURSOR_HEIGHT / 2;
		var xSrc = 0;
		var ySrc = height;
		var pic = root.queryUI('command_poschangecursor');
		
		pic.drawParts(x - 10, y, xSrc, ySrc, width, height);
	},
	
	drawDestCursor: function(x, y) {
		var width = UIFormat.SELECTCURSOR_WIDTH / 2;
		var height = UIFormat.SELECTCURSOR_HEIGHT / 2;
		var xSrc = this._cursorIndex * width;
		var ySrc = 0;
		var pic = root.queryUI('command_poschangecursor');
		
		pic.drawParts(x - 10, y, xSrc, ySrc, width, height);
	}
}
);

var FocusCursor = defineObject(BaseObject,
{
	_counter: null,
	_mapCursorSrcIndex: 0,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(16);
		this._counter.disableGameAcceleration();
	},
	
	setPos: function(x, y) {
		root.getCurrentSession().setMapCursorX(x);
		root.getCurrentSession().setMapCursorY(y);
	},
	
	moveCursor: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			if (this._mapCursorSrcIndex === 0) {
				this._mapCursorSrcIndex = 1;
			}
			else {
				this._mapCursorSrcIndex = 0;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawCursor: function() {
		var session = root.getCurrentSession();
		var width = UIFormat.MAPCURSOR_WIDTH / 2;
		var height = UIFormat.MAPCURSOR_HEIGHT;
		var x = (session.getMapCursorX() * width) - session.getScrollPixelX();
		var y = (session.getMapCursorY() * height) - session.getScrollPixelY();
		var pic = root.queryUI('focuscursor');
		var pic2 = root.queryUI('lockoncursor');
		
		if (pic !== null) {
			pic.drawParts(x, y - 40, this._mapCursorSrcIndex * width, 0, width, height);
		}
		
		if (pic2 !== null) {
			pic2.drawParts(x, y, this._mapCursorSrcIndex * width, 0, width, height);
		}
	},
	
	endCursor: function() {
	}
}
);

var LockonCursor = defineObject(BaseObject,
{
	_counter: null,
	_x: 0,
	_y: 0,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(30);
	},
	
	setPos: function(x, y) {
		var indexArray = [];
		
		if (this._isPanel()) {
			indexArray.push(CurrentMap.getIndex(x, y));
			MapLayer.getMapChipLight().setIndexArray(indexArray);
		}
		else {
			this._x = x;
			this._y = y;
		}
	},
	
	moveCursor: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this.endCursor();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawCursor: function() {
		if (!this._isPanel()) {
			this._drawMapCursor();
		}
	},
	
	endCursor: function() {
		if (this._isPanel()) {
			MapLayer.getMapChipLight().endLight();
		}
	},
	
	_drawMapCursor: function() {
		var session = root.getCurrentSession();
		var width = UIFormat.MAPCURSOR_WIDTH / 2;
		var height = UIFormat.MAPCURSOR_HEIGHT;
		var x = (this._x * width) - session.getScrollPixelX();
		var y = (this._y * height) - session.getScrollPixelY();
		var pic = root.queryUI('lockoncursor');
		var mapCursorSrcIndex = 0;
		
		if (pic !== null) {
			pic.drawParts(x, y, mapCursorSrcIndex * width, 0, width, height);
		}
	},
	
	_isPanel: function() {
		return true;
	}
}
);

var MapCursor = defineObject(BaseObject,
{
	_counter: null,
	_mapCursorSrcIndex: 0,
	_isInputEnabled: true,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(22);
		this._counter.disableGameAcceleration();
	},
	
	setPos: function(x, y) {
		root.getCurrentSession().setMapCursorX(x);
		root.getCurrentSession().setMapCursorY(y);
	},
	
	moveCursor: function() {
		var inputType;
		
		this.moveCursorAnimation();
		
		inputType = this._getDirectionInputType();
		if (inputType === InputType.NONE) {
			MouseControl.moveMapMouse(this);
			return inputType;
		}
		
		this._changeCursorValue(inputType);
		
		return inputType;
	},
	
	moveCursorAnimation: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			if (this._mapCursorSrcIndex === 0) {
				this._mapCursorSrcIndex = 1;
			}
			else {
				this._mapCursorSrcIndex = 0;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawCursor: function() {
		var session = root.getCurrentSession();
		var width = UIFormat.MAPCURSOR_WIDTH / 2;
		var height = UIFormat.MAPCURSOR_HEIGHT;
		var x = (session.getMapCursorX() * GraphicsFormat.MAPCHIP_WIDTH) - session.getScrollPixelX();
		var y = (session.getMapCursorY() * GraphicsFormat.MAPCHIP_HEIGHT) - session.getScrollPixelY();
		var pic = root.queryUI('mapcursor');
		
		if (pic !== null) {
			pic.drawStretchParts(x, y, GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT, this._mapCursorSrcIndex * width, 0, width, height);
		}
	},
	
	getX: function() {
		return root.getCurrentSession().getMapCursorX();
	},
	
	getY: function() {
		return root.getCurrentSession().getMapCursorY();
	},
	
	getUnitFromCursor: function() {
		var session = root.getCurrentSession();
		return PosChecker.getUnitFromPos(session.getMapCursorX(), session.getMapCursorY());
	},
	
	getMapChipFromCursor: function() {
		var session = root.getCurrentSession();
		return PosChecker.getTerrainFromPos(session.getMapCursorX(), session.getMapCursorY());
	},
	
	enableInput: function(enable) {
		this._isInputEnabled = enable;
	},
	
	_getDirectionInputType: function() {
		var inputType;
	
		if (!this._isInputEnabled) {
			return InputType.NONE;
		}
		
		if (this._isAccelerate()) {
			inputType = InputControl.getDirectionStateHigh();
		}
		else {
			inputType = InputControl.getDirectionState();
		}
		
		return inputType;
	},
	
	_isAccelerate: function() {
		// If cancel key is pressed, speed up a cursor move.
		return InputControl.isCancelState();
	},
	
	_changeCursorValue: function(input) {
		var session = root.getCurrentSession();
		var xCursor = session.getMapCursorX();
		var yCursor = session.getMapCursorY();
		var n = root.getCurrentSession().getMapBoundaryValue();
		
		if (input === InputType.LEFT) {
			xCursor--;
		}
		else if (input === InputType.UP) {
			yCursor--;
		}
		else if (input === InputType.RIGHT) {
			xCursor++;
		}
		else if (input === InputType.DOWN) {
			yCursor++;
		}
		
		if (xCursor < n) {
			xCursor = n;
		}
		else if (yCursor < n) {
			yCursor = n;
		}
		else if (xCursor > CurrentMap.getWidth() - 1 - n) {
			xCursor = CurrentMap.getWidth() - 1 - n;
		}
		else if (yCursor > CurrentMap.getHeight() - 1 - n) {
			yCursor = CurrentMap.getHeight() - 1 - n;
		}
		else {
			// A cursor was moved, so play a sound.
			this._playMovingSound();
		}
		
		MapView.setScroll(xCursor, yCursor);
		
		session.setMapCursorX(xCursor);
		session.setMapCursorY(yCursor);
	},
	
	_playMovingSound: function() {
		MediaControl.soundDirect('mapcursor');
	}
}
);

var EdgeCursor = defineObject(BaseObject,
{
	_counter: null,
	_scrollCursorIndex: 0,
	_totalWidth: 0,
	_totalHeight: 0,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(20);
		this._counter.disableGameAcceleration();
	},
	
	setEdgeRange: function(width, height) {
		this._totalWidth = width;
		this._totalHeight = height;
	},
	
	moveCursor: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			if (this._scrollCursorIndex === 0) {
				this._scrollCursorIndex = 1;
			}
			else {
				this._scrollCursorIndex = 0;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawHorzCursor: function(xStart, yStart, isLeft, isRight) {
		var range;
		var srcWidth = 32;
		var srcHeight = 32;
		var xSrc = this._scrollCursorIndex * srcWidth;
		var ySrc = 0;
		var pic = this._getCursorUI();
		
		if (pic === null) {
			return;
		}
		
		if (isLeft) {
			ySrc = 0;
			range = this.getLeftEdgeRange(xStart, yStart);
			pic.drawParts(range.x, range.y, xSrc, ySrc, srcWidth, srcHeight);
		}
		
		if (isRight) {
			ySrc = 64;
			range = this.getRightEdgeRange(xStart, yStart);
			pic.drawParts(range.x, range.y, xSrc, ySrc, srcWidth, srcHeight);
		}
	},
	
	drawVertCursor: function(xStart, yStart, isTop, isBottom) {
		var range;
		var srcWidth = 32;
		var srcHeight = 32;
		var xSrc = this._scrollCursorIndex * srcWidth;
		var ySrc = 0;
		var pic = this._getCursorUI();
		
		if (pic === null) {
			return;
		}
		
		if (isTop) {
			ySrc = 32;
			range = this.getTopEdgeRange(xStart, yStart);
			pic.drawParts(range.x, range.y, xSrc, ySrc, srcWidth, srcHeight);
		}
		
		if (isBottom) {
			ySrc = 96;
			range = this.getBottomEdgeRange(xStart, yStart);
			pic.drawParts(range.x, range.y, xSrc, ySrc, srcWidth, srcHeight);
		}
	},
	
	getLeftEdgeRange: function(xStart, yStart) {
		var xHalf = 16;
		var yHalf = 16;
		var x = xStart - xHalf - xHalf;
		var y = Math.floor(((yStart + this._totalHeight) + yStart) / 2) - yHalf;
		
		return this._createEdgeRange(x, y);
	},
	
	getRightEdgeRange: function(xStart, yStart) {
		var xHalf = 16;
		var yHalf = 16;
		var x = xStart + this._totalWidth - xHalf;
		var y = Math.floor(((yStart + this._totalHeight) + yStart) / 2) - yHalf;
		
		return this._createEdgeRange(x, y);
	},
	
	getTopEdgeRange: function(xStart, yStart) {
		var xHalf = 16;
		var yHalf = 16;
		var x = Math.floor(((xStart + this._totalWidth) + xStart) / 2) - xHalf;
		var y = yStart - yHalf - yHalf;
		
		return this._createEdgeRange(x, y);
	},
	
	getBottomEdgeRange: function(xStart, yStart) {
		var xHalf = 16;
		var yHalf = 16;
		var x = Math.floor(((xStart + this._totalWidth) + xStart) / 2) - xHalf;
		var y = yStart + this._totalHeight - yHalf;
		
		return this._createEdgeRange(x, y);
	},
	
	_getCursorUI: function() {
		return root.queryUI('scrollcursor');
	},
	
	_createEdgeRange: function(x, y) {
		return createRangeObject(x, y, 32, 32);
	}
}
);

var EdgeMapSideCursor = defineObject(EdgeCursor,
{
	_getCursorUI: function() {
		return root.queryUI('mapscrollcursor');
	}
}
);
