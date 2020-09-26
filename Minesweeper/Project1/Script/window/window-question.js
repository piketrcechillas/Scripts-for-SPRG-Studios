
var QuestionAnswer = {
	YES: 0,
	NO: 1
};

var QuestionWindow = defineObject(BaseWindow,
{
	_message: '',
	_scrollbar: null,
	_ans: 0,
	_windowWidth: 0,
	
	setQuestionMessage: function(message) {
		this._message = message;
		this._createScrollbar();
		this._calculateWindowSize();
		this.setQuestionIndex(0);
	},
	
	moveWindowContent: function() {
		var index;
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			index = this._scrollbar.getIndex();
			if (index === 0) {
				this._ans = QuestionAnswer.YES;
			}
			else {
				this._ans = QuestionAnswer.NO;
			}
			this.setQuestionIndex(0);
			return MoveResult.END;
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._ans = QuestionAnswer.NO;
			this.setQuestionIndex(0);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		var length = this._getTextLength();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		y += 10;
		TextRenderer.drawText(x, y, this._message, length, color, font);
		
		this._scrollbar.drawScrollbar(x, y);
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	setQuestionIndex: function(index) {
		this._scrollbar.setIndex(index);
	},
	
	setQuestionActive: function(isActive) {
		this._scrollbar.setActive(isActive);
	},
	
	getWindowWidth: function() {
		return this._windowWidth;
	},
	
	getWindowHeight: function() {
		return 120;
	},
	
	getQuestionAnswer: function() {
		return this._ans;
	},
	
	_createScrollbar: function() {
		var arr = [StringTable.QuestionWindow_DefaultCase1, StringTable.QuestionWindow_DefaultCase2];
		
		this._scrollbar = createScrollbarObject(QuestionScrollbar, this);
		this._scrollbar.setScrollFormation(2, 1);
		this._scrollbar.setObjectArray(arr);
	},
	
	_calculateWindowSize: function() {
		var textui = this.getWindowTextUI();
		
		this._windowWidth = TextRenderer.getTextWidth(this._message, textui.getFont()) + (DefineControl.getWindowXPadding() * 3);
		if (this._windowWidth < 250) {
			this._windowWidth = 250;
		}
		else if (this._windowWidth > 500) {
			this._windowWidth = 500;
		}
	},
	
	_getTextLength: function() {
		return this.getWindowWidth();
	}
}
);

var QuestionScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		// Shift position so as not to overlap the cursor.
		x += 3;
		y += 8;
		TextRenderer.drawText(x, y, object, length, color, font);
		
		this._drawLine(x, y, object, isSelect, index, font);	
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	getScrollXPadding: function() {
		return 60;
	},
	
	getScrollYPadding: function() {
		return 40;
	},
	
	getObjectWidth: function() {
		return 70;
	},
	
	getObjectHeight: function() {
		return 30;
	},
	
	_drawLine: function(x, y, object, isSelect, index, font) {
		var width = this._getLineWidth();
		var pic = root.queryUI('select_line');
		
		if (isSelect) {
			TitleRenderer.drawLine(x - 3, y + 14, width, pic);
		}
	},
	
	_getLineWidth: function(object, font) {
		return 20;
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);
