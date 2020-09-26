
var ChoiceShowEventCommand = defineObject(BaseEventCommand,
{
	_scrollbar: null,
	_messageArray: null,
	_switchArray: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			this._selectItem(this._scrollbar.getIndex());
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
	},
	
	isEventCommandSkipAllowed: function() {
		// Don't allow the skip by pressing the Start.
		return false;
	},
	
	_prepareEventCommandMemberData: function() {
		var i, text, obj;
		var replacer = createObject(VariableReplacer);
		var maxMessageCount = this._getMaxMessageCount();
		var eventCommandData = root.getEventCommandObject();
		
		this._scrollbar = createScrollbarObject(SelectScrollbar, this);
		this._messageArray = [];
		this._switchArray = [];
		this._isTwoLines = eventCommandData.isTwoLines();
		
		for (i = 0; i < maxMessageCount; i++) {
			if (!eventCommandData.isChoiceDisplayable(i)) {
				continue;
			}
			
			text = replacer.startReplace(eventCommandData.getMessage(i));
			if (text.length !== 0) {
				obj = {};
				obj.text = text;
				obj.handle = eventCommandData.getIconResourceHandle(i);
			
				this._messageArray.push(obj);
				this._switchArray.push(eventCommandData.getSelfSwitchId(i));
			}
		}
		
		// Choices are needed to display even if it's a skip mode, so force skip to be suspended.
		this.stopEventSkip();
	},
	
	isTwoLines: function() {
		return this._isTwoLines;
	},
	
	_checkEventCommand: function() {
		if (this._messageArray.length === 0) {
			return false;
		}
		
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		var max;
		var count = 5;
		
		if (this._isTwoLines) {
			max = Math.ceil(this._messageArray.length / 2);
		}
		else {
			max = this._messageArray.length;
		}
		
		if (count > max) {
			count = max;
		}
		
		if (this._isTwoLines) {
			this._scrollbar.setScrollFormation(2, count);
		}
		else {
			this._scrollbar.setScrollFormation(1, count);
		}
		
		this._scrollbar.setObjectArray(this._messageArray);
		this._scrollbar.setActive(true);
	
		return EnterResult.OK;
	},
	
	_selectItem: function(index) {
		var id = this._switchArray[index];
		
		root.setSelfSwitch(id, true);
	},
	
	_getMaxMessageCount: function() {
		return root.getEventCommandObject().getChoiceCount();
	}
}
);

var SelectScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var dx, dy;
		var textui = this.getScrollTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var count = this._getCount();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var textWidth = TextRenderer.getTextWidth(object.text, font);
		var textHeight = TextRenderer.getTextHeight(object.text, font);
		
		TitleRenderer.drawTitle(pic, x, y, width, height, count);
		
		if (!object.handle.isNullHandle()) {
			dx = Math.floor((this.getObjectWidth() - (textWidth + GraphicsFormat.ICON_WIDTH + 4)) / 2);
			dy = Math.floor((height - GraphicsFormat.ICON_HEIGHT) / 2);
			GraphicsRenderer.drawImage(x + dx, y + dy, object.handle, GraphicsType.ICON);
			
			dx += GraphicsFormat.ICON_WIDTH + 4;
		}
		else {
			dx = Math.floor((this.getObjectWidth() - textWidth) / 2);
		}
		
		dy = Math.floor((height - textHeight) / 2);
		TextRenderer.drawText(x + dx, y + dy, object.text, -1, color, font);	
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	playCancelSound: function() {
	},
	
	getObjectWidth: function() {
		var count = this._getCount() + 2;
		
		return count * TitleRenderer.getTitlePartsWidth();
	},
	
	getObjectHeight: function() {
		return TitleRenderer.getTitlePartsHeight();
	},
	
	getScrollTextUI: function() {
		return root.queryTextUI('select_title');
	},
	
	getSpaceX: function() {
		return 20;
	},
	
	getSpaceY: function() {
		return 20;
	},
	
	_getCount: function() {
		var count;
		
		if (this.getParentInstance().isTwoLines()) {
			count = 6;
		}
		else {
			count = 12;
		}
		
		return count;
	}
}
);
