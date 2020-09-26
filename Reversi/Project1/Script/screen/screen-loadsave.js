
var LoadSaveMode = {
	TOP: 0,
	SAVECHECK: 1
};

var LoadSaveScreen = defineObject(BaseScreen,
{
	_screenParam: null,
	_isLoadMode: false,
	_scrollbar: null,
	_questionWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._isLoadMode) {
			result = this._moveLoad();
		}
		else {
			result = this._moveSave();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var x, y;
		var mode = this.getCycleMode();
		
		x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		this._scrollbar.drawScrollbar(x, y);
	
		if (mode === LoadSaveMode.SAVECHECK) {
			x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
			this._questionWindow.drawWindow(x, y);
		}
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Load');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._screenParam = screenParam;
		this._isLoadMode = screenParam.isLoad;
		this._scrollbar = createScrollbarObject(this._getScrollbarObject(), this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		var count = LayoutControl.getObjectVisibleCount(76, 5);
		
		this._scrollbar.setScrollFormation(this._getFileCol(), count);
		this._scrollbar.setActive(true);
		this._setScrollData(DefineControl.getMaxSaveFileCount(), this._isLoadMode);
		this._setDefaultSaveFileIndex();
		
		this._questionWindow.setQuestionMessage(StringTable.LoadSave_SaveQuestion);
		
		this.changeCycleMode(LoadSaveMode.TOP);
	},
	
	_setScrollData: function(count, isLoadMode) {
		var i;
		var manager = root.getLoadSaveManager();
		
		for (i = 0; i < count; i++) {
			this._scrollbar.objectSet(manager.getSaveFileInfo(i));
		}
		
		this._scrollbar.objectSetEnd();
		
		this._scrollbar.setLoadMode(isLoadMode);
	},
	
	_setDefaultSaveFileIndex: function() {
		var index = root.getExternalData().getActiveSaveFileIndex();
		
		// Point the cursor at the index of the file which is used before.
		if (this._scrollbar.getObjectCount() > index) {
			this._scrollbar.setIndex(index);
		}
	},
	
	_moveLoad: function() {
		var input;
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === LoadSaveMode.TOP) {
			input = this._scrollbar.moveInput();
			if (input === ScrollbarInput.SELECT) {
				this._executeLoad();
			}
			else if (input === ScrollbarInput.CANCEL) {
				result = MoveResult.END;
			}
			else {
				this._checkSaveFile();
			}
		}
		
		return result;
	},
	
	_moveSave: function() {
		var input;
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === LoadSaveMode.TOP) {
			input = this._scrollbar.moveInput();
			if (input === ScrollbarInput.SELECT) {
				this._scrollbar.enableSelectCursor(false);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(LoadSaveMode.SAVECHECK);
			}
			else if (input === ScrollbarInput.CANCEL) {
				result = MoveResult.END;
			}
			else {
				this._checkSaveFile();
			}
		}
		else if (mode === LoadSaveMode.SAVECHECK) {
			if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
				if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
					this._executeSave();
				}
				
				this._scrollbar.enableSelectCursor(true);
				this.changeCycleMode(LoadSaveMode.TOP);
			}
		}
		
		return result;
	},
	
	_checkSaveFile: function() {
	},
	
	_getScrollbarObject: function() {
		return LoadSaveScrollbar;
	},
	
	_getFileCol: function() {
		return 2;
	},
	
	_executeLoad: function() {
		var object = this._scrollbar.getObject();
		
		if (object.isCompleteFile() || object.getMapInfo() !== null) {
			SceneManager.setEffectAllRange(true);
			
			// root.changeScene is called inside and changed to the scene which is recorded at the save file.
			root.getLoadSaveManager().loadFile(this._scrollbar.getIndex());
		}
	},
	
	_executeSave: function() {
		var index = this._scrollbar.getIndex();
		
		root.getLoadSaveManager().saveFile(index, this._screenParam.scene, this._screenParam.mapId, this._getCustomObject());
	},
	
	_getCustomObject: function() {
		return {};
	}
}
);

