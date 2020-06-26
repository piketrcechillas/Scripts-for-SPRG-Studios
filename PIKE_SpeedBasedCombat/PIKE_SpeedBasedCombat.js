//Speed Based Combat, by piketrcechillas. Mimic FFT turn system
//Just put {ct:0, spd: <number>} to every unit. It works as follow:
//At the end of every unit's turn, each unit will gain CT equal to their spd.
//For example, an unit with 9 spd will gain 9 CT at the end of any unit's turn.
//Whoever gets to 100 CT first will be the next to act
//If there are multiple unit with 100 CT, they will follow the game's unit list, and enemy will have priority
//If an unit moves, it loses 80 CT when it ends its turn, otherwise it only loses 60 CT.
//Also, put the material folder into the project for the gauge bar

//Animation and States:
//You can set custom Effect animations when starting unit's turn, as well as custom state to indicate
//current starting unit. 
//Just put
//  {stateID:<number>, redID:<number>, blueID:<number>, greenID:<number>} to global parameters, whereas <number>
//represents the ID of the data you want to play.
//NOTICE! Animation position is carefully crafted, so you might need to experiment with your animation size and location
//a little bit to get to the exact animation. I've created sample .sani Effect animation sfiles, import them and see how it works


UnitWaitFlowEntry._completeMemberData = function(playerTurn) {
		var event;
		var unit = playerTurn.getTurnTargetUnit();
		var prevCT = unit.custom.ct;
		var str;

		
		unit.custom.ct -= 60;

		if(unit.getMostResentMov() > 0){
			unit.custom.ct -= 20;
			str = "They moved!!"
		}
		else{
			str = "They never moved..."
		}

		root.log(unit.getName() + " just finished their turn! " + str)
		root.log( " Before CT:" + prevCT + "/After CT:" + unit.custom.ct)

		SpeedGovernor.setState(unitTurn, IncreaseType.DECREASE);


		unit.setMostResentMov(0);
		
		// Unless it's unlimited action, then wait.
		if (!Miscellaneous.isPlayerFreeAction(unit)) {
			unit.setWait(true);
		}
		
		// Get a wait place event from the unit current position.
		event = this._getWaitEvent(unit);
		if (event === null) {
			return EnterResult.NOTENTER;
		}

		SpeedGovernor.increaseCT();
		
		return this._capsuleEvent.enterCapsuleEvent(event, true);
	}


 AutoActionBuilder.buildWaitAction = function(unit, autoActionArray) {
		var combination;
		var isWaitOnly = unit.getAIPattern().getWaitPatternInfo().isWaitOnly();
		
		if (isWaitOnly) {
			unit.custom.ct -= 60;

			SpeedGovernor.setState(unitTurn, IncreaseType.DECREASE);

			return this._buildEmptyAction();
		}
		else {
			// Get the best combination in the unit who can attack from the current position.
			combination = CombinationManager.getWaitCombination(unit);
			if (combination === null) {
				unit.custom.ct -= 60;

				SpeedGovernor.setState(unitTurn, IncreaseType.DECREASE);

				root.log("pass this")
				// Do nothing because it cannot attack.
				return this._buildEmptyAction();
			}
			else {
				root.log("pass that")
				this._pushGeneral(unit, autoActionArray, combination);
			}
		}

		return true;
	}


TurnChangeMapStart.doLastAction = function() {
		var stateID = root.getMetaSession().global.stateID;
		var red = root.getMetaSession().global.redID;
		var blue = root.getMetaSession().global.blueID;
		var green = root.getMetaSession().global.greenID;

		SpeedGovernor._setID(stateID, red, blue, green);



		root.log("checkpoint 1")

		unitTurn = SpeedGovernor._checkNextTurn();
		while (unitTurn == null){
			SpeedGovernor.increaseCT();
			unitTurn = SpeedGovernor._checkNextTurn();
		}
		root.log("checkpoint 2")

		SpeedGovernor.setState(unitTurn, IncreaseType.INCREASE);

		if(unitTurn.getUnitType() == UnitType.PLAYER){
				nextTurnType = TurnType.PLAYER;
			}
		else {
				nextTurnType = TurnType.ENEMY;
			}

		
		//SpeedGovernor.playAnimation(unitTurn);


		SpeedGovernor.setWaitAll(nextTurnType, unitTurn)
		root.getCurrentSession().setTurnType(nextTurnType);
		root.getCurrentSession().setTurnCount(0);
	}



