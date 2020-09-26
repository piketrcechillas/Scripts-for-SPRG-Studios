
var QuestScreenMode = {
	AUTOEVENTCHECK: 0,
	SELECT: 1,
	EVENT: 2,
	QUESTION: 3
};

var QuestScreen = defineObject(BaseScreen,
{
	_eventChecker: null,
	_questListWindow: null,
	_questDetailWindow: null,
	_questionWindow: null,
	_questEntryArray: null,
	_capsuleEvent: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === QuestScreenMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === QuestScreenMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === QuestScreenMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === QuestScreenMode.QUESTION) {
			result = this._moveQuestion();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var width = this._questListWindow.getWindowWidth() + this._questDetailWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._questListWindow.getWindowHeight());
		
		this._questListWindow.drawWindow(x, y);
		this._questDetailWindow.drawWindow(x + this._questListWindow.getWindowWidth(), y);
		
		if (this.getCycleMode() === QuestScreenMode.QUESTION) {
			this._drawQuestionWindow();
		}
	},
	
	drawScreenBottomText: function(textui) {
		var text;
		var entry = this.getCurrentQuestEntry();
		
		if (entry.isVisible) {
			text = entry.data.getDescription();
		}
		else {
			text = '';
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Quest');
	},
	
	getCurrentQuestEntry: function() {
		return this._questEntryArray[this._questListWindow.getQuestListIndex()];
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._eventChecker = createObject(RestAutoEventChecker);
		this._questListWindow = createWindowObject(QuestListWindow, this);
		this._questDetailWindow = createWindowObject(QuestDetailWindow, this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._questEntryArray = this._getQuestArray();
		
		this._questListWindow.setWindowData();
		this._questListWindow.setQuestEntryArray(this._questEntryArray);
		
		this._questionWindow.setQuestionMessage(StringTable.Quest_Select);
		
		this._questDetailWindow.setQuestData(this._questEntryArray[0].data);
		this._questDetailWindow.setSize(Math.floor(this._questListWindow.getWindowHeight() * 1.2), this._questListWindow.getWindowHeight());
		
		this._changeEventMode();
	},
	
	_getQuestArray: function() {
		var i, quest, entry;
		var arr = [];
		var list = root.getBaseData().getRestQuestList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			quest = list.getData(i);
			if (!quest.isQuestDisplayable()) {
				continue;
			}
			
			entry = StructureBuilder.buildListEntry();
			
			entry.isAvailable = quest.isQuestAvailable();
			entry.isVisible = entry.isAvailable || !quest.isPrivateQuest();
			if (entry.isVisible) {
				entry.name = quest.getName();
			}
			else {
				entry.name = StringTable.HideData_Question;
			}
			entry.data = quest;
			
			arr.push(entry);
		}
		
		return arr;
	},
	
	_moveAutoEventCheck: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this.changeCycleMode(QuestScreenMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveSelect: function() {
		var input = this._questListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startQuestEvent();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			if (this._questListWindow.isIndexChanged()) {
				this._questDetailWindow.setQuestData(this._questEntryArray[this._questListWindow.getQuestListIndex()].data);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this._startQuestion();
			return MoveResult.CONTINUE;
		}
		
		return result;
	},
	
	_moveQuestion: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._startQuestMap();
				return MoveResult.CONTIUNE;
			}
			else {
				this._questListWindow.enableSelectCursor(true);
				this._changeSelectMode();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawQuestionWindow: function() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	},
	
	_startQuestEvent: function() {
		var event = this._getPlaceEvent();
		var isExecuteMark = false;
		
		this._capsuleEvent.enterCapsuleEvent(event, isExecuteMark);
		this._questListWindow.enableSelectCursor(false);
		this.changeCycleMode(QuestScreenMode.EVENT);
	},
	
	_startQuestion: function() {
		if (this.getCurrentQuestEntry().isAvailable) {
			this.changeCycleMode(QuestScreenMode.QUESTION);
			this._questionWindow.setQuestionActive(true);
		}
		else {
			this._questListWindow.enableSelectCursor(true);
			this._changeSelectMode();
		}
	},
	
	_startQuestMap: function() {
		var quest = this.getCurrentQuestEntry().data;
		var map = quest.getFreeMap();
		
		root.getSceneController().startNewMap(map.getId());
		
		root.changeScene(SceneType.BATTLESETUP);
	},
	
	_getPlaceEvent: function() {
		var event;
		var entry = this.getCurrentQuestEntry();
		var quest = entry.data;
		
		if (entry.isAvailable) {
			event = quest.getEnabledEvent();
		}
		else {
			event = quest.getDisabledEvent();
		}
		
		return event;
	},
	
	_changeSelectMode: function() {
		this.changeCycleMode(QuestScreenMode.SELECT);
	},
	
	_changeEventMode: function() {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), RestAutoType.QUEST);
		if (result === EnterResult.NOTENTER) {
			this.changeCycleMode(QuestScreenMode.SELECT);
		}
		else {
			this.changeCycleMode(QuestScreenMode.AUTOEVENTCHECK);
		}
	}
}
);

var QuestListWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(QuestListScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
	},
	
	setQuestEntryArray: function(objectArray) {
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
	
	getQuestListIndex: function() {
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

var QuestListScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var dx = 0;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = object.isAvailable ? textui.getColor() : ColorValue.DISABLE;
		var handle = object.data.getIconResourceHandle();
		
		if (object.isVisible) {
			if (!handle.isNullHandle()) {
				dx = GraphicsFormat.ICON_WIDTH + 6;
				GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
			}
		}
		
		TextRenderer.drawKeywordText(x + dx, y, object.name, length, color, font);
	},
	
	playSelectSound: function() {
		var object = this.getObject();
		var isSelect = true;
		
		if (!object.isVisible) {
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

var QuestDetailWindow = defineObject(BaseWindow,
{
	_picCache: null,
	_quest: null,
	_groupArray: null,
	_width: null,
	_height: null,
	
	setSize: function(width, height) {
		this._width = width;
		this._height = height;
	},
	
	setQuestData: function(quest) {
		var i, count;
		
		this._quest = quest;
		
		this._picCache = null;
		
		this._groupArray = [];
		this._configureSentence(this._groupArray);
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].setParentWindow(this);
			this._groupArray[i].setCalculatorValue(this._quest);
		}
	},
	
	moveWindowContent: function() {
		var i, count;
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].moveQuestSentence();
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		var isPrivate = false;
		
		if (this._quest === null) {
			isPrivate = true;
		}
		else if (!this._quest.isQuestAvailable()) {
			isPrivate = this._quest.isPrivateQuest();
		}
		
		if (isPrivate) {
			this._drawEmptyMap(x, y);
			this._drawEmptySentence(x, y);
		}
		else {
			this._drawThumbnailMap(x, y);
			this._drawSentenceZone(x, y);
		}
	},
	
	getQuestSentenceSpaceY: function() {
		return 38;
	},
	
	getTitlePartsCount: function() {
		return 5;
	},
	
	getWindowWidth: function() {
		return this._width;
	},
	
	getWindowHeight: function() {
		return this._height;
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('face_window');
	},
	
	_drawThumbnailMap: function(x, y) {
		var mapData = this._quest.getFreeMap();
		var cacheWidth = mapData.getMapWidth() * GraphicsFormat.MAPCHIP_WIDTH;
		var cacheHeight = mapData.getMapHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		var width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (DefineControl.getWindowYPadding() * 2);
		var graphicsManager = root.getGraphicsManager();
		var alpha = this._getMapAlpha();
		
		if (this._picCache !== null) {
			if (this._picCache.isCacheAvailable()) {
				this._picCache.setAlpha(alpha);
				this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
				return;
			}
		}
		else {
			this._picCache = graphicsManager.createCacheGraphics(cacheWidth, cacheHeight);
		}
		
		graphicsManager.setRenderCache(this._picCache);
		root.drawMapAll(mapData);
		graphicsManager.resetRenderCache();
		
		this._picCache.setAlpha(alpha);
		this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
	},
	
	_drawSentenceZone: function(x, y) {
		var i;
		var count = this._groupArray.length;
		
		x = (x + this._width) - ((this.getTitlePartsCount() + 3) * TitleRenderer.getTitlePartsWidth());
		y += 5;
		for (i = 0; i < count; i++) {
			this._groupArray[i].drawQuestSentence(x, y);
			y += this._groupArray[i].getQuestSentenceCount() * this.getQuestSentenceSpaceY();
		}
	},
	
	_drawEmptyMap: function(x, y) {
		var textui = root.queryTextUI('default_window');
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (DefineControl.getWindowYPadding() * 2);
		var range = createRangeObject(x, y, width, height);
		
		TextRenderer.drawRangeText(range, TextFormat.CENTER, StringTable.HideData_Unknown, -1, color, font);
	},
	
	_drawEmptySentence: function(x, y) {
	},
	
	_getMapAlpha: function() {
		return 200;
	},
	
	_configureSentence: function(groupArray) {
		if (root.getRestPreference().isEnemyTotalEnabled()) {
			groupArray.appendObject(QuestSentence.EnemyTotal);
		}
		if (root.getRestPreference().isEnemyAverageLevelEnabled()) {
			groupArray.appendObject(QuestSentence.EnemyAverageLevel);
		}
		groupArray.appendObject(QuestSentence.Reward);
	}
}
);

