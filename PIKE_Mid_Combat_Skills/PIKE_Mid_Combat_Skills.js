
RealBattle._bigAttackParam = null;

var MidCombatWeaponSelectMenu = defineObject(WeaponSelectMenu,
{
	_enemyUnit: null,	
	_enemyX: 0,			
	_enemyY: 0,			
	_weapon:null,		
	_noEquipMessageWindow:null,	
	_availableArray: null,

	setMenuUnitAndTarget: function(unit, enemyUnit, enemyX, enemyY, enemyWeapon) {

		this._enemyUnit = enemyUnit;
		this._enemyX = enemyX;
		this._enemyY = enemyY;
		this._weapon = enemyWeapon;
		this.setMenuTarget(unit);
	},
	
	drawWindowManager: function() {
		WeaponSelectMenu.drawWindowManager.call(this);

		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		posWidth = mapInfo.getMapWidth();
		posHeight = mapInfo.getMapHeight();

		var x = 800;
		var y = this.getPositionWindowY();
		var height = this._itemListWindow.getWindowHeight() + this._itemInfoWindow.getWindowHeight();
		
	},

	_setWeaponbar: function(unit) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		var scrollbar = this._itemListWindow.getItemScrollbar();
		var waitIndex = 0;
		
		scrollbar.resetScrollData();
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (this._isWeaponAllowed(unit, item) && !item.custom.wait) {
				scrollbar.objectSet(item);
			}
			if(item.custom.wait){
				waitIndex = i;
			}
		}

		item = UnitItemControl.getItem(unit, waitIndex);
		scrollbar.objectSet(item);
		
		scrollbar.objectSetEnd();
	},
	
	_isWeaponAllowed: function(unit, item) {
		if (!ItemControl.isWeaponAvailable(unit, item)) {
			return false;
		}

		if(item.custom.engage) {
			return false;
		}

		if(unit.custom.tempCount == 0 && !item.custom.wait) {
			return false;
		}
		
		var result = AttackChecker.isCounterAttackableWeapon(this._weapon, this._enemyX, this._enemyY, unit, item, this._enemyUnit);
		return result;
	}
}
);

AttackChecker.isCounterAttackableWeapon= function(enemyWeapon, unitx, unity, counterUnit, counterWeapon, enemyUnit) {
		var indexArray;
		
		if (!Calculator.isCounterattackAllowed(enemyUnit, counterUnit)) {
			return false;
		}
		
		if (enemyWeapon !== null && enemyWeapon.isOneSide()) {
			return false;
		}
		
		if (counterWeapon === null) {
			return false;
		}
		
		if (counterWeapon.isOneSide()) {
			return false;
		}
		
		indexArray = IndexArray.createIndexArray(counterUnit.getMapX(), counterUnit.getMapY(), counterWeapon);
		
		var result = IndexArray.findPos(indexArray, unitx, unity);
		return result;
};

RealBattle._weaponSelectMenu = null;

RealBattle._moveBattle = function() {
		this._checkBattleContinue();
	
		return MoveResult.CONTINUE;
	}

RealBattle._moveBattleStart = function() {
		if (this._battleTable.moveBattleStart() !== MoveResult.CONTINUE) {
			if (!this._attackFlow.validBattle()) {
				// If the battle cannot start, immediately end.
				this._processModeBattleEnd();
				return MoveResult.CONTINUE;
			}
			
			this._weaponSelectMenu = createObject(MidCombatWeaponSelectMenu);

			var turnType = root.getCurrentSession().getTurnType()

			if(turnType == TurnType.PLAYER){
				var unit = this._order.getActiveUnit();
				var targetUnit = this._order.getPassiveUnit();}
			else {
				var unit = this._order.getPassiveUnit();
				var targetUnit = this._order.getActiveUnit();}


			if(unit.custom.tempCount == 0 && targetUnit.custom.tempCount == 0) {
				unit.custom.tempCount = unit.custom.count;
				targetUnit.custom.tempCount = targetUnit.custom.count;
			}

			this._weaponSelectMenu.setMenuUnitAndTarget(unit, targetUnit, targetUnit.getMapX(), targetUnit.getMapY(), ItemControl.getEquippedWeapon(unit));
			this.changeCycleMode(RealBattleMode.WEAPONSELECT);

		
		}
		
		return MoveResult.CONTINUE;
	}

