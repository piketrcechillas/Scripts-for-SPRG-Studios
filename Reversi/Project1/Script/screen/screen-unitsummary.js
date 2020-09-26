
var UnitSummaryScreen = defineObject(BaseScreen,
{
	_summaryWindow: null,
	_pageChanger: null,
	_playerList: null,
	_isMapCall: false,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		this._pageChanger.movePage();
		
		if (this._pageChanger.checkPage()) {
			this._changeUnitList();
		}
		
		return this._summaryWindow.moveWindow();
	},
	
	drawScreenCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._summaryWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._summaryWindow.getWindowHeight());
		
		this._summaryWindow.drawWindow(x, y);
		this._pageChanger.drawPage(x, y);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('UnitSummary');
	},
	
	isPlayerOnly: function() {
		return !this._isMapCall;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._summaryWindow = createWindowObject(UnitSummaryWindow, this);
		this._pageChanger = createObject(HorizontalPageChanger);
		this._playerList = screenParam.isMapCall ? PlayerList.getSortieOnlyList() : PlayerList.getMainList();
		this._isMapCall = screenParam.isMapCall;
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._summaryWindow.setSummaryWindowData();
		this._summaryWindow.setSummaryPage(this._playerList);
		
		this._pageChanger.setPageData(this._getPageCount(), this._summaryWindow.getWindowWidth(), this._summaryWindow.getWindowHeight());
	},
	
	_changeUnitList: function() {
		var list;
		var index = this._pageChanger.getPageIndex();
		
		if (index === 0) {
			list = this._playerList;
		}
		else if (index === 1) {
			list = EnemyList.getMainList();
			if (list.getCount() === 0) {
				list = AllyList.getMainList();
			}
		}
		else if (index === 2) {
			list = AllyList.getMainList();
			if (list.getCount() === 0) {
				list = PlayerList.getMainList();
			}
		}
		else {
			return;
		}
		
		this._summaryWindow.setSummaryPage(list);
	},
	
	_getPageCount: function() {
		var list;
		var count = 1;
		
		if (this._isMapCall) {
			list = EnemyList.getMainList();
			if (list.getCount() > 0) {
				count++;
			}
			
			list = AllyList.getMainList();
			if (list.getCount() > 0) {
				count++;
			}
		}
		
		return count;
	}
}
);

var UnitSummaryWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setSummaryWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(50, 8);
		
		this._scrollbar = createScrollbarObject(UnitSummaryScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
	},
	
	setSummaryPage: function(unitList) {
		this._scrollbar.setDataList(unitList);
	},
	
	moveWindowContent: function() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
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
	}
}
);

var UnitSummaryScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawLeft(x, y, object, isSelect, index);
		this._drawRight(x, y, object, isSelect, index);
	},
	
	getObjectWidth: function() {
		return 520 + HorizontalLayout.OBJECT_WIDTH;
	},
	
	getObjectHeight: function() {
		return 50;
	},
	
	_drawLeft: function(x, y, unit, isSelect, index) {
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		unitRenderParam.alpha = this._getUnitAlpha(unit);
		UnitRenderer.drawDefaultUnit(unit, x, y + 10, unitRenderParam);
		
		TextRenderer.drawKeywordText(x + 50, y + 15, unit.getName(), this._getNameLength(), color, font);
		
		NumberRenderer.drawRightNumberColor(x + 180, y + 15, unit.getId(), this._getColorIndexFromUnit(unit), 255);
	},
	
	_drawRight: function(x, y, unit, isSelect, index) {
		var i, color, range;
		var dx = 265;
		var arr = [StringTable.UnitSummary_Alive, StringTable.UnitSummary_Death, StringTable.UnitSummary_Erase, StringTable.UnitSummary_Immortal];
		var count = arr.length;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		
		if (Miscellaneous.isInjuryAllowed(unit)) {
			arr[1] = StringTable.UnitSummary_Injury;
		}
		
		for (i = 0; i < count; i++) {
			if (this._isStateEnabled(unit, i)) {
				color = ColorValue.KEYWORD;
			}
			else {
				color = ColorValue.DISABLE;
			}
			
			range = createRangeObject(x + dx, y + 15, this._getWidth(), 23);
			TextRenderer.drawRangeText(range, TextFormat.CENTER, arr[i], -1, color, font);
			dx += this._getWidth() + 5;
		}
	},
	
	_isStateEnabled: function(unit, index) {
		var isEnabled = false;
		
		if (index === 0) {
			isEnabled = unit.getAliveState() === AliveType.ALIVE;
		}
		else if (index === 1) {
			if (Miscellaneous.isInjuryAllowed(unit)) {
				isEnabled = unit.getAliveState() === AliveType.INJURY;
			}
			else {
				isEnabled = unit.getAliveState() === AliveType.DEATH;
			}
		}
		else if (index === 2) {
			isEnabled = unit.getAliveState() === AliveType.ERASE;
		}
		else if (index === 3) {
			isEnabled = unit.isImmortal();
		}
		
		return isEnabled;
	},
	
	_getWidth: function() {
		return 55 + HorizontalLayout.OBJECT_SPACE;
	},
	
	_getNameLength: function() {
		return 150;
	},
	
	_getColorIndexFromUnit: function(unit) {
		var colorIndex = 1;
		
		if (unit.getUnitType() === UnitType.ENEMY) {
			colorIndex = 3;
		}
		else if (unit.getUnitType() === UnitType.ALLY) {
			colorIndex = 2;
		}
		
		return colorIndex;
	},
	
	_getUnitAlpha: function(unit) {
		var aliveType = unit.getAliveState();
		var sortieType = unit.getSortieState();
		var alpha = 255;
		
		if (this.getParentInstance().getParentInstance().isPlayerOnly()) {
			if (aliveType !== AliveType.ALIVE) {
				alpha = 80;
			}
		}
		else {
			if (sortieType !== SortieType.SORTIE || aliveType !== AliveType.ALIVE) {
				alpha = 80;
			}
		}
		
		return alpha;
	}
}
);
