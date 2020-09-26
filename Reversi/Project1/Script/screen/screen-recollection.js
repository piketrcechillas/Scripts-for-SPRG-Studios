
var RecollectionMode = {
	TOP: 0,
	EVENT: 1
};

var RecollectionScreen = defineObject(BaseScreen,
{
	_eventArray: null,
	_recollectionEvent: null,
	_isAutoBackground: false,
	_scrollbar: null,
	_descriptionChanger: null,
	_isThumbnailMode: false,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RecollectionMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === RecollectionMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		this._drawTop();
	},
	
	drawScreenTopText: function(textui) {
		TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
	},
	
	drawScreenBottomText: function(textui) {
		this._descriptionChanger.drawBottomDescription(textui, this._scrollbar);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Recollection');
	},
	
	getExtraDisplayName: function() {
		return this.getScreenTitleName();
	},
	
	getExtraDescription: function() {
		return StringTable.Extra_Recollection;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._eventArray = this._createEventArray();
		this._recollectionEvent = createObject(RecollectionEvent);
		this._isAutoBackground = false;
		this._scrollbar = createScrollbarObject(this._isThumbnailMode ? ThumbnailScrollbar : DictionaryScrollbar, this);
		this._descriptionChanger = createObject(DescriptionChanger);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._setScrollbarData();
		this._descriptionChanger.setDescriptionData();
		this._descriptionChanger.setDescriptionText(this._scrollbar);
		
		this.changeCycleMode(RecollectionMode.TOP);
	},
	
	_createEventArray: function() {
		var i, event, handle;
		var list = root.getBaseData().getRecollectionEventList();
		var count = list.getCount();
		var eventArray = [];
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			if (event.getRecollectionEventInfo().isExtraDisplayable()) {
				eventArray.push(event);
				
				handle = event.getRecollectionEventInfo().getThumbnailResourceHandle();
				if (!handle.isNullHandle()) {
					this._isThumbnailMode = true;
				}
			}
		}
		
		return eventArray;
	},
	
	_setScrollbarData: function() {
		var dictionaryScrollbarParam = this._createDictionaryScrollbarParam();
		
		this._scrollbar.setDictionaryScrollbarParam(dictionaryScrollbarParam);
		this._scrollbar.setDictionaryFormation();
		this._scrollbar.setActive(true);
		this._scrollbar.setObjectArray(this._eventArray);
	},
	
	_createDictionaryScrollbarParam: function() {
		var dictionaryScrollbarParam = StructureBuilder.buildDictionaryScrollbarParam();
		
		dictionaryScrollbarParam.isRecollectionMode = true;
		dictionaryScrollbarParam.funcCondition = function(object, index) {
			return object.getExecutedMark() === EventExecutedType.EXECUTED;
		};
		
		return dictionaryScrollbarParam;
	},
	
	_moveTop: function() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			result = this._moveSelect();
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = this._moveCancel();
		}
		else if (input === ScrollbarInput.NONE) {
			result = this._moveNone();
		}
		
		return result;
	},
	
	_moveSelect: function() {
		var event = this._scrollbar.getObject();
		
		if (this._scrollbar.isNameDisplayable(event)) {
			this._recollectionEvent.startRecollectionEvent(event);
			this.changeCycleMode(RecollectionMode.EVENT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveCancel: function() {
		this._descriptionChanger.endDescription();
		return MoveResult.END;
	},
	
	_moveNone: function() {
		this._descriptionChanger.setDescriptionText(this._scrollbar);
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		if (this._recollectionEvent.moveRecollectionEvent() !== MoveResult.CONTINUE) {
			this.changeCycleMode(RecollectionMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawTop: function() {
		var x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
	},
	
	_drawEvent: function() {
	}
}
);

var RecollectionEventMode = {
	RANDOMBACK: 0,
	EVENT: 1,
	BACKEND: 2
};

var RecollectionEvent = defineObject(BaseObject,
{
	_event: null,
	
	startRecollectionEvent: function(event) {
		var generator;
		
		if (event.getRecollectionEventInfo().isRandomBackground()) {
			generator = root.getEventGenerator();
			generator.backgroundChange(BackgroundChangeType.CHANGE, Miscellaneous.getRandomBackgroundHandle(), GraphicsType.EVENTBACK, BackgroundTransitionType.BLACK);
			generator.execute();
			this.changeCycleMode(RecollectionEventMode.RANDOMBACK);
		}
		else {
			event.startEvent();
			this.changeCycleMode(RecollectionEventMode.EVENT);
		}
		
		this._event = event;
	},
	
	moveRecollectionEvent: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RecollectionEventMode.RANDOMBACK) {
			result = this._moveRandomBack();
		}
		else if (mode === RecollectionEventMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === RecollectionEventMode.BACKEND) {
			result = this._moveBackEnd();
		}
				
		return result;
	},
	
	_moveRandomBack: function() {
		this._event.startEvent();
		this.changeCycleMode(RecollectionEventMode.EVENT);
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		var generator;
		
		if (EventCommandManager.isEventRunning(this._event)) {
			return MoveResult.CONTINUE;
		}
		
		if (!root.isEventBackgroundVisible()) {
			return MoveResult.END;
		}
		
		// Delete the random background or the background which was displayed in the event.
		generator = root.getEventGenerator();
		generator.backgroundChange(BackgroundChangeType.NONE, root.createEmptyHandle(), GraphicsType.EVENTBACK, BackgroundTransitionType.BLACK);
		generator.execute();
		
		this.changeCycleMode(RecollectionEventMode.BACKEND);
		
		return MoveResult.CONTINUE;
	},
	
	_moveBackEnd: function() {
		return MoveResult.END;
	}
}
);
