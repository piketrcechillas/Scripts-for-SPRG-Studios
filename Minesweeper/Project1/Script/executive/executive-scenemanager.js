
var cur_map = null;

// One scene has a possibility in which several screens exist.
// These screens are controlled as _screenArray and currently displayed as the last element of array at the front screen.
// The specific screen processing is done through ScreenController.
var SceneManager = {
	_sceneType: 0,
	_screenArray: null,
	_activeAcene: null,
	_isForceForeground: false,
	
	enterSceneManagerCycle: function(sceneType) {
		this._sceneType = sceneType;
		this._screenArray = [];
		
		CacheControl.clearCache();
		
		this._activeAcene = this._createSceneObject(sceneType);
		this._activeAcene.setSceneData();
		
		this._isForceForeground = false;
		
		return EnterResult.OK;
	},
	
	moveSceneManagerCycle: function() {
		var i;
		var count = this._screenArray.length;
		var result = this._activeAcene.moveSceneCycle();
		
		for (i = 0; i < count; i++) {
			if (i + 1 === count) {
				// Call moveScreenControllerCycle because the this._screenArray[i] is currently displayed on the front screen.
				result = ScreenController.moveScreenControllerCycle(this._screenArray[i]);
				if (result !== MoveResult.CONTINUE) {
					// Go back to the previous screen because the this._screenArray[i] screen was closed.
					this._screenArray.pop();
				}
			}
			else {
				// call moveScreenControllerBackCycle because the this._screenArray[i] is currently displayed on the back screen.
				ScreenController.moveScreenControllerBackCycle(this._screenArray[i]);
			}
		}
		
		return result;
	},
	
	drawSceneManagerCycle: function() {
		var i;
		var count = this._screenArray.length;
		
		this._activeAcene.drawSceneCycle();
		
		for (i = 0; i < count; i++) {
			if (i + 1 === count) {
				ScreenController.drawScreenControllerCycle(this._screenArray[i]);
			}
			else {
				ScreenController.drawScreenControllerBackCycle(this._screenArray[i]);
			}
		}
	},
	
	backSceneManagerCycle: function() {
		var i;
		var count = this._screenArray.length;
		
		this._activeAcene.moveBackSceneCycle();
		
		for (i = 0; i < count; i++) {
			ScreenController.moveScreenControllerBackCycle(this._screenArray[i]);
		}
		
		return true;
	},
	
	addScreen: function(screen, param) {
		var screenContainer = {};
		
		screenContainer.screen = screen;
		screenContainer.param = param;
		this._screenArray.push(screenContainer);
		
		ScreenController.enterScreenControllerCycle(screenContainer);
	},
	
	getChildScreenContainer: function(screenContainer) {
		var i;
		var count = this._screenArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._screenArray[i] === screenContainer) {
				if (i < count - 1) {
					// Return the next screen (child screen) of the current screen.
					return this._screenArray[i + 1];
				}
			}
		}
		
		return null;
	},
	
	getParentScreenContainer: function(screenContainer) {
		var i;
		var count = this._screenArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._screenArray[i] === screenContainer) {
				if (i - 1 >= 0) {
					// Return the previous screen (parent screen) of the current screen.
					return this._screenArray[i - 1];
				}
			}
		}
		
		return null;
	},
	
	getActiveScene: function() {
		return this._activeAcene;
	},
	
	getLastScreen: function() {
		return this._screenArray[this._screenArray.length - 1].screen;
	},
	
	setEffectAllRange: function(isFilled) {
		var effect = root.getScreenEffect();
		
		if (isFilled) {
			effect.setAlpha(255);
		}
		else {
			effect.setAlpha(0);
		}
		
		effect.setRange(EffectRangeType.ALL);
	},
	
	// If this method returns true,
	// it means that entire screen is painted in one color depending on the color which obj shows.
	isScreenFilled: function() {
		var effect = root.getScreenEffect();
		
		return effect.getAlpha() === 255;
	},
	
	resetCurrentMap: function() {
		cur_map = root.getCurrentSession().getCurrentMapInfo();
		
		CurrentMap.prepareMap();
	},
	
	isScreenClosed: function(screen) {
		var i;
		var count = this._screenArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._screenArray[i].screen === screen) {
				return false;
			}
		}
		
		return true;
	},
	
	getScreenCount: function() {
		return this._screenArray.length;
	},
	
	isForceForeground: function() {
		return this._isForceForeground;
	},
	
	setForceForeground: function(isForceForeground) {
		this._isForceForeground = isForceForeground;
	},
	
	_createSceneObject: function(scene) {
		var obj = null;
		
		if (scene === SceneType.TITLE) {
			obj = TitleScene;
		}
		else if (scene === SceneType.ENDING) {
			obj = EndingScene;
		}
		else if (scene === SceneType.GAMEOVER) {
			obj = GameOverScene;
		}
		else if (scene === SceneType.FREE) {
			obj = FreeAreaScene;
		}
		else if (scene === SceneType.BATTLESETUP) {
			obj = BattleSetupScene;
		}
		else if (scene === SceneType.BATTLERESULT) {
			obj = BattleResultScene;
		}
		else if (scene === SceneType.REST) {
			obj = RestScene;
		}
		else if (scene === SceneType.EVENTTEST) {
			obj = EventTestScene;
		}
		
		return createObject(obj);
	}
};
