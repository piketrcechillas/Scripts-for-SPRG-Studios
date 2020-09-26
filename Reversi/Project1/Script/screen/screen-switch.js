
var SwitchScreen = defineObject(BaseScreen,
{
	_switchWindow: null,
	_pageChanger: null,
	_isLocalView: false,
	_localSwitchArray: null,
	_globalSwitchArray: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var result;
		
		this._pageChanger.movePage();
		
		if (this._pageChanger.checkPage()) {
			this._changeSwitchPage();
		}
		
		result = this._switchWindow.moveWindow();
		if (result === MoveResult.END) {
			this._finishSwitchArray(this._localSwitchArray, this._getLocalSwitchTable());
			this._finishSwitchArray(this._globalSwitchArray, this._getGlobalSwitchTable());
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._switchWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._switchWindow.getWindowHeight());
			
		this._switchWindow.drawWindow(x, y);
		this._pageChanger.drawPage(x, y);
	},
	
	drawScreenBottomText: function(textui) {
		var switchTable, text;
		var index = this._switchWindow.getSwitchIndex();
		
		if (this._isLocalView) {
			switchTable = this._getLocalSwitchTable();
		}
		else {
			switchTable = this._getGlobalSwitchTable();
		}
		
		text = switchTable.getSwitchDescription(index);
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Switch');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._switchWindow = createWindowObject(SwitchWindow, this);
		this._pageChanger = createObject(HorizontalPageChanger);
		this._isLocalView = true;
		this._localSwitchArray = [];
		this._globalSwitchArray = [];
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._createSwitchArray(this._localSwitchArray, this._getLocalSwitchTable());
		this._createSwitchArray(this._globalSwitchArray, this._getGlobalSwitchTable());
		
		this._switchWindow.setSwitchWindowData(this._getLocalSwitchTable());
		this._switchWindow.setSwitchPage(this._localSwitchArray);
		this._pageChanger.setPageData(6, this._switchWindow.getWindowWidth(), this._switchWindow.getWindowHeight());
	},
	
	_changeSwitchPage: function() {
		this._isLocalView = !this._isLocalView;
		
		if (this._isLocalView) {
			this._switchWindow.setSwitchPage(this._localSwitchArray, this._getLocalSwitchTable());
		}
		else {
			this._switchWindow.setSwitchPage(this._globalSwitchArray, this._getGlobalSwitchTable());
		}
	},
	
	_createSwitchArray: function(switchArray, switchTable) {
		var i, count, data;
		
		count = switchTable.getSwitchCount();
		for (i = 0; i < count; i++) {
			data = {};
			data.name = switchTable.getSwitchName(i);
			data.isSwitchOn = switchTable.isSwitchOn(i);
			data.handle = switchTable.getSwitchResourceHandle(i);
			switchArray.push(data);
		}
	},
	
	_finishSwitchArray: function(switchArray, switchTable) {
		var i;
		var count = switchArray.length;
		
		for (i = 0; i < count; i++) {
			if (switchArray[i].isSwitchOn !== switchTable.isSwitchOn(i)) {
				switchTable.setSwitch(i, switchArray[i].isSwitchOn);
			}
		}
	},
	
	_getLocalSwitchTable: function() {
		var table;
		
		if (root.getBaseScene() === SceneType.REST) {
			table = root.getCurrentSession().getLocalSwitchTable();
		}
		else {
			table = root.getCurrentSession().getCurrentMapInfo().getLocalSwitchTable();
		}
		
		return table;
	},
	
	_getGlobalSwitchTable: function() {
		return root.getMetaSession().getGlobalSwitchTable();
	}
}
);

var SwitchWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	_objectArray: null,
	_switchTable: null,
	
	setSwitchWindowData: function(switchTable) {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(SwitchScrollbar, this);
		this._scrollbar.setActive(true);
		this._scrollbar.setScrollFormation(1, count);
		
		this._switchTable = switchTable;
	},
	
	setSwitchPage: function(objectArray) {
		this._objectArray = objectArray;
		this._scrollbar.setObjectArray(objectArray);
	},
	
	moveWindowContent: function() {
		var i, count, data;
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			data = this._scrollbar.getObject();
			data.isSwitchOn = !data.isSwitchOn;
		}
		else if (input === ScrollbarInput.CANCEL) {
			count = this._objectArray.length;
			for (i = 0; i < count; i++) {
				if (this._objectArray[i].isSwitchOn !== this._switchTable.isSwitchOn(i)) {
					this._switchTable.setSwitch(i, this._objectArray[i].isSwitchOn);
				}
			}
			
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
	
	getSwitchIndex: function() {
		return this._scrollbar.getIndex();
	}
}
);

var SwitchScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawName(x, y, object, isSelect, index);
		this._drawSwitch(x, y, object, isSelect, index);
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
	
	_drawSwitch: function(x, y, object, isSelect, index) {
		var color, text;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		
		if (object.isSwitchOn) {
			color = ColorValue.KEYWORD;
			text = StringTable.Select_On;
		}
		else {
			color = ColorValue.DISABLE;
			text = StringTable.Select_Off;
		}
		
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