var BaseQuestSentence = defineObject(BaseObject,
{
	_detailWindow: null,
	
	setParentWindow: function(detailWindow) {
		this._detailWindow = detailWindow;
	},
	
	setCalculatorValue: function(quest) {
	},
	
	moveQuestSentence: function() {
		return MoveResult.CONTINUE;
	},
	
	drawQuestSentence: function(x, y) {
	},
	
	getQuestSentenceCount: function() {
		return 1;
	},
	
	_drawNumberAndText: function(x, y, text, number, colorIndex) {
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		y += 19;
		TextRenderer.drawKeywordText(x + 8, y + 0, text, -1, color, font);
		NumberRenderer.drawNumberColor(x + 186, y + 0, number, colorIndex, 255);
	},
	
	_drawTitle: function(x, y) {
		var textui = this._getSentenceTextUI();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var pic = textui.getUIImage();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, this._detailWindow.getTitlePartsCount());
	},
	
	_getSentenceTextUI: function() {
		return root.queryTextUI('questreward_title');
	},
	
	_getNumberColorIndex: function() {
		return 3;
	}
}
);

var QuestSentence = {};

QuestSentence.EnemyTotal = defineObject(BaseQuestSentence,
{
	_value: 0,
	
	setCalculatorValue: function(quest) {
		var list = quest.getFreeMap().getListFromUnitGroup(UnitGroup.ENEMY);
		
		this._value = list.getCount();
	},
	
	drawQuestSentence: function(x, y) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, StringTable.Quest_EnemyTotal, this._value, this._getNumberColorInex());
	},
	
	_getNumberColorInex: function() {
		return 3;
	}
}
);

QuestSentence.EnemyAverageLevel = defineObject(BaseQuestSentence,
{
	_value: 0,
	
	setCalculatorValue: function(quest) {
		var i, unit;
		var list = quest.getFreeMap().getListFromUnitGroup(UnitGroup.ENEMY);
		var count = list.getCount();
		var totalLevel = 0;
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			totalLevel += unit.getLv();
		}
		
		this._value = Math.floor(totalLevel / count);
	},
	
	drawQuestSentence: function(x, y) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, StringTable.Quest_AverageLevel, this._value, this._getNumberColorInex());
	},
	
	_getNumberColorInex: function() {
		return 3;
	}
}
);

var QuestRewardType = {
	ITEM: 0,
	GOLD: 1,
	BONUS: 2,
	TEXT: 3
};

QuestSentence.Reward = defineObject(BaseQuestSentence,
{
	_arr: null,

	setCalculatorValue: function(quest) {
		var i, reward;
		var list = quest.getRewardList();
		var count = list.getCount();
		
		this._arr = [];
		
		for (i = 0; i < count; i++) {
			reward = list.getData(i);
			if (this._isRewardEnabled(reward)) {
				this._arr.push(reward);
			}
		}
	},
	
	drawQuestSentence: function(x, y) {
		var i;
		var count = this._arr.length;
		
		for (i = 0; i < count; i++) {
			this._drawReward(x, y, this._arr[i]);
			y += this._detailWindow.getQuestSentenceSpaceY();
		}
	},
	
	getQuestSentenceCount: function() {
		return this._arr.length;
	},
	
	_drawReward: function(x, y, reward) {
		var type = reward.getType();
		
		if (type === QuestRewardType.ITEM) {
			this._drawItem(x, y, reward);
		}
		else if (type === QuestRewardType.GOLD) {
			this._drawGold(x, y, reward);
		}
		else if (type === QuestRewardType.BONUS) {
			this._drawBonus(x, y, reward);
		}
		else if (type === QuestRewardType.TEXT) {
			this._drawText(x, y, reward);
		}
	},
	
	_drawItem: function(x, y, reward) {
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		this._drawTitle(x, y);
		y += 10;
		ItemRenderer.drawItem(x + 8, y + 8, reward.getItem(), color, font, false);
		TextRenderer.drawKeywordText(x + 168, y - 3, StringTable.Quest_GetItem, -1, ColorValue.KEYWORD, font);
	},
	
	_drawGold: function(x, y, reward) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, StringTable.Quest_GetGold, reward.getGold(), this._getNumberColorInex());
	},
	
	_drawBonus: function(x, y, reward) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, StringTable.Quest_GetBonus, reward.getBonus(), this._getNumberColorInex()); 
	},
	
	_drawText: function(x, y, reward) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, reward.getText(), reward.getValue(), reward.getNumberColorIndex());
	},
	
	_getNumberColorInex: function() {
		return 1;
	},
	
	_isRewardEnabled: function(reward) {
		// If the item is specified with variable, it cannot not be obtained sometimes.
		if (reward.getType() === QuestRewardType.ITEM && reward.getItem() === null) {
			return false;
		}
		
		return true;
	}
}
);
