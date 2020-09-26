
// Rule:
// 1. When the unit item is full, display the window to send items to the stock.
// 2. However, if the skip or images non display is enabled, display the window without condition.
// 3. If the target to increase the item is the enemy unit, even if it's full, nothing occurs.
// 4. The command to decrease the item can decrease the important item, too.
// 5. When the item in the stock is full, if the item is added, it means to discard the item, however, the important item cannot be discarded.

var ItemChangeMode = {
	NOTICE: 0,
	UNITITEMFULL: 1,
	STOCKITEMFULL: 2
};

var ItemChangeEventCommand = defineObject(BaseEventCommand,
{
	_targetUnit: null,
	_targetItem: null,
	_increaseType: 0,
	_isStockChange: false,
	_isStockSend: false,
	_itemIndex: 0,
	_itemArray: null,
	_itemChangeView: null,
	_unitItemFull: null,
	_stockItemFull: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemChangeMode.NOTICE) {
			result = this._moveNotice();
		}
		else if (mode === ItemChangeMode.UNITITEMFULL) {
			result = this._moveUnitItemFull();
		}
		else if (mode === ItemChangeMode.STOCKITEMFULL) {
			result = this._moveStockItemFull();
		}
		
		return result;
	},
	
	drawEventCommandCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === ItemChangeMode.NOTICE) {
			this._drawNotice();
		}
		else if (mode === ItemChangeMode.UNITITEMFULL) {
			this._drawUnitItemFull();
		}
		else if (mode === ItemChangeMode.STOCKITEMFULL) {
			this._drawStockItemFull();
		}
	},
	
	isEventCommandSkipAllowed: function() {
		// To allow the skip by pressing Start is when the item can be obtained only.
		// If the item is full, the skip is not allowed.
		return this.getCycleMode() === ItemChangeMode.NOTICE && this._isChangeSuccess;
	},
	
	_prepareEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._targetUnit = eventCommandData.getTargetUnit();
		this._targetItem = eventCommandData.getTargetItem();
		this._increaseType = eventCommandData.getIncreaseValue();
		this._isStockChange = eventCommandData.isStockChange();
		this._isStockSend = eventCommandData.isStockSend();
		this._itemIndex = 0;
		this._itemArray = null;
		this._itemChangeView = createWindowObject(ItemChangeNoticeView, this);
		this._unitItemFull = createObject(UnitItemFull);
		this._stockItemFull = createObject(StockItemFull);
	},
	
	_checkEventCommand: function() {
		if (this._targetItem === null) {
			return false;
		}
		
		if (!this._isStockChange) {
			if (this._targetUnit === null) {
				// Regardless of increase/decrease of the unit item, if the unit is enabled, return false.
				return false;
			}
			
			// If trade prohibited, change increase/decrease for the unit to increase/decrease for the stock.
			if (!Miscellaneous.isItemAccess(this._targetUnit)) {
				this._isStockChange = true;
			}
		}
		
		if (this._isStockChange) {
			this._itemArray = ItemChangeControl.changeStockItem(this._targetItem, this._increaseType);
		}
		else {
			// If not the player, cannot send it to the stock.
			if (this._targetUnit.getUnitType() !== UnitType.PLAYER) {
				this._isStockSend = false;
			}
			
			this._itemArray = ItemChangeControl.changeUnitItem(this._targetUnit, this._targetItem, this._increaseType, this._isStockSend);
		}
		
		if (this.isSystemSkipMode() && this._itemArray.length === 0) {
			// If adding item has ended without problem, return false so as not to enter the cycle.
			return false;
		}
		
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		if (this._increaseType !== IncreaseType.ALLRELEASE) {
			this._itemChangeView.setItemChangeData(this._targetItem, this._increaseType);
			this.changeCycleMode(ItemChangeMode.NOTICE);
		}
		else {
			if (!this._checkItemArray()) {
				return EnterResult.NOTENTER;
			}
		}
		
		return EnterResult.OK;
	},
	
	_checkItemArray: function() {
		var item = this._itemArray[this._itemIndex];
		
		if (this._itemIndex === this._itemArray.length) {
			return false;
		}
		
		if (this._isStockChange) {
			this._stockItemFull.setItemFullData(this._targetUnit, item);
			this.changeCycleMode(ItemChangeMode.STOCKITEMFULL);
		}
		else {
			// Even if the item cannot be added, if a target is not the player, end it.
			if (this._targetUnit.getUnitType() !== UnitType.PLAYER) {
				return false;
			}
			else {
				if (StockItemControl.isStockItemSpace()) {
					this._unitItemFull.setItemFullData(this._targetUnit, item);
					this.changeCycleMode(ItemChangeMode.UNITITEMFULL);
				}
				else {
					this._stockItemFull.setItemFullData(this._targetUnit, item);
					this.changeCycleMode(ItemChangeMode.STOCKITEMFULL);
				}
			}
		}
		
		this._itemIndex++;
		
		return true;
	},
	
	_moveNotice: function() {
		if (this._itemChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			if (this._itemArray.length === 0) {
				// Item increase/decrease has ended without problem, so allow to end it.
				return MoveResult.END;
			}
			else {
				if (!this._checkItemArray()) {
					return MoveResult.END;
				}
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveUnitItemFull: function() {
		if (this._unitItemFull.moveWindowManager() !== MoveResult.CONTINUE) {
			if (!this._checkItemArray()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveStockItemFull: function() {
		if (this._stockItemFull.moveWindowManager() !== MoveResult.CONTINUE) {
			if (!this._checkItemArray()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawNotice: function() {
		var x = LayoutControl.getCenterX(-1, this._itemChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._itemChangeView.getNoticeViewHeight());
		
		this._itemChangeView.drawNoticeView(x, y);
	},
	
	_drawUnitItemFull: function() {
		this._unitItemFull.drawWindowManager();
	},
	
	_drawStockItemFull: function() {
		this._stockItemFull.drawWindowManager();
	}
}
);

var ItemChangeNoticeView = defineObject(BaseNoticeView,
{
	_targetItem: null,
	_increaseType: null,
	_titlePartsCount: 0,
	
	setItemChangeData: function(item, type) {
		this._targetItem = item;
		this._increaseType = type;
		
		this._setTitlePartsCount();
		
		if (this._increaseType === IncreaseType.INCREASE) {
			this._playItemGetSound();
		}
	},
	
	drawNoticeViewContent: function(x, y) {
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = this._increaseType === IncreaseType.INCREASE ? StringTable.GetTitle_ItemChange : StringTable.LostTitle_ItemChange;
		var infoColor = this._increaseType === IncreaseType.INCREASE ? ColorValue.KEYWORD : ColorValue.INFO;
		var width = TextRenderer.getTextWidth(text, font) + 5;
		
		TextRenderer.drawKeywordText(x, y, text, -1, infoColor, font);
		ItemRenderer.drawItem(x + width, y, this._targetItem, color, font, false);
	},
	
	getTitlePartsCount: function() {
		return this._titlePartsCount;
	},
	
	_setTitlePartsCount: function() {
		var font = this.getTitleTextUI().getFont();
		var textWidth = TextRenderer.getTextWidth(this._targetItem.getName(), font) + 100 + (TitleRenderer.getTitlePartsWidth() * 2);
		
		this._titlePartsCount = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
	},
	
	_playItemGetSound: function() {
		MediaControl.soundDirect('itemget');
	}
}
);

var ItemChangeHelpWindow = defineObject(BaseWindow,
{
	_messageAnalyzer: null,
	
	setItemHelpData: function(text) {
		var messageAnalyzerParam = this._createMessageAnalyzerParam();
		
		this._messageAnalyzer = createObject(MessageAnalyzer);
		this._messageAnalyzer.setMessageAnalyzerParam(messageAnalyzerParam);
		this._messageAnalyzer.setMessageAnalyzerText(text);
	},
	
	moveWindowContent: function() {
		this._messageAnalyzer.moveMessageAnalyzer();
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		// If there are notifications to say that items are full over several pages,
		// it looks strange. So these strings shouldn't be specified at func. Several pages are not liked,
		// so don't specify the argument about the cursor.
		this._messageAnalyzer.drawMessageAnalyzer(x, y, -1, -1, null);
	},
	
	getWindowWidth: function() {
		return 480;
	},
	
	getWindowHeight: function() {	
		return 80;
	},
	
	_createMessageAnalyzerParam: function() {
		var textui = this.getWindowTextUI();
		var messageAnalyzerParam = StructureBuilder.buildMessageAnalyzerParam();
		
		messageAnalyzerParam.color = textui.getColor();
		messageAnalyzerParam.font = textui.getFont();
		messageAnalyzerParam.messageSpeedType = SpeedType.DIRECT;
		
		return messageAnalyzerParam;
	}
}
);

var ItemChangeTargetItemWindow = defineObject(BaseWindow,
{
	_unit: null,
	_targetItem: null,
	
	setItemTargetData: function(unit, item) {
		this._unit = unit;
		this._targetItem = item;
	},
	
	moveWindowContent: function() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, StringTable.ItemChange_TargetItem, -1, color, font);
		
		if (Miscellaneous.isTradeDisabled(this._unit, this._targetItem)) {
			color = ColorValue.KEYWORD;
		}
		
		y += 30;
		ItemRenderer.drawItem(x, y, this._targetItem, color, font, false);
	},
	
	getWindowWidth: function() {
		return 480 - ItemRenderer.getItemWindowWidth();
	},
	
	getWindowHeight: function() {
		return 100;
	}
}
);

var BaseItemFull = defineObject(BaseWindowManager,
{
	_unit: null,
	_targetItem: null,
	_itemListWindow: null,
	_questionWindow: null,
	_helpWindow: null,
	_targetItemWindow: null,
	
	initialize: function() {
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemListWindow.setDefaultItemFormation();
		this._itemListWindow.enableWarningState(true);
		
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage('');
		
		this._helpWindow = createWindowObject(ItemChangeHelpWindow, this);
		
		this._targetItemWindow = createWindowObject(ItemChangeTargetItemWindow, this);
	},
	
	setItemFullData: function(unit, item) {
		this._unit = unit;
		this._targetItem = item;
		
		this._helpWindow.setItemHelpData(this.getItemFullString());
		this._targetItemWindow.setItemTargetData(unit, item);
	},
	
	moveWindowManager: function() {
		return MoveResult.CONTINUE;
	},
	
	drawWindowManager: function() {
	},
	
	getPositionWindowX: function() {
		var width = this.getTotalWindowWidth();
		
		return LayoutControl.getCenterX(-1, width);
	},
	
	getPositionWindowY: function() {
		var height = this.getTotalWindowHeight();
		
		return LayoutControl.getCenterY(-1, height);
	},
	
	getTotalWindowWidth: function() {
		return this._itemListWindow.getWindowWidth() + this._targetItemWindow.getWindowWidth();
	},
	
	getTotalWindowHeight: function() {
		return this._itemListWindow.getWindowHeight() + this._helpWindow.getWindowHeight();
	},
	
	getItemFullString: function() {
		return '';
	},
	
	drawOtherWindow: function() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var width = this._itemListWindow.getWindowWidth();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);
		this._targetItemWindow.drawWindow(x + width, y);
		
		this._helpWindow.drawWindow(x, y + height);
	},
	
	drawItemQuestionWindow: function() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	},
	
	playOperationBlockSound: function() {
		MediaControl.soundDirect('operationblock');
	}
}
);

var UnitItemFullMode = {
	TOP: 0,
	TRADEQUESTION: 1,
	STOCKQUESTION: 2
};

var UnitItemFull = defineObject(BaseItemFull,
{
	setItemFullData: function(unit, item) {
		BaseItemFull.setItemFullData.call(this, unit, item);
		
		this._itemListWindow.setUnitItemFormation(this._unit);
		this._itemListWindow.setActive(true);
		
		this.changeCycleMode(UnitItemFullMode.TOP);
	},
	
	moveWindowManager: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === UnitItemFullMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === UnitItemFullMode.TRADEQUESTION) {
			result = this._moveTradeQuestion();
		}
		else if (mode === UnitItemFullMode.STOCKQUESTION) {
			result = this._moveStockQuestion();
		}
		
		this._helpWindow.moveWindow();
	
		return result;
	},
	
	drawWindowManager: function() {
		var mode = this.getCycleMode();
		
		this.drawOtherWindow();
		
		if (mode !== UnitItemFullMode.TOP) {
			this.drawItemQuestionWindow();
		}
	},
	
	getItemFullString: function() {
		return StringTable.ItemChange_UnitItemFull;
	},
	
	_moveTop: function() {
		var index, item;
		var input = this._itemListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			index = this._itemListWindow.getItemIndex();
			item = UnitItemControl.getItem(this._unit, index);
			
			if (Miscellaneous.isTradeDisabled(this._unit, item)) {
				this.playOperationBlockSound();
				return MoveResult.CONTINUE;
			}
				
			// Set the window mode to ask if trading for the item.
			this._itemListWindow.enableSelectCursor(false);
			this._questionWindow.setQuestionMessage(StringTable.ItemChange_TradeTitle);
			this._questionWindow.setQuestionActive(true);
			this.changeCycleMode(UnitItemFullMode.TRADEQUESTION);
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (Miscellaneous.isTradeDisabled(this._unit, this._targetItem)) {
				this.playOperationBlockSound();
				return MoveResult.CONTINUE;
			}
			
			// Set the window mode to ask if sending an obtained item to the stock.
			this._itemListWindow.enableSelectCursor(false);
			this._questionWindow.setQuestionMessage(StringTable.ItemChange_StockSendTitle);
			this._questionWindow.setQuestionActive(true);
			this.changeCycleMode(UnitItemFullMode.STOCKQUESTION);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveTradeQuestion: function() {
		var index, item;
		
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				// Possessed item is stored in the stock, and set the obtained item at the empty place.
				index = this._itemListWindow.getItemIndex();
				item = UnitItemControl.getItem(this._unit, index);
				UnitItemControl.setItem(this._unit, index, this._targetItem);
				StockItemControl.pushStockItem(item);
				return MoveResult.END;
			}
			else {
				this._itemListWindow.enableSelectCursor(true);
				this.changeCycleMode(UnitItemFullMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveStockQuestion: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				// Send the obtained item to the stock.
				StockItemControl.pushStockItem(this._targetItem);
				return MoveResult.END;
			}
			else {
				this._itemListWindow.enableSelectCursor(true);
				this.changeCycleMode(UnitItemFullMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}
}
);

var StockItemFullMode = {
	TOP: 0,
	TRADEQUESTION: 1,
	THROWQUESTION: 2
};
				
var StockItemFull = defineObject(BaseItemFull,
{
	setItemFullData: function(unit, item) {
		BaseItemFull.setItemFullData.call(this, unit, item);
		
		this._itemListWindow.setStockItemFormation();
		this._itemListWindow.setActive(true);
		
		this.changeCycleMode(StockItemFullMode.TOP);
	},
	
	moveWindowManager: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === StockItemFullMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === StockItemFullMode.TRADEQUESTION) {
			result = this._moveTradeQuestion();
		}
		else if (mode === StockItemFullMode.THROWQUESTION) {
			result = this._moveThrowQuestion();
		}
		
		this._helpWindow.moveWindow();
		
		return result;
	},
	
	drawWindowManager: function() {
		var mode = this.getCycleMode();
		
		this.drawOtherWindow();
		
		if (mode !== StockItemFullMode.TOP) {
			this.drawItemQuestionWindow();
		}
	},
	
	getItemFullString: function() {
		return StringTable.ItemChange_StockItemFull;
	},
	
	_moveTop: function() {
		var index, item;
		var input = this._itemListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			index = this._itemListWindow.getItemIndex();
			item = StockItemControl.getStockItem(index);
			
			if (Miscellaneous.isTradeDisabled(this._unit, item)) {
				this.playOperationBlockSound();
				return MoveResult.CONTINUE;
			}
			
			// If the item is not important, set a mode to check if it's traded or not.
			if (!item.isImportance()) {
				this._itemListWindow.enableSelectCursor(false);
				this._questionWindow.setQuestionMessage(StringTable.ItemChange_TradeTitle);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(StockItemFullMode.TRADEQUESTION);
			}
			else {
				this._playOperationBlockSound();
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			// If the selected item is not important, set a mode to check if it's discarded or not.
			if (!this._targetItem.isImportance()) {
				this._itemListWindow.enableSelectCursor(false);
				this._questionWindow.setQuestionMessage(StringTable.ItemChange_StockThrowTitle);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(StockItemFullMode.THROWQUESTION);
			}
			else {
				this._playOperationBlockSound();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveTradeQuestion: function() {
		var index, item;
		
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				// Send the target item to the stock.
				index = this._itemListWindow.getItemIndex();
				item = StockItemControl.getStockItem(index);
				StockItemControl.setStockItem(index, this._targetItem);
				this._throwItem(item);
				return MoveResult.END;
			}
			else {
				this._itemListWindow.enableSelectCursor(true);
				this.changeCycleMode(StockItemFullMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveThrowQuestion: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._throwItem(this._targetItem);
				return MoveResult.END;
			}
			else {
				this._itemListWindow.enableSelectCursor(true);
				this.changeCycleMode(StockItemFullMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_throwItem: function(item) {
	},
	
	_playOperationBlockSound: function() {
		MediaControl.soundDirect('operationblock');
	}
}
);
