
/*Tetrakarn and Makarakarn, by piketrcechillas
This plugin allows a status that erects a barrier to reflect the damage to the attacker ONCE (like Persona)
Insert
physRef: true
to the custom parameter of the status that reflects physical damage and
magRef: true
to the status that reflects magical damage
Alternatively, you can insert both to reflect all kind of damage.
*/



AttackFlow._doAttackAction = function() {
		var i, count, turnState;
		var order = this._order;
		var active = order.getActiveUnit();
		var passive = order.getPassiveUnit();
		var activeStateArray = order.getActiveStateArray();
		var passiveStateArray = order.getPassiveStateArray();
		var isItemDecrement = order.isCurrentItemDecrement();

		var actWeapon = ItemControl.getEquippedWeapon(active);
		var pasWeapon = ItemControl.getEquippedWeapon(passive);
		

		DamageControl.reduceHp(active, order.getActiveDamage());
		

		var tetrakarn = false;
		var makarakarn = false;

		var list = passive.getTurnStateList();
		var count = list.getCount();
		var makaState, tetraState;
		for (i = 0; i < count; i++) {
			checkTurnState = list.getData(i).getState();
			if(checkTurnState.custom.physRef){
				tetrakarn = true;
				tetraState = checkTurnState;
			}
			if(checkTurnState.custom.magRef){
				makarakarn = true;
				makaState = checkTurnState;
			}
		}

		if(tetrakarn){
			if(!DamageControl.isLosted(passive) && actWeapon.getWeaponCategoryType() == WeaponCategoryType.PHYSICS){
				root.log("Blademail")
				DamageControl.reduceHp(active, order.getPassiveDamage());
				this.reflected = true;
				StateControl.arrangeState(passive, tetraState, IncreaseType.DECREASE);
			}
		}

		if(makarakarn){
			if(!DamageControl.isLosted(passive) && actWeapon.getWeaponCategoryType() == WeaponCategoryType.MAGIC){
				root.log("Blademail")
				DamageControl.reduceHp(active, order.getPassiveDamage());
				this.reflected = true;
				StateControl.arrangeState(passive, makaState, IncreaseType.DECREASE);
			}
		}
			
		if(!tetrakarn && !makarakarn)
				DamageControl.reduceHp(passive, order.getPassiveDamage());
		
		DamageControl.checkHp(active, passive);
		DamageControl.checkHp(passive, active);

		
		count = activeStateArray.length;
		for (i = 0; i < count; i++) {
			turnState = StateControl.arrangeState(active, activeStateArray[i], IncreaseType.INCREASE);
			if (turnState !== null) {
				turnState.setLocked(true);
			}
		}
		
		count = passiveStateArray.length;
		for (i = 0; i < count; i++) {
			turnState = StateControl.arrangeState(passive, passiveStateArray[i], IncreaseType.INCREASE);
			if (turnState !== null) {
				turnState.setLocked(true);
			}
		}
		
		if (isItemDecrement) {
			// Reduce the weapons for the attacker.
			// Items don't get discarded.
			// ItemControl.getEquippedWeapon is not called because there is a possibility to return null.
			// If the "Users" of the weapon is current HP, there is a possibility that HP has changed due to the battle, so the equipment decision also changes.
			ItemControl.decreaseLimit(active, BattlerChecker.getBaseWeapon(active));
		}
	}


