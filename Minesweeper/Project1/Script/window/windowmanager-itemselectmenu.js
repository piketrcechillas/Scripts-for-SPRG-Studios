
var ItemSelectMenuMode = {
	ITEMSELECT: 0,
	WORK: 1,
	DISCARD: 2
};

var ItemSelectMenuResult = {
	USE: 0,
	CANCEL: 1,
	NONE: 2
};

var ItemSelectMenu = defineObject(BaseWindowManager,
{
	_unit: null,
	_itemListWindow: null,
	_itemInfoWindow: null,
	_itemWorkWindow: null,
	_discardManager: null,
	_forceSelectIndex: -1,
	_isDiscardAction: false,
	
	setMenuTarget: function(unit) {
		this._unit = unit;
		
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this);
		this._itemWorkWindow = createWindowObject(ItemWorkWindow, this);
		this._discardManager = createObject(DiscardManager);
		
		this._itemWorkWindow.setupItemWorkWindow();
		
		this._resetItemList();
		
		this._processMode(ItemSelectMenuMode.ITEMSELECT);
	},
	
	moveWindowManager: function() {
		var mode = this.getCycleMode();
		var result = ItemSelectMenuResult.NONE;
		
		if (mode === ItemSelectMenuMode.ITEMSELECT) {
			result = this._moveItemSelect();
		}
		else if (mode === ItemSelectMenuMode.WORK) {
			result = this._moveWork();
		}
		else if (mode === ItemSelectMenuMode.DISCARD) {
			result = this._moveDiscard();
		}
		
		return result;
	},
	
	drawWindowManager: function() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);

		this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
		
		if (this.getCycleMode() === ItemSelectMenuMode.WORK) {
			this._itemWorkWindow.drawWindow(x + this._itemListWindow.getWindowWidth(), y);
		}
		
		if (this.getCycleMode() === ItemSelectMenuMode.DISCARD) {
			this._discardManager.drawWindowManager();
		}
	},
	
	getTotalWindowWidth: function() {
		return this._itemInfoWindow.getWindowWidth() + this._itemWorkWindow.getWindowWidth();
	},
	
	getTotalWindowHeight: function() {
		return this._itemListWindow.getWindowHeight() + this._getWindowInterval() + this._itemInfoWindow.getWindowHeight();
	},
	
	getPositionWindowX: function() {
		var width = this.getTotalWindowWidth();
		return LayoutControl.getUnitBaseX(this._unit, width);
	},
	
	getPositionWindowY: function() {
		return LayoutControl.getCenterY(-1, 340);
	},
	
	getSelectItem: function() {
		return this._itemListWindow.getCurrentItem();
	},
	
	isDiscardAction: function() {
		return this._isDiscardAction;
	},
	
	isWorkAllowed: function(index) {
		var result = false;
		var item = this._itemListWindow.getCurrentItem();
		
		if (item.isWeapon()) {
			if (index === 0) {
				result = ItemControl.isWeaponAvailable(this._unit, item);
			}
			else if (index === 1) {
				result = !item.isImportance();
			}
		}
		else {
			if (index === 0) {
				result = this._isItemUsable(item);
			}
			else if (index === 1) {
				result = !item.isImportance();
			}
		}
		
		return result;
	},
	
	_moveItemSelect: function() {
		var input = this._itemListWindow.moveWindow();
		var result = ItemSelectMenuResult.NONE;
		
		if (input === ScrollbarInput.SELECT) {
			this._itemWorkWindow.setItemWorkData(this._itemListWindow.getCurrentItem());
			this._processMode(ItemSelectMenuMode.WORK);
		}
		else if (input === ScrollbarInput.CANCEL) {
			ItemControl.updatePossessionItem(this._unit);
			result = ItemSelectMenuResult.CANCEL;
		}
		else {
			if (this._itemListWindow.isIndexChanged()) {
				this._itemInfoWindow.setInfoItem(this._itemListWindow.getCurrentItem());
			}
		}
		
		return result;
	},
	
	_moveWork: function() {
		var index;
		var input = this._itemWorkWindow.moveWindow();
		var result = ItemSelectMenuResult.NONE;
		
		if (input === ScrollbarInput.SELECT) {
			index = this._itemWorkWindow.getWorkIndex();
			if (this.isWorkAllowed(index)) {
				result = this._doWorkAction(index);
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._processMode(ItemSelectMenuMode.ITEMSELECT);
		}
		
		return result;
	},
	
	_moveDiscard: function() {
		var discardResult = this._discardManager.moveWindowManager();
		var result = ItemSelectMenuResult.NONE;
		
		if (discardResult === DiscardWindowResult.DISCARD) {
			this._discardItem();
			if (UnitItemControl.getPossessionItemCount(this._unit) === 0) {
				ItemControl.updatePossessionItem(this._unit);
				result = ItemSelectMenuResult.CANCEL;
			}
			else {
				this._processMode(ItemSelectMenuMode.ITEMSELECT);
			}
		}
		else if (discardResult === DiscardWindowResult.CANCEL) {
			this._processMode(ItemSelectMenuMode.ITEMSELECT);
		}
		
		return result;
	},
	
	_discardItem: function() {
		var index = this._itemListWindow.getItemIndex();
		
		UnitItemControl.cutItem(this._unit, index);
		
		this._resetItemList();
		
		this._isDiscardAction = true;
	},
	
	_doWorkAction: function(index) {
		var item = this._itemListWindow.getCurrentItem();
		var result = ItemSelectMenuResult.NONE;
		
		if (item.isWeapon()) {
			if (index === 0) {
				ItemControl.setEquippedWeapon(this._unit, item);
				this._resetItemList();
				this._processMode(ItemSelectMenuMode.ITEMSELECT);
			}
			else if (index === 1) {
				this._processMode(ItemSelectMenuMode.DISCARD);
			}
		}
		else {
			if (index === 0) {
				result = ItemSelectMenuResult.USE;
			}
			else if (index === 1) {
				this._processMode(ItemSelectMenuMode.DISCARD);
			}
		}
		
		return result;
	},
	
	_isItemUsable: function(item) {
		var obj;
		
		// Wands cannot be used from the item list.
		if (item.isWand()) {
			return false;
		}
		
		if (!ItemControl.isItemUsable(this._unit, item)) {
			return false;
		}
		
		obj = ItemPackageControl.getItemAvailabilityObject(item);
		if (obj === null) {
			return false;
		}
		
		return obj.isItemAvailableCondition(this._unit, item);
	},
	
	_getWindowInterval: function() {
		return 10;
	},
	
	_resetItemList: function() {
		var count = UnitItemControl.getPossessionItemCount(this._unit);
		var visibleCount = 8;
		
		if (count > visibleCount) {
			count = visibleCount;
		}
		
		this._itemListWindow.setItemFormation(count);
		this._itemListWindow.setUnitItemFormation(this._unit);
	},
	
	_processMode: function(mode) {
		if (mode === ItemSelectMenuMode.ITEMSELECT) {
			this._forceSelectIndex = -1;
			this._itemListWindow.enableSelectCursor(true);
		}
		else if (mode === ItemSelectMenuMode.WORK) {
			this._itemListWindow.enableSelectCursor(false);
		
			this._itemWorkWindow.setWorkIndex(0);
			this._itemWorkWindow.enableSelectCursor(true);
		}
		else if (mode === ItemSelectMenuMode.DISCARD) {
			this._discardManager.setDiscardItem(this._itemListWindow.getCurrentItem());
		}
		
		this.changeCycleMode(mode);
	}
}
);

var ItemWorkWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setupItemWorkWindow: function() {
		this._scrollbar = createScrollbarObject(ItemWorkScrollbar, this);
		this._scrollbar.setScrollFormation(1, 2);
	},
	
	setItemWorkData: function(item) {
		var arr;
		
		if (item.isWeapon()) {
			arr = [StringTable.ItemWork_Equipment, StringTable.ItemWork_Discard];
			this._scrollbar.setObjectArray(arr);
		}
		else {
			arr = [StringTable.ItemWork_Use, StringTable.ItemWork_Discard];
			this._scrollbar.setObjectArray(arr);
		}
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
	
	getWorkIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	setWorkIndex: function(index) {
		this._scrollbar.setIndex(index);
	},
	
	enableSelectCursor: function(isActive) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}
);

var ItemWorkScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (!this._isEnabled(index)) {
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
	
	getObjectWidth: function() {
		return 85;
	},
	
	getObjectHeight: function() {
		return 35;
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	},
	
	_isEnabled: function(index) {
		return this.getParentInstance().getParentInstance().isWorkAllowed(index);
	}
}
);
