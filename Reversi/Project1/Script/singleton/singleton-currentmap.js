
var CurrentMap = {
	_width: 0,
	_height: 0,
	_divisionAreaArray: null,
	_isSkipMode: false,
	_isEnemyAccelerationEnabled: false,
	
	prepareMap: function() {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		
		if (mapInfo !== null) {
			this._width = mapInfo.getMapWidth();
			this._height = mapInfo.getMapHeight();
			
			// This calling will have a meaning when reinforcements appear.
			this.prepareDivisionAreaArray();
			
			MapLayer.prepareMapLayer();
			
			MouseControl.prepareMouseControl();
			
			this._checkMapBoundaryValue(true);
			
			this.setTurnSkipMode(false);
		}
		else {
			this._width = 0;
			this._height = 0;
			this._divisionAreaArray = null;
			this._isSkipMode = false;
			this._checkMapBoundaryValue(false);
		}
	},
	
	getWidth: function() {
		return this._width;
	},
	
	getHeight: function() {
		return this._height;
	},
	
	getSize: function() {
		return this._width * this._height;
	},
	
	isMapInside: function(x, y) {
		if (x < 0 || x > this._width - 1) {
			return false;
		}
		
		if (y < 0 || y > this._height - 1) {
			return false;
		}
		
		return true;
	},
	
	getIndex: function(x, y) {
		if (!this.isMapInside(x, y)) {
			return -1;
		}
		
		return (y * this._width) + x;
	},
	
	getX: function(index) {
		return Math.floor(index % this._width);
	},
	
	getY: function(index) {
		return Math.floor(index / this._width);
	},
	
	getCol: function() {
		return Math.ceil(root.getGameAreaWidth() / GraphicsFormat.MAPCHIP_WIDTH);
	},
	
	getRow: function() {
		// If the resolution is 800x600 etc., the height is indivisible by 32.
		// In this scene, round up the number.
		return Math.ceil(root.getGameAreaHeight() / GraphicsFormat.MAPCHIP_HEIGHT);
	},
	
	prepareDivisionAreaArray: function() {
		var x, y, xEnd, yEnd, divisionArea;
		var width = CurrentMap.getWidth();
		var height = CurrentMap.getHeight();
		
		this._divisionAreaArray = [];
		
		// If a map is wide, even if display reinforcements at once, sometimes some parts cannot be seen.
		// So divide the map display range in a certain number and check if the reinforcements are within the range in order with obj.
		y = 0;
		yEnd = 0;
		for (; y < height;) {
			yEnd += this.getRow();
			if (yEnd > height) {
				yEnd = height;
			}
			
			x = 0;
			xEnd = 0;
			for (; x < width;) {
				xEnd += this.getCol();
				if (xEnd > width) {
					xEnd = width;
				}
				
				divisionArea = {};
				divisionArea.x = x;
				divisionArea.y = y;
				divisionArea.xEnd = xEnd;
				divisionArea.yEnd = yEnd;
				this._divisionAreaArray.push(divisionArea);
				
				x = xEnd;
			}
			y = yEnd;
		}
	},
	
	getDivisionAreaArray: function() {
		return this._divisionAreaArray;
	},
	
	setTurnSkipMode: function(isSkipMode) {
		this._isSkipMode = isSkipMode;
		root.setEventSkipMode(isSkipMode);
	},
	
	isTurnSkipMode: function() {
		return this._isSkipMode;
	},
	
	isCompleteSkipMode: function() {
		return this._isSkipMode || root.isEventSkipMode();
	},
	
	isEnemyAcceleration: function() {
		return this._isEnemyAccelerationEnabled;
	},
	
	enableEnemyAcceleration: function(isEnabled) {
		this._isEnemyAccelerationEnabled = isEnabled;
	},
	
	_checkMapBoundaryValue: function(isEnabled) {
		if (isEnabled) {
			if (!DataConfig.isMapEdgePassable()) {
				// Disable one tile if invasion of the map edge is not allowed.
				root.getCurrentSession().setMapBoundaryValue(1);
			}
		}
	}
};

