
var ExtraMode = {
	TOP: 0,
	MAIN: 1
};

var ExtraScreen = defineObject(BaseScreen,
{
	_screen: null,
	_screenArray: null,
	_scrollbar: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ExtraMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ExtraMode.MAIN) {
			result = this._moveMain();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var x = LayoutControl.getRelativeX(8) - 50;
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight()) - 5;
		
		this._scrollbar.drawScrollbar(x, y);
	},
	
	drawScreenTopText: function(textui) {
		TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
	},
	
	drawScreenBottomText: function(textui) {
		var index = this._scrollbar.getIndex();
		var text = this._screenArray[index].getExtraDescription();
		
		TextRenderer.drawScreenBottomTextCenter(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Extra');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._screen = null;
		this._screenArray = [];
		this._scrollbar = createScrollbarObject(ExtraScrollbar, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		var count = LayoutControl.getObjectVisibleCount(TitleRenderer.getTitlePartsHeight(), -1);
		
		this._configureExtraScreens(this._screenArray);
		
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
		this._scrollbar.setObjectArray(this._screenArray);
		
		this.changeCycleMode(ExtraMode.TOP);
	},
	
	_moveTop: function() {
		var index;
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			this._scrollbar.setActive(false);
			index = this._scrollbar.getIndex();
			this._screen = this._screenArray[index];
			
			SceneManager.addScreen(this._screen, ScreenBuilder.buildScreen());
			
			this.changeCycleMode(ExtraMode.MAIN);
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveMain: function() {
		if (SceneManager.isScreenClosed(this._screen)) {
			this._scrollbar.setActive(true);
			this.changeCycleMode(ExtraMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_configureExtraScreens: function(groupArray) {
		if (ExtraControl.isRecollectionDisplayable()) {
			if (DataConfig.isSupportListView()) {
				groupArray.appendObject(SupportScreen);
			}
			else {
				groupArray.appendObject(RecollectionScreen);
			}
		}
		
		if (ExtraControl.isCharacterDictionaryDisplayable()) {
			groupArray.appendObject(CharacterScreen);
		}
		
		if (ExtraControl.isWordDictionaryDisplayable()) {
			groupArray.appendObject(WordScreen);
		}
		
		if (ExtraControl.isGalleryDictionaryDisplayable()) {
			groupArray.appendObject(GalleryScreen);
		}
		
		if (ExtraControl.isMediaDictionaryDisplayable()) {
			groupArray.appendObject(SoundRoomScreen);
		}
	}
}
);

var ExtraScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var text = object.getExtraDisplayName();
		var textui = this._getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, this._getCount());
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	getObjectWidth: function() {
		return (this._getCount() + 2) * TitleRenderer.getTitlePartsWidth();
	},
	
	getObjectHeight: function() {
		return TitleRenderer.getTitlePartsHeight();
	},
	
	_getTextUI: function() {
		return root.queryTextUI('extraitem_title');
	},
	
	_getCount: function() {
		return 6;
	}
}
);

var DictionaryMode = {
	TOP: 0,
	MAIN: 1
};

var DictionaryScreen = defineObject(BaseScreen,
{
	_scrollbar: null,
	_storyDataChanger: null,
	_messagePager: null,
	_secretViewer: null,
	_dataChanger: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === DictionaryMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === DictionaryMode.MAIN) {
			result = this._moveMain();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === DictionaryMode.TOP) {
			this._drawTop();	
		}
		else if (mode === DictionaryMode.MAIN) {
			this._drawMain();
		}
	},
	
	drawScreenTopText: function(textui) {
		TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
	},
	
	getScreenInteropData: function() {
		return null;
	},
	
	setScrollbarData: function() {
	},
	
	getExtraDisplayName: function() {
		return this.getScreenTitleName();
	},
	
	getExtraDescription: function() {
		return '';
	},
	
	getContentX: function() {
		return LayoutControl.getCenterX(-1, 560);
	},
	
	getContentY: function() {
		return LayoutControl.getCenterY(-1, this.getContentHeight());
	},
	
	getContentHeight: function() {
		return Math.floor((root.getGameAreaHeight() / 3) * 2);
	},
	
	drawDictionaryImage: function(obj) {
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._scrollbar = createScrollbarObject(DictionaryScrollbar, this);
		this._storyDataChanger = createObject(StoryDataChanger);
		this._messagePager = createObject(MessagePager);
		this._secretViewer = createObject(SecretViewer);
		this._dataChanger = createObject(VerticalDataChanger);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this.setScrollbarData();
		this._setMessagePagerData();
		
		this.changeCycleMode(DictionaryMode.TOP);
	},
	
	_setMessagePagerData: function() {
		var textui = root.queryTextUI('extraexplanation_title');
		var messagePagerParam = StructureBuilder.buildMessagePagerParam();
		
		messagePagerParam.color = textui.getColor();
		messagePagerParam.font = textui.getFont();
		messagePagerParam.picUnderLine = textui.getUIImage();
		messagePagerParam.rowCount = Math.floor(this.getContentHeight() / 28);
		
		this._messagePagerParam = messagePagerParam;
	},
	
	_moveTop: function() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			this._changeNewPage(true);
			this.changeCycleMode(DictionaryMode.MAIN);
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		
		return result;
	},
	
	_moveMain: function() {
		var index;
		
		this._storyDataChanger.movePage();
		
		if (InputControl.isCancelAction()) {
			MouseControl.changeCursorFromScrollbar(this._scrollbar, this._scrollbar.getIndex());
			this._playCancelSound();
			this.changeCycleMode(DictionaryMode.TOP);
		}
		else if (this._storyDataChanger.checkPage()) {
			this._changeNewPage(false);
		}
		else {
			index = this._dataChanger.checkDataIndex(this._scrollbar, null);
			if (index !== -1) {
				this._scrollbar.setIndex(index);
				this._changeNewPage(true);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_changeNewPage: function(isTarget) {
		var text;
		var data = this._scrollbar.getObject();
		
		this._storyDataChanger.setCurrentData(data);
		
		if (isTarget) {
			this._setPageData();
		}
		
		text = data.getPageText(this._storyDataChanger.getTruePageIndex());
		this._messagePager.setMessagePagerText(text, this._messagePagerParam);
	},
	
	_setPageData: function() {
		this._storyDataChanger.setPageData(this._messagePager.getPagerWidth(), 120);
	},
	
	_drawTop: function() {
		var x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
	},
	
	_drawMain: function() {
		var obj = this._scrollbar.getObject();
		
		if (this._scrollbar.isNameDisplayable(obj, 0)) {
			this._drawTopName(obj);
			this._drawExplanation(obj);
			this.drawDictionaryImage(obj);
		}
		else {
			this._secretViewer.drawSecretCharacter(obj, 0);
		}
		
		this._drawPage();
	},
	
	_drawTopName: function(obj) {
		var text = obj.getFormalName();
		var textui = root.queryTextUI('extraname_title');
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var x = this.getContentX();
		var y = this.getContentY();
		
		TitleRenderer.drawTitle(pic, x, y, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), 8);
		TextRenderer.drawText(x + 40, y + 17, text, -1, color, font);
	},
	
	_drawExplanation: function(obj) {
		var x = this.getContentX();
		var y = this.getContentY() + 86;
		
		this._messagePager.drawMessagePager(x, y);
	},
	
	_drawPage: function() {
		this._storyDataChanger.drawPage(this.getContentX(), this.getContentY() + 86);
		this._storyDataChanger.drawPageNumber(this.getContentX() + 340, this.getContentY() + 56);
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	}
}
);

