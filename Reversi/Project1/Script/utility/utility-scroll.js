
var BaseLineScroll = defineObject(BaseObject,
{
	_goalIndex: 0,
	_goalArray: null,
	
	setGoalData: function(x1, y1, x2, y2) {
		var x, y;
		var dx = x2 - x1;
		var dy = y2 - y1;
		var e = 0;
		var n = 1;
		
		if (x1 > x2) {
			dx = x1 - x2;
		}
		if (y1 > y2) {
			dy = y1 - y2;
		}
		
		x = x1;
		y = y1;
		
		this._goalArray = [];
		this._goalIndex = 0;
		
		if (dx > dy) {
			if (x < x2) {
				for (; x <= x2; x += n) {
					e += dy;
					if (e > dx) {
						e -= dx;
						if (y2 > y1) {
							y += n;
						}
						else {
							y -= n;
						}
					}
					this._goalArray.push(createPos(x, y));
				}
			}
			else {
				for (; x >= x2; x -= n) {
					e += dy;
					if (e > dx){
						e -= dx;
						if (y2 > y1) {
							y += n;
						}
						else {
							y -= n;
						}
					}
					this._goalArray.push(createPos(x, y));
				}
			}
		}
		else {
			if (y < y2) {
				for (; y <= y2; y += n) {
					e += dx;
					if (e > dy){
						e -= dy;
						if (x2 > x1) {
							x += n;
						}
						else {
							x -= n;
						}
					}
					this._goalArray.push(createPos(x, y));
				}
			}
			else {
				for (; y >= y2; y -= n) {
					e += dx;
					if (e > dy){
						e -= dy;
						if (x2 > x1) {
							x += n;
						}
						else {
							x -= n;
						}
					}
					this._goalArray.push(createPos(x, y));
				}
			}
		}
		
		this._goalArray.push(createPos(x2, y2));
	},
	
	moveLineScroll: function() {
		var n = this._getLineInterval();
		
		if (this._goalArray === null || CurrentMap.isCompleteSkipMode()) {
			return MoveResult.END;
		}
		
		for (; this._goalIndex < this._goalArray.length; ) {
			if (this._setLinePos(this._goalArray[this._goalIndex])) {
				this._goalIndex += n;
				break;
			}
			this._goalIndex += n;
		}
		
		if (this._goalIndex >= this._goalArray.length || InputControl.isStartAction()) {
			this._setLinePos(this._goalArray[this._goalArray.length - 1]);
			this._goalArray = null;
			this._goalIndex = 0;
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	isMoving: function(pos) {
		if (this._goalArray === null) {
			return false;
		}
		
		return this._goalArray.length > 0;
	},
	
	_setLinePos: function(pos) {
		return false;
	},
	
	_getLineInterval: function() {
		return 16;
	}
}
);

var MapLineScroll = defineObject(BaseLineScroll,
{
	startLineScroll: function(x, y) {
		var x1, y1, x2, y2;
		var session = root.getCurrentSession();
		
		if (session === null) {
			return;
		}
		
		if (EnvironmentControl.getScrollSpeedType() === SpeedType.HIGH) {
			MapView.setScroll(x, y);
			return;
		}
		
		x1 = session.getScrollPixelX() + Math.floor(root.getGameAreaWidth() / 2);
		y1 = session.getScrollPixelY() + Math.floor(root.getGameAreaHeight() / 2);
		x2 = (x * GraphicsFormat.MAPCHIP_WIDTH) + Math.floor(GraphicsFormat.MAPCHIP_WIDTH / 2);
		y2 = (y * GraphicsFormat.MAPCHIP_HEIGHT) + Math.floor(GraphicsFormat.MAPCHIP_HEIGHT / 2);
		
		this.setGoalData(x1, y1, x2, y2);
	},
	
	_setLinePos: function(pos) {
		return MapView.setScrollPixel(pos.x, pos.y);
	},
	
	_getLineInterval: function() {
		if (Miscellaneous.isGameAcceleration()) {
			return 26;
		}
		
		if (EnvironmentControl.getScrollSpeedType() === SpeedType.NORMAL) {
			return 20;
		}
		
		return 14;
	}
}
);

var MouseLineScroll = defineObject(BaseLineScroll,
{
	_setLinePos: function(pos) {
		root.setMousePos(pos.x, pos.y);
		return true;
	},
	
	_getLineInterval: function() {
		return 50;
	}
}
);

var ScrollBackground = defineObject(BaseObject,
{
	_counter: null,
	_xScroll: 0,
	_yScroll: 0,
	_pic: null,
	_picCache: null,
	_xMax: 0,
	_yMax: 0,
	_isHorz: false,
	_isVert: false,
	
	initialize: function() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(this._getCounterMax());
	},
	
	startScrollBackground: function(pic) {
		var c;
		
		if (pic === null) {
			this._pic = null;
			this._picCache = null;
			return;
		}
		
		if (pic === this._pic) {
			return;
		}
		
		c = pic.getName().charAt(0);
		if (c === '!') {
			this._isHorz = true;
			this._xMax = pic.getWidth();
		}
		
		if (c === '#') {
			this._isVert = true;
			this._yMax = pic.getHeight();
		}
		
		this._pic = pic;
		this._picCache = null;
	},
	
	moveScrollBackground: function() {
		if (this._counter.moveCycleCounter() === MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		if (this._isHorz) {
			this._xScroll += this._getPixel();
			if (this._xScroll >= this._xMax) {
				this._xScroll = 0;
			}
		}
		
		if (this._isVert) {
			this._yScroll += this._getPixel();
			if (this._yScroll >= this._yMax) {
				this._yScroll = 0;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawScrollBackground: function() {
		if (this._pic === null) {
			return;
		}
		
		if (this._picCache === null) {
			this._createBackgroundCache();
		}
		
		this._picCache.drawStretchParts(0, 0, root.getGameAreaWidth(), root.getGameAreaHeight(),
			this._xScroll, this._yScroll, this._pic.getWidth(), this._pic.getHeight());
	},
	
	isScrollable: function() {
		return this._isHorz || this._isVert;
	},
	
	_createBackgroundCache: function() {
		var width = this._pic.getWidth();
		var height = this._pic.getHeight();
		var graphicsManager = root.getGraphicsManager();
		
		this._picCache = root.getGraphicsManager().createCacheGraphics(this._isHorz ? width * 2 : width, this._isVert ? height * 2 : height);
			
		graphicsManager.setRenderCache(this._picCache);
		
		this._pic.draw(0, 0);
		
		if (this._isHorz) {
			this._pic.draw(width, 0);
		}
		if (this._isVert) {
			this._pic.draw(0, height);
		}
		if (this._isHorz && this._isVert) {
			this._pic.draw(width, height);
		}
		
		graphicsManager.resetRenderCache();
	},
	
	_getCounterMax: function() {
		return -1;
	},
	
	_getPixel: function() {
		return 1;
	}
}
);
