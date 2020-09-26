
var BaseMessageView = defineObject(BaseObject,
{
	_messageLayout: null,
	_activePos: MessagePos.NONE,
	_isNameDisplayable: false,
	_isWindowDisplayable: false,
	_faceId: 0,
	_illustId: 0,
	_name: null,
	_faceHandle: null,
	_illustImage: null,
	_messageAnalyzer: null,
	
	setupMessageView: function(messageViewParam) {
		this._messageLayout = messageViewParam.messageLayout;
		this._activePos = messageViewParam.pos;
		this._isNameDisplayable = messageViewParam.isNameDisplayable;
		this._isWindowDisplayable = messageViewParam.isWindowDisplayable;
		
		if (this._messageLayout.isFacialExpressionEnabled()) {
			this._faceId = messageViewParam.facialExpressionId;
		}
		
		if (this._messageLayout.isCharIllustFacialExpressionEnabled()) {
			this._illustId = messageViewParam.facialExpressionId;
		}
		
		this._setupName(messageViewParam);
		this._setupFaceHandle(messageViewParam);
		this._setupIllustImage(messageViewParam);
		
		this._messageAnalyzer = this.createMessageAnalyzer(messageViewParam);
		this._messageAnalyzer.setMessageAnalyzerText(messageViewParam.text);
	},
	
	moveMessageView: function() {
		if (MessageViewControl.moveBacklog() !== MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		if (MessageViewControl.isHidden() || MessageViewControl.isBacklog()) {
			return MoveResult.CONTINUE;
		}
		
		return this._messageAnalyzer.moveMessageAnalyzer();
	},
	
	drawMessageView: function(isActive, pos) {
		var xWindow = pos.x + this._messageLayout.getWindowX();
		var yWindow = pos.y + this._messageLayout.getWindowY();
		var xText = pos.x + this._messageLayout.getTextX();
		var yText = pos.y + this._messageLayout.getTextY();
		var xCursor = pos.x + this._messageLayout.getCursorX();
		var yCursor = pos.y + this._messageLayout.getCursorY();
		var xFace = pos.x + this._messageLayout.getFaceX();
		var yFace = pos.y + this._messageLayout.getFaceY();
		var xName = pos.x + this._messageLayout.getNameX();
		var yName = pos.y + this._messageLayout.getNameY();
		
		MessageViewControl.drawBacklog();
		
		if (MessageViewControl.isHidden() || MessageViewControl.isBacklog()) {
			return;
		}
		
		this.drawMessageWindow(xWindow, yWindow);
		this._messageAnalyzer.drawMessageAnalyzer(xText, yText, xCursor, yCursor, this._messageLayout.getPageCursorUI());
		
		if (!isActive) {
			// Draw before drawFace in case face graphic extends outside of the window.
			this._drawWindowShadow(xWindow, yWindow);
		}
		
		this.drawFace(xFace, yFace, isActive);
		
		if (isActive) {
			this.drawName(xName, yName);
		}
	},
	
	endMessageView: function() {
		if (this._messageAnalyzer !== null) {
			this._messageAnalyzer.endMessageAnalyzer();
		}
	},
	
	eraseMessage: function() {
	},
	
	createMessageAnalyzer: function(messageViewParam) {
		var messageAnalyze = createObject(MessageAnalyzer);
		var messageAnalyzerParam = this._createMessageAnalyzerParam(messageViewParam);
		
		messageAnalyze.setMessageAnalyzerParam(messageAnalyzerParam);
		
		return messageAnalyze;
	},
	
	drawMessageWindow: function(xWindow, yWindow) {
		var textui = this._messageLayout.getWindowTextUI();
		var picWindow = textui.getUIImage();
		
		if (picWindow === null || !this._isWindowDisplayable) {
			return;
		}
		
		picWindow.draw(xWindow, yWindow);
	},
	
	drawFace: function(xDest, yDest, isActive) {
		var pic, xSrc, ySrc;
		var destWidth = GraphicsFormat.FACE_WIDTH;
		var destHeight = GraphicsFormat.FACE_HEIGHT;
		var srcWidth = destWidth;
		var srcHeight = destHeight;
		var handle = this._faceHandle;
		var facialExpressionId = this._faceId;
		
		if (handle === null) {
			return;
		}
		
		pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
		if (pic === null) {
			return;
		}
		
		if (root.isLargeFaceUse()) {
			destWidth = root.getLargeFaceWidth();
			destHeight = root.getLargeFaceHeight();
			if (pic.isLargeImage()) {
				srcWidth = destWidth;
				srcHeight = destHeight;
			}
		}
		
		if (facialExpressionId === 0) {
			xSrc = handle.getSrcX();
			ySrc = handle.getSrcY();
		}
		else {
			xSrc = Math.floor(facialExpressionId % 6);
			ySrc = Math.floor(facialExpressionId / 6);
		}
		
		if (this._messageLayout.isFaceReverse()) {
			pic.setReverse(true);
		}
		
		if (!isActive) {
			pic.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());
		}
		
		xSrc *= srcWidth;
		ySrc *= srcHeight;
		pic.drawStretchParts(xDest, yDest, destWidth, destHeight, xSrc, ySrc, srcWidth, srcHeight);
	},
	
	drawName: function(x, y) {
		var text = this._name;
		var textui, color, font, pic;
		
		if (text === '' || !this._isNameDisplayable) {
			return;
		}
		
		textui = this._messageLayout.getNameTextUI();
		color = textui.getColor();
		font = textui.getFont();
		pic = textui.getUIImage();
		
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, 4);
	},
	
	drawCharIllust: function(isActive) {
		var pos, xCharIllust, yCharIllust;
		var image = this._illustImage;
		
		if (image === null || MessageViewControl.isHidden()) {
			return;
		}
		
		pos = this.getIllustPos(image);
		xCharIllust = pos.x + this._messageLayout.getCharIllustX();
		yCharIllust = pos.y + this._messageLayout.getCharIllustY();
		
		if (this._messageLayout.isCharIllustReverse()) {
			image.setReverse(true);
		}
		
		if (!isActive) {
			image.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());
		}
		
		image.draw(xCharIllust, yCharIllust);
	},
	
	_drawWindowShadow: function(xWindow, yWindow) {
		var textui = this._messageLayout.getWindowTextUI();
		var picWindow = textui.getUIImage();
		
		if (picWindow === null) {
			return;
		}
		
		// Make opacity 0 in order to draw shadow.
		picWindow.setAlpha(0);
		picWindow.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());
		picWindow.draw(xWindow, yWindow);
	},
	
	_getNonActiveColor: function() {
		return 0x0;
	},
	
	_getNonActiveAlpha: function() {
		return 96;
	},
	
	_setupName: function(messageViewParam) {
		var name = '';
		
		if (messageViewParam.unit !== null) {
			name = messageViewParam.unit.getName();
		}
		else if (messageViewParam.npc !== null) {
			name = messageViewParam.npc.getName();
		}
		
		this._name = name;
	},
	
	_setupFaceHandle: function(messageViewParam) {
		var handle = null;
		
		if (this._messageLayout.getFaceVisualType() === FaceVisualType.INVISIBLE) {
			return;
		}
		
		if (messageViewParam.unit !== null) {
			handle = messageViewParam.unit.getFaceResourceHandle();
		}
		else if (messageViewParam.npc !== null) {
			handle = messageViewParam.npc.getFaceResourceHandle();
		}
		
		this._faceHandle = handle;
	},
	
	_setupIllustImage: function(messageViewParam) {
		var image = null;
		var facialExpressionId = this._illustId;
		
		if (this._messageLayout.getCharIllustVisualType() === CharIllustVisualType.NONE) {
			return;
		}
		
		if (messageViewParam.unit !== null) {
			image = messageViewParam.unit.getCharIllustImage(facialExpressionId);
		}
		else if (messageViewParam.npc !== null) {
			image = messageViewParam.npc.getCharIllustImage(facialExpressionId);
		}
		
		this._illustImage = image;
	},
	
	getTextWindowWidth: function() {
		var textui = this._messageLayout.getWindowTextUI();
		var picWindow = textui.getUIImage();
		
		if (picWindow === null) {
			return UIFormat.TEXTWINDOW_WIDTH;
		}
		
		return picWindow.getWidth();
	},
	
	getTextWindowHeight: function() {
		var textui = this._messageLayout.getWindowTextUI();
		var picWindow = textui.getUIImage();
		
		if (picWindow === null) {
			return UIFormat.TEXTWINDOW_HEIGHT;
		}
		
		return picWindow.getHeight();
	},
	
	getMessageSpeedType: function() {
		return EnvironmentControl.getMessageSpeedType();
	},
	
	getMessagePos: function() {
		var pos;
			
		if (this._activePos === MessagePos.TOP) {
			pos = this.getMessageTopPos();
		}
		else if (this._activePos === MessagePos.CENTER) {
			pos = this.getMessageCenterPos();
		}
		else if (this._activePos === MessagePos.BOTTOM) {
			pos = this.getMessageBottomPos();
		}
		else {
			pos = createPos(0, 0);
		}
		
		return pos;
	},
	
	getMessageTopPos: function() {
		var y = LayoutControl.getRelativeY(6) - 70;
		
		return createPos(this.getMessageX(), y);
	},
	
	getMessageCenterPos: function() {
		var y = Math.floor(root.getGameAreaHeight() / 2) - Math.floor(this.getTextWindowHeight() / 2);
		
		return createPos(this.getMessageX(), y);
	},
	
	getMessageBottomPos: function() {
		var y = LayoutControl.getRelativeY(6) - 70;
		
		y = root.getGameAreaHeight() - (this.getTextWindowHeight() + y);
		
		return createPos(this.getMessageX(), y);
	},
	
	getMessageX: function() {
		return LayoutControl.getCenterX(-1, this.getTextWindowWidth());
	},
	
	getIllustPos: function(image) {
		var pos;
		var type = this._messageLayout.getCharIllustVisualType();
			
		if (type === CharIllustVisualType.LEFT) {
			pos = this.getIllustTopPos(image);
		}
		else if (type === CharIllustVisualType.CENTER) {
			pos = this.getIllustCenterPos(image);
		}
		else if (type === CharIllustVisualType.RIGHT) {
			pos = this.getIllustBottomPos(image);
		}
		else {
			pos = createPos(0, 0);
		}
		
		return pos;
	},
	
	getIllustTopPos: function(image) {
		var x, y;
		
		// Display on right side.
		x = Math.floor(root.getGameAreaWidth() / 2);
		x += Math.floor(x / 2);
		x -= Math.floor(image.getWidth() / 2);
		
		y = this.getIllustY(image);
		
		return createPos(x, y);
	},
	
	getIllustCenterPos: function(image) {
		var x, y;
		
		x = Math.floor(root.getGameAreaWidth() / 2);
		x -= Math.floor(image.getWidth() / 2);
		
		y = this.getIllustY(image);
		
		return createPos(x, y);
	},
	
	getIllustBottomPos: function(image) {
		var x, y;
		
		// Display on left side
		x = Math.floor(root.getGameAreaWidth() / 2);
		x -= Math.floor(x / 2);
		x -= Math.floor(image.getWidth() / 2);
		
		y = this.getIllustY(image);
		
		return createPos(x, y);
	},
	
	getIllustY: function(image) {
		var y;
		var baseheight = Math.floor(root.getGameAreaHeight() * 0.7);
		var height = image.getHeight();
		
		if (height > baseheight) {
			y = root.getGameAreaHeight() - baseheight;
		}
		else {
			y = root.getGameAreaHeight() - height;
		}
		
		return y;
	},
	
	_createMessageAnalyzerParam: function(messageViewParam) {
		var textui = this._messageLayout.getWindowTextUI();
		var messageAnalyzerParam = StructureBuilder.buildMessageAnalyzerParam();
		
		messageAnalyzerParam.color = textui.getColor();
		messageAnalyzerParam.font = textui.getFont();
		messageAnalyzerParam.voiceSoundHandle = this._messageLayout.getVoiceSoundHandle();
		messageAnalyzerParam.pageSoundHandle = this._messageLayout.getPageSoundHandle();
		messageAnalyzerParam.messageSpeedType = this.getMessageSpeedType();
		
		return messageAnalyzerParam;
	}
}
);

