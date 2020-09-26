
var ShopListScreenMode = {
	TOP: 0,
	SCREEN: 1
};

var ShopListScreen = defineObject(BaseScreen,
{
	_shopListWindow: null,
	_shopItemWindow: null,
	_shopEntryArray: null,
	_stockCountWindow: null,
	_shopScreenLauncher: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ShopListScreenMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ShopListScreenMode.SCREEN) {
			result = this._moveScreen();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var xInfo, yInfo;
		var width = this._shopListWindow.getWindowWidth() + this._shopShelfWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._shopListWindow.getWindowHeight());
		
		this._shopListWindow.drawWindow(x, y);
		this._shopShelfWindow.drawWindow(x + this._shopListWindow.getWindowWidth(), y);
		
		xInfo = (x + width) - this._stockCountWindow.getWindowWidth();
		yInfo = (y - this._stockCountWindow.getWindowHeight());
		this._stockCountWindow.drawWindow(xInfo, yInfo);
	},
	
	drawScreenBottomText: function(textui) {
		var text;
		var entry = this.getCurrentShopEntry();
		
		if (entry.isAvailable) {
			text = entry.data.getDescription();
		}
		else {
			text = '';
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('ShopList');
	},
	
	getCurrentShopEntry: function() {
		return this._shopEntryArray[this._shopListWindow.getListIndex()];
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._shopListWindow = createWindowObject(ShopListWindow, this);
		this._shopShelfWindow = createWindowObject(ShopShelfWindow, this);
		this._stockCountWindow = createWindowObject(StockCountWindow, this);
		this._shopScreenLauncher = this._createScreenLauncher();
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._shopEntryArray = this._getShopEntryArray();
		
		this._shopListWindow.setWindowData();
		this._shopListWindow.setShopLayoutEntryArray(this._shopEntryArray);
		
		this._shopShelfWindow.setShopData(this._shopEntryArray[0].data);
	},
	
	_getShopEntryArray: function() {
		var i, data, entry;
		var arr = [];
		var list = this._getDataList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			entry = StructureBuilder.buildListEntry();
			
			entry.isAvailable = data.isShopDisplayable();
			if (entry.isAvailable) {
				entry.name = data.getName();
			}
			else {
				entry.name = StringTable.HideData_Question;
			}
			entry.data = data;
			
			arr.push(entry);
		}
		
		return arr;
	},
	
	_getDataList: function() {
		return root.getBaseData().getRestShopList();
	},
	
	_createScreenLauncher: function() {
		return createObject(ShopScreenLauncher);
	},
	
	_moveTop: function() {
		var input = this._shopListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startShopScreen();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			if (this._shopListWindow.isIndexChanged()) {
				this._shopShelfWindow.setShopData(this._shopEntryArray[this._shopListWindow.getListIndex()].data);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveScreen: function() {
		var result = this._shopScreenLauncher.moveScreenLauncher();
		
		if (result !== MoveResult.CONTINUE) {
			this._shopShelfWindow.setShopData(this._shopEntryArray[this._shopListWindow.getListIndex()].data);
			this._shopListWindow.enableSelectCursor(true);
			this.changeCycleMode(ShopListScreenMode.TOP);
			return MoveResult.CONTINUE;
		}
		
		return result;
	},
	
	_startShopScreen: function() {
		var entry = this.getCurrentShopEntry();
		
		if (!entry.isAvailable) {
			return;
		}
		
		this._shopScreenLauncher.setShopData(entry.data);
		this._shopScreenLauncher.openScreenLauncher();
		this.changeCycleMode(ShopListScreenMode.SCREEN);
	}
}
);

var ShopListWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(ShopListScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
	},
	
	setShopLayoutEntryArray: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
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
	
	getListIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}
);

var ShopListScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var dx = 0;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var handle = object.data.getIconResourceHandle();
		
		if (object.isAvailable) {
			if (!handle.isNullHandle()) {
				dx = GraphicsFormat.ICON_WIDTH + 6;
				GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
			}
		}
		else {
			color = ColorValue.DISABLE;
		}
		
		TextRenderer.drawKeywordText(x + dx, y, object.name, length, color, font);
	},
	
	playSelectSound: function() {
		var object = this.getObject();
		var isSelect = true;
		
		if (!object.isAvailable) {
			isSelect = false;
		}
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	},
	
	getObjectWidth: function() {
		return DefineControl.getTextPartsWidth() + GraphicsFormat.ICON_WIDTH;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);

