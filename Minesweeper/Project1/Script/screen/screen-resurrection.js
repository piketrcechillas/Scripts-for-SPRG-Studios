
var ResurrectionScreenMode = {
	TOP: 0,
	HELP: 1,
	CHECK: 2,
	EMPTY: 3
};

var ResurrectionScreen = defineObject(BaseScreen,
{
	_unitList: null,
	_selectUnit: null,
	_leftWindow: null,
	_unitMenuTopWindow: null,
	_unitMenuBottomWindow: null,
	_questionWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode !== ResurrectionScreenMode.EMPTY) {
			this._moveAnimation();
		}
		
		if (mode === ResurrectionScreenMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ResurrectionScreenMode.HELP) {
			result = this._moveHelp();
		}
		else if (mode === ResurrectionScreenMode.CHECK) {
			result = this._moveCheck();
		}
		else if (mode === ResurrectionScreenMode.EMPTY) {
			result = this._moveEmpty();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		if (this.getCycleMode() !== ResurrectionScreenMode.EMPTY) {
			this._drawMainWindow();
		}
		else {
			this._drawSubWindow();
		}
	},
	
	drawScreenBottomText: function(textui) {
		var index, unit;
		var text = '';
		var mode = this.getCycleMode();
		var isDefault = false;
		
		if (mode === ResurrectionScreenMode.EMPTY) {
			return;
		}
		else if (mode === ResurrectionScreenMode.CHECK || MouseControl.isMouseMoving()) {
			isDefault = true;
		}
		else if (this._unitMenuTopWindow.isTracingHelp()) {
			text = this._unitMenuTopWindow.getHelpText();
		}
		else if (this._unitMenuBottomWindow.isHelpMode() || this._unitMenuBottomWindow.isTracingHelp()) {
			text = this._unitMenuBottomWindow.getHelpText();
		}
		else {
			isDefault = true;
		}
		
		if (isDefault) {
			index = this._leftWindow.getUnitListIndex();
			unit = this._unitList.getData(index);
			text = unit.getDescription();
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Resurrection');
	},
	
	getResurrectionUnit: function() {
		return this._selectUnit;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._unitList = this._combineDeathList(screenParam);
		this._selectUnit = null;
		this._leftWindow = createWindowObject(ResurrectionListWindow, this);
		this._unitMenuTopWindow = createWindowObject(UnitMenuTopWindow, this);
		this._unitMenuBottomWindow = createWindowObject(UnitMenuBottomWindow, this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._infoWindow = createWindowObject(InfoWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		if (this._unitList.getCount() > 0) {
			this._leftWindow.setResurrectionList(this._unitList);
			this._questionWindow.setQuestionMessage(StringTable.ResurrectionLayout_Question);
			this._unitMenuTopWindow.setUnitMenuData();
			this._unitMenuBottomWindow.setUnitMenuData();
			
			this._setMenuUnit(0);
			
			this.changeCycleMode(ResurrectionScreenMode.TOP);
		}
		else {
			this._infoWindow.setInfoMessage(StringTable.ResurrectionLayout_Empty);
			this.changeCycleMode(ResurrectionScreenMode.EMPTY);
		}
	},
	
	_setMenuUnit: function(index) {
		var unit = this._unitList.getData(index);
		
		this._unitMenuTopWindow.changeUnitMenuTarget(unit);
		this._unitMenuBottomWindow.changeUnitMenuTarget(unit);
	},
	
	_moveTop: function() {
		var recentlyInput;
		var result = MoveResult.CONTINUE;
		var input = this._leftWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._leftWindow.enableSelectCursor(false);
			this._questionWindow.setQuestionActive(true);
			
			// When selecting a possibility of revive, the item information window etc. is not be displayed.
			this._unitMenuBottomWindow.lockTracing(true);
			this.changeCycleMode(ResurrectionScreenMode.CHECK);
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._selectUnit = null;
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.NONE) {
			recentlyInput = this._leftWindow.getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				this._setHelpMode();
			}
			else {
				if (this._leftWindow.isIndexChanged()) {
					this._setMenuUnit(this._leftWindow.getUnitListIndex());
				}
			}
		}
		
		return result;
	},
	
	_moveHelp: function() {
		if (!this._unitMenuBottomWindow.isHelpMode()) {
			this._leftWindow.enableSelectCursor(true);
			this.changeCycleMode(UnitSortieMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveCheck: function() {
		var index;
		
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				index = this._leftWindow.getUnitListIndex();
				this._selectUnit = this._unitList.getData(index);
				return MoveResult.END;
			}
			else {
				this._leftWindow.enableSelectCursor(true);
				this._unitMenuBottomWindow.lockTracing(false);
				this.changeCycleMode(ResurrectionScreenMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEmpty: function() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			this._playCancelSound();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAnimation: function() {
		this._unitMenuTopWindow.moveWindow();
		this._unitMenuBottomWindow.moveWindow();
		
		return MoveResult.CONTINUE;
	},
	
	_drawMainWindow: function() {
		var mode = this.getCycleMode();		
		var width = this._leftWindow.getWindowWidth() + this._unitMenuTopWindow.getWindowWidth();
		var height = this._leftWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		width = this._leftWindow.getWindowWidth();
		height = this._unitMenuTopWindow.getWindowHeight();
		
		this._leftWindow.drawWindow(x, y);
		this._unitMenuTopWindow.drawWindow(x + width, y);
		this._unitMenuBottomWindow.drawWindow(x + width, y + height);
		
		if (mode === ResurrectionScreenMode.CHECK) {
			x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
			this._questionWindow.drawWindow(x, y);
		}
	},
	
	_drawSubWindow: function() {
		var x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
		
		this._infoWindow.drawWindow(x, y);
	},
	
	_setHelpMode: function() {
		if (this._unitMenuBottomWindow.setHelpMode()) {
			this._leftWindow.enableSelectCursor(false);
			this.changeCycleMode(UnitSortieMode.HELP);
		}
	},
	
	_combineDeathList: function(screenParam) {
		var arr = ResurrectionControl.getTargetArray(screenParam.unit, screenParam.item);
		var list = StructureBuilder.buildDataList();
		
		list.setDataArray(arr);
		
		return list;
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	}
}
);

var ResurrectionListWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	_unitList: null,
	
	setResurrectionList: function(unitList) {
		this._unitList = unitList;
		
		this._scrollbar = createScrollbarObject(ResurrectionListScrollbar, this);
		this._scrollbar.setScrollFormation(1, 10);
		this._scrollbar.setDataList(unitList);
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
		return DefineControl.getFaceWindowHeight() + DefineControl.getUnitMenuBottomWindowHeight();
	},
	
	getUnitListIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	getRecentlyInputType: function() {
		return this._scrollbar.getRecentlyInputType();
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}
);

var ResurrectionListScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		
		TextRenderer.drawKeywordText(x, y, object.getName(), length, color, font);
	},
	
	playSelectSound: function() {
		MediaControl.soundDirect('commandselect');
	},
	
	getObjectWidth: function() {
		return DefineControl.getTextPartsWidth();
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);
