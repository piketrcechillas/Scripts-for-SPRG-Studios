
var MapEditMode = {
	CURSORMOVE: 0,
	UNITMENU: 1
};

var MapEditResult = {
	UNITSELECT: 0,
	MAPCHIPSELECT: 1,
	MAPCHIPCANCEL: 2,
	NONE: 3
};

var MapEdit = defineObject(BaseObject,
{
	_activeIndex: 0,
	_prevUnit: null,
	_unitMenu: null,
	_mapCursor: null,
	_mapPartsCollection: null,
	_unitRangePanel: null,
	_isMarkingDisabled: false,
	
	openMapEdit: function() {
		this._prepareMemberData();
		this._completeMemberData();
	},
	
	moveMapEdit: function() {
		var mode = this.getCycleMode();
		var result = MapEditResult.NONE;
		
		if (mode === MapEditMode.CURSORMOVE) {
			result = this._moveCursorMove();
		}
		else if (mode === MapEditMode.UNITMENU) {
			result = this._moveUnitMenu();
		}
		
		if (result !== MapEditResult.NONE) {
			// There is a possibility that the unit can be updated with a further caller's operation,
			// so set null so that the previous unit isn't kept to be saved.
			this._prevUnit = null;
		}
		
		return result;
	},
	
	drawMapEdit: function() {
		var mode = this.getCycleMode();
		
		if (mode === MapEditMode.CURSORMOVE) {
			this._mapCursor.drawCursor();
			this._mapPartsCollection.drawMapPartsCollection();
		
			MouseControl.drawMapEdge();
		}
	},
	
	clearRange: function() {
		this._unitRangePanel.setUnit(null);
		this._prevUnit = null;
	},
	
	getEditTarget: function() {
		return this._mapCursor.getUnitFromCursor();
	},
	
	getEditX: function() {
		return this._mapCursor.getX();
	},
	
	getEditY: function() {
		return this._mapCursor.getY();
	},
	
	setCursorPos: function(x, y) {
		this._mapCursor.setPos(x, y);
	},
	
	rebuildMapPartsCollection: function() {
		this._mapPartsCollection.setMapCursor(this._mapCursor);
	},
	
	disableMarking: function(isMarkingDisabled) {
		this._isMarkingDisabled = isMarkingDisabled;
	},
	
	_prepareMemberData: function() {
		this._activeIndex = 0;
		this._prevUnit = null;
		this._unitMenu = null;
		this._mapCursor = createObject(MapCursor);
		this._mapPartsCollection = createObject(MapPartsCollection);
		this._unitRangePanel = MapLayer.getUnitRangePanel();
		this._isMarkingDisabled = false;
	},
	
	_completeMemberData: function() {
		this._mapPartsCollection.setMapCursor(this._mapCursor);
		this.changeCycleMode(MapEditMode.CURSORMOVE);
	},
	
	_moveCursorMove: function() {
		var unit = this._mapCursor.getUnitFromCursor();
		var result = MapEditResult.NONE;
		
		if (InputControl.isSelectAction()) {
			result = this._selectAction(unit);
		}
		else if (InputControl.isCancelAction()) {
			result = this._cancelAction(unit);
		}
		else if (InputControl.isOptionAction()) {
			result = this._optionAction(unit);
		}
		else if (InputControl.isLeftPadAction()) {
			this._changeTarget(false);
		}
		else if (InputControl.isRightPadAction()) {
			this._changeTarget(true);
		}
		else {
			this._mapCursor.moveCursor();
			this._mapPartsCollection.moveMapPartsCollection();
			
			unit = this.getEditTarget();
			
			// Update if the unit is changed.
			if (unit !== this._prevUnit) {
				this._setUnit(unit);
			}
		}
		
		return result;
	},
	
	_selectAction: function(unit) {
		var result;
		
		if (unit !== null) {
			result = MapEditResult.UNITSELECT;
		}
		else {
			result = MapEditResult.MAPCHIPSELECT;
		}
		
		return result;
	},
	
	_cancelAction: function(unit) {
		var result = this._openMenu(unit);
		
		if (result === MapEditResult.MAPCHIPCANCEL) {
			if (!this._isMarkingDisabled && InputControl.getInputType() === InputType.NONE) {
				MapLayer.getMarkingPanel().startMarkingPanel();
			}
		}
		
		return result;
	},
	
	_optionAction: function(unit) {
		return this._openMenu(unit);
	},
	
	_openMenu: function(unit) {
		var screenParam, result;
		
		if (unit !== null) {
			// Process if cancelled on the unit. 
			screenParam = this._createScreenParam();
			this._unitMenu = createObject(UnitMenuScreen);
			SceneManager.addScreen(this._unitMenu, screenParam);
			this.changeCycleMode(MapEditMode.UNITMENU);
			
			result = MapEditResult.NONE;
		}
		else {
			// Return this value if canceled at the place where the unit doesn't exist.
			result = MapEditResult.MAPCHIPCANCEL;
		}
		
		return result;
	},
	
	_moveUnitMenu: function() {
		var unit;
		
		if (SceneManager.isScreenClosed(this._unitMenu)) {
			unit = this._unitMenu.getCurrentTarget();
			this._setFocus(unit);
			this.changeCycleMode(MapEditMode.CURSORMOVE);
		}
		
		return MapEditResult.NONE;
	},
	
	_changeTarget: function(isNext) {
		var unit;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		var index = this._activeIndex;
		
		for (;;) {
			if (isNext) {
				index++;
			}
			else {
				index--;
			}
			
			if (index >= count) {
				index = 0;
			}
			else if (index < 0) {
				index = count - 1;
			}
			
			unit = list.getData(index);
			if (unit === null) {
				break;
			}
			
			if (!unit.isWait())  {
				this._activeIndex = index;
				this._setUnit(unit);
				this._setFocus(unit);
				break;
			}
			
			if (index === this._activeIndex) {
				break;
			}
		}
	},
	
	_setUnit: function(unit) {
		this._unitRangePanel.setUnit(unit);
		this._mapPartsCollection.setUnit(unit);
		this._prevUnit = unit;
	},
	
	_setFocus: function(unit) {
		if (unit.getMapX() === this._mapCursor.getX() && unit.getMapY() === this._mapCursor.getY()) {
			return;
		}
		
		MapView.changeMapCursor(unit.getMapX(), unit.getMapY());
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildUnitMenu();
		
		screenParam.unit = this._mapCursor.getUnitFromCursor();
		screenParam.enummode = UnitMenuEnum.SORTIE;
		
		return screenParam;
	}
}
);