var ShopShelfWindow = defineObject(BaseWindow,
{
	_shopData: null,
	_scrollbar: null,
	_shopItemArray: null,
	_inventoryArray: null,
	
	initialize: function() {
		this._scrollbar = createScrollbarObject(ShopShelfScrollbar, this);
	},

	setShopData: function(shopData) {
		var count = LayoutControl.getObjectVisibleCount(ItemRenderer.getItemHeight(), 12);
		
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.enablePageChange();
		
		this._shopData = shopData;
		this._shopItemArray = shopData.getShopItemArray();
		this._inventoryArray = shopData.getInventoryNumberArray();
		
		this._arrangeInventoryArray();
		
		this._scrollbar.setObjectArray(this._shopItemArray);
		this._scrollbar.resetAvailableData();
	},
	
	moveWindowContent: function() {
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		if (this._shopData.isShopDisplayable()) {
			this._scrollbar.drawScrollbar(x, y);
		}
	},
	
	getInventoryArray: function() {
		return this._inventoryArray;
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	_arrangeInventoryArray: function() {
		var i;
		var count = this._inventoryArray.length;
		
		for (;;) {
			count = this._inventoryArray.length;
			for (i = 0; i < count; i++) {
				if (this._inventoryArray[i].getAmount() === -1) {
					this._inventoryArray.splice(i, 1);
					this._shopItemArray.splice(i, 1);
					break;
				}
			}
			
			if (i === count) {
				break;
			}
		}
	}
}
);

var ShopShelfScrollbar = defineObject(BaseScrollbar,
{
	_availableArray: null,
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var item = object;
		var arr = this.getParentInstance().getInventoryArray();
		var amount = arr[index].getAmount();
		
		if (!this._availableArray[index]) {
			// Dim the item which doesn't satisfy the condition.
			color = ColorValue.DISABLE;
		}
		
		ItemRenderer.drawShopItem(x, y, item, color, font, this._getPrice(item), amount);
	},
	
	resetAvailableData: function() {
		var i, item;
		var length = this._objectArray.length;
		
		this._availableArray = [];
		
		for (i = 0; i < length; i++) {
			item = this._objectArray[i];
			if (item !== null) {
				this._availableArray.push(this._isItemBuyable(item));
			}
		}
	},
	
	getObjectWidth: function() {
		return ItemRenderer.getShopItemWidth();
	},
	
	getObjectHeight: function() {
		return ItemRenderer.getItemHeight();
	},
	
	_isItemBuyable: function(item) {
		return true;
	},
	
	_getPrice: function(item) {
		return item.getGold();
	}
}
);


//------------------------------------------------------------------


var BonusListScreen = defineObject(ShopListScreen,
{
	getScreenInteropData: function() {
		return root.queryScreen('BonusList');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._shopListWindow = createWindowObject(ShopListWindow, this);
		this._shopShelfWindow = createWindowObject(BonusShelfWindow, this);
		this._stockCountWindow = createWindowObject(StockCountWindow, this);
		this._shopScreenLauncher = createObject(BonusScreenLauncher);
	},
	
	_getDataList: function() {
		return root.getBaseData().getRestBonusList();
	}
}
);

var BonusShelfWindow = defineObject(ShopShelfWindow,
{
	_bonusArray: null,
	_scrollbar: null,
	
	initialize: function() {
		this._scrollbar = createScrollbarObject(BonusShelfScrollbar, this);
	},

	setShopData: function(shopData) {
		ShopShelfWindow.setShopData.call(this, shopData);
		
		this._bonusArray = shopData.getBonusNumberArray();
	},
	
	getBonusFromItem: function(item) {
		var i;
		var count = this._shopItemArray.length;
			
		for (i = 0; i < count; i++) {
			if (ItemControl.compareItem(this._shopItemArray[i], item)) {
				return this._bonusArray[i];
			}
		}
		
		return 0;
	}
}
);

var BonusShelfScrollbar = defineObject(ShopShelfScrollbar,
{
	_getPrice: function(item) {
		return this.getParentInstance().getBonusFromItem(item);
	}
}
);