// Manage objects inheriting BaseMessageView (this object itself does not inherit BaseMessageView).
var FaceView = defineObject(BaseObject,
{
	_topView: null,
	_centerView: null,
	_bottomView: null,
	_activePos: MessagePos.NONE,
	
	setupMessageView: function(messageViewParam) {
		var pos = messageViewParam.pos;
		
		if (pos === MessagePos.TOP) {
			this._topView = createObject(FaceViewTop);
			messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.TOP);
			this._topView.setupMessageView(messageViewParam);
		}
		else if (pos === MessagePos.CENTER) {
			this._centerView = createObject(FaceViewCenter);
			messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.CENTER);
			this._centerView.setupMessageView(messageViewParam);
		}
		else if (pos === MessagePos.BOTTOM) {
			this._bottomView = createObject(FaceViewBottom);
			messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.BOTTOM);
			this._bottomView.setupMessageView(messageViewParam);
		}
		
		this._activePos = pos;
	},
	
	moveMessageView: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._activePos === MessagePos.TOP) {
			result = this._topView.moveMessageView();
		}
		else if (this._activePos === MessagePos.CENTER) {
			result = this._centerView.moveMessageView();
		}
		else if (this._activePos === MessagePos.BOTTOM) {
			result = this._bottomView.moveMessageView();
		}
		
		return result;
	},
	
	drawMessageView: function() {
		var view = null;
		var isActive = true;
		var isTopActive = true;
		var isCenterActive = true;
		var isBottomActive = true;
		
		if (root.isMessageBlackOutEnabled()) {
			isTopActive = this._activePos === MessagePos.TOP;
			isCenterActive = this._activePos === MessagePos.CENTER;
			isBottomActive = this._activePos === MessagePos.BOTTOM;
		}
		
		if (this._topView !== null) {
			this._topView.drawCharIllust(isTopActive);
		}
		
		if (this._centerView !== null) {
			this._centerView.drawCharIllust(isCenterActive);
		}
		
		if (this._bottomView !== null) {
			this._bottomView.drawCharIllust(isBottomActive);
		}
		
		if (root.isMessageWindowFixed()) {
			if (this._activePos === MessagePos.TOP) {
				view = this._topView;
				isActive = isTopActive;
			}
			else if (this._activePos === MessagePos.CENTER) {
				view = this._centerView;
				isActive = isCenterActive;
			}
			else if (this._activePos === MessagePos.BOTTOM) {
				view = this._bottomView;
				isActive = isBottomActive;
			}
			
			if (view !== null) {
				view.drawMessageView(isActive, BaseMessageView.getMessageBottomPos.call(view));
			}
		}
		else {
			if (this._topView !== null) {
				this._topView.drawMessageView(isTopActive, this._topView.getMessagePos());
			}
			
			if (this._centerView !== null) {
				this._centerView.drawMessageView(isCenterActive, this._centerView.getMessagePos());
			}
			
			if (this._bottomView !== null) {
				this._bottomView.drawMessageView(isBottomActive, this._bottomView.getMessagePos());
			}
		}
	},
	
	endMessageView: function() {
		this.eraseMessage(MessageEraseFlag.ALL);
	},
	
	eraseMessage: function(flag) {
		if (flag & MessageEraseFlag.TOP) {
			if (this._topView !== null) {
				this._topView.endMessageView();
				this._topView = null;
			}
		}
		
		if (flag & MessageEraseFlag.CENTER) {
			if (this._centerView !== null) {
				this._centerView.endMessageView();
				this._centerView = null;
			}
		}
		
		if (flag & MessageEraseFlag.BOTTOM) {
			if (this._bottomView !== null) {
				this._bottomView.endMessageView();
				this._bottomView = null;
			}
		}
		
		this._activePos = MessagePos.NONE;
	}
}
);

