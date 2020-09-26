ScalingBattleContainer.pushBattleContainer = function() {

		if(this._picCache == null) {
			this._picCache = root.getGraphicsManager().createCacheGraphics(this._getBattleAreaWidth(), this._getBattleAreaHeight());
		}

		root.getGraphicsManager().enableMapClipping(false);
		
		root.getGraphicsManager().setRenderCache(this._picCache);
	}


ConfigWindow._configureConfigItem = function(groupArray) {
		groupArray.appendObject(ConfigItem.MusicPlay);
		groupArray.appendObject(ConfigItem.SoundEffect);
		if (DataConfig.getVoiceCategoryName() !== '') {
			groupArray.appendObject(ConfigItem.Voice);
		}
		if (DataConfig.isMotionGraphicsEnabled()) {
			//groupArray.appendObject(ConfigItem.RealBattle);
			if (DataConfig.isHighResolution()) {
				//groupArray.appendObject(ConfigItem.RealBattleScaling);
			}
		}
		groupArray.appendObject(ConfigItem.AutoCursor);
		groupArray.appendObject(ConfigItem.AutoTurnEnd);
		groupArray.appendObject(ConfigItem.AutoTurnSkip);
		groupArray.appendObject(ConfigItem.EnemyMarking);
		groupArray.appendObject(ConfigItem.MapGrid);
		groupArray.appendObject(ConfigItem.UnitSpeed);
		groupArray.appendObject(ConfigItem.MessageSpeed);
		groupArray.appendObject(ConfigItem.ScrollSpeed);
		groupArray.appendObject(ConfigItem.UnitMenuStatus);
		groupArray.appendObject(ConfigItem.MapUnitHpVisible);
		groupArray.appendObject(ConfigItem.MapUnitSymbol);
		groupArray.appendObject(ConfigItem.DamagePopup);
		if (this._isVisible(CommandLayoutType.MAPCOMMAND, CommandActionType.LOAD)) {
			groupArray.appendObject(ConfigItem.LoadCommand);
		}
		groupArray.appendObject(ConfigItem.SkipControl);
		groupArray.appendObject(ConfigItem.MouseOperation);
		groupArray.appendObject(ConfigItem.MouseCursorTracking);
	}

TurnChangeMapStart.doLastAction = function() {
		root.getMetaSession().setDefaultEnvironmentValue(13, 0);
		root.getMetaSession().setDefaultEnvironmentValue(14, 0);
		var turnType = TurnType.PLAYER;
		
		if (PlayerList.getSortieList().getCount() > 0) {
			turnType = TurnType.PLAYER;
		}
		else if (EnemyList.getAliveList().getCount() > 0) {
			turnType = TurnType.ENEMY;
		}
		else if (AllyList.getAliveList().getCount() > 0) {
			turnType = TurnType.ALLY;
		}
		
		root.getCurrentSession().setTurnCount(0);
		root.getCurrentSession().setTurnType(turnType);
}

TurnChangeEnd._startNextTurn = function() {
		var nextTurnType;
		var turnType = root.getCurrentSession().getTurnType();
		
		this._checkActorList();
		
		if (turnType === TurnType.PLAYER) {
			// If a number of the enemy is 0 at this moment, it is also possible that the enemy turn is not executed.
			// However, in this case, the enemy turn related cannot be detected with an event condition,
			// always switch it to the enemy turn.
			// If a number of the enemy is 0, images and background music are not changed,
			// so it doesn't seem that it's switched to the enemy turn.
			nextTurnType = TurnType.ENEMY;
			ConfigItem.SkipControl.selectFlag(0);
		}
		else if (turnType === TurnType.ENEMY) {
			nextTurnType = TurnType.ALLY;
		}
		else {
			nextTurnType = TurnType.PLAYER;
			ConfigItem.SkipControl.selectFlag(2);
		}
		
		root.getCurrentSession().setTurnType(nextTurnType);
	}