RealBattle._moveWeaponSelect= function() {
		var weapon, filter, indexArray;

		var turnType = root.getCurrentSession().getTurnType()
		var targetUnit;
		var enemyUnit;

		if(turnType == TurnType.PLAYER){
			targetUnit = this._order.getActiveUnit();
			enemyUnit = this._order.getPassiveUnit();
		}
		else {
			enemyUnit = this._order.getActiveUnit();
			targetUnit = this._order.getPassiveUnit();
		}

		var input = this._weaponSelectMenu.moveWindowManager();
		
		if (input === ScrollbarInput.SELECT) {
				weapon = this._weaponSelectMenu.getSelectWeapon();

				filter = FilterControl.getReverseFilter(targetUnit.getUnitType());
				
				ItemControl.setEquippedWeapon(targetUnit, weapon);

				var i, item;
				var count = UnitItemControl.getPossessionItemCount(enemyUnit);

				while(ItemControl.getEquippedWeapon(enemyUnit, weapon).custom.engage || ItemControl.getEquippedWeapon(enemyUnit, weapon).custom.wait)
					{
						i = Math.floor(count*Math.random(0, count))
						item = UnitItemControl.getItem(enemyUnit, i); 
						if(item.isWeapon()){
							ItemControl.setEquippedWeapon(enemyUnit,item);
						}
					}

				if(turnType == TurnType.ENEMY && this._order.getActiveUnit().custom.tempCount == 0) {
					var count = UnitItemControl.getPossessionItemCount(this._order.getActiveUnit());
	
		
					for (i = 0; i < count; i++) {
						item = UnitItemControl.getItem(this._order.getActiveUnit(), i);
						if (item.custom.wait) {
							ItemControl.setEquippedWeapon(this._order.getActiveUnit(), item);
							break;
						}
					}


				}

				this._bigAttackParam = StructureBuilder.buildAttackParam();
				this._bigAttackParam.unit = this._order.getActiveUnit();
				this._bigAttackParam.targetUnit = this._order.getPassiveUnit();
			
		
				
				this._bigAttackParam.attackStartType = AttackStartType.NORMAL;

				BattlerChecker.setUnit(this._bigAttackParam.unit, this._bigAttackParam.targetUnit);

				
				var infoBuilder = createObject(NormalAttackInfoBuilder);
				var orderBuilder = createObject(NormalAttackOrderBuilder);
				var attackInfo = infoBuilder.createAttackInfo(this._bigAttackParam);
				var attackOrder = orderBuilder.createAttackOrder(attackInfo);

				
			
				this._attackFlow.setAttackInfoAndOrder(attackInfo, attackOrder, this._parentCoreAttack);
				
				this._order = this._attackFlow.getAttackOrder();
				this._attackInfo = this._attackFlow.getAttackInfo();
				this._resetBattleMemberData(this._parentCoreAttack);
				
				if(this._order.getActiveUnit().custom.tempCount > 0)
					this._order.getActiveUnit().custom.tempCount -= 1;

				if(this._order.getPassiveUnit().custom.tempCount > 0)
					this._order.getPassiveUnit().custom.tempCount -= 1;
				
				this._processModeActionStart();

		}
		
		return MoveResult.CONTINUE;
}

RealBattle._changeBattle = function() {
		var battler = this.getActiveBattler();
		
		// Set to true since the screen should scroll according to the position of the motion when it starts moving.
		// This value may be changed to false by battler.startBattler.
		// One such case is when the first frame is the start of a magic loop.
		this._isMotionBaseScroll = true;

		battler.startBattler();
		//this._attackFlow.finalizeAttack();
	}