var FaceViewTop = defineObject(BaseMessageView,
{
}
);

var FaceViewCenter = defineObject(BaseMessageView,
{
	getMessageCenterPos: function() {
		// Put window on bottom if there is a character illustration displayed in the middle.
		if (this._illustImage !== null) {
			return BaseMessageView.getMessageBottomPos.call(this);
		}
		
		return BaseMessageView.getMessageCenterPos.call(this);
	}
}
);

var FaceViewBottom = defineObject(BaseMessageView,
{
}
);

var TeropView = defineObject(BaseMessageView,
{
	drawMessageView: function() {
		// Draw character illustration first so it does not cover the window.
		this.drawCharIllust(true);
		BaseMessageView.drawMessageView.call(this, true, this.getMessagePos());
	}
}
);

var StillView = defineObject(BaseMessageView,
{
	drawMessageView: function() {
		this.drawCharIllust(true);
		BaseMessageView.drawMessageView.call(this, true, this.getMessagePos());
	}
}
);

var MessageViewControl = {
	_isHidden: false,
	_backlogWindow: null,
	
	setHidden: function(isHidden) {
		this._isHidden = isHidden;
	},
	
	isHidden: function() {
		return this._isHidden;
	},
	
	isBacklog: function() {
		return this._backlogWindow !== null;
	},
	
	reset: function() {
		this._isHidden = false;
		this._backlogWindow = null;
	},
	
	moveBacklog: function() {
		if (this._backlogWindow !== null) {
			if (this._backlogWindow.moveWindow() !== MoveResult.CONTINUE) {
				this._backlogWindow = null;
				return MoveResult.END;
			}
		}
		else if (this._isBacklogInput()) {
			this._backlogWindow = createWindowObject(BacklogWindow);
			this._backlogWindow.setWindowData();
		}
		else if (this._isMessageInput()) {
			this._isHidden = !this._isHidden;
		}
	
		return MoveResult.CONTINUE;
	},
	
	drawBacklog: function() {
		var x, y;
		
		if (this._backlogWindow === null) {
			return;
		}
		
		x = LayoutControl.getCenterX(-1, this._backlogWindow.getWindowWidth());
		y = LayoutControl.getCenterY(-1, this._backlogWindow.getWindowHeight());
		
		this._backlogWindow.drawWindow(x, y);
	},
	
	_isBacklogInput: function() {
		return InputControl.isInputAction(InputType.UP) || MouseControl.isInputAction(MouseType.UPWHEEL);
	},
	
	_isMessageInput: function() {
		return InputControl.isInputAction(InputType.LEFT) || InputControl.isInputAction(InputType.RIGHT);
	}
};

