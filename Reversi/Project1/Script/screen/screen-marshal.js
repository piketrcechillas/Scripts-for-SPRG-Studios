
var MarshalScreenMode = {
	TOP: 0,
	OPEN: 1
};

var MarshalInfoWindowType = {
	ITEM: 0,
	UNIT: 1
};

var MarshalScreen = defineObject(BaseScreen,
{
	_unitList: null,
	_unitSelectWindow: null,
	_marshalCommandWindow: null,
	_itemListWindow: null,
	_unitSimpleWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === MarshalScreenMode.TOP) {
			result = this._moveTopMode();
		}
		else if (mode === MarshalScreenMode.OPEN) {
			result = this._moveOpenMode();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var object;
		var mode = this.getCycleMode();
		
		this._drawLeftWindow();
		
		if (mode === MarshalScreenMode.OPEN) {
			object = this._marshalCommandWindow.getObject();
			object.drawCommand();
			
			this._drawSubWindow();
		}
		
		this._drawRightWindow();
	},
	
	drawScreenBottomText: function(textui) {
		var object = this._marshalCommandWindow.getObject();
		var text = object.getMarshalDescription();
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('UnitMarshal');
	},

	getUnitSelectWindow: function() {
		return this._unitSelectWindow;
	},
	
	notifyChildScreenClosed: function() {
		var object = this._marshalCommandWindow.getObject();
		
		object.notifyScreenClosed();
	},
	
	updateSubWindow: function() {
		var unit = this._unitSelectWindow.getCurrentUnit();
		
		this._itemListWindow.setUnitMaxItemFormation(unit);
		this._unitSimpleWindow.setFaceUnitData(unit);
	},
	
	updateUnitList: function() {
		this._unitList = this._createUnitList();
		this._unitSelectWindow.changeUnitList(this._unitList);
	},
	
	getUnitList: function() {
		return this._unitList;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._unitList = this._createUnitList();
		this._unitSelectWindow = createWindowObject(UnitSelectWindow, this);
		this._marshalCommandWindow = createWindowObject(MarshalCommandWindow, this);
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._unitSimpleWindow = createWindowObject(UnitSimpleWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._marshalCommandWindow.setMarshalCommandData();
		this._marshalCommandWindow.enableSelectCursor(true);
	
		this._itemListWindow.setDefaultItemFormation();
		
		this._unitSelectWindow.setInitialList(this._unitList);
		this.changeCycleMode(MarshalScreenMode.TOP);
	},
	
	_moveTopMode: function() {
		var object;
		var input = this._marshalCommandWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			this._marshalCommandWindow.enableSelectCursor(false);
		
			object = this._marshalCommandWindow.getObject();
			object.openCommand();
			
			this.updateSubWindow();
			
			this.changeCycleMode(MarshalScreenMode.OPEN);
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		
		return result;
	},
	
	_moveOpenMode: function() {
		var object = this._marshalCommandWindow.getObject();
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			this._unitSelectWindow.setActive(false);
			this._marshalCommandWindow.enableSelectCursor(true);
			this.changeCycleMode(MarshalScreenMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawLeftWindow: function() {
		var width = this._marshalCommandWindow.getWindowWidth() + this._unitSelectWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = this._getStartY();
		
		this._marshalCommandWindow.drawWindow(x, y);
	},
	
	_drawRightWindow: function() {
		var width = this._marshalCommandWindow.getWindowWidth() + this._unitSelectWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = this._getStartY();
		
		x += this._marshalCommandWindow.getWindowWidth();
		this._unitSelectWindow.drawWindow(x, y);
	},
	
	_drawSubWindow: function() {
		var x, y, width, subWindow;
		var object = this._marshalCommandWindow.getObject();
		
		if (object.isMarshalScreenOpened())	{
			return;
		}
		
		if (object.getInfoWindowType() === MarshalInfoWindowType.ITEM) {
			subWindow = this._itemListWindow;
		}
		else {
			subWindow = this._unitSimpleWindow;
		}
		
		width = this._marshalCommandWindow.getWindowWidth() + this._unitSelectWindow.getWindowWidth();
		y = this._getStartY() + this._unitSelectWindow.getWindowHeight() - subWindow.getWindowHeight();
		x = LayoutControl.getCenterX(-1, width);
		x += (this._marshalCommandWindow.getWindowWidth() - subWindow.getWindowWidth());
		
		subWindow.drawWindow(x, y);
	},
	
	_getStartY: function() {
		return LayoutControl.getCenterY(-1, this._unitSelectWindow.getWindowHeight());
	},
	
	_createUnitList: function() {
		return PlayerList.getAliveList();
	}
}
);

var MarshalBaseMode = {
	UNITSELECT: 0,
	SCREEN: 1
};

var MarshalBaseCommand = defineObject(BaseObject,
{	
	_unitSelectWindow: null,
	_parentMarshalScreen: null,
	
	openCommand: function() {
		this._unitSelectWindow.setActive(true);
		this._unitSelectWindow.setSingleMode();
	},
	
	moveCommand: function() {
		var result = MoveResult.CONTINUE;
		var mode = this.getCycleMode();
		
		if (mode === MarshalBaseMode.UNITSELECT) {
			result = this._moveUnitSelect();
		}
		else if (mode === MarshalBaseMode.SCREEN) {
			result = this._moveScreen();
		}
		
		return result;
	},
	
	isMarshalScreenOpened: function() {
		return this.getCycleMode() === MarshalBaseMode.SCREEN;
	},
	
	drawCommand: function() {
	},
	
	checkCommand: function() {
		return true;
	},
	
	getCommandName: function() {
		return '';
	},
	
	getMarshalDescription: function() {
		return '';
	},
	
	setUnitSelectWindow: function(unitSelectWindow) {
		this._unitSelectWindow = unitSelectWindow;
	},
	
	notifyScreenClosed: function() {
		this._parentMarshalScreen.updateSubWindow();
	},
	
	_moveUnitSelect: function() {
		var result = this._unitSelectWindow.moveWindow();
		
		if (this._unitSelectWindow.isIndexChanged()) {
			this._parentMarshalScreen.updateSubWindow();
		}
		
		if (result !== MoveResult.CONTINUE) {
			if (!this.checkCommand()) {
				this._closeCommand();
				return MoveResult.END;
			}
			
			this._unitSelectWindow.setActive(false);
			this.changeCycleMode(MarshalBaseMode.SCREEN);
			
			return MoveResult.CONTINUE;
		}
		
		return result;
	},
	
	_moveScreen: function() {
		if (this.isMarshalScreenCloesed()) {
			this.changeCycleMode(MarshalBaseMode.UNITSELECT);
			this._closeCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_closeCommand: function() {
	}
}
);

var MarshalCommand = {};

MarshalCommand.StockTrade = defineObject(MarshalBaseCommand,
{
	_stockItemTradeScreen: null,
	
	checkCommand: function() {
		var screenParam = this._createScreenParam();
			
		// The unit isn't set, it means that it was canceled, so end to process.
		if (screenParam.unit === null) {
			return false;
		}
		
		this._stockItemTradeScreen = createObject(DataConfig.isStockTradeWeaponTypeAllowed() ? CategoryStockItemTradeScreen : StockItemTradeScreen);
		SceneManager.addScreen(this._stockItemTradeScreen, screenParam);
		
		return true;
	},
	
	isMarshalScreenCloesed: function() {
		return SceneManager.isScreenClosed(this._stockItemTradeScreen);
	},
	
	getInfoWindowType: function() {
		return MarshalInfoWindowType.ITEM;
	},
	
	getCommandName: function() {
		return root.queryCommand('stockexchange_marshalcommand');
	},
	
	getMarshalDescription: function() {
		return StringTable.Marshal_StockTrade;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildStockItemTrade();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.unitList = this._parentMarshalScreen.getUnitList();
		
		return screenParam;
	}
}
);

MarshalCommand.ItemTrade = defineObject(MarshalBaseCommand,
{
	_unitItemTradeScreen: null,
	
	openCommand: function() {
		this._unitSelectWindow.setActive(true);
		this._unitSelectWindow.setDoubleMode();
	},
	
	checkCommand: function() {
		var screenParam = this._createScreenParam();
			
		if (screenParam.unit === null || screenParam.targetUnit === null) {
			return false;
		}
		
		if (screenParam.unit === screenParam.targetUnit) {
			this._unitSelectWindow.cancelDoubleMode();
			return true;
		}
		
		this._unitItemTradeScreen = createObject(UnitItemTradeScreen);
		SceneManager.addScreen(this._unitItemTradeScreen, screenParam);
		
		return true;
	},
	
	isMarshalScreenCloesed: function() {
		return SceneManager.isScreenClosed(this._unitItemTradeScreen);
	},
	
	getInfoWindowType: function() {
		return MarshalInfoWindowType.ITEM;
	},
	
	getCommandName: function() {
		return root.queryCommand('itemexchange_marshalcommand');
	},
	
	getMarshalDescription: function() {
		return StringTable.Marshal_ItemTrade;
	},
	
	notifyScreenClosed: function() {
		// Call cancelDoubleMode first.
		this._unitSelectWindow.cancelDoubleMode();
		this._parentMarshalScreen.updateSubWindow();
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildUnitItemTrade();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.targetUnit = this._unitSelectWindow.getSecondUnit();
		
		return screenParam;
	}
}
);

MarshalCommand.UnitSort = defineObject(MarshalBaseCommand,
{	
	openCommand: function() {
		this._unitSelectWindow.setActive(true);
		this._unitSelectWindow.setDoubleMode();
	},
	
	checkCommand: function() {
		var index, list;
		var unit = this._unitSelectWindow.getFirstUnit();
		var targetUnit = this._unitSelectWindow.getSecondUnit();
		
		if (unit === null || targetUnit === null) {
			return false;
		}
		
		list = PlayerList.getMainList();
		list.exchangeUnit(unit, targetUnit);
		
		index = this._unitSelectWindow.getUnitSelectIndex();
		
		// The unit changed to line, update a window.
		this._unitSelectWindow.resetSelectUnit();
		this._unitSelectWindow.updateUnitList(PlayerList.getAliveList());
		this._unitSelectWindow.setUnitSelectIndex(index);
		
		return true;
	},
	
	isMarshalScreenCloesed: function() {
		return true;
	},
	
	getInfoWindowType: function() {
		return MarshalInfoWindowType.UNIT;
	},
	
	getCommandName: function() {
		return root.queryCommand('unitsort_marshalcommand');
	},
	
	getMarshalDescription: function() {
		return StringTable.Marshal_UnitSort;
	},
	
	_moveUnitSelect: function() {
		var result = this._unitSelectWindow.moveWindow();
			
		if (this._unitSelectWindow.getRecentlyInputType() !== InputType.NONE) {
			this._parentMarshalScreen.updateSubWindow();
		}
		
		if (result !== MoveResult.CONTINUE) {
			this.checkCommand();
		}
		
		return result;
	}
}
);

MarshalCommand.UnitStatus = defineObject(MarshalBaseCommand,
{
	_unitMenuScreen: null,
	
	checkCommand: function() {
		var screenParam = this._createScreenParam();
		
		if (screenParam.unit === null) {
			return false;
		}
		
		this._unitMenuScreen = createObject(UnitMenuScreen);
		SceneManager.addScreen(this._unitMenuScreen, screenParam);
		
		return true;
	},
	
	isMarshalScreenCloesed: function() {
		return SceneManager.isScreenClosed(this._unitMenuScreen);
	},
	
	getInfoWindowType: function() {
		return MarshalInfoWindowType.UNIT;
	},
	
	getCommandName: function() {
		return root.queryCommand('unitstatus_marshalcommand');
	},
	
	getMarshalDescription: function() {
		return StringTable.Marshal_UnitStatus;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildUnitMenu();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.enummode = UnitMenuEnum.ALIVE;
		
		return screenParam;
	}
}
);

MarshalCommand.Shop = defineObject(MarshalBaseCommand,
{
	_shopData: null,
	_shopLayoutScreen: null,
	
	checkCommand: function() {
		var screenParam = this._createScreenParam();
			
		if (screenParam.unit === null) {
			return false;
		}
		
		this._shopLayoutScreen = createObject(ShopLayoutScreen);
		this._shopLayoutScreen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._shopLayoutScreen, screenParam);
		
		return true;
	},
	
	isMarshalScreenCloesed: function() {
		return SceneManager.isScreenClosed(this._shopLayoutScreen);
	},
	
	getInfoWindowType: function() {
		return MarshalInfoWindowType.ITEM;
	},
	
	getCommandName: function() {
		return this._shopData.getName();
	},
	
	getMarshalDescription: function() {
		return StringTable.Marshal_Shop;
	},
	
	setShopData: function(shopData) {
		this._shopData = shopData;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildShopLayout();
		var shopData = this._shopData;
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		
		return screenParam;
	}
}
);

MarshalCommand.Bonus = defineObject(MarshalBaseCommand,
{
	_shopData: null,
	_bonusLayoutScreen: null,
	
	checkCommand: function() {
		var screenParam = this._createScreenParam();
		
		if (screenParam.unit === null) {
			return false;
		}
		
		this._bonusLayoutScreen = createObject(BonusLayoutScreen);
		this._bonusLayoutScreen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._bonusLayoutScreen, screenParam);
		
		return true;
	},
	
	isMarshalScreenCloesed: function() {
		return SceneManager.isScreenClosed(this._bonusLayoutScreen);
	},
	
	getInfoWindowType: function() {
		return MarshalInfoWindowType.ITEM;
	},
	
	getCommandName: function() {
		return this._shopData.getName();
	},
	
	getMarshalDescription: function() {
		return StringTable.Marshal_Bonus;
	},
	
	setShopData: function(shopData) {
		this._shopData = shopData;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildBonusLayout();
		var shopData = this._shopData;
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		screenParam.bonusArray = shopData.getBonusNumberArray();
		
		return screenParam;
	}
}
);

MarshalCommand.ItemUse = defineObject(MarshalBaseCommand,
{
	_itemUseScreen: null,
	
	checkCommand: function() {
		var screenParam = this._createScreenParam();
		
		if (screenParam.unit === null) {
			return false;
		}
		
		this._itemUseScreen = createObject(ItemUseScreen);
		SceneManager.addScreen(this._itemUseScreen, screenParam);
		
		return true;
	},
	
	isMarshalScreenCloesed: function() {
		return SceneManager.isScreenClosed(this._itemUseScreen);
	},
	
	getInfoWindowType: function() {
		return MarshalInfoWindowType.ITEM;
	},
	
	getCommandName: function() {
		return root.queryCommand('itemuse_marshalcommand');
	},
	
	getMarshalDescription: function() {
		return StringTable.Marshal_ItemUse;
	},
	
	notifyScreenClosed: function() {
		this._parentMarshalScreen.updateUnitList();
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildItemUse();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		
		return screenParam;
	}
}
);

MarshalCommand.ClassChange = defineObject(MarshalBaseCommand,
{
	_multiClassChangeScreen: null,
	
	openCommand: function() {
		MarshalBaseCommand.openCommand.call(this);
		this._setSelectableArray();
	},
	
	checkCommand: function() {
		var screenParam = this._createScreenParam();
		
		if (screenParam.unit === null) {
			return false;
		}
		
		this._multiClassChangeScreen = createObject(MultiClassChangeScreen);
		SceneManager.addScreen(this._multiClassChangeScreen, screenParam);
		
		return true;
	},
	
	isMarshalScreenCloesed: function() {
		return SceneManager.isScreenClosed(this._multiClassChangeScreen);
	},
	
	getInfoWindowType: function() {
		return MarshalInfoWindowType.UNIT;
	},
	
	getCommandName: function() {
		return root.queryCommand('classchange_marshalcommand');
	},
	
	getMarshalDescription: function() {
		return StringTable.Marshal_ClassChange;
	},
	
	_setSelectableArray: function() {
		var i, unit, classEntryArray;
		var list = this._parentMarshalScreen.getUnitList();
		var count = list.getCount();
		var arr = [];
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			classEntryArray = ClassChangeChecker.getClassEntryArray(unit, false);
			arr.push(classEntryArray.length > 0);
		}
		
		this._unitSelectWindow.getChildScrollbar().setSelectableArray(arr);
	},
	
	_closeCommand: function() {
		this._unitSelectWindow.getChildScrollbar().setSelectableArray(null);
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildMultiClassChange();
		
		screenParam.unit = this._unitSelectWindow.getFirstUnit();
		screenParam.isMapCall = false;
		
		return screenParam;
	}
}
);

var MarshalCommandWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	_objectArray: null,
	
	setMarshalCommandData: function() {
		this._prepareMarshalItem();
		this._createScrollbar();
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
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	getObject: function() {
		return this._scrollbar.getObject();
	},
	
	getIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	},
	
	_prepareMarshalItem: function() {
		var i, count;
		
		this._objectArray = [];
		this._configureMarshalItem(this._objectArray);
		
		count = this._objectArray.length;
		for (i = 0; i < count; i++) {
			this._objectArray[i]._parentMarshalScreen = this.getParentInstance();
			this._objectArray[i].setUnitSelectWindow(this.getParentInstance().getUnitSelectWindow());
		}
	},
	
	_createScrollbar: function() {
		this._scrollbar = createScrollbarObject(MarshalCommandScrollbar, this);
		this._scrollbar.setScrollFormation(1, this._objectArray.length);
		this._scrollbar.setObjectArray(this._objectArray);
	},
	
	_configureMarshalItem: function(groupArray) {
		var isRest = root.getBaseScene() === SceneType.REST;
		
		if (isRest || root.getCurrentSession().isMapState(MapStateType.STOCKSHOW)) {
			groupArray.appendObject(MarshalCommand.StockTrade);
		}
		
		groupArray.appendObject(MarshalCommand.ItemTrade);
		groupArray.appendObject(MarshalCommand.UnitSort);
		groupArray.appendObject(MarshalCommand.UnitStatus);
		
		if (!isRest) {
			if (this._isShopVisible()) {
				this._appendShop(groupArray);
			}
			
			if (this._isBonusVisible()) {
				this._appendBonus(groupArray);
			}
		}
		
		if (DataConfig.isBattleSetupItemUseAllowed()) {
			groupArray.appendObject(MarshalCommand.ItemUse);
		}
		
		if (DataConfig.isBattleSetupClassChangeAllowed()) {
			groupArray.appendObject(MarshalCommand.ClassChange);
		}
	},
	
	_isShopVisible: function() {
		return this._isVisible(CommandLayoutType.UNITMARSHAL, CommandActionType.SHOP);
	},

	_isBonusVisible: function() {
		return this._isVisible(CommandLayoutType.UNITMARSHAL, CommandActionType.BONUS);
	},
	
	_isVisible: function(commandLayoutType, commandActionType) {
		var i, commandLayout;
		var list = root.getBaseData().getCommandLayoutList(commandLayoutType);
		var count = list.getCount();
		var result = false;
		
		for (i = 0; i < count; i++) {
			commandLayout = list.getData(i);
			if (commandLayout.getCommandActionType() === commandActionType) {
				if (commandLayout.getCommandVisibleType() !== CommandVisibleType.HIDE) {
					result = true;
				}
				break;
			}
		}
		
		return result;
	},
	
	_appendShop: function(groupArray) {
		var i, shopData;
		var list = root.getCurrentSession().getCurrentMapInfo().getShopDataList();
		var count = list.getCount();
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			shopData = list.getData(i);
			if (shopData.isShopDisplayable() && shopData.getShopItemArray().length > 0) {
				groupArray.appendObject(MarshalCommand.Shop);
				groupArray[groupArray.length - 1].setShopData(shopData);
			}
		}
	},
	
	_appendBonus: function(groupArray) {
		var i, shopData;
		var list = root.getBaseData().getRestBonusList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			shopData = list.getData(i);
			if (shopData.isShopDisplayable() && shopData.getShopItemArray().length > 0) {
				groupArray.appendObject(MarshalCommand.Bonus);
				groupArray[groupArray.length - 1].setShopData(shopData);
			}
		}
	}
}
);

var MarshalCommandScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var text = object.getCommandName();
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, text, length, color, font);
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