var MapLayer = {
	_counter: null,
	_unitRangePanel: null,
	_mapChipLight: null,
	_markingPanel: null,
	_effectMotion: null,
	
	prepareMapLayer: function() {
		this._counter = createObject(UnitCounter);
		this._unitRangePanel = createObject(UnitRangePanel);
		
		this._mapChipLight = createObject(MapChipLight);
		this._mapChipLight.setLightType(MapLightType.NORMAL);
		
		this._markingPanel = createObject(MarkingPanel);
	},
	
	moveMapLayer: function() {
		this._counter.moveUnitCounter();
		this._unitRangePanel.moveRangePanel();
		this._mapChipLight.moveLight();
		this._markingPanel.moveMarkingPanel();
		
		return MoveResult.END;
	},
	
	drawMapLayer: function() {
		var session;
		
		session = root.getCurrentSession();
		if (session !== null) {
			session.drawMapSet(0, 0);
			if (EnvironmentControl.isMapGrid() && root.isSystemSettings(SystemSettingsType.MAPGRID)) {
				session.drawMapGrid(0x0, 64);
			}
		}
		else {
			root.getGraphicsManager().fill(0x0);
		}
		
		this._drawColor(EffectRangeType.MAP);
	},
	
	drawUnitLayer: function() {
		var index = this._counter.getAnimationIndex();
		var index2 = this._counter.getAnimationIndex2();
		var session = root.getCurrentSession();
		
		this._markingPanel.drawMarkingPanel();
		
		this._unitRangePanel.drawRangePanel();
		this._mapChipLight.drawLight();
		
		if (session !== null) {
			session.drawUnitSet(true, true, true, index, index2);
		}
		
		this._drawColor(EffectRangeType.MAPANDCHAR);
		
		if (this._effectRangeType === EffectRangeType.MAPANDCHAR) {
			this._drawScreenColor();
		}
	},
	
	getAnimationIndexFromUnit: function(unit) {
		return this._counter.getAnimationIndexFromUnit(unit);
	},
	
	getUnitRangePanel: function() {
		return this._unitRangePanel;
	},
	
	getMapChipLight: function() {
		return this._mapChipLight;
	},
	
	getMarkingPanel: function() {
		return this._markingPanel;
	},
	
	setEffectMotion: function(motion) {
		this._effectMotion = motion;
	},
	
	_drawColor: function(rangeType) {
		if (this._effectMotion === null) {
			return;
		}
		
		this._drawColorAnime(rangeType);
		
		if (this._effectMotion.getScreenEffectRangeType() === rangeType) {
			this._effectMotion.drawScreenColor();
		}
	},
	
	_drawColorAnime: function(rangeType) {
		if (this._effectMotion === null) {
			return;
		}
		
		if (this._effectMotion.getBackgroundAnimeRangeType() === rangeType) {
			this._effectMotion.drawBackgroundAnime();
		}
	}
};

var MapView = {
	isVisible: function(x, y) {
		return this.isVisiblePixel(x * GraphicsFormat.MAPCHIP_WIDTH, y * GraphicsFormat.MAPCHIP_HEIGHT);
	},
	
	isVisiblePixel: function(xPixel, yPixel) {
		var session = root.getCurrentSession();
		var mx = session.getScrollPixelX();
		var my = session.getScrollPixelY();
		var width = root.getGameAreaWidth();
		var height = root.getGameAreaHeight();
		
		if (mx > xPixel || my > yPixel) {
			return false;
		}
		else if ((mx + width) <= xPixel || (my + height) <= yPixel) {
			return false;
		}
		
		return true;
	},
	
	setScroll: function(x, y) {
		return this.setScrollPixel(x * GraphicsFormat.MAPCHIP_WIDTH, y * GraphicsFormat.MAPCHIP_HEIGHT);
	},
	
	setScrollPixel: function(xPixel, yPixel) {
		var pos = this.getScrollPixelPos(xPixel, yPixel);
		var session = root.getCurrentSession();
		var xScrollPrev = session.getScrollPixelX();
		var yScrollPrev = session.getScrollPixelY();
		
		session.setScrollPixelX(pos.x);
		session.setScrollPixelY(pos.y);

		return xScrollPrev !== pos.x || yScrollPrev !== pos.y;
	},
	
	getScrollPixelPos: function(xPixel, yPixel) {
		var xScroll, yScroll;
		var maxWidth = CurrentMap.getWidth() * GraphicsFormat.MAPCHIP_WIDTH;
		var maxHeight = CurrentMap.getHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		var areaWidth = root.getGameAreaWidth();
		var areaHeight = root.getGameAreaHeight();
		
		xScroll = xPixel - Math.floor(areaWidth / 2);
		
		if (xScroll < 0) {
			xScroll = 0;
		}
		else if (xScroll > maxWidth - areaWidth) {
			xScroll = maxWidth - areaWidth;
		}
		
		yScroll = yPixel - Math.floor(areaHeight / 2);

		if (yScroll < 0) {
			yScroll = 0;
		}
		else if (yScroll > maxHeight - areaHeight) {
			yScroll = maxHeight - areaHeight;
		}
		
		return createPos(xScroll, yScroll);
	},
	
	getScrollableData: function() {
		var isLeft = false;
		var isTop = false;
		var isRight = false;
		var isBottom = false;
		var session = root.getCurrentSession();
		var xScroll = session.getScrollPixelX();
		var yScroll = session.getScrollPixelY();
		var maxWidth = CurrentMap.getWidth() * GraphicsFormat.MAPCHIP_WIDTH;
		var maxHeight = CurrentMap.getHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		var areaWidth = root.getGameAreaWidth();
		var areaHeight = root.getGameAreaHeight();
		
		if (xScroll > 0) {
			isLeft = true;
		}
		
		if (xScroll < maxWidth - areaWidth) {
			isRight = true;
		}
		
		if (yScroll > 0) {
			isTop = true;	
		}
		
		if (yScroll < maxHeight - areaHeight) {
			isBottom = true;
		}
		
		return {
			isLeft: isLeft,
			isTop: isTop,
			isRight: isRight,
			isBottom: isBottom
		};
	},
	
	changeMapCursor: function(x, y) {
		var session = root.getCurrentSession();
		
		session.setMapCursorX(x);
		session.setMapCursorY(y);
		
		this.setScroll(x, y);
		MouseControl.changeCursorFromMap(x, y);
	}
};