var MapPartsCollection = defineObject(BaseObject,
{
	_mapPartsArray: null,
	
	setMapCursor: function(editObject) {
		var i, count;
		
		this._mapPartsArray = [];
		this._configureMapParts(this._mapPartsArray);
		
		count = this._mapPartsArray.length;
		for (i = 0; i < count; i++) {
			this._mapPartsArray[i].setMapCursor(editObject);
		}
	},
	
	moveMapPartsCollection: function() {
		var i;
		var count = this._mapPartsArray.length;
		
		for (i = 0; i < count; i++) {
			this._mapPartsArray[i].moveMapParts();
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawMapPartsCollection: function() {
		var i;
		var count = this._mapPartsArray.length;
		
		for (i = 0; i < count; i++) {
			this._mapPartsArray[i].drawMapParts();
		}
	},
	
	setUnit: function(unit) {
		var i;
		var count = this._mapPartsArray.length;
		
		for (i = 0; i < count; i++) {
			this._mapPartsArray[i].setUnit(unit);
		}
	},
	
	_getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	_configureMapParts: function(groupArray) {
		if (EnvironmentControl.isMapUnitWindowDetail()) {
			groupArray.appendObject(MapParts.UnitInfo);
		}
		else {
			groupArray.appendObject(MapParts.UnitInfoSmall);
		}
		groupArray.appendObject(MapParts.Terrain);
	}
}
);

var BaseMapParts = defineObject(BaseObject,
{
	_mapCursor: null,
	
	setMapCursor: function(object) {
		this._mapCursor = object;
	},
	
	setUnit: function(unit) {
	},
	
	moveMapParts: function() {
		return MoveResult.END;
	},
	
	drawMapParts: function() {
	},
	
	getMapPartsTarget: function() {
		return this._mapCursor.getUnitFromCursor();
	},
	
	getMapPartsX: function() {
		return this._mapCursor.getX();
	},
	
	getMapPartsY: function() {
		return this._mapCursor.getY();
	},
	
	getIntervalY: function() {
		return 20;
	}
}
);

var MapParts = {};

MapParts.UnitInfo = defineObject(BaseMapParts,
{
	_mhp: 0,
	
	setUnit: function(unit) {
		if (unit !== null) {
			this._mhp = ParamBonus.getMhp(unit);
		}
	},
	
	drawMapParts: function() {
		var x, y, unit;
		
		unit = this.getMapPartsTarget();
		if (unit === null) {
			return;
		}
		
		x = this._getPositionX(unit);
		y = this._getPositionY(unit);
		
		this._drawMain(x, y);
	},
	
	_drawMain: function(x, y) {
		var unit = this.getMapPartsTarget();
		var width = this._getWindowWidth();
		var height = this._getWindowHeight();
		var textui = this._getWindowTextUI();
		var pic = textui.getUIImage();
		
		// When select the unit, the direction is not the front.
		// But at that time, the window isn't displayed so as to show the map clearly.
		if (unit === null || unit.getDirection() !== DirectionType.NULL) {
			return;
		}
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += this._getWindowXPadding();
		y += this._getWindowYPadding();
		this._drawContent(x, y, unit, textui);
	},
	
	_drawContent: function(x, y, unit, textui) {
		UnitSimpleRenderer.drawContentEx(x, y, unit, textui, this._mhp);
	},
	
	_getPositionX: function() {
		return LayoutControl.getRelativeX(10) - 54;
	},
	
	_getPositionY: function(unit) {
		var y = LayoutControl.getPixelY(unit.getMapY());
		var d = root.getGameAreaHeight() / 2;
		var yBase = LayoutControl.getRelativeY(10) - 28;
		var yMin = yBase;
		var yMax = root.getGameAreaHeight() - this._getWindowHeight() - yBase;
		
		return y > d ? yMin : yMax;
	},
	
	_getWindowWidth: function() {
		return ItemRenderer.getItemWindowWidth();
	},
	
	_getWindowHeight: function() {
		return DefineControl.getFaceWindowHeight();
	},
	
	_getWindowXPadding: function() {
		return DefineControl.getFaceXPadding();
	},
	
	_getWindowYPadding: function() {
		return DefineControl.getFaceYPadding();
	},
	
	_getWindowTextUI: function() {
		return root.queryTextUI('face_window');
	}
}
);

MapParts.UnitInfoSmall = defineObject(MapParts.UnitInfo,
{
	_mhp: 0,

	setUnit: function(unit) {
		if (unit !== null) {
			this._mhp = ParamBonus.getMhp(unit);
		}
	},
	
	_drawContent: function(x, y, unit, textui) {
		this._drawName(x, y, unit, textui);
		this._drawInfo(x, y, unit, textui);
	},
	
	_drawName: function(x, y, unit, textui) {
		var length = this._getTextLength();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawText(x, y, unit.getName(), length, color, font);
	},
	
	_drawInfo: function(x, y, unit, textui) {
		var length = this._getTextLength();
		var color = textui.getColor();
		var font = textui.getFont();
		
		y += this.getIntervalY();
		ContentRenderer.drawHp(x, y, unit.getHp(), this._mhp);
	},
	
	_getTextLength: function() {
		return this._getWindowWidth() - DefineControl.getWindowXPadding();
	},
	
	_getWindowWidth: function() {
		return 140;
	},
	
	_getWindowHeight: function() {
		return 72;
	},
	
	_getWindowXPadding: function() {
		return DefineControl.getWindowXPadding();
	},
	
	_getWindowYPadding: function() {
		return DefineControl.getWindowYPadding();
	},
	
	_getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	}
}
);

MapParts.Terrain = defineObject(BaseMapParts,
{
	drawMapParts: function() {
		var x = this._getPositionX();
		var y = this._getPositionY();
		
		this._drawMain(x, y);
	},
	
	_drawMain: function(x, y) {
		var width = this._getWindowWidth();
		var height = this._getWindowHeight();
		var xCursor = this.getMapPartsX();
		var yCursor = this.getMapPartsY();
		var terrain = PosChecker.getTerrainFromPos(xCursor, yCursor);
		var textui = this._getWindowTextUI();
		var pic = textui.getUIImage();
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += this._getWindowXPadding();
		y += this._getWindowYPadding();
		this._drawContent(x, y, terrain);
	},
	
	_drawContent: function(x, y, terrain) {
		var text;
		var textui = this._getWindowTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var length = this._getTextLength();
		
		if (terrain === null) {
			return;
		}
		
		x += 2;
		TextRenderer.drawText(x, y, terrain.getName(), length, color, font);
		
		y += this.getIntervalY();
		this._drawKeyword(x, y, root.queryCommand('avoid_capacity'), terrain.getAvoid());
		
		if (terrain.getDef() !== 0) {
			text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.DEF));
			y += this.getIntervalY();
			this._drawKeyword(x, y, text, terrain.getDef());
		}
		
		if (terrain.getMdf() !== 0) {
			text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.MDF));
			y += this.getIntervalY();
			this._drawKeyword(x, y, text, terrain.getMdf());
		}
	},
	
	_drawKeyword: function(x, y, text, value) {
		ItemInfoRenderer.drawKeyword(x, y, text);
		
		x += 45;
		if (value !== 0) {
			TextRenderer.drawSignText(x, y, value > 0 ? ' + ': ' - ');
			if (value < 0) {
				// Minus cannot be specified for drawNumber, so times -1 to be plus.
				value *= -1;
			}
		}
		x += 40;
		
		NumberRenderer.drawNumber(x, y, value);
	},
	
	_getPartsCount: function(terrain) {
		var count = 0;
		
		count += 3;
		if (terrain.getDef() !== 0) {
			count++;
		}
		
		if (terrain.getMdf() !== 0) {
			count++;
		}
		
		return count;
	},
	
	_getTextLength: function() {
		return this._getWindowWidth() - DefineControl.getWindowXPadding();
	},
	
	_getPositionX: function() {
		var dx = LayoutControl.getRelativeX(10) - 54;
		
		return root.getGameAreaWidth() - this._getWindowWidth() - dx;
	},
	
	_getPositionY: function() {
		var x = LayoutControl.getPixelX(this.getMapPartsX());
		var dx = root.getGameAreaWidth() / 2;
		var y = LayoutControl.getPixelY(this.getMapPartsY());
		var dy = root.getGameAreaHeight() / 2;
		var yBase = LayoutControl.getRelativeY(10) - 28;
		
		if (x > dx && y < dy) {
			return root.getGameAreaHeight() - this._getWindowHeight() - yBase;
		}
		else {
			return yBase;
		}
	},
	
	_getWindowXPadding: function() {
		return DefineControl.getWindowXPadding();
	},
	
	_getWindowYPadding: function() {
		return DefineControl.getWindowYPadding();
	},
	
	_getWindowWidth: function() {
		return 140;
	},
	
	_getWindowHeight: function() {
		var xCursor = this.getMapPartsX();
		var yCursor = this.getMapPartsY();
		var terrain = PosChecker.getTerrainFromPos(xCursor, yCursor);
		
		if (terrain === null) {
			return 0;
		}
		
		return 12 + (this._getPartsCount(terrain) * this.getIntervalY());
	},
	
	_getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	}
}
);
