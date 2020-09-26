
var GameOverMode = {
	FADEOUT: 0,
	MAIN: 1
};

var GameOverScene = defineObject(BaseScene,
{
	_transition: null,
	_scrollBackground: null,
	_isBackDraw: false,
	
	setSceneData: function() {
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	},
	
	moveSceneCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		this._moveCommonAnimation();
		
		if (mode === GameOverMode.FADEOUT) {
			result = this._moveFadeout();
		}
		else if (mode === GameOverMode.MAIN) {
			result = this._moveMain();
		}
		
		return result;
	},
	
	drawSceneCycle: function() {
		var mode = this.getCycleMode();
		
		MapLayer.drawUnitLayer();
		
		this._transition.drawTransition();
		
		if (this._isBackDraw || mode === GameOverMode.MAIN) {
			this._drawMain();
		}
	},
	
	_prepareSceneMemberData: function() {
		this._transition = createObject(SystemTransition);
		this._scrollBackground = createObject(ScrollBackground);
		this._isBackDraw = false;
	},
	
	_completeSceneMemberData: function() {
		this._transition.enableDoubleFade();
		this._transition.setFadeSpeed(3);
		this._transition.setDestOut();
		
		this._setBackgroundData();
		
		MediaControl.musicPlayNew(root.querySoundHandle('gameovermusic'));
		
		this.changeCycleMode(GameOverMode.FADEOUT);
	},
	
	_setBackgroundData: function() {
		var pic = root.getSceneController().getSceneBackgroundImage(SceneType.GAMEOVER);
		
		this._scrollBackground.startScrollBackground(pic);
	},
	
	_moveCommonAnimation: function() {
		MapLayer.moveMapLayer();
		this._scrollBackground.moveScrollBackground();
		
		return MoveResult.CONTINUE;
	},
	
	_moveFadeout: function() {
		if (this._isResetAction()) {
			this._doResetAction();
			return MoveResult.END;
		}
		
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this.changeCycleMode(GameOverMode.MAIN);
		}
		else {
			if (!this._isBackDraw && this._transition.isOneFadeLast()) {
				this._isBackDraw = true;
				root.resetVisualEventObject();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveMain: function() {
		if (this._isResetAction()) {
			this._doResetAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawMain: function() {
		this._scrollBackground.drawScrollBackground();
	},
	
	_isResetAction: function() {
		return InputControl.isSelectAction();
	},
	
	_doResetAction: function() {
		root.resetGame();
	}
}
);