var BacklogWindow = defineObject(BaseWindow,
{
	_scrollbar: null,

	setWindowData: function() {
		var count = Math.floor(root.getGameAreaHeight() / 70);
		
		this._scrollbar = createScrollbarObject(BacklogScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
		
		this._setBacklogObject();
		this._setFirstIndex();
	},
	
	moveWindowContent: function() {
		var data;
		
		if (InputControl.isInputAction(InputType.DOWN) || InputControl.isInputState(InputType.DOWN)) {
			if (this._scrollbar.getIndex() === this._scrollbar.getObjectCount() - 1) {
				return MoveResult.END;
			}
		}
		else if (MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			data = this._scrollbar.getScrollableData();
			if (!data.isBottom) {
				return MoveResult.END;
			}
		}
		else if (InputControl.isStartAction()) {
			return MoveResult.END;
		}
		
		this._scrollbar.moveInput();
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('backlog_window');
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	_setFirstIndex: function() {
		var count = this._scrollbar.getObjectCount();
		
		this._scrollbar.setIndex(count - 1);
	},
	
	_setBacklogObject: function() {
		var i, j, arr, count2, command;
		var object = {};
		var count = root.getBacklogCommandCount();
		
		for (i = 0; i < count; i++) {
			command = root.getBacklogCommand(i);
			arr = this._getBacklogText(command);
			count2 = arr.length;
			for (j = 0; j < count2; j++) {
				if ((j % 3) === 0) {
					object = {};
					object.command = command;
					object.textArray = [];
					object.voiceName = '';
					this._scrollbar.objectSet(object);
				}
				
				object.textArray.push(arr[j]);
			}
		}
	
		this._scrollbar.objectSetEnd();
		
		this._checkVoice();
	},
	
	_getBacklogText: function(object) {
		var i, j, c, count;
		var text = object.getText();
		var arr = [];
		var replacer = createObject(VariableReplacer);
		var parser = createObject(TextParser);
		var parserInfo = StructureBuilder.buildParserInfo();
		
		// Exclude control characters for voice.
		parserInfo.isVoiceIncluded = false;
		
		text = replacer.startReplace(text);
		text = parser.startReplace(text, parserInfo);
		count = text.length;
		
		for (i = 0, j = 0; i < count; i++) {
			c = text.charAt(i);
			if (c === '\n') {
				arr.push(text.substring(j, i));
				j = i + 1;
			}
			else if (i === count - 1) {
				arr.push(text.substring(j, i + 1));
			}
		}
		
		return arr;
	},
	
	_checkVoice: function() {
		var i, object;
		var count = this._scrollbar.getObjectCount();
		
		// Does not continue if the voice folder is not configured.
		if (this._getVoiceCategory() === '') {
			return;
		}
		
		for (i = 0; i < count; i++) {
			object = this._scrollbar.getObjectFromIndex(i);
			object.voiceName = this._getVoiceName(object);
		}
	},
	
	_getVoiceName: function(object) {
		var i, c;
		var name = '';
		var count = object.textArray.length;
		
		for (i = 0; i < count; i++) {
			c = object.textArray[i].match(this._getKey());
			if (c !== null && c[1] !== '') {
				name = c[1];
			}
			
			object.textArray[i] = object.textArray[i].replace(this._getKey(), '');
		}
		
		return name;
	},
	
	_getKey: function() {
		var key = /\\vo\[(.+?)\]/;
		
		return key;
	},
	
	_getVoiceCategory: function() {
		return DataConfig.getVoiceCategoryName();
	}
}
);

var BacklogScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawName(x, y, object);
		this._drawMessage(x, y, object);
		this._drawFace(x, y, object);
		this._drawVoiceIcon(x, y, object);
	},
	
	getObjectWidth: function() {
		return 550;
	},
	
	getObjectHeight: function() {
		return 70;
	},
	
	playSelectSound: function() {
		var fileName;
		var object = this.getObject();
		var ext = ['ogg', 'mp3', 'wav'];
		
		if (object.voiceName === '') {
			return;
		}
		
		root.getMaterialManager().voiceStop(1, false);
		
		fileName = object.voiceName + '.' + ext[this._getVoiceExtIndex()];
		root.getMaterialManager().voicePlay(this._getVoiceCategory(), fileName, 1);
	},
	
	playCancelSound: function() {
	},
	
	_drawName: function(xDest, yDest, object) {
		var range;
		var textui = this._getNameTextUI();
		var color = this._getNameColor(object.command, textui);
		var font = textui.getFont();
		var name = this._getNameText(object.command);
		
		if (!root.isLargeFaceUse()) {
			return;
		}
		
		range = createRangeObject(xDest, yDest, 120, this.getObjectHeight());
		TextRenderer.drawRangeText(range, TextFormat.CENTER, name, -1, color, font);
	},
	
	_drawMessage: function(xDest, yDest, object) {
		var i;
		var length = -1;
		var textui = this._getMessageTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var textArray = object.textArray;
		var count = textArray.length;
		
		xDest += 160;
		for (i = 0; i < count; i++) {
			TextRenderer.drawKeywordText(xDest, yDest + (i * 20), textArray[i], length, color, font);
		}
	},
	
	_drawFace: function(xDest, yDest, object) {
		var pic, xSrc, ySrc;
		var destWidth = GraphicsFormat.FACE_WIDTH;
		var destHeight = 67;
		var srcWidth = destWidth;
		var srcHeight = destHeight;
		var handle = this._getFaceResourceHandle(object.command);
		var facialExpressionId = object.command.getFacialExpressionId();
		
		if (handle === null || root.isLargeFaceUse()) {
			return;
		}
		
		pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
		if (pic === null) {
			return;
		}
		
		if (facialExpressionId === 0) {
			xSrc = handle.getSrcX();
			ySrc = handle.getSrcY();
		}
		else {
			xSrc = Math.floor(facialExpressionId % 6);
			ySrc = Math.floor(facialExpressionId / 6);
		}
		
		xSrc *= GraphicsFormat.FACE_WIDTH;
		ySrc *= GraphicsFormat.FACE_HEIGHT;
		pic.setAlpha(this._getFaceAlpha());
		pic.drawStretchParts(xDest + 25, yDest - 2, destWidth, destHeight, xSrc, ySrc + 5, srcWidth, srcHeight);
	},
	
	_drawVoiceIcon: function(xDest, yDest, object) {
		var handle = root.queryGraphicsHandle('voiceicon');
		
		if (object.voiceName === '') {
			return;
		}
		
		xDest += 510;
		yDest += 20;
		GraphicsRenderer.drawImage(xDest, yDest, handle, GraphicsType.ICON);
	},
	
	_getNameColor: function(command, textui) {
		var raceId;
		var color = textui.getColor();
		var unit = command.getUnit();
		
		if (unit === null) {
			return color;
		}
		
		raceId = this._getRaceId(unit);
		if (raceId === 0) {
			color = this._getFirstRaceColor();
		}
		else if (raceId === 1) {
			color = this._getSecondRaceColor();
		}
		
		return color;
	},
	
	_getRaceId: function(unit) {
		var i, raceId;
		var refList = unit.getClass().getRaceReferenceList();
		var count = refList.getTypeCount();
		
		for (i = 0; i < count; i++) {
			data = refList.getTypeData(i);
			raceId = data.getId();
			if (raceId === 0 || raceId === 1) {
				return raceId;
			}
		}
		
		return -1;
	},
	
	_getNameText: function(command) {
		var object = this._getTargetObject(command);
		
		if (object === null) {
			return '';
		}
		
		return object.getName();
	},
	
	_getNameTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	_getMessageTextUI: function() {
		return this.getParentTextUI();
	},
	
	_getFaceResourceHandle: function(command) {
		var object = this._getTargetObject(command);
		
		if (object === null) {
			return root.createEmptyHandle();
		}
		
		return object.getFaceResourceHandle();
	},
	
	_getTargetObject: function(command) {
		var unit = command.getUnit();
		
		if (unit !== null) {
			return unit;
		}
		
		return command.getNpc();
	},
	
	_getFaceAlpha: function() {
		return 150;
	},
	
	_getFirstRaceColor: function() {
		return 0x30c0f5;
	},
	
	_getSecondRaceColor: function() {
		return 0xf0a5f0;
	},
	
	_getVoiceCategory: function() {
		return DataConfig.getVoiceCategoryName();
	},
	
	_getVoiceExtIndex: function() {
		return DataConfig.getVoiceExtIndex();
	}
}
);