var DataSaveScreen = defineObject(LoadSaveScreen,
{
	getScreenInteropData: function() {
		return root.queryScreen('Save');
	}
}
);

var LoadSaveScrollbar = defineObject(BaseScrollbar,
{
	_isLoadMode: false,
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var width = this.getObjectWidth();
		var height = this.getObjectHeight();
		var pic = this._getWindowTextUI().getUIImage();
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += DefineControl.getWindowXPadding();
		y += DefineControl.getWindowYPadding();
		
		if (object.isCompleteFile() || object.getMapInfo() !== null) {
			this._drawMain(x, y, object, index);
		}
		else {
			this._drawEmptyFile(x, y, index);
		}
		
		this._drawFileTitle(x, y, index);
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	playSelectSound: function() {
		var object = this.getObject();
		var isSelect = true;
		
		if (this._isLoadMode) {
			if (!object.isCompleteFile() && object.getMapInfo() === null) {
				isSelect = false;
			}
		}
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	},
	
	getSpaceX: function() {
		return 0;
	},
	
	getSpaceY: function() {
		return 0;
	},
	
	getObjectWidth: function() {
		return 260;
	},
	
	getObjectHeight: function() {
		return 76;
	},
	
	setLoadMode: function(isLoadMode) {
		this._isLoadMode = isLoadMode;
	},
	
	_drawMain: function(x, y, object, index) {
		this._drawChapterNumber(x, y, object);
		this._drawChapterName(x, y, object);
		this._drawPlayTime(x, y, object);
		this._drawTurnNo(x, y, object);
		this._drawDifficulty(x, y, object);
	},
	
	_drawChapterNumber: function(xBase, yBase, object) {
		var text;
		var textui = this._getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var x = xBase;
		var y = yBase;
		
		if (object.isCompleteFile()) {
			text = StringTable.Chapter_Rest;
		}
		else {
			text = ChapterRenderer.getChapterText(object.getMapInfo());
		}
		
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	},
	
	_drawChapterName: function(xBase, yBase, object) {
		var text;
		var length = this._getTextLength();
		var textui = this._getWindowTextUI();
		var font = textui.getFont();
		var x = xBase + 80;
		var y = yBase;
		
		if (object.isCompleteFile()) {
			text = root.getRestPreference().getCompleteSaveTitle();
		}
		else {
			text = object.getMapInfo().getName();
		}
		
		TextRenderer.drawKeywordText(x, y, text, length, ColorValue.KEYWORD, font);
	},
	
	_drawPlayTime: function(xBase, yBase, object) {
		var x = xBase;
		var y = yBase + 25;
		
		ContentRenderer.drawPlayTime(x, y, object.getPlayTime());
	},
	
	_drawTurnNo: function(xBase, yBase, object) {
		var width;
		var textui = this._getWindowTextUI();
		var font = textui.getFont();
		var text = StringTable.Signal_Turn;
		var turn = object.getTurnCount();
		var x = xBase + 80;
		var y = yBase + 25;
		
		if (turn > 0) {
			TextRenderer.drawKeywordText(x, y, text, -1, ColorValue.INFO, font);
			width = TextRenderer.getTextWidth(text, font) + 30;
			NumberRenderer.drawNumber(x + width, y, turn);
		}
		else if (object.getSceneType() === SceneType.REST) {
			TextRenderer.drawKeywordText(x, y, StringTable.LoadSave_Rest, -1, ColorValue.INFO, font);
		}
	},
	
	_drawDifficulty: function(xBase, yBase, object) {
		var difficulty = object.getDifficulty();
		var x = xBase + 200;
		var y = yBase + 23;
		
		GraphicsRenderer.drawImage(x, y, difficulty.getIconResourceHandle(), GraphicsType.ICON);
	},
	
	_drawEmptyFile: function(xBase, yBase, index) {
		var length = this._getTextLength();
		var textui = this._getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var x = xBase;
		var y = yBase;
		
		if (this._getTitleTextUI().getUIImage() === null) {
			TextRenderer.drawKeywordText(x, y, StringTable.LoadSave_SaveFileMark + (index + 1), length, color, font);
			
			x += 90;
			TextRenderer.drawKeywordText(x, y, StringTable.LoadSave_NoData, -1, ColorValue.KEYWORD, font);
		}
		else {
			x += 70;
			y += 10;
			TextRenderer.drawKeywordText(x, y, StringTable.LoadSave_NoData, -1, ColorValue.KEYWORD, font);
		}
	},
	
	_drawFileTitle: function(xBase, yBase, index) {
		var textui = this._getTitleTextUI();
		var x = xBase;
		var y = yBase - 42;
		var width = this.getObjectWidth() - 85;
		var n = index + 1;
		var dx = n >= 10 ? 56 : 51;
		
		if (textui.getUIImage() === null) {
			return;
		}
		
		TitleRenderer.drawTitle(textui.getUIImage(), x + width, y, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), 1);
		NumberRenderer.drawNumberColor(x + width + dx, y + 17, n, this._getNumberColorIndex(), 255);
	},
	
	_getTextLength: function() {
		return this.getObjectWidth() - 80;
	},
	
	_getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('savenumber_title');
	},
	
	_getNumberColorIndex: function() {
		return 4;
	}
}
);