TurnChangeEnd._startNextTurn = function() {
		var nextTurnType;
		var turnType = root.getCurrentSession().getTurnType();
		var unitTurn;
		
		unitTurn = SpeedGovernor._checkNextTurn();
		while (unitTurn == null){
			SpeedGovernor.increaseCT();
			unitTurn = SpeedGovernor._checkNextTurn();
		}

		if(unitTurn.getUnitType() == UnitType.PLAYER){
			nextTurnType = TurnType.PLAYER;
		}
		else if (unitTurn.getUnitType() == UnitType.ALLY){
			nextTurnType = TurnType.ALLY;
		}
		else {
			nextTurnType = TurnType.ENEMY;
		}

		SpeedGovernor.playAnimation(unitTurn);
		SpeedGovernor.setState(unitTurn, IncreaseType.INCREASE);

		SpeedGovernor.setWaitAll(nextTurnType, unitTurn)
		root.getCurrentSession().setTurnType(nextTurnType);
		
				
	}


SpeedGovernor = {

	_stateID: -1,
	_animeIDRed: -1,
	_animeIDBlue: -1,
	_animeIDGreen: -1,

	_setID: function(stateID, animeIDRed, animeIDBlue, animeIDGreen) {
		if(stateID != null)
			this._stateID = stateID;
		if(animeIDRed != null)
			this._animeIDRed = animeIDRed;
		if(animeIDBlue != null)
			this._animeIDBlue = animeIDBlue;
		if(animeIDGreen != null)
			this._animeIDGreen = animeIDGreen;
	},

	_checkNextTurn: function() {
	var list = EnemyList.getAliveList();
	var count = list.getCount();

	var unitTurn = null;
	for(i = 0; i < count; i++){
		unit = list.getData(i);
		if(unit.custom.ct >= 100){
			unitTurn = unit;
			unitTurn.setWait(false);
			root.log("It's...." + unitTurn.getName())
			return unitTurn;
		}
	}

	var list2 = PlayerList.getSortieList();
	var count2 = list2.getCount();

	for(i = 0; i < count2; i++){
		unit = list2.getData(i);
		if(unit.custom.ct >= 100){
			unitTurn = unit;
			unitTurn.setWait(false);
			root.log("It's...." + unitTurn.getName())
			return unitTurn;
			}
		}

	var list3 = AllyList.getAliveList();
	var count3 = list3.getCount();

	for(i = 0; i < count3; i++){
		unit = list3.getData(i);
		if(unit.custom.ct >= 100){
			unitTurn = unit;
			unitTurn.setWait(false);
			root.log("It's...." + unitTurn.getName())
			return unitTurn;
			}
		}

	return unitTurn;
	},

	increaseCT: function() {
		root.log("-----------------------")
		var list = EnemyList.getAliveList();
		var count = list.getCount();
		for(i = 0; i < count; i++){
			unit = list.getData(i);
			unit.custom.ct += unit.custom.spd;
			root.log(unit.getName() + ":" + unit.custom.ct);
		}

		var list2 = PlayerList.getSortieList();
		var count2 = list2.getCount();

		for(i = 0; i < count2; i++){
			unit = list2.getData(i);
			unit.custom.ct += unit.custom.spd;
			root.log(unit.getName() + ":" + unit.custom.ct);
		}

		var list3 = AllyList.getAliveList();
		var count3 = list3.getCount();

		for(i = 0; i < count3; i++){
			unit = list3.getData(i);
			unit.custom.ct += unit.custom.spd;
			root.log(unit.getName() + ":" + unit.custom.ct);
		}


		root.log("-----------------------")
	},

	setWaitAll: function(turnType, unitTurn) {
		if(turnType == TurnType.ENEMY) {
			var list = EnemyList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				if(unit.getId() != unitTurn.getId()) {
					unit.setWait(true);
				}
			}
			var list = PlayerList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				unit.setWait(false);
			}
			var list = AllyList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				unit.setWait(false);
			}
		}
		else if(turnType == TurnType.PLAYER) {
			var list = PlayerList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				if(unit.getId() != unitTurn.getId()) {
					unit.setWait(true);
				}
			}

			var list = EnemyList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				unit.setWait(false);
			}

			var list = AllyList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				unit.setWait(false);
			}
		}
		else if(turnType == TurnType.ALLY) {
			var list = AllyList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				if(unit.getId() != unitTurn.getId()) {
					unit.setWait(true);
				}
			}

			var list = EnemyList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				unit.setWait(false);
			}

			var list = PlayerList.getAliveList();
			var count = list.getCount();
			for(i = 0; i < count; i++){
				unit = list.getData(i);
				unit.setWait(false);
			}
		}
	},

	playAnimation: function(unitTurn) {
		generator = root.getEventGenerator();
		var list = root.getBaseData().getEffectAnimationList(false);
		var anime = null;
		if(unitTurn.getUnitType() == UnitType.PLAYER && this._animeIDBlue != -1)
			anime = list.getDataFromId(this._animeIDBlue);
		else if(unitTurn.getUnitType() == UnitType.ENEMY && this._animeIDRed != -1)
			anime = list.getDataFromId(this._animeIDRed);
		else if(unitTurn.getUnitType() == UnitType.ALLY && this._animeIDGreen != -1)
			anime = list.getDataFromId(this._animeIDGreen);

		if(anime!= null) {
			var x = LayoutControl.getPixelX(unitTurn.getMapX());
			var y = LayoutControl.getPixelY(unitTurn.getMapY());
			var pos = LayoutControl.getMapAnimationPos(x, y, anime);
			generator.animationPlay(anime, x, y, false, AnimePlayType.SYNC, 9999)
			generator.execute();
		}
	},

	setState: function(unit, increaseType) {
		if(this._stateID != -1) {
			var list = root.getBaseData().getStateList();
			var act = list.getDataFromId(this._stateID);

			StateControl.arrangeState(unit, act, increaseType);

		}

	}
}

