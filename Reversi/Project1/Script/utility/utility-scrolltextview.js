
var ScrollTextView = defineObject(BaseObject,
{
	_text: null,
	_moveTime: 0,
	_nextTime: 0,
	_isMove: false,
	_scrollTextParam: null,
	_factoryArray: null,
	_blockArray: null,
	_isAcceleration: false,
	
	openScrollTextViewCycle: function(scrollTextParam) {
		this._prepareMemberData(scrollTextParam);
		this._completeMemberData(scrollTextParam);
	},
	
	moveScrollTextViewCycle: function() {
		var i, count;
		
		// Delete a block which was displayed.
		if (this._blockArray.length > 0) {
			if (this._blockArray[0].isLastBlock()) {
				this._blockArray.shift();
			}
		}
		
		if (!this._checkMove()) {
			return MoveResult.CONTINUE;
		}
		
		// Add the elapsed time.
		this._moveTime += this.getBlockInterval();
		
		// To be regular intervals to display blocks, detect speed up with regular intervals.
		if (this._moveTime % this._getBaseTime() === 0) {
			if (this._isAcceleration) {
				if (!Miscellaneous.isGameAcceleration()) {
					this._isAcceleration = false;
				}
			}
			else {
				if (Miscellaneous.isGameAcceleration()) {
					this._isAcceleration = true;
				}
			}
		}
		
		count = this._blockArray.length;
		for (i = 0; i < count; i++) {
			this._blockArray[i].notifyTime(this._moveTime);
			this._blockArray[i].moveBlock();
		}
		
		if (count === 0) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawScrollTextViewCycle: function() {
		var i;
		var count = this._blockArray.length;
		
		this._drawScrollWindow();
		
		for (i = 0; i < count; i++) {
			this._blockArray[i].drawBlock();
		}
	},
	
	// Return the divisible number for _getBaseTime.
	getBlockInterval: function() {
		var n;
		var speedType = this._scrollTextParam.speedType;
		
		if (this._isAcceleration) {
			return 20;
		}
		
		if (speedType === SpeedType.DIRECT) {
			n = 8;
		}
		else if (speedType === SpeedType.SUPERHIGH) {
			n = 5;
		}
		else if (speedType === SpeedType.HIGH) {
			n = 4;
		}
		else if (speedType === SpeedType.NORMAL) {
			n = 2.5;
		}
		else if (speedType === SpeedType.LOW) {
			n = 2;
		}
		else {
			n = 1;
		}
		
		return n;
	},
	
	getMoveTime: function() {
		return this._moveTime;
	},
	
	setNextTime: function(nextTime) {
		nextTime = this._nextTime;
	},
	
	getScrollTextParam: function() {
		return this._scrollTextParam;
	},
	
	_prepareMemberData: function(scrollTextParam) {
		this._text = scrollTextParam.text;
		this._moveTime = 0;
		this._nextTime = 0;
		this._isMove = false;
		this._scrollTextParam = scrollTextParam;
		
		this._factoryArray = [];
		this._configureFactoryObject(this._factoryArray);
		
		this._blockArray = [];
	},
	
	_completeMemberData: function(scrollTextParam) {
		var i, count, oneblock;
		var text = this._text;
		
		while (text.length !== 0) {
			// WaitBlockFactory changes this._nextTime, so initialize every time.
			this._nextTime = this._getBaseTime();
			
			// Get one line from the text.
			oneblock = this._readBlock(text);
			
			// Search an object which can process the lines which were gotten.
			count = this._factoryArray.length;
			for (i = 0; i < count; i++) {
				if (this._factoryArray[i].checkBlock(oneblock, this._blockArray, this)) {
					// If a line can be processed, exit a loop to search the next line.
					break;
				}
			}
			
			// Add the temporary elapsed time.
			this._moveTime += this._nextTime;
			
			// Get the first text on the next line.
			text = this._nextBlock(text);
		}
		
		// Initialize to call moveScrollTextViewCycle later.
		this._moveTime = 0;
	},
	
	_readBlock: function(text) {
		var i;
		var count = text.length;
		
		for (i = 0; i < count; i++) {
			if (text.charAt(i) === '\n') {
				// Get a text which existed until the line feed.
				return text.substring(0, i);
			}
		}
		
		// If there is no line feed, this is the last line, so return it.
		return text;
	},
	
	_nextBlock: function(text) {
		var i;
		var count = text.length;
		
		for (i = 0; i < count; i++) {
			if (text.charAt(i) === '\n') {
				// Get a text which existed until the line feed.
				return text.substring(i + 1, text.length);
			}
		}
		
		return '';
	},
	
	_checkMove: function() {
		if (!DataConfig.isHighPerformance()) {
			return true;
		}
		
		this._isMove = !this._isMove;
		
		return this._isMove;
	},
	
	_getBaseTime: function() {
		return 40;
	},
	
	_drawScrollWindow: function() {
		var textui = root.queryTextUI('messagescroll_window');
		var pic = textui.getUIImage();
		var n = this._scrollTextParam.margin;
		var x = n;
		var y = n;
		var width = root.getGameAreaWidth() - (n * 2);
		var height = root.getGameAreaHeight() - (n * 2);
		
		if (pic !== null) {
			WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		}
	},
	
	_configureFactoryObject: function(groupArray) {
		groupArray.appendObject(BlockFactory.Picture);
		groupArray.appendObject(BlockFactory.Wait);
		
		// Text processing object has no control character such as \space.
		// So check it at the end.
		groupArray.appendObject(BlockFactory.Text);
	}
}
);

// BaseBlockFactory is an object to create ScrollBlock.
var BaseBlockFactory = defineObject(BaseObject,
{
	checkBlock: function(text, arr, parentTextView) {
		return true;
	}
}
);

var BlockFactory = {};

BlockFactory.Text = defineObject(BaseBlockFactory,
{
	checkBlock: function(text, arr, parentTextView) {
		var obj = createObject(TextScrollBlock);
		
		obj.setBlockData(text, parentTextView);
		arr.push(obj);
		
		return true;
	}
}
);

BlockFactory.Picture = defineObject(BaseBlockFactory,
{
	checkBlock: function(text, arr, parentTextView) {
		var obj;
		var key = this.getKey();
		var c = text.match(key);
		
		if (c !== null) {
			obj = createObject(PictureScrollBlock);
			obj.setBlockData(c[1], parentTextView);
			arr.push(obj);
			
			return true;
		}
	
		return false;
	},
	
	getKey: function() {
		var key = /\\pic\[(.+)\]/;
		
		return key;
	}
}
);

BlockFactory.Wait = defineObject(BaseBlockFactory,
{
	checkBlock: function(text, arr, parentTextView) {
		var key = this.getKey();
		var c = text.match(key);
		
		if (c !== null) {
			parentTextView.setNextTime(Number(c[1]));
			return true;
		}
		
		return false;
	},
	
	getKey: function() {
		var key = /\\space\[(\d+)\]/;
		
		return key;
	}
}
);

// BaseScrollBlock is an object to move on the screen.
var BaseScrollBlock = defineObject(BaseObject,
{
	_x: 0,
	_y: 0,
	_top: 0,
	_bottom: 0,
	_value: null,
	_startTime: 0,
	_isStart: false,
	_isLast: false,
	_alpha: 0,
	_parentTextView: null,
	
	setBlockData: function(value, parentTextView) {
		var scrollTextParam = parentTextView.getScrollTextParam();
		var n = scrollTextParam.margin;
		var size = root.queryTextUI('messagescroll_window').getFont().getSize();
		
		this._top = n;
		this._bottom = root.getGameAreaHeight() - n - size;
		this._x = scrollTextParam.x;
		this._y = this._bottom;
		this._value = value;
		this._startTime = parentTextView.getMoveTime();
		this._isStart = false;
		this._isLast = false;
		this._alpha = 0;
		this._parentTextView = parentTextView;
	},
	
	moveBlock: function() {
		var zone = this._getAlphaZone();
		var blockInterval = this._parentTextView.getBlockInterval();
		var d = Math.floor(zone / blockInterval);
		var da = Math.floor(255 / d);
		
		if (this._isLast) {
			return MoveResult.END;
		}
		
		if (this._isStart) {
			// If the current position is lower than a value of top, lower the alpha value.
			if (this._y > this._bottom - zone) {
				this._alpha += da;
				if (this._alpha > 255) {
					this._alpha = 255;
				}
			}
			
			// If the current position is lower than a value of top, lower the alpha value.
			if (this._y < this._top + zone) {
				this._alpha -= da;
				if (this._alpha < 0) {
					this._alpha = 0;
				}
			}
			
			this._y -= blockInterval;
			// If the current position exceeds top-zone, it should totally be transparent, so set the end flag.
			if (this._y < this._top) {
				this._isLast = true;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawBlock: function() {
	},
	
	isLastBlock: function() {
		return this._isLast;
	},
	
	notifyTime: function(time) {
		if (!this._isStart) {
			// Check if the notified time exceeds the time when the block should start moving.
			if (time >= this._startTime) {
				// Start the block moving.
				this._isStart = true;
			}
		}
	},
	
	_getAlphaZone: function() {
		return 40;
	}
}
);

var TextScrollBlock = defineObject(BaseScrollBlock,
{
	drawBlock: function() {
		var x, width, textui, color, font;
		var text = this._value;
		
		if (this._isStart) {
			textui = root.queryTextUI('messagescroll_window');
			color = textui.getColor();
			font = textui.getFont();
			
			if (this._x === -1) {
				width = TextRenderer.getTextWidth(text, font);
				x = LayoutControl.getCenterX(-1, width);
			}
			else {
				x = this._x;
			}
			
			TextRenderer.drawAlphaText(x, this._y, text, -1, color, this._alpha, font);
		}
	}
}
);

var PictureScrollBlock = defineObject(BaseScrollBlock,
{
	_pictureId: -1,
	
	setBlockData: function(value, parentTextView) {
		var i, data;
		var list = root.getBaseData().getGraphicsResourceList(GraphicsType.PICTURE, false);
		var count = list.getCount();
		
		BaseScrollBlock.setBlockData.call(this, value, parentTextView);
		
		for (i = 0; i < count; i++) {
			data = list.getCollectionData(i, 0);
			if (data.getName() === value) {
				this._pictureId = data.getId();
			}
		}
	},
	
	drawBlock: function() {
		var x, width, pic;
		var text = this._value;
		
		if (this._isStart) {
			pic = this._getGraphics(text);
			if (pic === null) {
				return;
			}
			
			width = pic.getWidth();
			
			if (this._x === -1) {
				x = LayoutControl.getCenterX(-1, width);
			}
			else {
				x = this._x;
			}
			
			pic.setAlpha(this._alpha);
			pic.draw(x, this._y);
		}
	},
	
	_getGraphics: function(text) {
		var list = root.getBaseData().getGraphicsResourceList(GraphicsType.PICTURE, false);
		
		return list.getCollectionDataFromId(this._pictureId, 0);
	}
}
);