//------------------------------------------------------------------


var LoadSaveScreenEx = defineObject(LoadSaveScreen,
{
	_saveFileDetailWindow: null,
	
	drawScreenCycle: function() {
		var width = this._scrollbar.getObjectWidth() + this._saveFileDetailWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
		this._saveFileDetailWindow.drawWindow(x + this._scrollbar.getObjectWidth(), y);
		
		if (this.getCycleMode() === LoadSaveMode.SAVECHECK) {
			x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
			y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
			this._questionWindow.drawWindow(x, y);
		}
	},
	
	_completeScreenMemberData: function(screenParam) {
		LoadSaveScreen._completeScreenMemberData.call(this, screenParam);
		
		this._scrollbar.enablePageChange();
		
		this._saveFileDetailWindow	= createWindowObject(SaveFileDetailWindow, this);
		this._saveFileDetailWindow.setSize(Math.floor(this._scrollbar.getScrollbarHeight() * 1.2), this._scrollbar.getScrollbarHeight());
		
		this._checkSaveFile();
	},
	
	_checkSaveFile: function() {
		if (this._scrollbar.checkAndUpdateIndex()) {
			this._saveFileDetailWindow.setSaveFileInfo(this._scrollbar.getObject());
		}
	},
	
	_getScrollbarObject: function() {
		return LoadSaveScrollbarEx;
	},
	
	_getFileCol: function() {
		return 1;
	},
	
	_executeSave: function() {
		LoadSaveScreen._executeSave.call(this);
		
		this._saveFileDetailWindow.setSaveFileInfo(this._scrollbar.getObject());
	},
	
	_getCustomObject: function() {
		var obj = LoadSaveScreen._getCustomObject.call(this);
		
		this._setLeaderSettings(obj);
		this._setPositionSettings(obj);
		
		return obj;
	},
	
	_setLeaderSettings: function(obj) {
		var unit = this._getLeaderUnit();
		
		if (unit === null) {
			obj.leaderName = 'undefined';
			return;
		}
		
		obj.leaderName = unit.getName();
		obj.leaderLv = unit.getLv();
		obj.binary = serializeResourceHandle(unit.getCharChipResourceHandle());
	},
	
	_setPositionSettings: function(obj) {
		var area, mapInfo;
		
		obj.playerArrayX = [];
		obj.playerArrayY = [];
		obj.enemyArrayX = [];
		obj.enemyArrayY = [];
		obj.allyArrayX = [];
		obj.allyArrayY = [];
		
		if (this._screenParam.scene === SceneType.REST) {
			area = root.getRestPreference().getActiveRestAreaFromMapId(this._screenParam.mapId);
			obj.areaId = area.getId();
			return obj;
		}
		else {
			mapInfo = root.getCurrentSession().getCurrentMapInfo();
			if (this._screenParam.mapId !== mapInfo.getId()) {
				return obj;
			}
		}
		
		this._setPositionSettingsInternal(PlayerList.getSortieList(), obj.playerArrayX, obj.playerArrayY);
		this._setPositionSettingsInternal(EnemyList.getAliveList(), obj.enemyArrayX, obj.enemyArrayY);
		this._setPositionSettingsInternal(AllyList.getAliveList(), obj.allyArrayX, obj.allyArrayY);
	},
	
	_setPositionSettingsInternal: function(list, arrayX, arrayY) {
		var i, unit;
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (this._isUnitExcluded(unit)) {
				continue;
			}
			
			arrayX.push(unit.getMapX());
			arrayY.push(unit.getMapY());
		}
	},
	
	_isUnitExcluded: function(unit) {
		return unit.isInvisible();
	},
	
	_getLeaderUnit: function() {
		var i, count;
		var list = PlayerList.getMainList();
		var unit = null;
		var firstUnit = null;
		
		count = list.getCount();
		if (count === 0) {
			return null;
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.getAliveState() === AliveType.ERASE) {
				continue;
			}
			
			if (firstUnit === null) {
				firstUnit = unit;
			}
			
			if (unit.getImportance() === ImportanceType.LEADER) {
				break;
			}
		}
		
		if (i === count) {
			unit = firstUnit;
		}
		
		return unit;
	}
}
);