var CharacterScreen = defineObject(DictionaryScreen,
{
	setScrollbarData: function() {
		var dictionaryScrollbarParam = this._createDictionaryScrollbarParam();
		
		this._scrollbar.setDictionaryScrollbarParam(dictionaryScrollbarParam);
		this._scrollbar.setDictionaryFormation();
		this._scrollbar.setActive(true);
		
		this._scrollbar.setDataList(root.getBaseData().getCharacterDictionaryList());
		
		this._storyDataChanger.setConditionData(root.getStoryPreference().isCharacterNumberVisible(), dictionaryScrollbarParam.funcCondition);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Character');
	},
	
	getExtraDescription: function() {
		return StringTable.Extra_Character;
	},
	
	drawDictionaryImage: function(obj) {
		var x, y;
		var image = obj.getCharIllustImage();
		
		if (image !== null) {
			x = this._getIllustX(image, obj);
			y = this._getIllustY(image, obj);
			image.draw(x, y);
		}
		else {
			x = this._getFaceX(image, obj);
			y = this._getFaceY(image, obj);
			if (root.isLargeFaceUse()) {
				this._drawLargeFace(x, y, obj.getResourceHandle());
			}
			else {
				this._drawFaceImage(x, y, obj.getResourceHandle());
			}
		}
	},
	
	_createDictionaryScrollbarParam: function() {
		var dictionaryScrollbarParam = StructureBuilder.buildDictionaryScrollbarParam();
		
		dictionaryScrollbarParam.funcCondition = function(object, index) {
			return object.isPageEnabled(index);
		};
		
		return dictionaryScrollbarParam;
	},
	
	_drawFaceImage: function(x, y, handle) {
		var picFrame = root.queryUI('extraunit_frame');
		var xMargin = 16;
		var yMargin = 16;
		var frameWidth = Math.floor(UIFormat.FACEFRAME_WIDTH / 2);
		var frameHeight = UIFormat.FACEFRAME_HEIGHT;
		
		if (handle.isNullHandle()) {
			return;
		}
		
		if (picFrame !== null) {
			picFrame.drawStretchParts(x, y, frameWidth, frameHeight, frameWidth, 0, frameWidth, frameHeight);
		}
		
		GraphicsRenderer.drawImage(x + xMargin, y + yMargin, handle, GraphicsType.FACE);
		
		if (picFrame !== null) {
			picFrame.drawStretchParts(x, y, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
		}
	},
	
	_drawLargeFace: function(xDest, yDest, handle) {
		var xSrc, ySrc;
		var destWidth = root.getLargeFaceWidth();
		var destHeight = root.getLargeFaceHeight();
		var srcWidth = destWidth;
		var srcHeight = destHeight;
		var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
		
		if (pic === null) {
			return;
		}
		
		if (!pic.isLargeImage()) {
			srcWidth = GraphicsFormat.FACE_WIDTH;
			srcHeight = GraphicsFormat.FACE_HEIGHT;
		}
		
		xSrc = handle.getSrcX() * srcWidth;
		ySrc = handle.getSrcY() * srcHeight;
		pic.drawStretchParts(xDest, yDest, destWidth, destHeight, xSrc, ySrc, srcWidth, srcHeight);
	},
	
	_getFaceX: function(image, obj) {
		return this.getContentX() + obj.getImageOffsetX() + 405;
	},
	
	_getFaceY: function(image, obj) {
		return this.getContentY() + obj.getImageOffsetY();
	},
	
	_getIllustX: function(image, obj) {
		return this.getContentX() + obj.getImageOffsetX() + 250;
	},
	
	_getIllustY: function(image, obj) {
		var y;
		var baseheight = Math.floor(root.getGameAreaHeight() * 0.7);
		var height = image.getHeight();
		
		if (height > baseheight) {
			y = root.getGameAreaHeight() - baseheight;
		}
		else {
			y = root.getGameAreaHeight() - height;
		}
		
		return y + obj.getImageOffsetY();
	}
}
);

var WordScreen = defineObject(DictionaryScreen,
{
	setScrollbarData: function() {
		var dictionaryScrollbarParam = this._createDictionaryScrollbarParam();
		
		this._scrollbar = createScrollbarObject(DictionaryScrollbar, this);
		this._scrollbar.setDictionaryScrollbarParam(dictionaryScrollbarParam);
		this._scrollbar.setDictionaryFormation();
		this._scrollbar.setActive(true);
		
		this._scrollbar.setDataList(root.getBaseData().getWordDictionaryList());
		
		this._storyDataChanger.setConditionData(root.getStoryPreference().isWordNumberVisible(), dictionaryScrollbarParam.funcCondition);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Word');
	},
	
	getExtraDescription: function() {
		return StringTable.Extra_Word;
	},
	
	drawDictionaryImage: function(obj) {
		var x, y;
		var image = obj.getPictureImage();
		
		if (image !== null) {
			x = this._getPictureX(image, obj);
			y = this._getPictureY(image, obj);
			image.draw(x, y);
		}
	},
	
	_createDictionaryScrollbarParam: function() {
		var dictionaryScrollbarParam = StructureBuilder.buildDictionaryScrollbarParam();
		
		dictionaryScrollbarParam.funcCondition = function(object, index) {
			return object.isPageEnabled(index);
		};
		
		return dictionaryScrollbarParam;
	},
	
	_getPictureX: function(image, obj) {
		return this.getContentX() + obj.getImageOffsetX() + 375;
	},
	
	_getPictureY: function(image, obj) {
		return this.getContentY() + obj.getImageOffsetY() + 10;
	}
}
);

var GalleryMode = {
	TOP: 0,
	MAIN: 1
};

var GalleryScreen = defineObject(BaseScreen,
{
	_scrollbar: null,
	_storyDataChanger: null,
	_secretViewer: null,
	_descriptionChanger : null,
	_dataChanger: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === GalleryMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === GalleryMode.MAIN) {
			result = this._moveMain();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === GalleryMode.TOP) {
			this._drawTop();	
		}
		else if (mode === GalleryMode.MAIN) {
			this._drawMain();
		}
	},
	
	drawScreenTopText: function(textui) {
		TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
	},
	
	drawScreenBottomText: function(textui) {
		this._descriptionChanger.drawBottomDescription(textui, this._scrollbar);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Gallery');
	},
	
	getExtraDisplayName: function() {
		return this.getScreenTitleName();
	},
	
	getExtraDescription: function() {
		return StringTable.Extra_Gallery;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._scrollbar = createScrollbarObject(this._isThumbnailMode() ? ThumbnailScrollbar : DictionaryScrollbar, this);
		this._storyDataChanger = createObject(StoryDataChanger);
		this._secretViewer = createObject(SecretViewer);
		this._descriptionChanger = createObject(DescriptionChanger);
		this._dataChanger = createObject(VerticalDataChanger);
	},
	
	_completeScreenMemberData: function(screenParam) {
		var dictionaryScrollbarParam = this._createDictionaryScrollbarParam();
		
		this._scrollbar.setDictionaryScrollbarParam(dictionaryScrollbarParam);
		this._scrollbar.setDictionaryFormation();
		this._scrollbar.setActive(true);
		this._scrollbar.setDataList(root.getBaseData().getGalleryDictionaryList());
		
		this._descriptionChanger.setDescriptionData();
		this._descriptionChanger.setDescriptionText(this._scrollbar);
		
		this._storyDataChanger.setConditionData(root.getStoryPreference().isGalleryNumberVisible(), dictionaryScrollbarParam.funcCondition);
		
		this.changeCycleMode(GalleryMode.TOP);
	},
	
	_createDictionaryScrollbarParam: function() {
		var dictionaryScrollbarParam = StructureBuilder.buildDictionaryScrollbarParam();
		
		dictionaryScrollbarParam.funcCondition = function(object, index) {
			return root.getStoryPreference().isGalleryPublic() || object.isPageEnabled(index);
		};
		
		return dictionaryScrollbarParam;
	},
	
	_moveTop: function() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			this._changeNewPage(true);
			this.changeCycleMode(GalleryMode.MAIN);
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.NONE) {
			this._descriptionChanger.setDescriptionText(this._scrollbar);
		}
		
		return result;
	},
	
	_moveMain: function() {
		var index;
		
		this._storyDataChanger.movePage();
		
		if (InputControl.isCancelAction()) {
			MouseControl.changeCursorFromScrollbar(this._scrollbar, this._scrollbar.getIndex());
			this._playCancelSound();
			this.changeCycleMode(GalleryMode.TOP);
		}
		else if (this._storyDataChanger.checkPage()) {
			this._changeNewPage(false);
		}
		else {
			index = this._dataChanger.checkDataIndex(this._scrollbar, null);
			if (index !== -1) {
				this._scrollbar.setIndex(index);
				this._changeNewPage(true);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_changeNewPage: function(isTarget) {
		var data = this._scrollbar.getObject();
		
		this._storyDataChanger.setCurrentData(data);
		
		if (isTarget) {
			this._setPageData();
		}
	},
	
	_setPageData: function() {
		var index, handle, type, pic, size;
		var obj = this._scrollbar.getObject();
		
		// Set a dummy range and initialize an index.
		this._storyDataChanger.setPageData(root.getGameAreaWidth(), root.getGameAreaHeight());
		
		index = this._storyDataChanger.getTruePageIndex();
		if (!this._scrollbar.isNameDisplayable(obj, index)) {
			return;
		}
		
		handle = obj.getGraphicsResourceHandle(index);
		type = obj.getGraphicsType(index);
		pic = GraphicsRenderer.getGraphics(handle, type);
		size = GraphicsRenderer.getGraphicsSize(type, pic);
		
		this._storyDataChanger.setPageData(size.width, size.height);
		
		this._descriptionChanger.setDescriptionText(this._scrollbar);
	},
	
	_drawTop: function() {
		var x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
	},
	
	_drawMain: function() {
		var obj = this._scrollbar.getObject();
		var index = this._storyDataChanger.getTruePageIndex();
		
		if (this._scrollbar.isNameDisplayable(obj, index)) {
			this._drawImage(obj, index);
		}
		else {
			this._secretViewer.drawSecretGallery(obj, index);
		}
	},
	
	_drawImage: function(obj, index) {
		var x, y;
		var handle = obj.getGraphicsResourceHandle(index);
		var type = obj.getGraphicsType(index);
		var pic = GraphicsRenderer.getGraphics(handle, type);
		var size = GraphicsRenderer.getGraphicsSize(type, pic);
		
		if (this._isScaled()) {
			pic.drawStretchParts(0, 0, root.getGameAreaWidth(), root.getGameAreaHeight(), 0, 0, size.width, size.height);
		}
		else {
			x = LayoutControl.getCenterX(-1, size.width);
			y = LayoutControl.getCenterY(-1, size.height);
			GraphicsRenderer.drawImage(x, y, handle, type);
			this._storyDataChanger.drawPage(x, y);
			this._storyDataChanger.drawPageNumber(x + size.width - 10, y - 24);
		}
	},
	
	_isScaled: function() {
		return root.getStoryPreference().isGalleryScaled();
	},
	
	_isThumbnailMode: function() {
		var i, gallery, handle;
		var list = root.getBaseData().getGalleryDictionaryList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			gallery = list.getData(i);
			handle = gallery.getThumbnailResourceHandle();
			if (!handle.isNullHandle()) {
				// If there is a data including a thumbnail, even one thumbnail, return true to be a thumbnail mode.
				return true;
			}
		}
		
		return false;
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	},
	
	_playMenuTargetChangeSound: function() {
		MediaControl.soundDirect('menutargetchange');
	}
}
);

