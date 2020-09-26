
var ItemUseScreenMode = {
	OPERATION: 0,
	LIST: 1,
	MESSENGER: 2,
	HELP: 3
};

var ItemUseScreen = defineObject(BaseScreen,
{
	_unit: null,
	_unitList: null,
	_itemUseOperationWindow: null,
	_unitItemWindow: null,
	_stockItemWindow: null,
	_itemInfoWindow: null,
	_itemUserWindow: null,
	_unitSimpleWindow: null,
	_dataChanger: null,
	_itemMessenger: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemUseScreenMode.OPERATION) {
			result = this._moveOperation();
		}
		else if (mode === ItemUseScreenMode.LIST) {
			result = this._moveList();
		}
		else if (mode === ItemUseScreenMode.MESSENGER) {
			result = this._moveMessenger();
		}
		else if (mode === ItemUseScreenMode.HELP) {
			result = this._moveHelp();
		}
		
		this._itemUserWindow.moveWindow();
		
		return result;
	},
	
	drawScreenCycle: function() {
		var mode = this.getCycleMode();
		var width = this._getItemListWindow().getWindowWidth() + this._itemUserWindow.getWindowWidth();
		var height = this._itemUserWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._itemUseOperationWindow.drawWindow(x, y);
		this._getItemListWindow().drawWindow(x, y + this._itemUseOperationWindow.getWindowHeight());
		
		if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
			this._drawSubWindow(x, y, this._itemUserWindow.getSkillInteraction().getInteractionWindow());
		}
		else if (mode === ItemUseScreenMode.OPERATION) {
			this._drawSubWindow(x, y, this._unitSimpleWindow);
		}
		else if (mode === ItemUseScreenMode.LIST || mode === ItemUseScreenMode.USECHECK) {
			this._drawSubWindow(x, y, this._itemInfoWindow);
		}
		
		this._itemUserWindow.drawWindow(x + this._getItemListWindow().getWindowWidth(), y);
		
		if (mode === ItemUseScreenMode.MESSENGER) {
			this._itemMessenger.drawMessenger();
		}
	},
	
	drawScreenBottomText: function(textui) {
		var item;
		var mode = this.getCycleMode();
		var text = '';
		
		if (this._itemUserWindow.getSkillInteraction().isInteraction()) {
			text = this._itemUserWindow.getSkillInteraction().getHelpText();
		}
		else if (mode === ItemUseScreenMode.OPERATION) {
			text = StringTable.Marshal_StockOperation;
		}
		else {
			item = this._itemInfoWindow.getInfoItem();
			if (item !== null) {
				text = item.getDescription();
			}
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('ItemUse');
	},
	
	isTargetSelectable: function(index) {
		var count = 0;
		
		if (index === 0) {
			count = this._unitItemWindow.getItemScrollbar().getObjectCount() > 0;
		}
		else if (index === 1) {
			count = this._stockItemWindow.getItemScrollbar().getObjectCount() > 0;
		}
		
		return count > 0;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._unit = screenParam.unit;
		this._unitList = this._createUnitList();
		this._itemUseOperationWindow = createWindowObject(ItemUseOperationWindow, this);
		this._unitItemWindow = createWindowObject(ItemListWindow, this);
		this._stockItemWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this);
		this._itemUserWindow = createWindowObject(ItemUserWindow, this);
		this._unitSimpleWindow = this._createSimpleWindow();
		this._dataChanger = createObject(VerticalDataChanger);
		this._itemMessenger = createObject(ItemMessenger);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._itemUseOperationWindow.setItemUseOperationData();
		this._unitItemWindow.setItemFormation(5);
		this._unitItemWindow.getItemScrollbar().enablePageChange();
		
		this._stockItemWindow.setItemFormation(5);
		this._stockItemWindow.getItemScrollbar().enablePageChange();
		
		this._updateItemAndWindow(-1);
		
		this._processMode(ItemUseScreenMode.OPERATION);
	},
	
	_moveOperation: function() {
		var index;
		var input = this._itemUseOperationWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		index = this._itemUseOperationWindow.getOperationIndex();
		
		if (input === ScrollbarInput.SELECT) {
			if (this.isTargetSelectable(index)) {
				this._processMode(ItemUseScreenMode.LIST);
			}
			else {
				this._playOperationBlockSound();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		else {
			index = this._dataChanger.checkDataIndex(this._unitList, this._unit); 
			if (index !== -1) {
				this._changeData(index);
			}
		}
		
		return result;
	},
	
	_moveList: function() {
		var recentlyInput;
		var input = this._getItemListWindow().moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			if (this._isItemAvailable()) {
				this._itemMessenger.setMessenger(this._unit, this._getItemListWindow().getCurrentItem());
				this._processMode(ItemUseScreenMode.MESSENGER);
			}
			else {
				this._playOperationBlockSound();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._processMode(ItemUseScreenMode.OPERATION);
		}
		else {
			recentlyInput = this._getItemListWindow().getItemScrollbar().getRecentlyInputType();
			if (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT) {
				if (this._itemUserWindow.getSkillInteraction().setHelpMode()) {
					this._processMode(ItemUseScreenMode.HELP);
				}
			}
			else {
				if (this._getItemListWindow().isIndexChanged()) {
					this._itemInfoWindow.setInfoItem(this._getItemListWindow().getCurrentItem());
				}
				
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveMessenger: function() {
		var index;
		
		if (this._itemMessenger.moveMessenger() !== MoveResult.CONTINUE) {
			if (this._itemMessenger.isItemUsed()) {
				this._getItemListWindow().getItemScrollbar().saveScroll();
				this._updateItemAndWindow(this._itemUseOperationWindow.getOperationIndex());
				this._getItemListWindow().getItemScrollbar().restoreScroll();
				
				index = this._itemUseOperationWindow.getOperationIndex();
				if (this.isTargetSelectable(index)) {
					this._processMode(ItemUseScreenMode.LIST);
				}
				else {
					this._processMode(ItemUseScreenMode.OPERATION);
				}
			}
			else {
				this._processMode(ItemUseScreenMode.LIST);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveHelp: function() {
		if (!this._itemUserWindow.getSkillInteraction().isHelpMode()) {
			this._processMode(ItemUseScreenMode.LIST);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawSubWindow: function(x, y, window) {
		var xInfo = (x + this._getItemListWindow().getWindowWidth()) - window.getWindowWidth();
		var yInfo = (y + this._itemUserWindow.getWindowHeight()) - window.getWindowHeight();
		
		window.drawWindow(xInfo, yInfo);
	},
	
	_changeData: function(index) {
		var itemIndex = this._stockItemWindow.getItemIndex();
		var yScroll = this._stockItemWindow.getItemScrollbar().getScrollYValue();
		
		this._unit = this._unitList.getData(index);
		this._updateItemAndWindow(-1);
		
		// The stock window retains the previous position.
		this._stockItemWindow.setItemIndex(itemIndex);
		this._stockItemWindow.getItemScrollbar().setScrollYValue(yScroll);
		
		// The index of the unit window points to the first item.
		this._unitItemWindow.setItemIndex(0);
	},
	
	_updateItemAndWindow: function(index) {
		if (index === 0) {
			this._resetUnitItemArray();
		}
		else if (index === 1) {
			this._deleteFromStock();
			this._resetStockItemArray();
		}
		else {
			// There is a possibility that revive occurs, so rebuild.
			this._unitList = this._createUnitList();
			
			this._resetUnitItemArray();
			this._resetStockItemArray();
		}
		
		this._unitSimpleWindow.setFaceUnitData(this._unit);
		this._itemUserWindow.setItemUserData(this._unit);
	},
	
	_resetUnitItemArray: function() {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(this._unit);
		var unitItemArray = [];
		var unitAvailableArray = [];
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(this._unit, i);
			if (!this._itemMessenger.isItemAllowed(this._unit, item)) {
				continue;
			}
			
			unitItemArray.push(item);
			unitAvailableArray.push(this._itemMessenger.isUsable(this._unit, item));
		}
		
		this._unitItemWindow.getItemScrollbar().setObjectArray(unitItemArray);
		this._unitItemWindow.getItemScrollbar().setAvailableArray(unitAvailableArray);
	},
	
	_resetStockItemArray: function() {
		var i, item;
		var count = StockItemControl.getStockItemCount();
		var stockItemArray = [];
		var stockAvailableArray = [];
		
		for (i = 0; i < count; i++) {
			item = StockItemControl.getStockItem(i);
			if (!this._itemMessenger.isItemAllowed(this._unit, item)) {
				continue;
			}
			
			stockItemArray.push(item);
			stockAvailableArray.push(this._itemMessenger.isUsable(this._unit, item));
		}
		
		this._stockItemWindow.getItemScrollbar().setObjectArray(stockItemArray);
		this._stockItemWindow.getItemScrollbar().setAvailableArray(stockAvailableArray);
	},
	
	_deleteFromStock: function() {
		var i, item;
		var count = StockItemControl.getStockItemCount();
		
		for (i = 0; i < count; i++) {
			item = StockItemControl.getStockItem(i);
			if (item.isWeapon()) {
				continue;
			}
			
			if (ItemControl.isItemBroken(item)) {
				StockItemControl.cutStockItem(i);
				return;
			}
		}
	},
	
	_isItemAvailable: function() {
		var itemIndex = this._getItemListWindow().getItemIndex();
		var arr = this._getItemListWindow().getItemScrollbar().getAvailableArray();
		
		return arr[itemIndex];
	},
	
	_getItemListWindow: function() {
		var index = this._itemUseOperationWindow.getOperationIndex();
		
		return index === 0 ? this._unitItemWindow : this._stockItemWindow;
	},
	
	_playOperationBlockSound: function() {
		MediaControl.soundDirect('operationblock');
	},
	
	_processMode: function(mode) {
		if (mode === ItemUseScreenMode.OPERATION) {
			this._itemUseOperationWindow.enableSelectCursor(true);
			
			this._getItemListWindow().setActive(false);
			this._getItemListWindow().setForceSelect(-1);
		}
		else if (mode === ItemUseScreenMode.LIST) {
			this._getItemListWindow().enableSelectCursor(true);
			this._itemUseOperationWindow.enableSelectCursor(false);
			this._itemInfoWindow.setInfoItem(this._getItemListWindow().getCurrentItem());
		}
		else if (mode === ItemUseScreenMode.MESSENGER) {
			this._getItemListWindow().enableSelectCursor(false);
		}
		else if (mode === ItemUseScreenMode.HELP) {
			this._getItemListWindow().enableSelectCursor(false);
		}
		
		this.changeCycleMode(mode);
	},
	
	_createSimpleWindow: function() {
		var obj;
		
		if (DataConfig.isHighResolution()) {
			obj = createWindowObject(UnitSimpleWindow, this);
		}
		else {
			obj = createWindowObject(UnitSimpleNameWindow, this);
		}
		
		return obj;
	},
	
	_createUnitList: function() {
		return PlayerList.getAliveList();
	}
}
);

var ItemMessengerMode = {
	QUESTION: 0,
	SELECTION: 1,
	USE: 2
};

var ItemMessenger = defineObject(BaseObject,
{
	_unit: null,
	_item: null,
	_questionWindow: null,
	_itemSelection: null,
	_itemUse: null,
	_isUsed: false,
	
	setMessenger: function(unit, item) {
		this._unit = unit;
		this._item = item;
		this._isUsed = false;
		
		if (this._isQuestionRequired()) {
			this._setQuestionData();
		}
		else {
			this._checkSelectionAndUse();
		}
	},
	
	moveMessenger: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemMessengerMode.QUESTION) {
			result = this._moveQuestion();
		}
		else if (mode === ItemMessengerMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === ItemMessengerMode.USE) {
			result = this._moveUse();
		}
		
		return result;
	},
	
	drawMessenger: function() {
		var mode = this.getCycleMode();
		
		if (mode === ItemMessengerMode.QUESTION) {
			this._drawQuestion();
		}
		else if (mode === ItemMessengerMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === ItemMessengerMode.USE) {
			this._drawUse();
		}
	},
	
	isItemUsed: function() {
		return this._isUsed;
	},
	
	isItemAllowed: function(unit, item) {
		if (item.isWeapon()) {
			return false;
		}
		
		if (!this._isItemTypeAllowed(unit, item)) {
			return false;
		}
		
		if (!this._isWandAllowed(unit, item)) {
			return false;
		}
		return true;
	},
	
	isUsable: function(unit, item) {
		return ItemControl.isItemUsable(unit, item) && item.getTargetAggregation().isCondition(unit);
	},
	
	_isItemTypeAllowed: function(unit, item) {
		var result = false;
		var itemType = item.getItemType();
		var rangeType = item.getRangeType();
		
		if (itemType === ItemType.DOPING) {
			result = rangeType === SelectionRangeType.SELFONLY;
		}
		else if (itemType === ItemType.CLASSCHANGE) {
			result = true;
		}
		else if (itemType === ItemType.SKILLGET) {
			result = rangeType === SelectionRangeType.SELFONLY;
		}
		else if (itemType === ItemType.RESURRECTION) {
			result = true;
		}
		else if (itemType === ItemType.DURABILITY) {
			result = rangeType === SelectionRangeType.SELFONLY;
		}
		
		return result;
	},
	
	_isWandAllowed: function(unit, item) {
		return true;
	},
	
	_isQuestionRequired: function() {
		var result = false;
		var itemType = this._item.getItemType();
		
		if (itemType === ItemType.DOPING || itemType === ItemType.SKILLGET) {
			result = true;
		}
		
		return result;
	},
	
	_moveQuestion: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._checkSelectionAndUse();
			}
			else {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveSelection: function() {
		if (this._itemSelection.moveItemSelectionCycle() !== MoveResult.CONTINUE) {
			if (this._itemSelection.isSelection()) {
				this._useItem();
				this.changeCycleMode(ItemMessengerMode.USE);
			}
			else {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveUse: function() {
		if (this._itemUse.moveUseCycle() !== MoveResult.CONTINUE) {
			this._isUsed = true;
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawQuestion: function() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	},
	
	_drawSelection: function() {
		this._itemSelection.drawItemSelectionCycle();
	},
	
	_drawUse: function() {
		this._itemUse.drawUseCycle();
	},
	
	_setQuestionData: function() {
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(StringTable.ItemUse_Question);
		this._questionWindow.setQuestionActive(true);
		this.changeCycleMode(ItemMessengerMode.QUESTION);
	},
	
	_checkSelectionAndUse: function() {
		this._itemSelection = ItemPackageControl.getItemSelectionObject(this._item);
		if (this._itemSelection !== null) {
			if (this._itemSelection.enterItemSelectionCycle(this._unit, this._item) === EnterResult.NOTENTER) {
				this._useItem();
				this.changeCycleMode(ItemMessengerMode.USE);
			}
			else {
				this.changeCycleMode(ItemMessengerMode.SELECTION);
			}
		}
	},
	
	_useItem: function() {
		var itemTargetInfo;
		
		this._itemUse = ItemPackageControl.getItemUseParent(this._item);
		itemTargetInfo = this._itemSelection.getResultItemTargetInfo();
		
		itemTargetInfo.unit = this._unit;
		itemTargetInfo.item = this._item;
		itemTargetInfo.isPlayerSideCall = true;
		this._itemUse.enterUseCycle(itemTargetInfo);
	}
}
);

var ItemUserWindow = defineObject(BaseWindow,
{
	_unit: null,
	_statusScrollbar: null,
	_skillInteraction: null,
	
	initialize: function() {
		this._statusScrollbar = createScrollbarObject(ItemUseStatusScrollbar, this);
		this._skillInteraction = createObject(SkillInteractionLong);
	},
	
	setItemUserData: function(unit) {
		var i;
		var weapon = ItemControl.getEquippedWeapon(unit);
		var arr = SkillControl.getSkillMixArray(unit, weapon, -1, '');
		var count = arr.length;
		var newSkillArray = [];
		
		for (i = 0; i < count; i++) {
			if (!arr[i].skill.isHidden()) {
				newSkillArray.push(arr[i]);
			}
		}
		
		this._skillInteraction.setSkillArray(newSkillArray);
		
		this._statusScrollbar.setStatusFromUnit(unit);
		
		this._unit = unit;
	},
	
	moveWindowContent: function() {
		this._statusScrollbar.moveScrollbarContent();
		
		this._skillInteraction.moveInteraction();
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		this._drawTop(x, y);
		
		this._statusScrollbar.drawScrollbar(x, y + 90);
		
		y = y + this.getWindowHeight() - 60;
		this._skillInteraction.getInteractionScrollbar().drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return ItemRenderer.getItemWindowWidth() + 20;
	},
	
	getWindowHeight: function() {
		return DataConfig.isHighResolution() ? 400 : 320;
	},
	
	getSkillInteraction: function() {
		return this._skillInteraction;
	},
	
	_drawTop: function(x, y) {
		this._drawClass(x, y);
		this._drawClassName(x, y);
		this._drawUnitLevel(x, y);
		this._drawUnitHp(x, y);
	},
	
	_drawClass: function(xBase, yBase) {
		var x = xBase + 42;
		var y = yBase + 10;
		
		UnitRenderer.drawDefaultUnit(this._unit, x, y, null);
	},
	
	_drawClassName: function(xBase, yBase) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var cls = this._unit.getClass();
		var range = createRangeObject(xBase, yBase + 47, 120, 30);
		
		TextRenderer.drawRangeText(range, TextFormat.CENTER, cls.getName(), -1, color, font);
	},
	
	_drawUnitLevel: function(xBase, yBase) {
		var x = xBase + 127;
		var y = yBase + 5;
		
		ContentRenderer.drawLevelInfo(x, y, this._unit);
	},
	
	_drawUnitHp: function(xBase, yBase) {
		var x = xBase + 127;
		var y = yBase + 45;
		var pic = root.queryUI('unit_gauge');
		
		ContentRenderer.drawUnitHpZone(x, y, this._unit, pic);
	}
}
);

var ItemUseOperationWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setItemUseOperationData: function() {
		var arr = [StringTable.ItemUse_Unit, StringTable.ItemUse_Stock];
		
		this._scrollbar = createScrollbarObject(ItemUseOperationScrollbar, this);
		this._scrollbar.setScrollFormation(arr.length, 1);
		this._scrollbar.setObjectArray(arr);
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return ItemRenderer.getItemWindowWidth();
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	getOperationIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}
);

var ItemUseOperationScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var color;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var length = this._getTextLength();
		
		if (this._isEnabled(index)) {
			color = textui.getColor();
		}
		else {
			color = ColorValue.DISABLE;
		}
	
		TextRenderer.drawKeywordText(x, y, object, length, color, font);
	},
	
	playSelectSound: function() {
		var index = this.getIndex();
		var isSelect = this._isEnabled(index);
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	},
	
	getScrollbarWidth: function() {
		return ItemRenderer.getItemWidth();
	},
	
	getObjectWidth: function() {
		return Math.floor(ItemRenderer.getItemWidth() / 3);
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight() - 3;
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	},
	
	_isEnabled: function(index) {
		return this.getParentInstance().getParentInstance().isTargetSelectable(index);
	}
}
);
