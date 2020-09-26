
var DictionaryScrollbar = defineObject(BaseScrollbar,
{
	_funcCondition: null,
	_titleCount: 0,
	
	setDictionaryScrollbarParam: function(dictionaryScrollbarParam) {
		this._funcCondition = dictionaryScrollbarParam.funcCondition;
	},
	
	setDictionaryFormation: function() {
		var data = this._getCountData();
		
		this._titleCount = data.titleCount;
		this.setScrollFormation(data.colCount, LayoutControl.getObjectVisibleCount(this.getObjectHeight(), 8));
	},
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var text, format;
		var textui = this.getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var handle = null;
		
		if (this.isNameDisplayable(object, 0)) {
			text = object.getName();
			if (typeof object.getIconResourceHandle !== 'undefined') {
				handle = object.getIconResourceHandle();
			}
			format = TextFormat.LEFT;
		}
		else {
			text = StringTable.HideData_Question;
			format = TextFormat.CENTER;
		}
		
		if (handle !== null) {
			GraphicsRenderer.drawImage(x - 10, y + 10, handle, GraphicsType.ICON);
		}
		
		TextRenderer.drawFixedTitleText(x, y, text, color, font, format, pic, this._titleCount);
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	playSelectSound: function() {
		var object = this.getObject();
		var isSelect = this.isNameDisplayable(object, 0);
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	},
	
	getObjectWidth: function() {
		return (this._titleCount + 2) * TitleRenderer.getTitlePartsWidth();
	},
	
	getObjectHeight: function() {
		return TitleRenderer.getTitlePartsHeight();
	},
	
	getTextUI: function() {
		return root.queryTextUI('extraexplanation_title');
	},
	
	isNameDisplayable: function(object, index) {
		return root.getStoryPreference().isTestPlayPublic() || this._funcCondition(object, index);
	},
	
	_getCountData: function() {
		var colCount = 3;
		var titleCount = 4;
		var width = root.getGameAreaWidth();
		
		if (width >= 1000) {
			colCount++;
			titleCount++;
		}
		else if (width >= 800) {
			titleCount++;
		}
		
		return {
			colCount: colCount,
			titleCount: titleCount
		};
	}
}
);

var ThumbnailScrollbar = defineObject(BaseScrollbar,
{
	_isRecollectionMode: false,
	_funcCondition: null,
	
	setDictionaryScrollbarParam: function(dictionaryScrollbarParam) {
		this._isRecollectionMode = dictionaryScrollbarParam.isRecollectionMode;
		this._funcCondition = dictionaryScrollbarParam.funcCondition;
	},
	
	setDictionaryFormation: function() {
		this.setScrollFormation(4, LayoutControl.getObjectVisibleCount(this.getObjectHeight(), 4));
	},
	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var handle;
		
		if (this.isNameDisplayable(object, 0)) {
			if (this._isRecollectionMode) {
				handle = object.getRecollectionEventInfo().getThumbnailResourceHandle();
			}
			else {
				handle = object.getThumbnailResourceHandle();
			}
		}
		else {
			handle = root.queryGraphicsHandle('colsereollection');	
		}
		
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.THUMBNAIL);
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	playSelectSound: function() {
		var object = this.getObject();
		var isSelect = this.isNameDisplayable(object, 0);
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	},
	
	getObjectWidth: function() {
		return GraphicsFormat.THUMBNAIL_WIDTH;
	},
	
	getObjectHeight: function() {
		return GraphicsFormat.THUMBNAIL_HEIGHT;
	},
	
	getSpaceX: function() {
		return 40;
	},
	
	getSpaceY: function() {
		return 30;
	},
	
	isNameDisplayable: function(object, index) {
		return root.getStoryPreference().isTestPlayPublic() || this._funcCondition(object, index);
	},
	
	_getCountData: function() {
		var colCount = 3;
		var titleCount = 4;
		var width = root.getGameAreaWidth();
		
		if (width >= 1000) {
			colCount++;
			titleCount++;
		}
		else if (width >= 800) {
			titleCount++;
		}
		
		return {
			colCount: colCount,
			titleCount: titleCount
		};
	}
}
);
