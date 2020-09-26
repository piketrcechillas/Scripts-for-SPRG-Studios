
var MessageAnalyzerMode = {
	PAGE: 0,
	CANCEL: 1,
	CLEAR: 2
};

var MessageAnalyzerState = {
	NONE: 0,
	ENDTEXT: 1,
	READBLOCK: 2
};

var MessageWaitState = {
	WAIT: 0,
	NONE: 1
};

var MessageRowCount = 3;

// This object is used if the string of several lines is needed to display characters one by one.
// This is for the interval to display the character and to switch the page etc.
// For the drawing character, the method of CoreAnalyzer is called.
var MessageAnalyzer = defineObject(BaseObject,
{
	_voiceSoundHandle: null,
	_pageSoundHandle: null,
	_messageSpeedValue: 0,
	_messageState: 0,
	_pageCursor: null,
	_coreAnalyzer: null,
	_waitChain: null,
	_parserInfo: null,
	_cancelCounter: null,
	
	setMessageAnalyzerParam: function(messageAnalyzerParam) {
		this._voiceSoundHandle = messageAnalyzerParam.voiceSoundHandle;
		this._pageSoundHandle = messageAnalyzerParam.pageSoundHandle;
		this._messageSpeedValue = this._convertSpeed(messageAnalyzerParam.messageSpeedType);
		this._messageState = 0;
		this._pageCursor = createObject(PageCursor);
		this._coreAnalyzer = createObject(CoreAnalyzer);
		this._waitChain = createObject(WaitChain);
		this._cancelCounter = createObject(CycleCounter);
		
		this._parserInfo = StructureBuilder.buildParserInfo();
		this._parserInfo.defaultColor = messageAnalyzerParam.color;
		this._parserInfo.defaultFont = messageAnalyzerParam.font;
		this._parserInfo.maxTextLength = messageAnalyzerParam.maxTextLength;
		
		this._waitChain.setupWaitChain(this);
	},
	
	setMessageAnalyzerText: function(text) {
		this._parserInfo.wait = 0;
		this._parserInfo.autoWait = 0;
		this._parserInfo.speed = -1;
		this._coreAnalyzer.setCoreAnalyzerData(text, this._parserInfo);
		
		if (this._getCancelSpeedValue() >= 0) {
			this._cancelCounter.disableGameAcceleration();
			this._cancelCounter.setCounterInfo(this._getCancelSpeedValue());
		}
		
		this._startNewPage();
	},
	
	moveMessageAnalyzer: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === MessageAnalyzerMode.PAGE) {
			result = this._movePage();
		}
		else if (mode === MessageAnalyzerMode.CANCEL) {
			result = this._moveCancel();
		}
		else if (mode === MessageAnalyzerMode.CLEAR) {
			result = this._moveClear();
		}
		
		this._pageCursor.moveCursor();
		
		return result;
	},
	
	drawMessageAnalyzer: function(xMessage, yMessage, xCursor, yCursor, pic) {
		this._coreAnalyzer.drawCoreAnalyzer(xMessage, yMessage + 5);
		
		if (pic !== null) {
			if (this._messageState === MessageAnalyzerState.READBLOCK && !this._waitChain.isAutoMode()) {
				this._pageCursor.drawCursor(xCursor, yCursor, pic);
			}
		}
	},
	
	endMessageAnalyzer: function() {
		this._cleanPage();
	},
	
	setMaxRowCount: function(maxRowCount) {
		this._coreAnalyzer.setMaxRowCount(maxRowCount);
	},
	
	getEnsureText: function() {
		return this._coreAnalyzer.getEnsureText();
	},
	
	isMessageDirect: function() {
		// If it's 0, the character is not only one character, but all characters are displayed at once.
		return this._messageSpeedValue === 0;
	},
	
	cutPage: function() {
		var isMessageDirect = this.isMessageDirect();
		
		for (;;) {
			// Specify true to cut the page.
			this._checkCurrentPage(true);
			
			// cutPage was called due to speeding up,
			// but there is a possibility that speed can be changed while cutting, so check it.
			if (isMessageDirect && !this.isMessageDirect()) {
				break;
			}
			
			// One page was processed so exit the loop.
			if (this._isPageLast()) {
				break;
			}
		}
		
		// Process the page and disable to wait explicitly.
		this._parserInfo.wait = 0;
		this._waitChain.endPage();
	},
	
	getMessageSpeed: function() {
		return this._messageSpeedValue;
	},
	
	setMessageSpeed: function(messageSpeedValue) {
		this._messageSpeedValue = messageSpeedValue;
	},
	
	getCoreAnalyzer: function() {
		return this._coreAnalyzer;
	},
	
	_movePage: function() {
		// Check if it's needed to continue to the next page.
		if (this._isPageChange()) {
			this._changeNextPage();
			return MoveResult.CONTINUE;
		}
		else {
			// Process the current page is needed, but check if it's entered in a wait state first.
			if (this._waitChain.moveWaitChain() === MoveResult.CONTINUE) {
				// It's entered in a wait state so don't continue to process.
				return MoveResult.CONTINUE;
			}
		}
		
		// Process the current page.
		this._checkCurrentPage(false);
		
		// If it's 30FPS, process by each 2 characters.
		if (!DataConfig.isHighPerformance()) {
			this._checkCurrentPage(false);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveCancel: function() {
		if (this._cancelCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this._changeNextPage();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveClear: function() {
		this._cleanPage();
		
		// No more text exists, so end it.
		if (this._messageState === MessageAnalyzerState.ENDTEXT) {
			return MoveResult.END;
		}
		
		this._coreAnalyzer.nextCoreAnalyzer();
		this._waitChain.startPage();
		
		this._startNewPage();
		
		return MoveResult.CONTINUE;
	},
	
	_changeNextPage: function() {
		if (this._messageState === MessageAnalyzerState.NONE) {
			// If it's while displaying characters,
			// display all characters once and don't switch the page soon.
			this.cutPage();
			return;
		}
		
		// Change to the next page, so play the sound.
		this._playMessagePageSound();
		
		this.changeCycleMode(MessageAnalyzerMode.CLEAR);
	},
	
	_startNewPage: function() {
		this._messageState = MessageAnalyzerState.NONE;
		
		if (this.isMessageDirect()) {
			if (this._voiceSoundHandle !== null && !this._voiceSoundHandle.isNullHandle()) {
				// If characters are displayed at once, play the message sound once.
				MediaControl.soundPlay(this._voiceSoundHandle);
			}
			this.cutPage();
		}
		
		this.changeCycleMode(MessageAnalyzerMode.PAGE);
	},
	
	// Process when the one page ends.
	_cleanPage: function() {
		// If the voice has already been played, stop the sound.
		if (this._parserInfo.voiceRefId !== -1) {
			root.getMaterialManager().voiceStop(this._parserInfo.voiceRefId, false);
			this._parserInfo.voiceRefId = -1;
		}
	},
	
	_checkCurrentPage: function(isPageCut) {
		var isAdvance = true;
		
		if (this._isPageLast()) {
			// One page has already been processed, so process nothing.
			return;
		}
		
		// Process one character on the page.
		this._messageState = this._coreAnalyzer.moveCoreAnalyzer();
		
		// Check if one page has already been displayed.
		if (this._isPageLast()) {
			this._waitChain.endPage();
		}
		else {
			isAdvance = this._waitChain.checkWaitChain(this._parserInfo, isPageCut) === MessageWaitState.NONE;
		}
		
		if (isAdvance) {
			// If a page is not cut, the message sound can be played.
			if (!isPageCut) {
				this._playMessageVoiceSound();
			}
			this._coreAnalyzer.advanceStep();
		}
	},
	
	_isPageChange: function() {
		if (this._waitChain.isAutoMode()) {
			if (this._waitChain.isPageAutoChange()) {
				// Auto wait has been ended, so switch a page.
				return true;
			}
		}
		else {
			if (this._isCancelAllowed()) {
				// If cancel key is being pressed, switch a page.
				if (this._getCancelSpeedValue() >= 0) {
					// If speedy switch needs to be prevented, wait.
					this.changeCycleMode(MessageAnalyzerMode.CANCEL);
					return false;
				}
				
				// If _getCancelSpeedValue returns minus, switch a page immediately without waiting.
				
				return true;
			}
			else if (InputControl.isSelectAction()) {
				// If the decision key is pressed, switch a page.
				return true;
			}
		}
		
		return false;
	},
	
	_isPageLast: function() {
		return this._messageState === MessageAnalyzerState.READBLOCK || this._messageState === MessageAnalyzerState.ENDTEXT;
	},
	
	_playMessageVoiceSound: function() {
		if (this._voiceSoundHandle !== null && !this._voiceSoundHandle.isNullHandle()) {
			if ((this._coreAnalyzer.getCurrentIndex() % 7) === 0) {
				MediaControl.soundPlay(this._voiceSoundHandle);
			}
		}
	},
	
	_playMessagePageSound: function() {
		if (this._pageSoundHandle !== null && !this._pageSoundHandle.isNullHandle()) {
			if (!this._waitChain.isAutoMode()) {
				MediaControl.soundPlay(this._pageSoundHandle);
			}
		}
	},
	
	_convertSpeed: function(speedType) {
		var n = 2;
		
		if (speedType === SpeedType.DIRECT || speedType === SpeedType.SUPERHIGH || speedType === SpeedType.HIGH) {
			n = 0;
		}
		else if (speedType === SpeedType.NORMAL) {
			n = 1;
		}
		
		return n;
	},
	
	_isCancelAllowed: function() {
		return Miscellaneous.isGameAcceleration();
	},
	
	_getCancelSpeedValue: function() {
		return 0;
	}
}
);

// When displaying the message, wait state occurs mainly in 3 states.
// The 1st is an explicit wait by a control character such as \., and ExplicitWait processes it.
// The 2nd is a wait by a control character such as \at, and it waits until switching to the next page automatically,
// and AutoWait processes it.
// The 3rd is a wait until analyzing the next character.
// If the  message speed of the config is set as slow, a wait will be long accordingly, and SpeedWait processes it.
var WaitChain = defineObject(BaseObject,
{
	_waitPartsArray: null,
	
	setupWaitChain: function(parentMessageAnalyzer) {
		var i, count;
		
		this._waitPartsArray = [];
		this._configureWaitParts(this._waitPartsArray);
		
		count = this._waitPartsArray.length;
		for (i = 0; i < count; i++) {
			this._waitPartsArray[i].setupWaitParts(parentMessageAnalyzer);
		}
	},
	
	moveWaitChain: function() {
		var i;
		var count = this._waitPartsArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._waitPartsArray[i].moveWaitParts() === MoveResult.CONTINUE) {
				return MoveResult.CONTINUE;
			}
		}
		
		return MoveResult.END;
	},
	
	checkWaitChain: function(parserInfo, isPageCut) {
		var i;
		var count = this._waitPartsArray.length;
		var waitState = MessageWaitState.NONE;
		
		for (i = 0; i < count; i++) {
			// If there is an object to return false even one object, don't continue to the next character.
			if (this._waitPartsArray[i].checkWaitParts(parserInfo, isPageCut) === MessageWaitState.WAIT) {
				waitState = MessageWaitState.WAIT;
			}
		}
		
		return waitState;
	},
	
	startPage: function() {
		var i;
		var count = this._waitPartsArray.length;
		
		for (i = 0; i < count; i++) {
			this._waitPartsArray[i].startPage();
		}
	},
	
	endPage: function() {
		var i;
		var count = this._waitPartsArray.length;
		
		for (i = 0; i < count; i++) {
			this._waitPartsArray[i].endPage();
		}
	},
	
	isPageAutoChange: function() {
		var i;
		var count = this._waitPartsArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._waitPartsArray[i].isPageAutoChange()) {
				return true;
			}
		}
		
		return false;
	},
	
	isAutoMode: function() {
		var i;
		var count = this._waitPartsArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._waitPartsArray[i].isAutoMode()) {
				return true;
			}
		}
		
		return false;
	},
	
	_configureWaitParts: function(groupArray) {
		groupArray.appendObject(WaitParts.Explicit);
		groupArray.appendObject(WaitParts.Auto);
		groupArray.appendObject(WaitParts.Speed);
	}
}
);