RealBattle._completeBattleMemberData = function(coreAttack) {
		ConfigItem.SkipControl.selectFlag(0);
		this._createBattler();
	
		this._autoScroll.setScrollX(this.getActiveBattler().getFocusX());
		
		this._uiBattleLayout.setBattlerAndParent(this._battlerRight, this._battlerLeft, this);
		
		this._battleTable.setBattleObject(this);
		this._battleTable.enterBattleStart();
		this.changeCycleMode(RealBattleMode.BATTLESTART);
	}

RealBattle._resetBattleMemberData = function(coreAttack) {
		this._createBattler();
	
		this._autoScroll.setScrollX(this.getActiveBattler().getFocusX());
		
		this._uiBattleLayout.setBattlerAndParent(this._battlerRight, this._battlerLeft, this);
		this._battleTable = createObject(RealBattleTable);
		this._battleTable.setBattleObject(this);
		this._battleTable.enterBattleStart();
	}


RealBattle._moveActionEnd = function() {


		if (this._battleTable.moveActionEnd() !== MoveResult.CONTINUE) {
			this._checkNextAttack();
		}
		
		

		return MoveResult.CONTINUE;
	}

RealBattle._checkNextAttack = function() {
		var result, battler;
		var battlerPrev = this.getActiveBattler();
		
		this._attackFlow.executeAttackPocess();
		
		result = this._attackFlow.checkNextAttack();
		if (result === AttackFlowResult.DEATH) {
			battler = this.getActiveBattler();
			if (DamageControl.isLosted(battler.getUnit())) {
				battler.lostBattler();
			}
			
			battler = this.getPassiveBattler();
			if (DamageControl.isLosted(battler.getUnit())) {
				battler.lostBattler();
			}
		}
		else if (result === AttackFlowResult.CONTINUE) {
			battler = this.getActiveBattler();
			
			// If battler and battlerPrev are identical, it means that the unit to attack is identical at the previous time and this time.
			if (!battler.checkForceScroll(battler === battlerPrev)) {
				this._processModeActionStart();
			}
			
			// Continue the battle.
			return true;
		}

		if((this._order.getActiveUnit().custom.tempCount != 0 || this._order.getPassiveUnit().custom.tempCount != 0) && result !== AttackFlowResult.DEATH) {

			root.log("pass");


				
			var infoBuilder = createObject(NormalAttackInfoBuilder);
			var orderBuilder = createObject(NormalAttackOrderBuilder);
			var attackInfo = infoBuilder.createAttackInfo(this._bigAttackParam);
			var attackOrder = orderBuilder.createAttackOrder(attackInfo);

				
			
			this._attackFlow.setAttackInfoAndOrder(attackInfo, attackOrder, this._parentCoreAttack);
				
			this._order = this._attackFlow.getAttackOrder();
			this._attackInfo = this._attackFlow.getAttackInfo();
			this._prepareBattleMemberData(this._parentCoreAttack);
			this._completeBattleMemberData(this._parentCoreAttack);
		}
		else {
			this._processModeBattleEnd();
		}
		
		return false;
	}

RealBattle.moveBattleCycle = function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RealBattleMode.BATTLESTART) {
			result = this._moveBattleStart();
		}
		else if (mode === RealBattleMode.BATTLE) {
			result = this._moveBattle();
		}
		else if (mode === RealBattleMode.WEAPONSELECT) {
			result = this._moveWeaponSelect();
		}
		else if (mode === RealBattleMode.ACTIONSTART) {
			result = this._moveActionStart();
		}
		else if (mode === RealBattleMode.ACTIONEND) {
			result = this._moveActionEnd();
		}
		else if (mode === RealBattleMode.BATTLEEND) {
			result = this._moveBattleEnd();
		}
		else if (mode === RealBattleMode.IDLE) {
			result = this._moveIdle();
		}
		else if (mode === RealBattleMode.DELAY) {
			result = this._moveDelay();
		}
		
		this._moveAnimation();
		
		return result;
	}

