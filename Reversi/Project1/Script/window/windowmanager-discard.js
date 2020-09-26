
var DiscardWindowResult = {
	DISCARD: 0,
	CANCEL: 1,
	NONE: 2
};

var DiscardManager = defineObject(BaseWindowManager,
{
	_questionWindow: null,
	_infoWindow: null,
	_item: null,
	_isImportance: false,
	
	setDiscardItem: function(item) {
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(StringTable.StockItem_ItemDiscard);
		this._infoWindow = createWindowObject(InfoWindow, this);
		this._item = item;
		this._isImportance = item.isImportance();
		
		if (this._isImportance) {
			this._playOperationBlockSound();
			this._infoWindow.setInfoMessage(StringTable.Discard_Warning);
		}
		
		this._questionWindow.setQuestionActive(true);
	},
	
	moveWindowManager: function() {
		var result = DiscardWindowResult.NONE;
		
		if (this._isImportance) {
			if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
				result = DiscardWindowResult.CANCEL;
			}
		}
		else {
			result = this._moveDiscard();
		}
		
		return result;
	},
	
	drawWindowManager: function() {
		var x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
		
		if (this._isImportance) {
			this._infoWindow.drawWindow(x, y);
		}
		else {
			this._questionWindow.drawWindow(x, y);
		}
	},
	
	_moveDiscard: function() {
		var result = DiscardWindowResult.NONE;
		
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._discardItem();
				result = DiscardWindowResult.DISCARD;
			}
			else {
				result = DiscardWindowResult.CANCEL;
			}
		}
		
		return result;
	},
	
	_playOperationBlockSound: function() {
		MediaControl.soundDirect('operationblock');
	},
	
	_discardItem: function() {
	}
}
);