RealBattle.doHitAction = function() {
		var order = this._order;
		var isHit = order.isCurrentHit();
		var damageActive = order.getActiveDamage();
		var damagePassive = order.getPassiveDamage();
		var battlerActive = this.getActiveBattler();
		var battlerPassive = this.getPassiveBattler();

		var reflected = false;

		var actWeapon = ItemControl.getEquippedWeapon(battlerActive.getUnit());
		var pasWeapon = ItemControl.getEquippedWeapon(battlerPassive.getUnit());

		var tetrakarn = false;
		var makarakarn = false;

		var list = battlerPassive.getUnit().getTurnStateList();
		var count = list.getCount();
		var makaState, tetraState;
		for (i = 0; i < count; i++) {
			checkTurnState = list.getData(i).getState();
			if(checkTurnState.custom.physRef){
				tetrakarn = true;
				tetraState = checkTurnState;
			}
			if(checkTurnState.custom.magRef){
				makarakarn = true;
				makaState = checkTurnState;
			}
		}

		if(tetrakarn){
			if(damagePassive < battlerPassive.getUnit().getHp() && actWeapon.getWeaponCategoryType() == WeaponCategoryType.PHYSICS){
				//root.log("Blademail")
				reflected = true;
			}
		}

		if(makarakarn){
			if(damagePassive < battlerPassive.getUnit().getHp() && actWeapon.getWeaponCategoryType() == WeaponCategoryType.MAGIC){
				//root.log("Blademail")
				reflected = true;
			}
		}
		
		if (isHit) {
			// Reduce HP at the side of being attacked, and damage can be displayed as UI.
			

			if (reflected)
			{
				this._checkDamage(order.getActiveUnit(), damagePassive, battlerActive);
			}
			else
				this._checkDamage(order.getActiveUnit(), damagePassive, battlerPassive);
			// Reduce HP at the attacker and damage can be displayed as UI.
			// Normally, no damage or recovery occurs for the attacker,
			// so if statement is not executed in a principle.
			if (damageActive !== 0) {
				this._checkDamage(order.getPassiveUnit(), damageActive, battlerActive);
			}
			
			battlerPassive = this.getPassiveBattler();
			
			// If the opponent is wait state, the wait ends with this method.
			battlerPassive.setDamageState();
		}
		else {
			battlerPassive = this.getPassiveBattler();
			this._uiBattleLayout.showAvoidAnime(battlerPassive);
			
			// Attack failed to hit, so the opponent is "Avoid" motion.
			battlerPassive.setAvoidState();
		}
		
		return isHit;
	}


EasyMapUnit._doHitAction = function() {
		var order = this._order;
		var isHit = order.isCurrentHit();
		var damageActive = order.getActiveDamage();
		var damagePassive = order.getPassiveDamage();
		var battlerActive = order.getActiveUnit();
		var battlerPassive = order.getPassiveUnit();

		var reflected = false;

		var actWeapon = ItemControl.getEquippedWeapon(battlerActive);
		var pasWeapon = ItemControl.getEquippedWeapon(battlerPassive);

		var tetrakarn = false;
		var makarakarn = false;

		var list = battlerPassive.getTurnStateList();
		var count = list.getCount();
		var makaState, tetraState;
		for (i = 0; i < count; i++) {
			checkTurnState = list.getData(i).getState();
			if(checkTurnState.custom.physRef){
				tetrakarn = true;
				tetraState = checkTurnState;
			}
			if(checkTurnState.custom.magRef){
				makarakarn = true;
				makaState = checkTurnState;
			}
		}

		if(tetrakarn){
			if(damagePassive < battlerPassive.getHp() && actWeapon.getWeaponCategoryType() == WeaponCategoryType.PHYSICS){
				//root.log("Blademail")
				reflected = true;
			}
		}

		if(makarakarn){
			if(damagePassive < battlerPassive.getHp() && actWeapon.getWeaponCategoryType() == WeaponCategoryType.MAGIC){
				//root.log("Blademail")
				reflected = true;
			}
		}
		
		if (isHit) {
			// Reduce HP at the side of being attacked, and damage can be displayed as UI.
			
			if (reflected)
			{
				this._checkDamage(order.getPassiveUnit(), damagePassive);
			}
			else
				this._checkDamage(order.getActiveUnit(), damagePassive);

			// Reduce HP at the attacker and damage can be displayed as UI.
			// Normally, no damage or recovery occurs for the attacker,
			// so if statement is not executed in a principle.
			if (damageActive !== 0) {
				this._checkDamage(order.getPassiveUnit(), damageActive);
			}
		}

	}