RealBattle.drawBattleCycle = function() {
		var mode = this.getCycleMode();
		
		if (this._isBattleLayoutVisible) {
			this._uiBattleLayout.drawBattleLayout();
		}
		
		if (mode === RealBattleMode.BATTLESTART) {
			this._drawBattleStart();
		}
		else if (mode === RealBattleMode.WEAPONSELECT) {
			this._drawWeaponSelect();
		}
		else if (mode === RealBattleMode.ACTIONSTART) {
			this._drawActionStart();
		}
		else if (mode === RealBattleMode.ACTIONEND) {
			this._drawActionEnd();
		}
		else if (mode === RealBattleMode.BATTLEEND) {
			this._drawBattleEnd();
		}
	}

RealBattle._drawWeaponSelect= function() {
		this._weaponSelectMenu.drawWindowManager();
}

RealBattle.endBattle = function() {

		ConfigItem.SkipControl.selectFlag(2);
		MediaControl.musicStop(MusicStopType.BACK);
		MediaControl.resetSoundList();

		this._order.getActiveUnit().custom.tempCount = 0;
		this._order.getPassiveUnit().custom.tempCount = 0;


		this._uiBattleLayout.endBattleLayout();
		// Prevent to play the animation sound with backBattleCycle after the battle ends.
		this._parentCoreAttack = null;
	}

var RealBattleMode = {
	BATTLESTART: 0,
	BATTLE: 1,
	ACTIONSTART: 2,
	ACTIONEND: 3,
	BATTLEEND: 4,
	IDLE: 5,
	DELAY: 6,
	WEAPONSELECT: 7
};

AttackChecker.isCounterattack = function(unit, targetUnit) {
		var weapon, indexArray;
		
		if (!Calculator.isCounterattackAllowed(unit, targetUnit)) {
			return false;
		}
		
		weapon = ItemControl.getEquippedWeapon(unit);
		if (weapon !== null && weapon.isOneSide()) {
			// If the attacker is equipped with "One Way" weapon, no counterattack occurs.
			return false;
		}
		
		// Get the equipped weapon of those who is attacked.
		weapon = ItemControl.getEquippedWeapon(targetUnit);
		
		// If no weapon is equipped, cannot counterattack.
		if (weapon === null) {
			return false;
		}
		
		// If "One Way" weapon is equipped, cannot counterattack.
		if (weapon.isOneSide()) {
			return false;
		}

		if(targetUnit.custom.tempCount == 0) {
			return false;
		}
		
		indexArray = IndexArray.createIndexArray(targetUnit.getMapX(), targetUnit.getMapY(), weapon);
		
		return IndexArray.findUnit(indexArray, unit);
	}

AttackEvaluator.HitCritical.isHit = function(virtualActive, virtualPassive, attackEntry) {
		// Calculate with probability if it hits.
		if(ItemControl.getEquippedWeapon(virtualActive.unitSelf).custom.wait){
			return false;
		}


		return this.calculateHit(virtualActive, virtualPassive, attackEntry);
	}


CombinationCollector.Weapon.collectCombination = function(misc) {
		var i, weapon, filter, rangeMetrics;
		var unit = misc.unit;
		var itemCount = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < itemCount; i++) {
			weapon = UnitItemControl.getItem(unit, i);
			if (weapon === null) {
				continue;
			}
			
			// If it's not a weapon, or cannot equip with a weapon, don't continue.
			if (!weapon.isWeapon() || !this._isWeaponEnabled(unit, weapon, misc) || weapon.custom.engage) {
				continue;
			}
			
			misc.item = weapon;
			
			rangeMetrics = StructureBuilder.buildRangeMetrics();
			rangeMetrics.startRange = weapon.getStartRange();
			rangeMetrics.endRange = weapon.getEndRange();
			
			filter = this._getWeaponFilter(unit);
			this._checkSimulator(misc);
			this._setUnitRangeCombination(misc, filter, rangeMetrics);
		}
	}