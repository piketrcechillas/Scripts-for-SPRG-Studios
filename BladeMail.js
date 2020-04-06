
/*Blade Mail Skill, by piketrcechillas
This plugin allows Blade Mail skill that reflects the damage to the attacker
Usage: Equip the character with a custom skill with the keyword "Blademail", no quote
Then insert desired reflectable weapon types in custom parameters.
For example, if you want to reflect Sword weapon type and Lance weapon type, 
{
reflect: ["Sword","Lance"]
}
If you want to only reflect melee attack, add melee: true to the custom parameters
Example:
{
reflect: ["Sword","Lance"],
melee: true
}

This will only reflect damage cause at melee range*/





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
		DamageControl.reduceHp(passive, order.getPassiveDamage());


		var adj = false;

		var x = passive.getMapX();
		var y = passive.getMapY();
		var actX = active.getMapX();
		var actY = active.getMapY();

		if(actX==x&&actY==y-1)
			adj = true;
		if(actX==x&&actY==y+1)
			adj = true;
		if(actX==x-1&&actY==y)
			adj = true;
		if(actX==x+1&&actY==y)
			adj = true;
		if(SkillControl.getPossessionCustomSkill(passive, "Blademail")){
			var skill = SkillControl.getPossessionCustomSkill(passive, "Blademail");
			var suitable = false;
			var arr = skill.custom.reflect;
			var i;
			if(skill.custom.all)
				suitable = true;
			for(i = 0; i < arr.length; i++){
				if(actWeapon.getWeaponType().getName() == arr[i])
					suitable = true;
				}

			if(skill.custom.melee){
				if(!DamageControl.isLosted(passive) && suitable && adj){
					root.log("Blademail")
					DamageControl.reduceHp(active, order.getPassiveDamage());
					this.reflected = true;
				}
			}

			else if(!DamageControl.isLosted(passive) && suitable){
				root.log("Blademail")
				DamageControl.reduceHp(active, order.getPassiveDamage());
				this.reflected = true;
			}
		}
		
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

		var adj = false;

		var x = battlerPassive.getUnit().getMapX();
		var y = battlerPassive.getUnit().getMapY();
		var actX = battlerActive.getUnit().getMapX();
		var actY = battlerActive.getUnit().getMapY();

		if(actX==x&&actY==y-1)
			adj = true;
		if(actX==x&&actY==y+1)
			adj = true;
		if(actX==x-1&&actY==y)
			adj = true;
		if(actX==x+1&&actY==y)
			adj = true;
		if(SkillControl.getPossessionCustomSkill(battlerPassive.getUnit(), "Blademail")){
			var skill = SkillControl.getPossessionCustomSkill(battlerPassive.getUnit(), "Blademail");
			var suitable = false;
			var arr = skill.custom.reflect;
			var i;
			if(skill.custom.all)
				suitable = true;
			for(i = 0; i < arr.length; i++){
				if(actWeapon.getWeaponType().getName() == arr[i])
					suitable = true;
				}

			if(skill.custom.melee){
				if(damagePassive < battlerPassive.getUnit().getHp() && suitable && adj){
					root.log("Blademail")
					reflected = true;
				}
			}

			else if(damagePassive < battlerPassive.getUnit().getHp() && suitable){
				root.log("Blademail")
				reflected = true;
			}
		}
		
		if (isHit) {
			// Reduce HP at the side of being attacked, and damage can be displayed as UI.
			this._checkDamage(order.getActiveUnit(), damagePassive, battlerPassive);

			if (reflected)
			{
				this._checkDamage(order.getActiveUnit(), damagePassive, battlerActive);
			}
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
		var battlerActive = this.getActiveBattler();
		var battlerPassive = this.getPassiveBattler();

		var reflected = false;

		var actWeapon = ItemControl.getEquippedWeapon(battlerActive.getUnit());
		var pasWeapon = ItemControl.getEquippedWeapon(battlerPassive.getUnit());

		var adj = false;

		var x = battlerPassive.getUnit().getMapX();
		var y = battlerPassive.getUnit().getMapY();
		var actX = battlerActive.getUnit().getMapX();
		var actY = battlerActive.getUnit().getMapY();

		if(actX==x&&actY==y-1)
			adj = true;
		if(actX==x&&actY==y+1)
			adj = true;
		if(actX==x-1&&actY==y)
			adj = true;
		if(actX==x+1&&actY==y)
			adj = true;
		if(SkillControl.getPossessionCustomSkill(battlerPassive.getUnit(), "Blademail")){
			var skill = SkillControl.getPossessionCustomSkill(battlerPassive.getUnit(), "Blademail");
			var suitable = false;
			var arr = skill.custom.reflect;
			var i;
			if(skill.custom.all)
				suitable = true;
			for(i = 0; i < arr.length; i++){
				if(actWeapon.getWeaponType().getName() == arr[i])
					suitable = true;
				}

			if(skill.custom.melee){
				if(damagePassive < battlerPassive.getUnit().getHp() && suitable && adj){
					root.log("Blademail")
					reflected = true;
				}
			}

			else if(damagePassive < battlerPassive.getUnit().getHp() && suitable){
				root.log("Blademail")
				reflected = true;
			}
		}
		
		if (isHit) {
			// Reduce HP at the side of being attacked, and damage can be displayed as UI.
			this._checkDamage(order.getActiveUnit(), damagePassive, battlerPassive);

			if (reflected)
			{
				this._checkDamage(order.getActiveUnit(), damagePassive, battlerActive);
			}
			// Reduce HP at the attacker and damage can be displayed as UI.
			// Normally, no damage or recovery occurs for the attacker,
			// so if statement is not executed in a principle.
			if (damageActive !== 0) {
				this._checkDamage(order.getPassiveUnit(), damageActive, battlerActive);
			}
			// If the opponent is wait state, the wait ends with this method.
		}
	}