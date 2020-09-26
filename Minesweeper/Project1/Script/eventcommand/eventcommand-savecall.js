
var SaveCallEventCommand = defineObject(BaseEventCommand,
{
	_loadSaveScreen: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (SceneManager.isScreenClosed(this._loadSaveScreen)) {
			SceneManager.setForceForeground(false);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
	},
	
	_prepareEventCommandMemberData: function() {
		this._loadSaveScreen = createObject(LoadSaveControl.getSaveScreenObject());
	},
	
	_checkEventCommand: function() {
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		var screenParam;
		
		if (root.getEventCommandObject().getSaveCallType() === SaveCallType.COMPLETE) {
			this._doCompleteAction();
			return EnterResult.NOTENTER;
		}
		
		screenParam = this._createScreenParam();
		SceneManager.addScreen(this._loadSaveScreen, screenParam);
		SceneManager.setForceForeground(true);
		
		this._doCurrentAction();
		
		return EnterResult.OK;
	},
	
	_doCurrentAction: function() {
		var unit;
		
		if (root.getBaseScene() === SceneType.REST) {
			return;
		}
		
		if (!root.getCurrentSession().isMapState(MapStateType.PLAYERFREEACTION)) {
			unit = this._getUnitFromUnitCommand();
			if (unit !== null) {
				// If it's executed via unit command, treat the unit as wait.
				unit.setWait(true);
			}
		}
	},
	
	_getUnitFromUnitCommand: function() {
		return root.getCurrentSession().getActiveEventUnit();
	},
	
	_doCompleteAction: function() {
		root.getEventCommandObject().setCompleteSaveFlag();
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildLoadSave();
		
		screenParam.isLoad = false;
		
		// If getCurrentScene is called with the event command, SceneType.EVENT is returned, so call getBaseScene.
		screenParam.scene = root.getBaseScene();
		if (screenParam.scene === SceneType.REST) {
			screenParam.mapId = root.getSceneController().getNextMapId();
		}
		else {
			screenParam.mapId = root.getCurrentSession().getCurrentMapInfo().getId();
		}
		
		return screenParam;
	}
}
);
