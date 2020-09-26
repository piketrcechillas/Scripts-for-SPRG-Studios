
var VariableScreen = defineObject(BaseScreen,
{
	_variableWindow: null,
	_pageChanger: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var index, table;
		
		this._pageChanger.movePage();
		
		if (this._pageChanger.checkPage()) {
			index = this._pageChanger.getPageIndex();
			table = root.getMetaSession().getVariableTable(index);
			this._variableWindow.setVariablePage(this._createVariableArray(table));
		}
		
		return this._variableWindow.moveWindow();
	},
	
	drawScreenCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._variableWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._variableWindow.getWindowHeight());
		
		this._variableWindow.drawWindow(x, y);
		
		this._pageChanger.drawPage(x, y);
	},
	
	drawScreenBottomText: function(textui) {
		var text;
		var index = this._variableWindow.getVariableIndex();
		var variableTable = root.getMetaSession().getVariableTable(this._activePageIndex);
		
		text = variableTable.getVariableDescription(index);
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Variable');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._variableWindow = createWindowObject(VariableWindow, this);
		this._pageChanger = createObject(HorizontalPageChanger);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._variableWindow.setVariableWindowData();
		this._variableWindow.setVariablePage(this._createVariableArray(root.getMetaSession().getVariableTable(0)));
		this._pageChanger.setPageData(6, this._variableWindow.getWindowWidth(), this._variableWindow.getWindowHeight());
	},
	
	_createVariableArray: function(variableTable) {
		var i, count, data;
		var variableArray = [];
		
		count = variableTable.getVariableCount();
		for (i = 0; i < count; i++) {
			data = {};
			data.name = variableTable.getVariableName(i);
			data.variable = variableTable.getVariable(i);
			data.handle = variableTable.getVariableResourceHandle(i);
			variableArray.push(data);
		}
		
		return variableArray;
	}
}
);

var VariableWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setVariableWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(VariableScrollbar, this);
		this._scrollbar.setActive(true);
		this._scrollbar.setScrollFormation(1, count);
	},
	
	setVariablePage: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
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
	},
	
	getVariableIndex: function() {
		return this._scrollbar.getIndex();
	}
}
);

var VariableScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawName(x, y, object, isSelect, index);
		this._drawVariable(x, y, object, isSelect, index);
		this._drawIcon(x, y, object, isSelect, index);
	},
	
	getObjectWidth: function() {
		return 400;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_drawName: function(x, y, object, isSelect, index) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		x += GraphicsFormat.ICON_WIDTH;
		TextRenderer.drawKeywordText(x, y, object.name, length, color, font);
	},
	
	_drawVariable: function(x, y, object, isSelect, index) {
		var textui = this.getParentTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var text = object.variable;
		
		x += (this.getObjectWidth() - 50);
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	},
	
	_drawIcon: function(x, y, object, isSelect, index) {
		GraphicsRenderer.drawImage(x, y, object.handle, GraphicsType.ICON);
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);