var DataSaveScreenEx = defineObject(LoadSaveScreenEx,
{
	getScreenInteropData: function() {
		return root.queryScreen('Save');
	}
}
);

var LoadSaveScrollbarEx = defineObject(LoadSaveScrollbar,
{
	getObjectWidth: function() {
		return DataConfig.isHighResolution() ? 260 : 220;
	}
}
);

var SaveFileDetailWindow = defineObject(BaseWindow,
{
	_picCache: null,
	_width: null,
	_height: null,
	_saveFileInfo: null,
	_groupArray: null,
	
	setSize: function(width, height) {
		this._width = width;
		this._height = height;
	},
	
	setSaveFileInfo: function(saveFileInfo) {
		var i, count;
		var object = saveFileInfo;
		
		if (!object.isCompleteFile() && object.getMapInfo() === null) {
			this._saveFileInfo = null;
			return;
		}
		
		this._saveFileInfo = saveFileInfo;
		this._picCache = null;
		
		this._groupArray = [];
		this._configureSentence(this._groupArray);
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].setParentWindow(this);
			this._groupArray[i].setSaveFileInfo(this._saveFileInfo);
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
		if (this._saveFileInfo === null) {
			return;
		}
		
		if (this._isThumbnailVisible()) {
			this._drawThumbnailMap(x, y);
		}
		
		this._drawMapName(x, y);
		this._drawSentenceZone(x, y);
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
	
	getLoadSaveSentenceSpaceY: function() {
		return 38;
	},
	
	getTitlePartsCount: function() {
		return this.isSentenceLong() ? 8 : 7;
	},
	
	isSentenceLong: function() {
		return DataConfig.isHighResolution();
	},
	
	_isThumbnailVisible: function() {
		return true;
	},
	
	_drawThumbnailMap: function(x, y) {
		var cacheWidth, cacheHeight;
		var mapData = null;
		var image = null; 
		var isMap = this._saveFileInfo.getSceneType() !== SceneType.REST;
		var width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (DefineControl.getWindowYPadding() * 2);
		var graphicsManager = root.getGraphicsManager();
		var alpha = this._getMapAlpha();
		
		if (isMap) {
			mapData = this._saveFileInfo.getMapInfo();
			cacheWidth = mapData.getMapWidth() * GraphicsFormat.MAPCHIP_WIDTH;
			cacheHeight = mapData.getMapHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		}
		else {
			image = this._getRestBackgroundImage();
			if (image === null) {
				return;
			}
			
			cacheWidth = image.getWidth();
			cacheHeight = image.getHeight();
		}
		
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
		if (isMap) {
			root.drawMapAll(mapData);
			this._drawUnitMark();
		}
		else {
			image.draw(0, 0);
		}
		graphicsManager.resetRenderCache();
		
		this._picCache.setAlpha(alpha);
		this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
	},
	
	_drawUnitMark: function() {
		var obj = this._saveFileInfo.custom;
		var colorArray = this._getMarkColor();
		
		if (typeof obj.playerArrayX === 'undefined') {
			return;
		}
		
		this._drawUnitMarkInternal(obj.playerArrayX, obj.playerArrayY, colorArray[0]);
		this._drawUnitMarkInternal(obj.enemyArrayX, obj.enemyArrayY, colorArray[1]);
		this._drawUnitMarkInternal(obj.allyArrayX, obj.allyArrayY, colorArray[2]);
	},
	
	_drawUnitMarkInternal: function(arrayX, arrayY, color) {
		var i;
		var count = arrayX.length;
		var canvas = root.getGraphicsManager().getCanvas();
		var width = GraphicsFormat.MAPCHIP_WIDTH;
		var height = GraphicsFormat.MAPCHIP_HEIGHT;
		
		canvas.setFillColor(color, 210);
		canvas.setStrokeInfo(color, 210, 1, false);
		
		for (i = 0; i < count; i++) {
			canvas.drawEllipse(arrayX[i] * width, arrayY[i] * height, width, height);
		}
	},
	
	_drawMapName: function(x, y) {
		var text;
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var mapInfo = this._saveFileInfo.getMapInfo();
		var titleCount = 7;
		var width = TitleRenderer.getTitlePartsWidth() * (titleCount + 2);
		var sx = x + Math.floor((this.getWindowWidth() - width) / 2) - this.getWindowXPadding();
		
		if (mapInfo !== null) {
			text = ChapterRenderer.getChapterText(mapInfo);
			text += '  ';
			text += mapInfo.getName();
		}
		else {
			text = root.getRestPreference().getCompleteSaveTitle();
		}
		
		TextRenderer.drawFixedTitleText(sx, y - 48, text, color, font, TextFormat.CENTER, pic, titleCount);
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
	
	_drawSentenceZone: function(x, y) {
		var i;
		var count = this._groupArray.length;
		var width = (this.getTitlePartsCount() + 3) * TitleRenderer.getTitlePartsWidth();
		
		x += Math.floor((this._width - width) / 2);
		y += this._height - (count * this.getLoadSaveSentenceSpaceY()) - 60;
		
		for (i = 0; i < count; i++) {
			this._groupArray[i].drawLoadSaveSentence(x, y);
			y += this._groupArray[i].getLoadSaveSentenceCount() * this.getLoadSaveSentenceSpaceY();
		}
	},
	
	_getRestBackgroundImage: function() {
		var area;
		var obj = this._saveFileInfo.custom;
		var list = root.getBaseData().getRestAreaList();
		
		if (typeof obj.areaId === 'undefined') {
			return null;
		}
		
		area = list.getDataFromId(obj.areaId);
		if (area === null) {
			return null;
		}
		
		return area.getBackgroundImage();
	},
	
	_getMapAlpha: function() {
		return 255;
	},
	
	_getMarkColor: function() {
		return [0x12fcee, 0xef3242, 0x08f511];
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('objective_title');
	},
	
	_configureSentence: function(groupArray) {
		if (typeof this._saveFileInfo.custom.leaderName !== 'undefined') {
			groupArray.appendObject(LoadSaveSentence.Leader);
		}
		
		if (root.getBaseData().getDifficultyList().getCount() > 0) {
			groupArray.appendObject(LoadSaveSentence.Time);
		}
	}
}
);

var BaseLoadSaveSentence = defineObject(BaseObject,
{
	_detailWindow: null,
	
	setParentWindow: function(detailWindow) {
		this._detailWindow = detailWindow;
	},
	
	setSaveFileInfo: function(saveFileInfo) {
	},
	
	moveLoadSaveSentence: function() {
		return MoveResult.CONTINUE;
	},
	
	drawLoadSaveSentence: function(x, y) {
	},
	
	getLoadSaveSentenceCount: function() {
		return 1;
	},
	
	_drawTitle: function(x, y) {
		var textui = this._getSentenceTextUI();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var pic = textui.getUIImage();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, this._detailWindow.getTitlePartsCount());
	},
	
	_getSentenceTextUI: function() {
		return root.queryTextUI('saveexplanation_title');
	}
}
);

