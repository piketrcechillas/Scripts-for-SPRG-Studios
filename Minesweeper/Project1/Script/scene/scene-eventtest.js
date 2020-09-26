
var EventTestMode = {
	EVENT: 0,
	END: 1
};

var EventTestScene = defineObject(BaseScene,
{
	_recollectionEvent: null,
	
	setSceneData: function() {
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	},
	
	moveSceneCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === EventTestMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === EventTestMode.END) {
			result = this._moveEnd();
		}
		
		return result;
	},
	
	drawSceneCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === EventTestMode.EVENT) {
			this._drawEvent();
		}
		else if (mode === EventTestMode.END) {
			this._drawEnd();
		}
	},
	
	_prepareSceneMemberData: function() {
		this._recollectionEvent = createObject(RecollectionEvent);
	},
	
	_completeSceneMemberData: function() {
		var list = root.getBaseData().getRecollectionEventList();
		var event = list.getDataFromId(root.getSceneController().getRecollectionTestEventId());
		
		this._recollectionEvent.startRecollectionEvent(event);
		
		this.changeCycleMode(EventTestMode.EVENT);
	},
	
	_moveEvent: function() {
		if (this._recollectionEvent.moveRecollectionEvent() !== MoveResult.CONTINUE) {
			this.changeCycleMode(EventTestMode.END);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEnd: function() {
		if (InputControl.isSelectAction() || InputControl.isCancelAction()) {
			root.endGame();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawEvent: function() {
	},
	
	_drawEnd: function() {
		var x, y, width;
		var textui = this._getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		y = LayoutControl.getCenterY(-1, 60);
	
		width = TextRenderer.getTextWidth(StringTable.EventTest_End, font);
		x = LayoutControl.getCenterX(-1, width);
		TextRenderer.drawText(x, y - 20, StringTable.EventTest_End, -1, color, font);
		
		width = TextRenderer.getTextWidth(StringTable.EventTest_Key, font);
		x = LayoutControl.getCenterX(-1, width);
		TextRenderer.drawText(x, y + 20, StringTable.EventTest_Key, -1, color, font);
	},
	
	_getTextUI: function() {
		return root.queryTextUI('default_window');
	}
}
);