var SoundRoomMode = {
	TOP: 0
};

var SoundRoomScreen = defineObject(BaseScreen,
{
	_isMusicPlay: false,
	_isSoundPlay: false,
	_scrollbar: null,
	_descriptionChanger : null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
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
	
	drawScreenCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
	},
	
	drawScreenTopText: function(textui) {
		TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
	},
	
	drawScreenBottomText: function(textui) {
		this._descriptionChanger.drawBottomDescription(textui, this._scrollbar);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('SoundRoom');
	},
	
	getExtraDisplayName: function() {
		return this.getScreenTitleName();
	},
	
	getExtraDescription: function() {
		return StringTable.Extra_SoundRoom;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._activeMusicHandle = null;
		this._activeMediaType = -1;
		this._scrollbar = createScrollbarObject(DictionaryScrollbar, this);
		this._descriptionChanger = createObject(DescriptionChanger);
	},
	
	_completeScreenMemberData: function(screenParam) {
		var dictionaryScrollbarParam = this._createDictionaryScrollbarParam();
		
		this._scrollbar.setDictionaryScrollbarParam(dictionaryScrollbarParam);
		this._scrollbar.setDictionaryFormation();
		this._scrollbar.setActive(true);
		this._scrollbar.setDataList(root.getBaseData().getMediaDictionaryList());
		
		this._descriptionChanger.setDescriptionData();
		this._descriptionChanger.setDescriptionText(this._scrollbar);
		
		this.changeCycleMode(SoundRoomMode.TOP);
	},
	
	_createDictionaryScrollbarParam: function() {
		var dictionaryScrollbarParam = StructureBuilder.buildDictionaryScrollbarParam();
		
		dictionaryScrollbarParam.funcCondition = function(object, index) {
			return object.isMediaEnabled();
		};
		
		return dictionaryScrollbarParam;
	},
	
	_moveSelect: function() {
		var mediaHandle, mediaType;
		var obj = this._scrollbar.getObject();
		
		if (this._scrollbar.isNameDisplayable(obj, 0)) {
			mediaHandle = obj.getMediaHandle();
			mediaType = obj.getMediaType();
			
			if (mediaType === MediaType.MUSIC) {
				// If the selected music is different from the currently played music, the music is played.
				if (!mediaHandle.isEqualHandle(root.getMediaManager().getActiveMusicHandle())) {
					MediaControl.musicPlay(mediaHandle);
					this._isMusicPlay = true;
				}
			}
			else if (mediaType === MediaType.SE) {
				MediaControl.soundPlay(mediaHandle);
				this._isSoundPlay = true;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveCancel: function() {
		if (this._isMusicPlay) {
			MediaControl.musicStop(MusicStopType.BACK);
		}
		if (this._isSoundPlay) {
			MediaControl.soundStop();
		}
		
		this._descriptionChanger.endDescription();
		
		return MoveResult.END;
	},
	
	_moveNone: function() {
		this._descriptionChanger.setDescriptionText(this._scrollbar);
		return MoveResult.CONTINUE;
	}
}
);

var DescriptionChanger = defineObject(BaseObject,
{
	_prevIndex: -1,
	_messageAnalyzer: null,
	
	setDescriptionData: function() {
		var messageAnalyzerParam = this._createMessageAnalyzerParam();
		
		this._messageAnalyzer = createObject(MessageAnalyzer);
		this._messageAnalyzer.setMessageAnalyzerParam(messageAnalyzerParam);
		this._messageAnalyzer.setMaxRowCount(2);
	},
	
	setDescriptionText: function(scrollbar) {
		var text;
		var index = scrollbar.getIndex();
		var event = scrollbar.getObject();
		
		if (index === this._prevIndex) {
			return;
		}
		
		if (scrollbar.isNameDisplayable(event, 0)) {
			text = event.getDescription();
		}
		else {
			text = '';
		}
		
		this._messageAnalyzer.setMessageAnalyzerText(text);
		
		this._prevIndex = index;
	},
	
	endDescription: function() {
		this._prevIndex = -1;
	},
	
	drawBottomDescription: function(textui, scrollbar) {
		var x, y, pic;
		var event = scrollbar.getObject();
		
		if (event === null) {
			return;
		}
		
		x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
		y = root.getGameAreaHeight() - UIFormat.SCREENFRAME_HEIGHT;
		
		pic = textui.getUIImage();
		if (pic !== null) {	
			pic.draw(x, y);
		}
		
		this._messageAnalyzer.drawMessageAnalyzer(x + 103, y + 43, -1, -1, null);
	},
	
	drawBottomDescriptionEx: function(textui, text) {
		var x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
		var y = root.getGameAreaHeight() - UIFormat.SCREENFRAME_HEIGHT;
		var pic = textui.getUIImage();
		
		if (pic !== null) {	
			pic.draw(x, y);
		}
		
		if (text !=='') {
			this._messageAnalyzer.setMessageAnalyzerText(text);
			this._messageAnalyzer.drawMessageAnalyzer(x + 103, y + 43, -1, -1, null);
		}
	},
	
	_getWindowTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	_createMessageAnalyzerParam: function() {
		var textui = this._getWindowTextUI();
		var messageAnalyzerParam = StructureBuilder.buildMessageAnalyzerParam();
		
		messageAnalyzerParam.color = textui.getColor();
		messageAnalyzerParam.font = textui.getFont();
		messageAnalyzerParam.messageSpeedType = SpeedType.DIRECT;
		
		return messageAnalyzerParam;
	}
}
);

var StoryDataChanger = defineObject(BaseObject,
{
	_pageChanger: null,
	_data: null,
	_funcCondition: null,
	_isMultiPage: false,
	xRendering: 0,
	yRendering: 0,
	
	initialize: function() {
		this._pageChanger = createObject(HorizontalPageChanger);
	},
	
	setPageData: function(width, height) {
		this._pageChanger.setPageData(this.getTruePageCount(), width, height);
	},
	
	setCurrentData: function(data) {
		this._data = data;
	},
	
	setConditionData: function(isMultiPage, funcCondition) {
		this._isMultiPage = isMultiPage;
		this._funcCondition = funcCondition;
	},
	
	movePage: function() {
		return this._pageChanger.movePage();
	},
	
	checkPage: function() {
		var index = this._getPressedIndex();
		
		if (index !== -1) {
			this._pageChanger.setPageIndex(index);
			return true;
		}
		
		return this._pageChanger.checkPage();
	},
	
	drawPage: function(x, y) {
		this._pageChanger.drawPage(x, y);
	},
	
	drawPageNumber: function(x, y) {
		var i, colorIndex;
		var count = this.getTruePageCount();
		var index = this._pageChanger.getPageIndex();
		
		if (count === 1 || !this._isMultiPage) {
			return;
		}
		
		this.xRendering = x;
		this.yRendering = y;
		
		for (i = count - 1; i >= 0; i--) {
			if (i === index) {
				colorIndex = 0;
			}
			else {
				colorIndex = 4;
			}
			
			NumberRenderer.drawNumberColor(x, y, i + 1, colorIndex, 255);
			x -= 22;
		}
	},
	
	getTruePageIndex: function() {
		var i;
		var count = this._data.getPageCount();
		var n = 0;
		var index = this._pageChanger.getPageIndex();
		
		if (this._isMultiPage) {
			for (i = 0; i < count; i++) {
				if (this._isPageEnabled(this._data, i)) {
					if (index === n) {
						index = i;
						break;
					}
					n++;
				}
			}
		}
		else {
			// Refer to the final page.
			for (i = 0; i < count; i++) {
				if (this._isPageEnabled(this._data, i)) {
					index = i;
				}
			}
		}
		
		return index;
	},
	
	getTruePageCount: function() {
		var i;
		var count = this._data.getPageCount();
		var n = 0;
		
		if (!this._isMultiPage) {
			return 1;
		}
		
		for (i = 0; i < count; i++) {
			if (this._isPageEnabled(this._data, i)) {
				n++;
			}
		}
		
		return n;
	},
	
	_getPressedIndex: function() {
		var i, range;
		var dx = 0;
		var count = this.getTruePageCount();
		var width = UIFormat.NUMBER_WIDTH / 10;
		var height = UIFormat.NUMBER_HEIGHT / 5;
		
		if (count === 1 || !this._isMultiPage) {
			return -1;
		}
		
		for (i = count - 1; i >= 0; i--) {
			range = createRangeObject(this.xRendering + dx, this.yRendering, width, height);
			if (MouseControl.isRangePressed(range)) {
				return i;
			}
			
			dx -= 22;
		}
		
		return -1;
	},
	
	_isPageEnabled: function(object, index) {
		return root.getStoryPreference().isTestPlayPublic() || this._funcCondition(object, index);
	}
}
);

var SecretViewer = defineObject(BaseObject,
{
	drawSecretCharacter: function(obj, index) {
		this._drawCommon(obj, index);
	},
	
	drawSecretWord: function(obj, index) {
		this._drawCommon(obj, index);
	},
	
	drawSecretGallery: function(obj, index) {
		this._drawCommon(obj, index);
	},
	
	_drawCommon: function(obj, index) {
		var range;
		var text = StringTable.HideData_Secret;
		var textui = root.queryTextUI('extraitem_title');
		var color = textui.getColor();
		var font = textui.getFont();
		
		range = createRangeObject(0, 0, root.getGameAreaWidth(), root.getGameAreaHeight());
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
	}
}
);