var LoadSaveSentence = {};

LoadSaveSentence.Leader = defineObject(BaseLoadSaveSentence,
{
	_value: 0,
	_saveFileInfo: null,
	
	setSaveFileInfo: function(saveFileInfo) {
		this._saveFileInfo = saveFileInfo;
	},
	
	drawLoadSaveSentence: function(x, y) {
		var unitRenderParam;
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var obj = this._saveFileInfo.custom;
		var length = 130;
		
		this._drawTitle(x, y);
		
		if (typeof obj.binary !== 'undefined') {
			unitRenderParam = StructureBuilder.buildUnitRenderParam();
			unitRenderParam.handle = deserializeResourceHandle(obj.binary);
			unitRenderParam.colorIndex = 0;
			UnitRenderer.drawCharChip(x + 24, y + 8, unitRenderParam);
		}
		
		if (typeof obj.leaderName !== 'undefined') {
			length += this._detailWindow.isSentenceLong() ? 20 : 0;
			TextRenderer.drawKeywordText(x + 70, y + 18, obj.leaderName, length, color, font);
		}
		
		if (typeof obj.leaderLv !== 'undefined') {
			x += this._detailWindow.isSentenceLong() ? 20 : 0;
			TextRenderer.drawKeywordText(x + 180, y + 18, 'Lv', -1, color, font);
			NumberRenderer.drawNumber(x + 210, y + 18, obj.leaderLv);
			
		}
	}
}
);