var BaseWaitParts = defineObject(BaseObject,
{
	_isWaitMode: false,
	_counter: null,
	_parentMessageAnalyzer: null,
	
	setupWaitParts: function(parentMessageAnalyzer) {
		this._counter = createObject(CycleCounter);
		this._parentMessageAnalyzer = parentMessageAnalyzer;
	},
	
	moveWaitParts: function() {
		if (!this._isWaitMode) {
			// If wait, return MoveResult.CONTINUE.
			return MoveResult.END;
		}
		
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this._isWaitMode = false;
			this.doEndWaitAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	// If no continue to the next character, return MessageWaitState.WAIT.
	checkWaitParts: function(parserInfo, isPageCut) {
		return MessageWaitState.NONE;
	},
	
	// If the new page is processed, it's called.
	startPage: function() {
	},
	
	// If the page cursor is not visible, return true.
	endPage: function() {
	},
	
	// If analyzing a page ends, it's called.
	isPageAutoChange: function() {
		return false;
	},
	
	// If the page cursor is not visible, return true.
	isAutoMode: function() {
		return false;
	},
	
	doEndWaitAction: function() {
	}
}
);

var WaitParts = {};

WaitParts.Explicit = defineObject(BaseWaitParts,
{	
	checkWaitParts: function(parserInfo, isPageCut) {
		// If a page is not cut, the waiting information is checked.
		if (!isPageCut && parserInfo.wait !== 0) {
			// If /ws etc. was found in the character, enter the wait state.
			this._counter.setCounterInfo(parserInfo.wait);
			
			parserInfo.wait = 0;
			this._isWaitMode = true;
			
			// It's in a wait state, so don't continue to the next character.
			return MessageWaitState.WAIT;
		}
		
		return MessageWaitState.NONE;
	},
	
	endPage: function() {
		this._counter.resetCounterValue();
		this._isWaitMode = false;
	},
	
	doEndWaitAction: function() {
		// A wait was ended, so continue to the next character.
		this._parentMessageAnalyzer.getCoreAnalyzer().advanceStep();
	}
}
);

WaitParts.Auto = defineObject(BaseWaitParts,
{
	_isForceAuto: false,
	_isAutoSelectAction: false,
	
	checkWaitParts: function(parserInfo, isPageCut) {
		if (parserInfo.autoWait !== 0) {
			// If /at was found in the character, prepare to enter the next page automatically.
			this._counter.setCounterInfo(parserInfo.autoWait);
			parserInfo.autoWait = 0;
			this._isForceAuto = true;
		}
		
		return MessageWaitState.NONE;
	},
	
	startPage: function() {
		if (this._isForceAuto) {
			this._isAutoSelectAction = false;
		}
	},
	
	endPage: function() {
		if (this._isForceAuto) {
			this._isWaitMode = true;
		}
	},
	
	isPageAutoChange: function() {
		if (this._isForceAuto && this._isAutoSelectAction) {
			return true;
		}
		
		return false;
	},
	
	doEndWaitAction: function() {
		this._isAutoSelectAction = true;
	},
	
	isAutoMode: function() {
		return this._isWaitMode || this._isAutoSelectAction;
	}
}
);

WaitParts.Speed = defineObject(BaseWaitParts,
{
	_value: 0,
	_maxValue: 0,
	
	setupWaitParts: function(parentMessageAnalyzer) {
		this._value = 0;
		this._maxValue = parentMessageAnalyzer.getMessageSpeed();
	
		BaseWaitParts.setupWaitParts.call(this, parentMessageAnalyzer);
	},
	
	moveWaitParts: function() {
		if (this._parentMessageAnalyzer.isMessageDirect()) {
			return MoveResult.END;
		}
		
		if (++this._value >= this._maxValue) {
			this._value = 0;
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	checkWaitParts: function(parserInfo, isPageCut) {
		if (parserInfo.speed !== -1) {
			// Set the message speed.
			this._parentMessageAnalyzer.setMessageSpeed(parserInfo.speed);
			
			if (this._parentMessageAnalyzer.isMessageDirect() || isPageCut) {
				// Analyze from the next character.
				this._parentMessageAnalyzer.getCoreAnalyzer().advanceStep();
					
				this._parentMessageAnalyzer.cutPage();
					
				// 1 page has been read at this moment, so no need to continue to the next character immediately.
				return MessageWaitState.WAIT;
			}
			else {
				this._maxValue = this._parentMessageAnalyzer.getMessageSpeed();
			}
			
			parserInfo.speed = -1;
		}
		
		return MessageWaitState.NONE;
	}
}
);

// Process the character.
// To understand all characters, the variable is replaced with VariableReplacer,
// and the control character is replaced with TextParser.
var CoreAnalyzer = defineObject(BaseObject,
{
	_totalIndex: 0,
	_isNextRow: false,
	_rowCount: 0,
	_fontSize: 0,
	_parserInfo: null,
	_maxRowCount: MessageRowCount,
	_textLineArray: null,
	_textParser: null,
	_totalText: null,
	
	setCoreAnalyzerData: function(text, parserInfo) {
		this._totalIndex = 0;
		this._rowCount = 0;
		this._fontSize = parserInfo.defaultFont.getSize();
		this._parserInfo = parserInfo;
		
		// The control character is not included in _totalText.
		this._totalText = this._startParse(text, parserInfo);
		
		this._createTextLine();
	},
	
	moveCoreAnalyzer: function() {
		var result = MessageAnalyzerState.NONE;
		var textLine = this._textLineArray[this._rowCount];
		
		// If check hasn't ended until the end of one line, don't continue.
		if (textLine.currentIndex !== textLine.text.length) {
			this._textParser.checkParserInfo(textLine.currentIndex + textLine.baseIndex);
			return result;
		}
		
		// Check if lines in the block were all processed. 
		if (this._rowCount + 1 === this._textLineArray.length) {
			if (this._totalIndex >= this._totalText.length) {
				// No more message exists, so end it.
				result = MessageAnalyzerState.ENDTEXT;
			}
			else {
				// Message exists, so continue to the next block.
				result = MessageAnalyzerState.READBLOCK;
			}
		}
		else {
			this._isNextRow = true;
		}
		
		return result;
	},
	
	drawCoreAnalyzer: function(xStart, yStart) {
		var i, j;
		var drawInfo, textLine, count2;
		var count = this._textLineArray.length;
		
		for (i = 0; i < count; i++) {
			textLine = this._textLineArray[i];
			
			// formattedText is not initialized, it means that drawing effect (change colors etc.)
			// doesn't occur for the one line which will be drawn from now, so simply call the draw method.
			
			if (textLine.formattedText === null) {
				root.getGraphicsManager().drawCharText(xStart, yStart, textLine.text, textLine.currentIndex,
					this._parserInfo.defaultColor, 255, this._parserInfo.defaultFont);
				
				yStart += this.getCharSpaceHeight();
				continue;
			}
			
			// If drawFormattedText is called, the text is all drawn.
			// So define the range to draw in advance.
			textLine.formattedText.setValidArea(0, textLine.currentIndex);
			
			// Decide the default text color in the range to draw.
			textLine.formattedText.setColorAlpha(0, textLine.currentIndex, this._parserInfo.defaultColor, 255);
			
			// setColor etc. is called in checkDrawInfo, so set the necessary information.
			drawInfo = {};
			drawInfo.formattedText = textLine.formattedText;
			drawInfo.baseIndex = textLine.baseIndex;
			drawInfo.defaultColor = this._parserInfo.defaultColor;
			drawInfo.defaultFont = this._parserInfo.defaultFont;
			
			// It includes the control character which may be positioned at the end of the text, so add +1.
			count2 = textLine.text.length + 1;
			for (j = 0; j < count2; j++) {
				this._textParser.checkDrawInfo(j + textLine.baseIndex, drawInfo);
			}
			
			textLine.formattedText.drawFormattedText(xStart, yStart, 0x0, 0);
			
			yStart += this.getCharSpaceHeight();
		}
	},
	
	nextCoreAnalyzer: function() {
		this._baseIndex = this._textLineArray[this._rowCount].currentIndex;
		this._rowCount = 0;
		
		this._createTextLine();
	},
	
	advanceStep: function() {
		if (this._isNextRow) {
			this._isNextRow = false;
			this._rowCount++;
		}
		else {
			this._textLineArray[this._rowCount].currentIndex++;
		}
	},
	
	setMaxRowCount: function(maxRowCount) {
		this._maxRowCount = maxRowCount;
	},

	getCurrentIndex: function() {
		return this._textLineArray[this._rowCount].currentIndex;
	},

	getEnsureText: function() {
		return this._totalText;
	},
	
	getCharSpaceHeight: function() {
		return this._fontSize + 10;
	},
	
	setTextLineArray: function(textLineArray) {
		this._textLineArray = textLineArray;
	},
	
	createTextContainerArray: function() {
		var i, count;
		var arr = [];
		
		for (;;) {
			if (arr.length !== 0) {
				this._createTextLine();
			}
			
			count = this._textLineArray.length;
			for (i = 0; i < count; i++) {
				this._textLineArray[i].currentIndex = this._textLineArray[i].text.length;
			}
			arr.push(this._textLineArray);
			
			if (this._totalIndex >= this._totalText.length) {
				break;
			}
		}
		
		return arr;
	},
	
	_startParse: function(text, parserInfo) {
		var variableReplacer = createObject(VariableReplacer);
		
		// Replace the variable.
		text = variableReplacer.startReplace(text);
		
		this._textParser = createObject(TextParser);
		
		// Replace the control character.
		return this._textParser.startReplace(text, parserInfo);
	},
	
	_createTextLine: function() {
		var i, j, c, textLine;
		var s = this._totalIndex;
		var baseIndex = 0;
		var textParts = '';
		var isDrawingObject = false;
		
		this._textLineArray = [];
		
		for (i = 0; i < this._maxRowCount; i++) {
			for (j = s; j < this._totalText.length; j++) {
				c = this._totalText.charAt(j);
				if (c === '\n' || j + 1 === this._totalText.length) {
					// Control character rules:
					// 1. Control character can be set at the beginning and the end of the line.
					// 2. Control character can be set at the beginning and the end of the block.
					// 3. There is no problem if a line ends with a control character and the next line also starts with a control character.
					// 4. It can concatenate like \C[2]\tu[1].
					// 5. It's valid per line.
					// 6. Drawing control characters need to sandwich between like \C[2]text\C[0].
					
					if (j + 1 === this._totalText.length) {
						j++;
					}
					
					// Extract a line of the text.
					textParts = this._totalText.substring(s, j);
					
					// Check if the range of the line is included the control character.
					isDrawingObject = this._textParser.isDrawingObject(s, j);
					
					baseIndex = s;
					
					// Save until which number of the index was checked.
					s = j + 1;
					
					break;
				}
			}
			
			textLine = {};
			textLine.currentIndex = 0;
			textLine.baseIndex = baseIndex;
			textLine.text = textParts;
			textLine.formattedText = isDrawingObject ? root.getGraphicsManager().createFormattedText(textParts, this._parserInfo.defaultFont) : null;
			this._textLineArray[i] = textLine;
			
			if (j === this._totalText.length) {
				break;
			}
		}
		
		// If _createTextLine was called next time, start from this value.
		this._totalIndex = s;
	}
}
);

// Return the text which replaced the control character in the text.
var TextParser = defineObject(BaseObject,
{
	_variableArray: null,
	_controlObjectArray: null,
	_parserInfo: null,

	startReplace: function(text, parserInfo) {
		var i, count, n, min, result;
		var s = text;
		var arr = [];
		var index = -1;
		
		this._parserInfo = parserInfo;
		this._controlObjectArray = [];
		this._variableArray = [];
		this._configureVariableObject(this._variableArray);
		
		arr = this._variableArray;
		
		for (;;) {
			// Point an index on the text.
			min = 999;
			
			// Point an index on the string.
			index = -1;
		
			count = arr.length;
			for (i = 0; i < count; i++) {
				n = s.search(arr[i].getKey());
				if (n === -1) {
					continue;
				}
				
				// Process from the control character which exists at the front.
				if (n < min) {
					// Save what number character exists from the front.
					min = n;
					index = i;
				}
			}
			
			if (index === -1) {
				break;
			}
			
			// Receive the converting result. 
			result = arr[index].startParser(s, min, this._controlObjectArray);
			
			// Convert the character.
			s = s.replace(arr[index].getKey(), result);
		}
		
		return s;
	},
	
	// This method is called from the move methods.
	checkParserInfo: function(index) {
		var i;
		var count = this._variableArray.length;
		
		for (i = 0; i < count; i++) {
			// Process for the specified index.
			this._variableArray[i].checkParserInfo(index, this._controlObjectArray, this._parserInfo);
		}
	},
	
	// This method is called from the draw methods.
	checkDrawInfo: function(index, drawInfo) {
		var i;
		var count = this._variableArray.length;
		
		count = this._variableArray.length;
		for (i = 0; i < count; i++) {
			// Process for the specified index.
			this._variableArray[i].checkDrawInfo(index, this._controlObjectArray, drawInfo);
		}
	},
	
	isDrawingObject: function(start, end) {
		var i, obj;
		var count = this._controlObjectArray.length;
		
		for (i = 0; i < count; i++) {
			obj = this._controlObjectArray[i];
			if (obj.isDrawingObject) {
				if (obj.index >= start && obj.index <= end) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	// For one control character, one object exists.
	// For instance, ControlVariable.Color replaces \C.
	_configureVariableObject: function(groupArray) {
		// The following code is the control character in associated with drawing.
		groupArray.appendObject(ControlVariable.Color);
		groupArray.appendObject(ControlVariable.Font);
		groupArray.appendObject(ControlVariable.FontIndex);
		groupArray.appendObject(ControlVariable.FontSize);
		groupArray.appendObject(ControlVariable.FontWeight);
		groupArray.appendObject(ControlVariable.FontStyle);
		groupArray.appendObject(ControlVariable.Strikethrough);
		groupArray.appendObject(ControlVariable.Underline);
		
		// The following code is the control character in associated with the system.
		groupArray.appendObject(ControlVariable.WaitShort);
		groupArray.appendObject(ControlVariable.WaitMiddle);
		groupArray.appendObject(ControlVariable.WaitLong);
		groupArray.appendObject(ControlVariable.Auto);
		groupArray.appendObject(ControlVariable.Speed);
		if (this._parserInfo.isVoiceIncluded) {
			groupArray.appendObject(ControlVariable.Voice);
		}
	}
}
);

var BaseControlVariable = defineObject(BaseObject,
{
	startParser: function(text, index, objectArray) {
		var key = this.getKey();
		var c = text.match(key);
		var obj = {};
		
		obj.index = index;
		obj.parentObject = this;
		obj.sig = Number(c[1]);
		obj.isDrawingObject = this.isDrawingObject();
		objectArray.push(obj);
		
		return '';
	},
	
	checkParserInfo: function(index, objectArray, parserInfo) {
	},
	
	checkDrawInfo: function(index, objectArray, drawInfo) {
	},
	
	isDrawingObject: function() {
		return false;
	},
	
	getObjectFromIndex: function(index, objectArray, parentObject) {
		var i;
		var count = objectArray.length;
		
		for (i = 0; i < count; i++) {
			if (objectArray[i].index === index && objectArray[i].parentObject === parentObject) {
				return objectArray[i];
			}
		}
		
		return null;
	}
}
);

var ControlVariable = {};

ControlVariable.Color = defineObject(BaseControlVariable,
{
	checkDrawInfo: function(index, objectArray, drawInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		if (typeof drawInfo.newColorObj !== 'undefined') {
			drawInfo.formattedText.setColorAlpha(drawInfo.newColorObj.index - drawInfo.baseIndex, obj.index - drawInfo.baseIndex, this._getColor(drawInfo), 255);
		}
		
		drawInfo.newColorObj = obj;
	},
	
	getKey: function() {
		var key = /\\C\[(\d+)\]/;
		
		return key;
	},
	
	isDrawingObject: function() {
		return true;
	},
	
	_getColor: function(drawInfo) {
		var c = [0xffffff, 0x10efff, 0xefff00, 0x20ff40, 0xff5040, 0xff10ef, 0x7f7f8f, 0x0];
		var count = c.length;
		var colorIndex = drawInfo.newColorObj.sig;
		
		if (colorIndex < 0 || colorIndex > count - 1) {
			return drawInfo.defaultColor;
		}
		
		return c[colorIndex];
	}
}
);

ControlVariable.Font = defineObject(BaseControlVariable,
{
	checkDrawInfo: function(index, objectArray, drawInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		if (typeof drawInfo.newFontObj !== 'undefined') {
			drawInfo.formattedText.setFont(drawInfo.newFontObj.index - drawInfo.baseIndex, obj.index - drawInfo.baseIndex, this._getFont(drawInfo));
		}
		
		drawInfo.newFontObj = obj;
	},
	
	getKey: function() {
		var key = /\\F\[(\d+)\]/;
		
		return key;
	},
	
	isDrawingObject: function() {
		return true;
	},
	
	_getFont: function(drawInfo) {
		var font = root.getBaseData().getFontList().getDataFromId(drawInfo.newFontObj.sig);
		
		if (font === null) {
			font = drawInfo.defaultFont;
		}
		
		return font;
	}
}
);

ControlVariable.FontIndex = defineObject(BaseControlVariable,
{
	checkDrawInfo: function(index, objectArray, drawInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		if (typeof drawInfo.newFontObj2 !== 'undefined') {
			drawInfo.formattedText.setFont(drawInfo.newFontObj2.index - drawInfo.baseIndex, obj.index - drawInfo.baseIndex, this._getFont(drawInfo));
		}
		
		drawInfo.newFontObj2 = obj;
	},
	
	getKey: function() {
		var key = /\\font\[(\d+)\]/;
		
		return key;
	},
	
	isDrawingObject: function() {
		return true;
	},
	
	_getFont: function(drawInfo) {
		var font = root.getBaseData().getFontList().getData(drawInfo.newFontObj2.sig);
		
		if (font === null) {
			font = drawInfo.defaultFont;
		}
		
		return font;
	}
}
);

ControlVariable.FontSize = defineObject(BaseControlVariable,
{
	checkDrawInfo: function(index, objectArray, drawInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		if (typeof drawInfo.newSizeObj !== 'undefined') {
			drawInfo.formattedText.setFontSize(drawInfo.newSizeObj.index - drawInfo.baseIndex, obj.index - drawInfo.baseIndex, drawInfo.newSizeObj.sig);
		}
		
		drawInfo.newSizeObj = obj;
	},
	
	getKey: function() {
		var key = /\\fs\[(\d+)\]/;
		
		return key;
	},
	
	isDrawingObject: function() {
		return true;
	}
}
);

ControlVariable.FontWeight = defineObject(BaseControlVariable,
{
	checkDrawInfo: function(index, objectArray, drawInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		if (typeof drawInfo.newWeightObj !== 'undefined') {
			drawInfo.formattedText.setFontWeight(drawInfo.newWeightObj.index - drawInfo.baseIndex, obj.index - drawInfo.baseIndex, drawInfo.newWeightObj.sig);
		}
		
		drawInfo.newWeightObj = obj;
	},
	
	getKey: function() {
		var key = /\\fw\[(\d+)\]/;
		
		return key;
	},
	
	isDrawingObject: function() {
		return true;
	}
}
);

ControlVariable.FontStyle = defineObject(BaseControlVariable,
{
	checkDrawInfo: function(index, objectArray, drawInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		if (typeof drawInfo.newStyleObj !== 'undefined') {
			drawInfo.formattedText.setFontStyle(drawInfo.newStyleObj.index - drawInfo.baseIndex, obj.index - drawInfo.baseIndex, drawInfo.newStyleObj.sig);
		}
		
		drawInfo.newStyleObj = obj;
	},
	
	getKey: function() {
		var key = /\\fi\[(\d+)\]/;
		
		return key;
	},
	
	isDrawingObject: function() {
		return true;
	}
}
);

ControlVariable.Strikethrough = defineObject(BaseControlVariable,
{
	checkDrawInfo: function(index, objectArray, drawInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		if (typeof drawInfo.newStrikeObj !== 'undefined') {
			drawInfo.formattedText.setStrikethrough(drawInfo.newStrikeObj.index - drawInfo.baseIndex, obj.index - drawInfo.baseIndex);
		}
		
		drawInfo.newStrikeObj = obj;
	},
	
	getKey: function() {
		var key = /\\ts\[(\d+)\]/;
		
		return key;
	},
	
	isDrawingObject: function() {
		return true;
	}
}
);

ControlVariable.Underline = defineObject(BaseControlVariable,
{
	checkDrawInfo: function(index, objectArray, drawInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		if (typeof drawInfo.newUnderObj !== 'undefined') {
			drawInfo.formattedText.setUnderline(drawInfo.newUnderObj.index - drawInfo.baseIndex, obj.index - drawInfo.baseIndex);
		}
		
		drawInfo.newUnderObj = obj;
	},
	
	getKey: function() {
		var key = /\\tu\[(\d+)\]/;
		
		return key;
	},
	
	isDrawingObject: function() {
		return true;
	}
}
);

ControlVariable.WaitShort = defineObject(BaseControlVariable,
{
	startParser: function(text, index, objectArray) {
		var obj = {};
		
		obj.index = index;
		obj.parentObject = this;
		obj.sig = 24;
		objectArray.push(obj);
		
		return '';
	},
	
	checkParserInfo: function(index, objectArray, parserInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		parserInfo.wait = obj.sig;
	},
	
	getKey: function() {
		var key = /\\\./;
		
		return key;
	}
}
);

ControlVariable.WaitMiddle = defineObject(BaseControlVariable,
{
	startParser: function(text, index, objectArray) {
		var obj = {};
		
		obj.index = index;
		obj.parentObject = this;
		obj.sig = 46;
		objectArray.push(obj);
		
		return '';
	},
	
	checkParserInfo: function(index, objectArray, parserInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		parserInfo.wait = obj.sig;
	},
	
	getKey: function() {
		var key = /\\_/;
		
		return key;
	}
}
);

ControlVariable.WaitLong = defineObject(BaseControlVariable,
{
	checkParserInfo: function(index, objectArray, parserInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		parserInfo.wait = obj.sig;
	},
	
	getKey: function() {
		var key = /\\wa\[(\d+)\]/;
		
		return key;
	}
}
);

ControlVariable.Auto = defineObject(BaseControlVariable,
{
	checkParserInfo: function(index, objectArray, parserInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		parserInfo.autoWait = obj.sig;
	},
	
	getKey: function() {
		var key = /\\at\[(\d+)\]/;
		
		return key;
	}
}
);

ControlVariable.Speed = defineObject(BaseControlVariable,
{
	checkParserInfo: function(index, objectArray, parserInfo) {
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		parserInfo.speed = obj.sig;
	},
	
	getKey: function() {
		var key = /\\sp\[(\d+)\]/;
		
		return key;
	}
}
);

ControlVariable.Voice = defineObject(BaseControlVariable,
{
	startParser: function(text, index, objectArray) {
		var key = this.getKey();
		var c = text.match(key);
		var obj = {};
		
		obj.index = index;
		obj.parentObject = this;
		obj.sig = c[1];
		obj.isDrawingObject = this.isDrawingObject();
		objectArray.push(obj);
		
		return '';
	},
	
	checkParserInfo: function(index, objectArray, parserInfo) {
		var fileName;
		var ext = ['ogg', 'mp3', 'wav'];
		var obj = this.getObjectFromIndex(index, objectArray, this);
		
		if (obj === null) {
			return;
		}
		
		fileName = obj.sig + '.' + ext[this._getVoiceExtIndex()];
		
		root.getMaterialManager().voicePlay(this._getVoiceCategory(), fileName, 1);
		
		parserInfo.voiceRefId = 1;
	},
	
	getKey: function() {
		var key = /\\vo\[(.+?)\]/;
		
		return key;
	},
	
	_getVoiceCategory: function() {
		return DataConfig.getVoiceCategoryName();
	},
	
	_getVoiceExtIndex: function() {
		return DataConfig.getVoiceExtIndex();
	}
}
);

// Return the text which replaced the control character in the text.
var VariableReplacer = defineObject(BaseObject,
{
	_variableArray: null,

	startReplace: function(text) {
		var i, count, n, min, result;
		var s = text;
		var arr = [];
		var index = -1;
		
		this._variableArray = [];
		this._configureVariableObject(this._variableArray);

		arr = this._variableArray;
		
		for (;;) {
			min = 999;
			index = -1;
		
			count = arr.length;
			for (i = 0; i < count; i++) {
				n = s.search(arr[i].getKey());
				if (n === -1) {
					continue;
				}
				
				// Process from the control character which exists at the front.
				if (n < min) {
					min = n;
					index = i;
				}
			}
			
			if (index === -1) {
				break;
			}
			
			// Receive the converting result.
			result = arr[index].getReplaceValue(s);
			
			// Convert the character.
			s = s.replace(arr[index].getKey(), result);
		}
		
		return s;
	},
	
	_configureVariableObject: function(groupArray) {
		groupArray.appendObject(DataVariable.Act);
		groupArray.appendObject(DataVariable.Pdb);
		groupArray.appendObject(DataVariable.Cdb);
		groupArray.appendObject(DataVariable.Wdb);
		groupArray.appendObject(DataVariable.Idb);
		groupArray.appendObject(DataVariable.Sdb);
		groupArray.appendObject(DataVariable.Turn);
		groupArray.appendObject(DataVariable.Gold);
		groupArray.appendObject(DataVariable.Bonus);
		groupArray.appendObject(DataVariable.Va1);
		groupArray.appendObject(DataVariable.Va2);
		groupArray.appendObject(DataVariable.Va3);
		groupArray.appendObject(DataVariable.Va4);
		groupArray.appendObject(DataVariable.Va5);
		groupArray.appendObject(DataVariable.Va6);
	}
}
);

var BaseDataVariable = defineObject(BaseObject,
{
	_variableArray: null,
	
	getReplaceValue: function(text) {
		var i, data;
		var id = this.getIdFromKey(text);
		var result = '';
		var list = this.getList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (data.getId() === id) {
				result = data.getName();
				break;
			}
		}
		
		return result;
	},
	
	getList: function() {
		return null;
	},
	
	getKey: function() {
		return null;
	},
	
	getVariableValue: function(text, n) {
		var id = this.getIdFromKey(text);
		var table = root.getMetaSession().getVariableTable(n - 1);
		var index = table.getVariableIndexFromId(id);
		
		return table.getVariable(index);
	},
	
	getIdFromKey: function(text) {
		var key = this.getKey();
		var c = text.match(key);
		
		return Number(c[1]);
	}
}
);

var DataVariable = {};

DataVariable.Act = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var unit = root.getCurrentSession().getActiveEventUnit();
		var result = '';
		
		if (unit !== null) {
			result = unit.getName();
		}
		
		return result;
	},
	
	getKey: function() {
		var key = /\\act/;
		
		return key;
	}
}
);

DataVariable.Pdb = defineObject(BaseDataVariable,
{
	getList: function() {
		return root.getBaseData().getPlayerList();
	},
	
	getKey: function() {
		var key = /\\pdb\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Cdb = defineObject(BaseDataVariable,
{
	getList: function() {
		return root.getBaseData().getClassList();
	},
	
	getKey: function() {
		var key = /\\cdb\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Wdb = defineObject(BaseDataVariable,
{
	getList: function() {
		return root.getBaseData().getWeaponList();
	},
	
	getKey: function() {
		var key = /\\wdb\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Idb = defineObject(BaseDataVariable,
{
	getList: function() {
		return root.getBaseData().getItemList();
	},
	
	getKey: function() {
		var key = /\\idb\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Sdb = defineObject(BaseDataVariable,
{
	getList: function() {
		return root.getBaseData().getSkillList();
	},
	
	getKey: function() {
		var key = /\\sdb\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Turn = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var session = root.getCurrentSession();
		
		if (session === null || typeof session.getTurnCount === 'undefined') {
			return '';
		}
		
		return session.getTurnCount().toString();
	},
	
	getKey: function() {
		var key = /\\T/;
		
		return key;
	}
}
);

DataVariable.Gold = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var result = root.getMetaSession().getGold().toString();
		
		return result;
	},
	
	getKey: function() {
		var key = /\\G/;
		
		return key;
	}
}
);

DataVariable.Bonus = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var result = root.getMetaSession().getBonus().toString();
		
		return result;
	},
	
	getKey: function() {
		var key = /\\B/;
		
		return key;
	}
}
);

DataVariable.Va1 = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 1);
	},
	
	getKey: function() {
		var key = /\\va1\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Va2 = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 2);
	},
	
	getKey: function() {
		var key = /\\va2\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Va3 = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 3);
	},
	
	getKey: function() {
		var key = /\\va3\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Va4 = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 4);
	},
	
	getKey: function() {
		var key = /\\va4\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Va5 = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 5);
	},
	
	getKey: function() {
		var key = /\\va5\[(\d+)\]/;
		
		return key;
	}
}
);

DataVariable.Va6 = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 6);
	},
	
	getKey: function() {
		var key = /\\va6\[(\d+)\]/;
		
		return key;
	}
}
);