ContentRenderer.drawUnitCtZoneEx = function(x, y, unit, pic, mhp) {
		var ct = unit.custom.ct;
		
		this.drawCt(x, y, ct, 100);
		
		y += 20;
		this.drawGauge(x, y, ct, 100, 1, 110, pic);
	}

ContentRenderer.drawCt = function(x, y, ct, maxCt) {
		var textHp = "CT";
		var textSlash = '/';
		var dx = [0, 44, 60, 98];
		if(ct > 100)
			ct = 100;
		TextRenderer.drawSignText(x + dx[0], y, textHp);
		NumberRenderer.drawNumber(x + dx[1], y, ct);
		TextRenderer.drawSignText(x + dx[2], y, textSlash);
		NumberRenderer.drawNumber(x + dx[3], y, 100);
	}


UnitMenuTopWindow._drawUnitHp = function(xBase, yBase) {
		var x = xBase + 303;
		var y = yBase + 25;
		var pic = root.queryUI('unit_gauge');
		
		ContentRenderer.drawUnitHpZoneEx(x, y, this._unit, pic, this._mhp);
	}

UnitMenuTopWindow._drawUnitCt = function(xBase, yBase) {
		var x = xBase + 303;
		var y = yBase + 60;
		var pic = root.getMaterialManager().createImage("PIKE_SpeedBased", "Gauge.png");
		
		ContentRenderer.drawUnitCtZoneEx(x, y, this._unit, pic, this._mhp);
	}

UnitMenuTopWindow._drawUnitLevel = function(xBase, yBase) {
		var x = xBase + 303;
		var y = yBase;
		
		ContentRenderer.drawLevelInfo(x, y, this._unit);
	}

UnitMenuTopWindow.drawWindowContent = function(x, y) {
		this._drawUnitFace(x, y);
		this._drawUnitName(x, y);
		this._drawUnitClass(x, y);
		this._drawUnitLevel(x, y);
		this._drawUnitHp(x, y);
		this._drawFusionIcon(x, y);
		this._drawUnitCt(x, y);
	}


TurnMarkFlowEntry.drawFlowEntry = function() {

}