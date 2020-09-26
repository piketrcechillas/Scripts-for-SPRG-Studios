
var UnitSelectMode = {
	SINGLE: 0,
	DOUBLE: 1,
	MENU: 2,
	NONE:3
};

var UnitSelectWindow = defineObject(BaseWindow,
{
	_returnmode: 0,
	_scrollbar: null,
	_unitFirst: null,
	_unitSecond: null,
	_indexFirst: 0,
	_unitMenuScreen: null,
	
	setInitialList: function(unitList) {
		var rowCount = LayoutControl.getObjectVisibleCount(77, 6);
		var colCount = root.getGameAreaWidth() > 1000 ? 3 : 2;
		
		this._scrollbar = createScrollbarObject(UnitSelectScrollbar, this);
		this._scrollbar.setScrollFormation(colCount, rowCount);
		this._scrollbar.setDataList(unitList);
		
		this.changeCycleMode(UnitSelectMode.NONE);
	},
	
	changeUnitList: function(unitList) {
		this._scrollbar.setDataList(unitList);
	},
	
	moveWindowContent: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === UnitSelectMode.SINGLE) {
			result = this._moveSingle();
		}
		else if (mode === UnitSelectMode.DOUBLE) {
			result = this._moveDouble();
		}
		else if (mode === UnitSelectMode.MENU) {
			result = this._moveMenu();
		}
		
		return result;
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
	
	getRecentlyInputType: function() {
		return this._scrollbar.getRecentlyInputType();
	},
	
	cancelDoubleMode: function() {
		this._scrollbar.setForceSelect(-1);
		this._scrollbar.setIndex(this._indexFirst);
		this.resetSelectUnit();
	},
	
	resetSelectUnit: function() {
		this._unitFirst = null;
		this._unitSecond = null;
	},
	
	setSingleMode: function() {
		this.changeCycleMode(UnitSelectMode.SINGLE);
		this.resetSelectUnit();
	},
	
	setDoubleMode: function() {
		this.changeCycleMode(UnitSelectMode.DOUBLE);
		this.resetSelectUnit();
	},
	
	getFirstUnit: function() {
		return this._unitFirst;
	},
	
	getSecondUnit: function() {
		return this._unitSecond;
	},
	
	getCurrentUnit: function() {
		return this._scrollbar.getObject();
	},
	
	getUnitSelectIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	setUnitSelectIndex: function(index) {
		this._scrollbar.setIndex(index);
	},
	
	setForceSelect: function(index) {
		this._scrollbar.setForceSelect(index);
	},
	
	setActive: function(isActive) {
		this._scrollbar.setActive(isActive);
	},
	
	updateUnitList: function(unitList) {
		this._scrollbar.setDataList(unitList);
	},
	
	isUnitMenuMode: function() {
		return this.getCycleMode() === UnitSelectMode.MENU;
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	_moveSingle: function() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			this._unitFirst = this._scrollbar.getObject();
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.CANCEL) {
			this.resetSelectUnit();
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.OPTION) {
			this._openMenu();
		}
		
		return result;
	},
	
	_moveDouble: function() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			if (this._unitFirst === null) {
				this._unitFirst = this._scrollbar.getObject();
				this._scrollbar.setForceSelect(this._scrollbar.getIndex());
				this._indexFirst = this._scrollbar.getIndex();
			}
			else {
				this._unitSecond = this._scrollbar.getObject();
				this._scrollbar.setForceSelect(-1);
				result = MoveResult.END;
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._unitFirst === null) {
				result = MoveResult.END;
			}
			else {
				this.cancelDoubleMode();
				this._scrollbar.setForceSelect(-1);
				this._scrollbar.setIndex(this._indexFirst);
				this.resetSelectUnit();
			}
		}
		else if (input === ScrollbarInput.OPTION) {
			this._openMenu();
		}
		
		return result;
	},
	
	_moveMenu: function() {
		var unit, index;
		
		if (SceneManager.isScreenClosed(this._unitMenuScreen)) {
			unit = this._unitMenuScreen.getCurrentTarget();
			
			index = this._scrollbar.getIndexFromObject(unit);
			
			// Set the current unit index because the unit needs to be switched when the menu is displayed.
			this._scrollbar.setIndex(index);
			
			// Get the mode back to the state before entering the menu.
			this.changeCycleMode(this._returnmode);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_openMenu: function() {
		var screenParam = this._createScreenParam();
		
		this._unitMenuScreen = createObject(UnitMenuScreen);
		SceneManager.addScreen(this._unitMenuScreen, screenParam);
		
		// Save so as to get back to the previous mode when the menu is closed.
		this._returnmode = this.getCycleMode();
		
		this.changeCycleMode(UnitSelectMode.MENU);
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildUnitMenu();
		
		screenParam.unit = this._scrollbar.getObject();
		screenParam.enummode = UnitMenuEnum.ALIVE;
		
		return screenParam;
	}
}
);

var UnitSelectScrollbar = defineObject(BaseScrollbar,
{
	_selectableArray: null,
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var range;
		var unit = object;
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var alpha = 255;
		var dx = Math.floor((this.getObjectWidth() - GraphicsFormat.CHARCHIP_WIDTH) / 2) + 16;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this._selectableArray !== null && !this._selectableArray[index]) {
			alpha = 128;
		}
		
		x += dx;
		y += 10;
		unitRenderParam.alpha = alpha;
		UnitRenderer.drawDefaultUnit(unit, x, y, unitRenderParam);
		
		range = createRangeObject(x - 50, y + 30, length, 40);
		TextRenderer.drawRangeAlphaText(range, TextFormat.CENTER, unit.getName(), length, color, alpha, font);
	},
	
	getObjectWidth: function() {
		return 130;
	},
	
	getObjectHeight: function() {
		return 80;
	},
	
	setSelectableArray: function(arr) {
		this._selectableArray = arr;
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);
