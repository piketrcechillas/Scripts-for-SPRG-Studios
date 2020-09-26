
var TalkCheckScreen = defineObject(BaseScreen,
{
	_talkCheckWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		return this._talkCheckWindow.moveWindow();
	},
	
	drawScreenCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._talkCheckWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._talkCheckWindow.getWindowHeight());
		
		this._talkCheckWindow.drawWindow(x, y);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('TalkCheck');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._talkCheckWindow = createWindowObject(TalkCheckWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._talkCheckWindow.setWindowData();
	}
}
);

var TalkCheckWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(50, 7);
		
		this._scrollbar = createScrollbarObject(TalkCheckScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
		
		this._setTalkEventList();
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
		if (this._scrollbar.getObjectCount() === 0) {
			this._drawNoDataText(x, y, this._scrollbar.getScrollbarWidth(), this._scrollbar.getScrollbarHeight());
		}
		else {
			this._scrollbar.drawScrollbar(x, y);
		}
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	_drawNoDataText: function(x, y, width, height) {
		var range;
		var text = StringTable.Communication_NoData;
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		range = createRangeObject(x, y, width, height);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
	},
	
	_setTalkEventList: function() {
		var i, event;
		var arr = EventCommonArray.createArray(root.getCurrentSession().getTalkEventList(), EventType.TALK);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			event = arr[i];
			if (this._isEvent(event)) {
				this._scrollbar.objectSet(event);
			}
		}
		
		this._scrollbar.objectSetEnd();
	},
	
	_isEvent: function(event) {
		var info = event.getTalkEventInfo();
		
		if (!event.isEvent()) {
			return false;
		}
		
		if (info.getDestUnit() === null) {
			return false;
		}
		
		return info.isSrcActive() || info.getSrcUnit() !== null;
	}
}
);

var TalkCheckScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawLeft(x, y, object, isSelect, index);
		this._drawRight(x, y, object, isSelect, index);
		this._drawMiddle(x, y, object, isSelect, index);
	},
	
	getObjectWidth: function() {
		return 450;
	},
	
	getObjectHeight: function() {
		return 50;
	},
	
	_drawLeft: function(x, y, object, isSelect, index) {
		var unit = object.getTalkEventInfo().getSrcUnit();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var range = this._getTextRange(x, y);
		var alpha = 255;
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var isSrcActive = object.getTalkEventInfo().isSrcActive();
		
		if (!this._isSelectable(object)) {
			alpha = 128;
			color = ColorValue.DISABLE;
		}
		
		if (!isSrcActive) {
			unitRenderParam.alpha = alpha;
			UnitRenderer.drawDefaultUnit(unit, x + this._getMarginX(), y + 10, unitRenderParam);
		}
		
		TextRenderer.drawRangeAlphaText(range, TextFormat.LEFT, isSrcActive ? StringTable.PlayerActive : unit.getName(), -1, color, alpha, font);
	},
	
	_drawRight: function(x, y, object, isSelect, index) {
		var unit = object.getTalkEventInfo().getDestUnit();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var range = this._getTextRange(x, y);
		var alpha = 255;
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (!this._isSelectable(object)) {
			alpha = 128;
			color = ColorValue.DISABLE;
		}
		
		x += (this.getObjectWidth() + (DefineControl.getWindowXPadding() * 2)) - this._getSize();
		
		unitRenderParam.alpha = alpha;
		UnitRenderer.drawDefaultUnit(unit, x - this._getMarginX(), y + 10, unitRenderParam);
		
		TextRenderer.drawRangeAlphaText(range, TextFormat.RIGHT, unit.getName(), -1, color, alpha, font);
	},
	
	_drawMiddle: function(x, y, object, isSelect, index) {
		var textui, pic;
		var width = TitleRenderer.getTitlePartsWidth();
		
		if (object.getTalkEventInfo().isMutual()) {
			textui = root.queryTextUI('bidirectional_title');
		}
		else {
			textui = root.queryTextUI('arrow_title');
		}
		
		pic = textui.getUIImage();
		if (pic !== null) {
			x += Math.floor(this.getScrollbarWidth() / 2) - Math.floor((width * 3) / 2);
			y -= 5;
			if (!this._isSelectable(object)) {
				pic.setAlpha(128);
			}
			pic.draw(x, y);
		}
		else {
			// If the title is not set, draw the command name.
			this._drawTalkCommand(x, y, object, isSelect, index);
		}
	},
	
	_drawTalkCommand: function(x, y, object, isSelect, index) {
		var text = object.getTalkEventInfo().getCommandText();
		var range = this._getTextRange(x, y);
		var alpha = 255;
		var textui = this.getParentTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		
		if (!this._isSelectable(object)) {
			alpha = 128;
			color = ColorValue.DISABLE;
		}
		
		TextRenderer.drawRangeAlphaText(range, TextFormat.CENTER, '<' + text + '>', -1, color, alpha, font);
	},
	
	_isSelectable: function(object) {
		if (object === null) {
			return false;
		}
		
		return object.getExecutedMark() === EventExecutedType.FREE;
	},
	
	_getTextRange: function(x, y) {
		var dx = this._getSize();
		var width = this.getObjectWidth() - (dx * 2) - (this._getMarginX() * 2);
		
		return createRangeObject(x + this._getMarginX() + dx, y, width, this.getObjectHeight());
	},
	
	_getMarginX: function(x, y) {
		return 20;
	},
	
	_getSize: function() {
		return 56;
	}
}
);
