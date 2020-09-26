
var FreeAreaMode = {
	TURNSTART: 0,
	TURNEND: 1,
	MAIN: 2
};

var FreeAreaScene = defineObject(BaseScene,
{
	_turnChangeStart: null,
	_turnChangeEnd: null,
	_playerTurnObject: null,
	_enemyTurnObject: null,
	_partnerTurnObject: null,
	
	setSceneData: function() {
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	},
	
	moveSceneCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		MapLayer.moveMapLayer();
		
		if (mode === FreeAreaMode.TURNSTART) {
			result = this._moveTurnStart();
		}
		else if (mode === FreeAreaMode.TURNEND) {
			result = this._moveTurnEnd();
		}
		else if (mode === FreeAreaMode.MAIN) {
			result = this._moveMain();
		}
		
		return result;
	},
	
	drawSceneCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === FreeAreaMode.TURNSTART) {
			this._drawTurnStart();
		}
		else if (mode === FreeAreaMode.TURNEND) {
			this._drawTurnEnd();
		}
		else if (mode === FreeAreaMode.MAIN) {
			this._drawMain();
		}
	},
	
	moveBackSceneCycle: function() {
		var preAttack = AttackControl.getPreAttackObject();
		
		MapLayer.moveMapLayer();
		
		if (preAttack !== null) {
			preAttack.getCoreAttack().backCoreAttackCycle();
		}
		
		return MoveResult.CONTINUE;
	},
	
	getTurnObject: function() {
		var obj = null;
		var type = root.getCurrentSession().getTurnType();
		
		if (type === TurnType.PLAYER) {
			obj = this._playerTurnObject;
		}
		else if (type === TurnType.ENEMY) {
			obj = this._enemyTurnObject;
		}
		else if (type === TurnType.ALLY) {
			obj = this._partnerTurnObject;
		}
		
		return obj;
	},
	
	turnEnd: function() {
		this._processMode(FreeAreaMode.TURNEND);
	},
	
	notifyLoadGame: function() {
		this._isLoad = true;
	},
	
	notifyAutoEventCheck: function() {
		this.getTurnObject().notifyAutoEventCheck();
	},
	
	isDebugMouseActionAllowed: function() {
		var type = root.getCurrentSession().getTurnType();
		
		if (type !== TurnType.PLAYER) {
			return false;
		}
		
		return this.getTurnObject().isDebugMouseActionAllowed();
	},
	
	_prepareSceneMemberData: function() {
		this._turnChangeStart = createObject(TurnChangeStart);
		this._turnChangeEnd = createObject(TurnChangeEnd);
		this._playerTurnObject = createObject(PlayerTurn);
		this._enemyTurnObject = createObject(EnemyTurn);
		this._partnerTurnObject = createObject(EnemyTurn);
	},
	
	_completeSceneMemberData: function() {
		var handle;
		var map = root.getCurrentSession().getCurrentMapInfo();
		var type = root.getCurrentSession().getTurnType();
		
		// If this screen is displayed by loading the save file, exclude the starting turn process.
		if (root.getSceneController().isActivatedFromSaveFile()) {
			// When entering the new map, reset the previous map setting.
			SceneManager.resetCurrentMap();
			
			MapHpControl.updateHpAll();
			
			// Restore the screen which may be painted.
			SceneManager.setEffectAllRange(false);
			
			if (type === TurnType.PLAYER) {
				handle = map.getPlayerTurnMusicHandle();
				this.getTurnObject().setAutoCursorSave(true);
			}
			else if (type === TurnType.ALLY) {
				handle = map.getAllyTurnMusicHandle();
			}
			else {
				handle = map.getEnemyTurnMusicHandle();
			}
			
			MediaControl.clearMusicCache();
			MediaControl.musicPlayNew(handle);
			
			this._processMode(FreeAreaMode.MAIN);
		}
		else {
			this._processMode(FreeAreaMode.TURNSTART);
		}
	},
	
	_moveTurnStart: function() {
		if (this._turnChangeStart.moveTurnChangeCycle() !== MoveResult.CONTINUE) {
			this._processMode(FreeAreaMode.MAIN);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveTurnEnd: function() {
		if (this._turnChangeEnd.moveTurnChangeCycle() !== MoveResult.CONTINUE) {
			this._processMode(FreeAreaMode.TURNSTART);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveMain: function() {
		this.getTurnObject().moveTurnCycle();
		
		// The scene is changed by "Victory Map" of the event command,
		// so this method can always return MoveResult.CONTINUE.
		return MoveResult.CONTINUE;
	},
	
	_drawTurnStart: function() {
		MapLayer.drawUnitLayer();
		this._turnChangeStart.drawTurnChangeCycle();
	},
	
	_drawTurnEnd: function() {
		MapLayer.drawUnitLayer();
		this._turnChangeEnd.drawTurnChangeCycle();
	},
	
	_drawMain: function() {
		this.getTurnObject().drawTurnCycle();
	},
	
	_processMode: function(mode) {
		if (mode === FreeAreaMode.TURNSTART) {
			if (this._turnChangeStart.enterTurnChangeCycle() === EnterResult.NOTENTER) {
				this._processMode(FreeAreaMode.MAIN);
			}
			else {
				this.changeCycleMode(mode);
			}
		}
		else if (mode === FreeAreaMode.TURNEND) {
			if (this._turnChangeEnd.enterTurnChangeCycle() === EnterResult.NOTENTER) {
				this._processMode(FreeAreaMode.TURNSTART);
			}
			else {
				this.changeCycleMode(mode);
			}
		}
		else if (mode === FreeAreaMode.MAIN) {
			// With this processing, when checking the auto event of objA and objB,
			// "Start and End" as an event condition is ignored.
			root.getCurrentSession().setStartEndType(StartEndType.NONE);
			
			this.getTurnObject().openTurnCycle();
			
			this.changeCycleMode(mode);
		}
	}
}
);