LoadSaveSentence.Time = defineObject(BaseLoadSaveSentence,
{
	_saveFileInfo: 0,
	
	setSaveFileInfo: function(saveFileInfo) {
		this._saveFileInfo = saveFileInfo;
	},
	
	drawLoadSaveSentence: function(x, y) {
		var dx, n;
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var difficulty = this._saveFileInfo.getDifficulty();
		
		this._drawTitle(x, y);
		
		if (this._saveFileInfo.getSceneType() === SceneType.FREE) {
			n = this._saveFileInfo.getTurnCount();
			if (n >= 100) {
				dx = 18;
			}
			else if (n >= 10) {
				dx = 24;
			}
			else {
				dx = 30;
			}
			NumberRenderer.drawAttackNumberColor(x + dx, y + 18, n, 1, 255);
		}
		
		TextRenderer.drawKeywordText(x + 70, y + 18, StringTable.PlayTime, -1, color, font);
		
		x += this._detailWindow.isSentenceLong() ? 20 : 0;
		ContentRenderer.drawPlayTime(x + 180, y + 18, this._saveFileInfo.getPlayTime());
	}
}
);

var LoadSaveControl = {
	getLoadScreenObject: function() {
		return DataConfig.isSaveScreenExtended() ? LoadSaveScreenEx : LoadSaveScreen;
	},
	
	getSaveScreenObject: function() {
		return DataConfig.isSaveScreenExtended() ? DataSaveScreenEx : DataSaveScreen;
	}
};
