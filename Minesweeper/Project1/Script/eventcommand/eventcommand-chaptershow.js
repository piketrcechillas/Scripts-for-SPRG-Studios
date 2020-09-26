
var ChapterShowMode = {
	FADEOUT: 0,
	TITLE: 1,
	FADEIN: 2,
	BLACKIN: 3
};

var ChapterShowEventCommand = defineObject(BaseEventCommand,
{
	_chapterName: null,
	_mapName: null,
	_transition: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ChapterShowMode.FADEOUT) {
			result = this._moveFadeout();
		}
		else if (mode === ChapterShowMode.TITLE) {
			result = this._moveTitle();
		}
		else if (mode === ChapterShowMode.FADEIN) {
			result = this._moveFadein();
		}
		else if (mode === ChapterShowMode.BLACKIN) {
			result = this._moveBlackin();
		}
		
		return result;
	},
	
	drawEventCommandCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === ChapterShowMode.FADEOUT || mode === ChapterShowMode.TITLE || mode === ChapterShowMode.FADEIN || mode === ChapterShowMode.BLACKIN) {
			this._transition.drawTransition();
		}
		
		if (mode === ChapterShowMode.TITLE) {
			this._drawFrame();
		}
	},
	
	mainEventCommand: function() {
		if (this._transition !== null) {
			// If it's skipped etc., don't leave the fadeout/fadein.
			this._transition.resetTransition();
		}
	},
	
	_prepareEventCommandMemberData: function() {
		this._setString();
		this._transition = createObject(SystemTransition);
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		// Prevent all screen in dark by specifying EffectRangeType.MAPANDCHAR.
		this._transition.setEffectRangeType(EffectRangeType.MAPANDCHAR);
		this._transition.setFadeSpeed(5);
		
		// If the screen has already been painted, only return is fine.
		if (SceneManager.isScreenFilled()) {
			this._changeBlackin();
		}
		else {
			this._changeFadeout();
		}
		
		return EnterResult.OK;
	},
	
	_setString: function() {
		var mapInfo;
		var eventCommandData = root.getEventCommandObject();
		
		if (eventCommandData.isMapInfoRef()) {
			mapInfo = root.getCurrentSession().getCurrentMapInfo();
			this._chapterName = mapInfo.getName();
			this._mapName = mapInfo.getMapName();
		}
		else {
			this._chapterName = eventCommandData.getChapterName();
			this._mapName = eventCommandData.getMapName();
		}
	},
	
	_moveFadeout: function() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ChapterShowMode.TITLE);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveFadein: function() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveTitle: function() {
		if (InputControl.isSelectAction() || InputControl.isCancelState()) {
			this._changeFadein();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveBlackin: function() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ChapterShowMode.TITLE);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawFrame: function() {
		var textui = this._getTextUI();
		var pic = textui.getUIImage();
		var pos = this._getBasePos();
		
		if (pic !== null) {
			pic.draw(pos.x, pos.y);
		}
		
		this._drawFirst();
		this._drawSecond();
		this._drawThird();
	},
	
	_drawFirst: function() {
		var x, width;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var title = ChapterRenderer.getChapterText(mapInfo);
		var pos = this._getBasePos();
		var textui = this._getSubTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		width = TextRenderer.getTextWidth(title, font);
		x = LayoutControl.getCenterX(-1, width);
		
		TextRenderer.drawText(x, pos.y + 10, title, -1, color, font);
	},
	
	_drawSecond: function() {
		var x, width;
		var pos = this._getBasePos();
		var textui = this._getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		width = TextRenderer.getTextWidth(this._chapterName, font);
		x = LayoutControl.getCenterX(-1, width);
		TextRenderer.drawText(x, pos.y + 38, this._chapterName, -1, color, font);
	},
	
	_drawThird: function() {
		var x, width, title;
		var pos = this._getBasePos();
		var textui = this._getSubTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this._mapName === '') {
			return;
		}
		
		title = '(' + this._mapName + ')';
		
		width = TextRenderer.getTextWidth(title, font);
		x = LayoutControl.getCenterX(-1, width);
		
		TextRenderer.drawText(x, pos.y + 70, title, -1, color, font);
	},
	
	_getTextUI: function() {
		return root.queryTextUI('chapter_frame');
	},
	
	_getSubTextUI: function() {
		return root.queryTextUI('default_window');
	},
	
	_getBasePos: function() {
		var x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
		var y = LayoutControl.getCenterY(-1, UIFormat.SCREENFRAME_HEIGHT);
		
		return createPos(x, y);
	},
	
	_changeFadeout: function() {
		this._playChapterSound();
		this._transition.setHalfOut();
		this.changeCycleMode(ChapterShowMode.FADEOUT);
	},
	
	_changeFadein: function() {
		this._transition.setHalfIn();
		this.changeCycleMode(ChapterShowMode.FADEIN);
	},
	
	_changeBlackin: function() {
		this._playChapterSound();
		this._transition.setVolume(255, 128, 255, false);
		this.changeCycleMode(ChapterShowMode.BLACKIN);
	},
	
	_playChapterSound: function() {
		MediaControl.soundDirect('chaptershow');
	}
}
);