var MapHpControl = {
	updateHp: function(unit) {
		ParamBonus.getMhp(unit);
	},
	
	updateHpAll: function() {
		var i, j, count, list, targetUnit;
		var filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY;
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				this.updateHp(targetUnit);
			}
		}
	}
};

var HpDecorationType = {
	FULL: 0,
	NONFULL: 1,
	HALF: 2,
	QUARTER: 3
};

// Notify how to draw HP to game.exe, not draw the HP.
// If drawing process itself is executed by game.exe, it's speeded up more than drawing by script.
var MapHpDecorator = {
	setupDecoration: function() {
		this._setupDecorationFromType(HpDecorationType.FULL);
		this._setupDecorationFromType(HpDecorationType.NONFULL);
		this._setupDecorationFromType(HpDecorationType.HALF);
		this._setupDecorationFromType(HpDecorationType.QUARTER);
	},
	
	_setupDecorationFromType: function(type) {
		var obj = root.getHpDecoration(type);
		var pos = this._getPos();
		var width = 32;
		var height = 10;
		var color = this._getColor(type);
		var alpha = this._getAlpha(type);
		var strokeColor = 0xff;
		var strokeAlpha = 255;
		var hpType = EnvironmentControl.getMapUnitHpType();
		
		obj.beginDecoration();
		
		if (hpType === 0) {
			// The color and outline are set before calling addRectangle.
			obj.setFillColor(color, alpha);
			obj.setStrokeInfo(strokeColor, strokeAlpha, 1, true);
			obj.addRectangle(pos.x, pos.y, width, height);
			
			obj.addHp(pos.x, pos.y, this._getNumberColorIndex(hpType));
		}
		else if (hpType === 1) {
			obj.addGauge(pos.x, pos.y, 1);
		}
		
		obj.endDecoration();
	},
	
	_getColor: function(type) {
		var arr = [0x00ffff, 0x00ff00, 0xffff00, 0xff0000];
		
		return arr[type];
	},
	
	_getAlpha: function(type) {
		return 204;
	},
	
	_getNumberColorIndex: function(type) {
		return 0;
	},
	
	_getPos: function() {
		var x = 1;
		var y = 20;
		
		if (GraphicsFormat.MAPCHIP_WIDTH !== 32 || GraphicsFormat.MAPCHIP_HEIGHT !== 32) {
			x += 8;
			y += 8;
		}
		
		return {
			x: x,
			y: y
		};
	}
};

var SymbolDecorationType = {
	PLAYER: 0,
	ENEMY: 1,
	PARTNER: 2
};

var MapSymbolDecorator = {
	setupDecoration: function() {
		this._setupDecorationFromType(SymbolDecorationType.PLAYER);
		this._setupDecorationFromType(SymbolDecorationType.ENEMY);
		this._setupDecorationFromType(SymbolDecorationType.PARTNER);
	},
	
	_setupDecorationFromType: function(type) {
		var obj = root.getSymbolDecoration(type);
		var color = this._getColor(type);
		var alpha = this._getAlpha(type);
		var pos = this._getPos();
		var width = 32;
		var height = 18;
		
		obj.beginDecoration();
		if (EnvironmentControl.isMapUnitSymbol()) {
			obj.setFillColor(color, alpha);
			obj.setLargeSize(-2, 0, 4, 6);
			obj.addEllipse(pos.x, pos.y, width, height);
		}
		obj.endDecoration();
	},
	
	_getColor: function(type) {
		var arr = [0x5732ec, 0xf0312d, 0x31e640];
		
		return arr[type];
	},
	
	_getAlpha: function(type) {
		return 140;
	},
	
	_getPos: function() {
		var x = 0;
		var y = 20;
		
		if (GraphicsFormat.MAPCHIP_WIDTH !== 32 || GraphicsFormat.MAPCHIP_HEIGHT !== 32) {
			x += 8;
			y += 8;
		}
		
		return {
			x: x,
			y: y
		};
	}
};

var IconDecorationType = {
	STATE: 0,
	FUSION: 1,
	STATEORFUSION: 2,
	CLASSTYPE: 10
};

var MapIconDecorator = {
	setupDecoration: function() {
		var obj = root.getIconDecoration();
		
		obj.beginDecoration();
		
		obj.setCounterMax(this._getCounterMax());
		
		this._addDecorationData(obj);
		
		obj.endDecoration();
	},
	
	_addDecorationData: function(obj) {
		var pos = this._getStatePos();
		
		obj.addObjectType(pos.x, pos.y, IconDecorationType.STATEORFUSION, true);
	},
	
	_getStatePos: function() {
		return {
			x: 12,
			y: -4
		};
	},
	
	_getCounterMax: function() {
		return 16;
	}
};
