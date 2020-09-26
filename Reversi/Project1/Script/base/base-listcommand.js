
var ListCommandManagerMode = {
	TITLE: 0,
	OPEN: 1
};

var BaseListCommandManager = defineObject(BaseObject,
{
	_groupArray: null,
	_commandScrollbar: null,
	_currentTarget: null,
	
	openListCommandManager: function() {
		this._commandScrollbar = createScrollbarObject(ListCommandScrollbar, this);
		this._commandScrollbar.setActive(true);
		this.rebuildCommand();
		this._playCommandOpenSound();
		this.changeCycleMode(ListCommandManagerMode.TITLE);
	},
	
	moveListCommandManager: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ListCommandManagerMode.TITLE) {
			result = this._moveTitle();
		}
		else if (mode === ListCommandManagerMode.OPEN) {
			result = this._moveOpen();
		}
		
		return result;
	},
	
	drawListCommandManager: function() {
		var mode = this.getCycleMode();
		
		if (mode === ListCommandManagerMode.TITLE) {
			this._drawTitle();
		}
		else if (mode === ListCommandManagerMode.OPEN) {
			this._drawOpen();
		}
	},
	
	rebuildCommand: function() {
		var i, count, arr;
		
		this._groupArray = [];
		this.configureCommands(this._groupArray);
		
		count = this._groupArray.length;
		arr = [];
		for (i = 0; i < count; i++) {
			this._groupArray[i]._listCommandManager = this;
			if (this._groupArray[i].isCommandDisplayable()) {
				arr.push(this._groupArray[i]);
			}
		}
		
		this._commandScrollbar.setScrollFormation(1, arr.length);
		this._commandScrollbar.setObjectArray(arr);
		
		this._groupArray = [];
	},
	
	rebuildCommandEx: function() {
		var prevIndex = this._commandScrollbar.getIndex();
		
		this.rebuildCommand();
		
		if (prevIndex >= this._commandScrollbar.getObjectCount()) {
			prevIndex = 0;
		}
		
		this._commandScrollbar.setIndex(prevIndex);
	},
	
	setListCommandUnit: function(unit) {
		this._currentTarget = unit;
	},
	
	getListCommandUnit: function() {
		return this._currentTarget;
	},
	
	getPositionX: function() {
		return 0;
	},
	
	getPositionY: function() {
		return 0;
	},
	
	getCommandTextUI: function() {
		return root.queryTextUI('mapcommand_title');
	},
	
	configureCommands: function(groupArray) {
	},
	
	getCommandScrollbar: function() {
		return this._commandScrollbar;
	},
	
	_moveTitle: function() {
		var object;
		var result = MoveResult.CONTINUE;
		
		if (InputControl.isSelectAction()) {
			object = this._commandScrollbar.getObject();
			if (object === null) {
				return result;
			}
			
			object.openCommand();
			
			this._playCommandSelectSound();
			this.changeCycleMode(ListCommandManagerMode.OPEN);
		}
		else if (InputControl.isCancelAction()) {
			this._playCommandCancelSound();
			this._checkTracingScroll();
			result = MoveResult.END;
		}
		else {
			this._commandScrollbar.moveScrollbarCursor();
		}
		
		return result;
	},
	
	_moveOpen: function() {
		var object = this._commandScrollbar.getObject();
		var result = MoveResult.CONTINUE;
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			this._commandScrollbar.setActive(true);
			this.changeCycleMode(ListCommandManagerMode.TITLE);
		}
		
		return result;
	},
	
	_drawTitle: function() {
		var x = this.getPositionX();
		var y = this.getPositionY();
		
		this._commandScrollbar.drawScrollbar(x, y);
	},
	
	_drawOpen: function() {
		var object = this._commandScrollbar.getObject();
		
		object.drawCommand();
	},
	
	_checkTracingScroll: function() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		
		MouseControl.changeCursorFromMap(x, y);
	},
	
	_playCommandOpenSound: function() {
		MediaControl.soundDirect('commandopen');
	},
	
	_playCommandSelectSound: function() {
		MediaControl.soundDirect('commandselect');
	},
	
	_playCommandCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	}
}
);

var BaseCommand = defineObject(BaseObject,
{
	_commandlayout: null,
	
	setCommandLayout: function(commandlayout) {
		this._commandlayout = commandlayout;
	},
	
	getCommandLayout: function() {
		return this._commandlayout;
	},
	
	getCommandName: function() {
		if (this._commandlayout === null) {
			return '';
		}
		
		return this._commandlayout.getName();
	}
}
);

var BaseListCommand = defineObject(BaseCommand,
{
	_listCommandManager: null,
	
	initialize: function() {
	},
	
	openCommand: function() {
	},
	
	moveCommand: function() {
		return MoveResult.END;
	},
	
	drawCommand: function() {
	},
	
	isCommandDisplayable: function() {
		return true;
	}
}
);

var ListCommandScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, pic, this._getPartsCount());
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	getObjectWidth: function() {
		return (4 + 2) * 30;
	},
	
	getObjectHeight: function() {
		return 32;
	},
	
	_getPartsCount: function() {
		return 4;
	}
}
);
