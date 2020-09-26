
var RealBattleMode = {
	BATTLESTART: 0,
	BATTLE: 1,
	ACTIONSTART: 2,
	ACTIONEND: 3,
	BATTLEEND: 4,
	IDLE: 5,
	DELAY: 6
};

// If the resolution is more than 800x600 and WIDTH is 800, all battle backgrounds can be displayed.
var RealBattleArea = {
	WIDTH: 640,
	HEIGHT: 480
};

var RealBattle = defineObject(BaseBattle,
{
	_parentCoreAttack: null,
	_isBattleLayoutVisible: false,
	_isMotionBaseScroll: false,
	_idleCounter: null,
	_autoScroll: null,
	_uiBattleLayout: null,
	_battleArea: null,
	
	openBattleCycle: function(coreAttack) {
		this._prepareBattleMemberData(coreAttack);
		this._completeBattleMemberData(coreAttack);
	},
	
	moveBattleCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RealBattleMode.BATTLESTART) {
			result = this._moveBattleStart();
		}
		else if (mode === RealBattleMode.BATTLE) {
			result = this._moveBattle();
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
	},
	
	drawBattleCycle: function() {
		var mode = this.getCycleMode();
		
		if (this._isBattleLayoutVisible) {
			this._uiBattleLayout.drawBattleLayout();
		}
		
		if (mode === RealBattleMode.BATTLESTART) {
			this._drawBattleStart();
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
	},
	
	backBattleCycle: function() {
		if (this._parentCoreAttack !== null) {
			this._moveBattlerAnimation();
			this._moveAsyncEffect();
		}
	},
	
	eraseRoutine: function(alpha) {
		var active = this.getActiveBattler();
		var passive = this.getPassiveBattler();
		
		if (DamageControl.isLosted(active.getUnit())) {
			active.setColorAlpha(alpha);
		}
		
		if (DamageControl.isLosted(passive.getUnit())) {
			passive.setColorAlpha(alpha);
		}
	},
	
	endBattle: function() {
		this._battleTable.endMusic();
		this._uiBattleLayout.endBattleLayout();
		
		// Prevent to play the animation sound with backBattleCycle after the battle ends.
		this._parentCoreAttack = null;
	},
	
	setBattleLayoutVisible: function(isVisible) {
		this._isBattleLayoutVisible = isVisible;
		this._uiBattleLayout.startBattleLayout();
	},
	
	startExperienceScroll: function(unit) {
		var battler = this._getPlayerBattler(unit);
		
		this._autoScroll.startScroll(battler.getKeyX());
	},
	
	getEffectPosFromUnit: function(animeData, unit) {
		var battler = this._getPlayerBattler(unit);
		var pos = battler.getEffectPos(animeData);
		
		return {
			x: pos.x - this._autoScroll.getScrollX(),
			y: pos.y
		};
	},
	
	getBattleArea: function() {
		return this._battleArea;
	},
	
	moveAutoScroll: function() {
		return this._autoScroll.moveAutoScroll();
	},
	
	doHitAction: function() {
		var order = this._order;
		var isHit = order.isCurrentHit();
		var damageActive = order.getActiveDamage();
		var damagePassive = order.getPassiveDamage();
		var battlerActive = this.getActiveBattler();
		var battlerPassive = this.getPassiveBattler();
		
		if (isHit) {
			// Reduce HP at the side of being attacked, and damage can be displayed as UI.
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
	},
	
	setMotionBaseScroll: function(isMotionBaseScroll) {
		this._isMotionBaseScroll = isMotionBaseScroll;
	},
	
	getAutoScroll: function() {
		return this._autoScroll;
	},
	
	forceAutoScroll: function(x) {
		if (this._autoScroll.isApproach()) {
			this._endScrollAction();
		}
		else {
			// Scroll towards the opponent if no approach.
			this._autoScroll.startScroll(x);
			this.changeCycleMode(RealBattleMode.DELAY);
		}
	},
	
	getNextBattler: function(isActive) {
		var unit;
		
		// Progress to the next order temporarily.
		if (!this._order.nextOrder()) {
			return null;
		}
		
		if (isActive) {
			unit = this._order.getActiveUnit();
		}
		else {
			unit = this._order.getPassiveUnit();
		}
		
		// Return the progressed order.
		this._order.prevOrder(); 
		
		if (unit === this._battlerRight.getUnit()) {
			return this._battlerRight;
		}
		
		return this._battlerLeft;
	},
	
	_prepareBattleMemberData: function(coreAttack) {
		this._parentCoreAttack = coreAttack;
		this._attackFlow = this._parentCoreAttack.getAttackFlow();
		this._order = this._attackFlow.getAttackOrder();
		this._attackInfo = this._attackFlow.getAttackInfo();
		this._battleTable = createObject(RealBattleTable);
		this._isMotionBaseScroll = false;
		this._effectArray = [];
		this._idleCounter = createObject(IdleCounter);
		this._autoScroll = createObject(RealAutoScroll);
		this._battleTransition = createObject(BattleTransition);
		this._uiBattleLayout = createObject(UIBattleLayout);
		
		this._createBattleArea();
	},
	
	_completeBattleMemberData: function(coreAttack) {
		this._createBattler();
	
		this._autoScroll.setScrollX(this.getActiveBattler().getFocusX());
		
		this._uiBattleLayout.setBattlerAndParent(this._battlerRight, this._battlerLeft, this);
		
		this._battleTable.setBattleObject(this);
		this._battleTable.enterBattleStart();
		this.changeCycleMode(RealBattleMode.BATTLESTART);
	},
	
	_createBattler: function() {
		var unitSrc = this._attackInfo.unitSrc;
		var unitDest = this._attackInfo.unitDest;
		var isRight = Miscellaneous.isUnitSrcPriority(unitSrc, unitDest);
		var versusType = this._getVersusType(unitSrc, unitDest);
		
		// It's important that the this._battlerRight is created based on the player (so as to display the player on the right side always).
		if (isRight) {
			// If processing is executed on this side, unitSrc is the player, and unitDest is the enemy.
			this._battlerRight = createObject(this._getBattlerObject(unitSrc));
			this._battlerLeft = createObject(this._getBattlerObject(unitDest));
			
			this._setBattlerData(this._battlerRight, unitSrc, true, true, versusType);
			this._setBattlerData(this._battlerLeft, unitDest, false, false, versusType);
		}
		else {
			// If processing is executed on this side, unitDest is the player, and unitSrc is the enemy.
			this._battlerRight = createObject(this._getBattlerObject(unitDest));
			this._battlerLeft = createObject(this._getBattlerObject(unitSrc));
			
			this._setBattlerData(this._battlerRight, unitDest, false, true, versusType);
			this._setBattlerData(this._battlerLeft, unitSrc, true, false, versusType);
		}
	},
	
	_setBattlerData: function(battler, unit, isSrc, isRight, versusType) {
		var motionId, pos;
		var animeData = BattlerChecker.findBattleAnimeFromUnit(unit);
		var motionParam = StructureBuilder.buildMotionParam();
		var order = this.getAttackOrder();
		var attackInfo = this.getAttackInfo();
		
		if (unit === attackInfo.unitSrc) {
			motionId = order.getWaitIdSrc();
		}
		else {
			motionId = order.getWaitIdDest();
		}
		
		motionParam.animeData = animeData;
		motionParam.unit = unit;
		motionParam.isRight = isRight;
		motionParam.motionColorIndex = Miscellaneous.getMotionColorIndex(unit);
		motionParam.motionId = motionId;
		motionParam.versusType = versusType;
		
		pos = BattlerPosChecker.getRealInitialPos(motionParam, isSrc, order);
		motionParam.x = pos.x;
		motionParam.y = pos.y;
		
		battler.setupRealBattler(motionParam, isSrc, this);
	},
	
	_createBattleArea: function() {
		this._battleArea = {};
		this._battleArea.x = 0;
		this._battleArea.y = 0;
		this._battleArea.width = RealBattleArea.WIDTH;
		this._battleArea.height = RealBattleArea.HEIGHT;
	},
	
	_getVersusType: function(unitSrc, unitDest) {
		var versusType;
		var animeSrc = BattlerChecker.findBattleAnimeFromUnit(unitSrc);
		var animeDest = BattlerChecker.findBattleAnimeFromUnit(unitDest);
		var srcSize = animeSrc.getSize();
		var destSize = animeDest.getSize();
		var s = 0;
		var m = 1;
		
		if (srcSize === s) {
			if (destSize === s) {
				versusType = VersusType.SS;
			}
			else if (destSize === m) {
				versusType = VersusType.SM;
			}
			else {
				versusType = VersusType.SL;
			}
		}
		else if (srcSize === m) {
			if (destSize === s) {
				versusType = VersusType.SM;
			}
			else if (destSize === m) {
				versusType = VersusType.MM;
			}
			else {
				versusType = VersusType.ML;
			}
		}
		else {
			if (destSize === s) {
				versusType = VersusType.SL;
			}
			else if (destSize === m) {
				versusType = VersusType.ML;
			}
			else {
				versusType = VersusType.LL;
			}
		}
		
		return versusType;
	},
	
	_getBattlerObject: function(unit) {
		var object;
		var attackTemplateType = BattlerChecker.findAttackTemplateTypeFromUnit(unit);
		var isDirectAttack = this._attackInfo.isDirectAttack;
		
		if (attackTemplateType === AttackTemplateType.FIGHTER) {
			if (this._attackInfo.checkMagicWeaponAttack(unit)) {
				object = MagicWeaponAttackBattler;
			}
			else {
				if (isDirectAttack) {
					object = DirectBattler;
				}
				else {
					object = IndirectBattler;
				}
			}
		}
		else if (attackTemplateType === AttackTemplateType.ARCHER) {
			object = IndirectBattler;
		}
		else {
			object = MagicBattler;
		}
		
		return object;
	},
	
	_moveBattleStart: function() {
		if (this._battleTable.moveBattleStart() !== MoveResult.CONTINUE) {
			if (!this._attackFlow.validBattle()) {
				// If the battle cannot start, immediately end.
				this._processModeBattleEnd();
				return MoveResult.CONTINUE;
			}
			
			this._processModeActionStart();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveBattle: function() {
		this._checkBattleContinue();
		
		return MoveResult.CONTINUE;
	},
	
	_moveActionStart: function() {
		if (this._battleTable.moveActionStart() !== MoveResult.CONTINUE) {
			this._changeBattle();
			this.changeCycleMode(RealBattleMode.BATTLE);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveActionEnd: function() {
		if (this._battleTable.moveActionEnd() !== MoveResult.CONTINUE) {
			this._checkNextAttack();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveBattleEnd: function() {
		if (this._battleTable.moveBattleEnd() !== MoveResult.CONTINUE) {
			this.endBattle();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveIdle: function() {
		var nextmode;
		
		if (this._idleCounter.moveIdleCounter() !== MoveResult.CONTINUE) {
			nextmode = this._idleCounter.getNextMode();
			
			if (nextmode === RealBattleMode.BATTLE) {
				this._changeBattle();
			}
			
			this.changeCycleMode(nextmode);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveDelay: function() {
		// If the screen is on scroll, motion doesn't move.
		if (this._autoScroll.moveAutoScroll() !== MoveResult.CONTINUE) {
			this._endScrollAction();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAnimation: function() {
		this._moveEffect();
		this._uiBattleLayout.moveBattleLayout();
		
		this._moveBattlerAnimation();
		
		if (this._isMotionBaseScroll) {
			// Scroll according to the current position of the motion or any thrown weapons.
			this._autoScroll.setScrollX(this.getActiveBattler().getFocusX());
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveBattlerAnimation: function() {
		if (this._isBattleLayoutVisible) {
			this._battlerRight.moveBattler();
			this._battlerLeft.moveBattler();
		}
	},
	
	_drawBattleStart: function() {
		this._battleTable.drawBattleStart();
	},
	
	_drawActionStart: function() {
		this._battleTable.drawActionStart();
	},
	
	_drawActionEnd: function() {
		this._battleTable.drawActionEnd();
	},
	
	_drawBattleEnd: function() {
		this._battleTable.drawBattleEnd();
	},
	
	_endScrollAction: function() {
		this._processModeActionStart();
	},
	
	_checkBattleContinue: function() {
		var isRightLast = this._battlerRight.isActionLast();
		var isLeftLast = this._battlerLeft.isActionLast();
		
		// Check if 2 battler motions are suspended, sync effect ends, moreover, UI (such as gauge) is animated.
		if (isRightLast && isLeftLast && this._isSyncEffectLast() && this._uiBattleLayout.isUIMoveLast()) {
			this._processModeActionEnd();
		}
		
		return true;
	},
	
	_checkNextAttack : function() {
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
		
		this._processModeBattleEnd();
		
		return false;
	},
	
	_checkDamage: function(unit, damage, battler) {
		var order = this._order;
		var isCritical = order.isCurrentCritical();
		var isFinish = order.isCurrentFinish();
		
		if (damage >= 0) {
			if (damage !== 0 || root.queryAnime('realnodamage') === null) {
				WeaponEffectControl.playDamageSound(unit, isCritical, isFinish);
			}
		}
		
		this._uiBattleLayout.setDamage(battler, damage, isCritical, isFinish);
	},
	
	_getPlayerBattler: function(unit) {
		var battler = this.getActiveBattler();
		
		if (battler.getUnit() !== unit) {
			battler = this.getPassiveBattler();
		}
		
		return battler;
	},
	
	_processModeActionStart: function() {
		if (this._battleTable.enterActionStart() === EnterResult.NOTENTER) {
			this._changeBattle();
			this.changeCycleMode(RealBattleMode.BATTLE);
		}
		else {
			this.changeCycleMode(RealBattleMode.ACTIONSTART);
		}
	},
	
	_processModeActionEnd: function() {
		if (this._battleTable.enterActionEnd() === EnterResult.NOTENTER) {
			this._checkNextAttack();
		}
		else {
			this.changeCycleMode(RealBattleMode.ACTIONEND);
		}
	},
	
	_processModeBattleEnd: function() {
		this._battleTable.enterBattleEnd();
		this.changeCycleMode(RealBattleMode.BATTLEEND);
	},
	
	_changeBattle: function() {
		var battler = this.getActiveBattler();
		
		// Set to true since the screen should scroll according to the position of the motion when it starts moving.
		// This value may be changed to false by battler.startBattler.
		// One such case is when the first frame is the start of a magic loop.
		this._isMotionBaseScroll = true;
		
		battler.startBattler();
	}
}
);

var BaseBattler = defineObject(BaseObject,
{
	_unit: null,
	_isSrc: false,
	_motion: null,
	_isPollingState: false,
	_pollingCounter: null,
	_isWaitForDamage: false,
	_realBattle: null,
	_isWaitLoopZone: false,
	_loopFrameIndex: 0,
	
	setupRealBattler: function(motionParam, isSrc, realBattle) {
		this._unit = motionParam.unit;
		this._isSrc = isSrc;
		this._motion = createObject(AnimeMotion);
		this._realBattle = realBattle;
		
		this._motion.setMotionParam(motionParam);
		this._setWapon();
		
		this._isWaitLoopZone = this._checkNewFrame();
	},
	
	getUnit: function() {
		return this._unit;
	},
	
	moveBattler: function() {
		var motionCategoryType;
		var motion = this._motion;
		
		// Check if wait by intention.
		if (!this._checkPollingState()) {
			return MoveResult.CONTINUE;
		}
		
		// Count only the number of display period which was set in the frame.
		if (motion.moveMotion() !== MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		motionCategoryType = this.getMotionCategoryType();
		if (motionCategoryType === MotionCategoryType.NORMAL) {
			this.moveNormal();
		}
		else if (motionCategoryType === MotionCategoryType.APPROACH) {
			this.moveApproach();
		}
		else if (motionCategoryType === MotionCategoryType.ATTACK) {
			this.moveAttack();
		}
		else if (motionCategoryType === MotionCategoryType.AVOID) {
			this.moveAvoidOrDamage();
		}
		else if (motionCategoryType === MotionCategoryType.THROW || motionCategoryType === MotionCategoryType.SHOOT) {
			this.moveThrow();
		}
		else if (motionCategoryType === MotionCategoryType.MAGIC || motionCategoryType === MotionCategoryType.MAGICATTACK) {
			this.moveMagic();
		}
		else if (motionCategoryType === MotionCategoryType.DAMAGE) {
			this.moveAvoidOrDamage();
		}
		
		return MoveResult.CONTINUE;
	},
	
	moveNormal: function() {
		if (this._checkLoopZone()) {
			this._isWaitLoopZone = true;
		}
		
		return MoveResult.CONTINUE;
	},
	
	moveApproach: function() {
		return MoveResult.CONTINUE;
	},
	
	moveAttack: function() {
		return MoveResult.CONTINUE;
	},
	
	moveAvoidOrDamage: function() {
		var unit, motionId, motionCategoryType, isAttack, order;
		
		if (this._checkLoopZone()) {
			// Progress to the next order temporarily.
			order = this._realBattle.getAttackOrder();
			if (order.nextOrder()) {
				unit = order.getActiveUnit();
				motionId = order.getActiveMotionId();
				motionCategoryType = this._motion.getAnimeData().getMotionCategoryType(motionId);
				isAttack = motionCategoryType === MotionCategoryType.ATTACK || motionCategoryType === MotionCategoryType.BOW || motionCategoryType === MotionCategoryType.MAGIC;
				
				// If the unit of "Avoid" or "Damage" will attack next, temporarily there will be a state of doing nothing.
				// If not, you feel that the switch from wait to attack is too fast visually.
				if (unit === this._unit && isAttack) {
					this._isPollingState = true;
					this._pollingCounter = createObject(CycleCounter);
					this._pollingCounter.setCounterInfo(4);
				}
				
				// Return the progressed order.
				order.prevOrder();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	moveThrow: function() {
		return MoveResult.CONTINUE;
	},
	
	moveMagic: function() {
		return MoveResult.CONTINUE;
	},
	
	drawBattler: function(xScroll, yScroll) {
		this._motion.drawMotion(xScroll, yScroll);
	},
	
	checkForceScroll: function(isContinuous) {
		return false;
	},
	
	startBattler: function() {
		EnemyOffsetControl.resetOffset(this);
		this.setAttackState();
	},
	
	isActionLast: function() {
		// It's not supposed that motion ends if it's in a state of doing nothing.
		if (this._isPollingState) {
			return false;
		}
		
		if (this._motion.isLoopMode()) {
			return true;
		}
		
		// "Wait" motion type loops, so cannot decide to end with isLastFrame.
		if (this.getMotionCategoryType() === MotionCategoryType.NORMAL) {
			if (this._isWaitForDamage) {
				// "Wait" with damage ends.
				return true;
			}
			else {
				return false;
			}
		}
		
		return this._motion.isLastFrame();
	},
	
	isLoopZone: function() {
		return this._isWaitLoopZone;
	},
	
	getAttackMotionId: function() {
		return this._realBattle.getAttackOrder().getActiveMotionId();
	},
	
	getPassiveMotionId: function() {
		return this._realBattle.getAttackOrder().getPassiveMotionId();
	},
	
	getMotionCategoryType: function() {
		var motionId = this._motion.getMotionId();
		
		return this._motion.getAnimeData().getMotionCategoryType(motionId);
	},
	
	setAttackState: function() {
		var motionId = this.getAttackMotionId();
		
		this._motion.setMotionId(motionId);
		this._checkNewFrame();
	},
	
	setAvoidState: function() {
		var avoidId = this.getPassiveMotionId();
		
		this._motion.setMotionId(avoidId);
		this._checkNewFrame();
	},
	
	setDamageState: function() {
		var damageId = this.getPassiveMotionId();
		
		if (damageId === -1) {
			// Keep the motion if "Damage" is not set.
			this._isWaitForDamage = true;
		}
		else {
			this._motion.setMotionId(damageId);
		}
		
		this._checkNewFrame();
	},
	
	// Get x-coordinate of the sprite which is focused on.
	getFocusX: function() {
		return this._motion.getFocusX();
	},
	
	// Get x-coordinate after moving the key sprite.
	getKeyX: function() {
		return this._motion.getKeyX();
	},
	
	getKeyY: function() {
		return this._motion.getKeyY();
	},
	
	getEffectPos: function(anime) {
		var isRight = this._realBattle.getBattler(true) === this;
		return this._motion.getEffectPos(anime, isRight);
	},
	
	getCenterPos: function(effectWidth, effectHeight) {
		var isRight = this._realBattle.getBattler(true) === this;
		return this._motion.getCenterPos(effectWidth, effectHeight, isRight);
	},
	
	lostBattler: function() {
	},
	
	isSrc: function() {
		return this._isSrc;
	},
	
	setColorAlpha: function(alpha) {
		this._motion.setColorAlpha(alpha);
	},
	
	getAnimeMotion: function() {
		return this._motion;
	},
	
	_setWapon: function() {
		var weapon = BattlerChecker.getRealBattleWeapon(this._unit);
		
		// Display weapons if the equipped weapons are not magic.
		if (weapon !== null && weapon.getWeaponCategoryType() !== AttackTemplateType.MAGE) {
			this._motion.setWeapon(weapon);
		}
	},
	
	_checkPollingState: function() {
		if (this._isPollingState) {
			if (this._pollingCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
				this._isPollingState = false;
			}
			
			return false;
		}
		
		return true;
	},
	
	_checkLoopZone: function() {
		var motion = this._motion;
		
		if (motion.isLoopMode()) {
			if (motion.isLoopEndFrame()) {
				motion.setFrameIndex(this._loopFrameIndex, true);
				return false;
			}
		}
		else if (motion.isLastFrame()) {
			return false;
		}
		
		motion.nextFrame();
		
		return this._checkNewFrame();
	},
	
	_checkNewFrame: function() {
		var isEnd = false;
		var motion = this._motion;
		
		if (motion.isLoopStartFrame()) {
			isEnd = true;
			this._loopFrameIndex = motion.getFrameIndex();
			motion.setLoopMode(true);
		}
		else if (motion.isLastFrame()) {
			isEnd = true;
		}
		
		return isEnd;
	}
}
);

// Motion moving of "Fighters".
var DirectBattler = defineObject(BaseBattler,
{
	moveApproach: function() {
		var motionId, moveId;
		var motion = this._motion;
			
		if (motion.isLastFrame()) {
			return MoveResult.CONTINUE;
		}
		
		motion.nextFrame();
		
		if (motion.isLastFrame()) {
			motionId = motion.getMotionId();
			moveId = this._realBattle.getAttackOrder().getMoveId();
			
			// Launch an attack because the move ends.
			if (motionId === moveId) {
				this._realBattle.getAutoScroll().setNear(true);
				this.setAttackState();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	moveAttack: function() {
		var motion = this._motion;
		
		if (motion.isLastFrame()) {
			return MoveResult.CONTINUE;
		}
		
		if (motion.isAttackHitFrame()) {
			this._realBattle.doHitAction();
		}
		
		if (this._realBattle.getActiveBattler().getAnimeMotion() == motion) {
			EnemyOffsetControl.checkOffset(motion);
		}
	
		this._checkLoopZone();
		
		if (this._isNextHit()) {
			WeaponEffectControl.playSound(this._unit, WeaponEffectSound.WEAPONWAVE);
		}
		
		return MoveResult.CONTINUE;
	},
	
	getAttackMotionId: function() {
		// Check if the unit has already approached the opponent.
		if (this._realBattle.getAutoScroll().isApproach()) {
			// If approach, return attack ID.
			return this._realBattle.getAttackOrder().getActiveMotionId();
		}
		else {
			// If no approach, return move ID to approach.
			return this._realBattle.getAttackOrder().getMoveId();
		}
	},
	
	_isNextHit: function() {
		var isNextHit;
		var index = this._motion.getFrameIndex();
		
		if (index + 1 === this._motion.getFrameCount()) {
			return false;
		}
		
		// Progress the frame by intention because the next frame information is needed.
		this._motion.setFrameIndex(index + 1, false);
		
		isNextHit = this._motion.isAttackHitFrame();
		
		// Return the frame.
		this._motion.setFrameIndex(index, false);
		
		return isNextHit;
	}
}
);

// Motion moving "Fighters" to throw weapons and "Archers".
var IndirectBattler = defineObject(BaseBattler,
{
	_isThrowState: false,
	
	moveThrow: function() {
		var isHit, motionCategoryType;
		var motion = this._motion;
		
		if (motion.isLastFrame()) {
			return MoveResult.CONTINUE;
		}
		
		if (motion.isAttackHitFrame()) {
			isHit = this._realBattle.doHitAction();
			
			if (isHit) {
				// Don't display weapons temporarily if an indirect attack hits.
				motion.hideThrowWeapon(); 
			}
		}
		else if (motion.isThrowStartFrame()) {
			motionCategoryType = this.getMotionCategoryType();
			
			if (motionCategoryType === MotionCategoryType.THROW) {
				this._playThrowSound();
			}
			else if (motionCategoryType === MotionCategoryType.SHOOT) {
				this._playShootSound();
			}
			
			// By recording the throwing state, focus on the weapon.
			this._isThrowState = true;
		}
		
		if (this._realBattle.getActiveBattler().getAnimeMotion() == motion) {
			EnemyOffsetControl.checkOffset(motion);
		}
		
		if (this._checkLoopZone()) {
			// Frame ends so don't display the weapon.
			motion.hideThrowWeapon();
			
			// Deactivate the throwing state.
			this._isThrowState = false;
			
			this._realBattle.setMotionBaseScroll(false);
		}
		
		return MoveResult.CONTINUE;
	},
	
	checkForceScroll: function(isContinuous) {
		var motion = this._motion;
		
		// If the same unit attacks continuously.
		if (isContinuous) {
			// When an arrow is shot, focus on the opponent side.
			// To get focusing back to the player's side, order to scroll.
			// If scroll ends, startBattler is called.
			this._realBattle.forceAutoScroll(motion.getKeyX(), 0);
			return true;
		}
		
		return false;
	},
	
	_playThrowSound: function() {
		WeaponEffectControl.playSound(this._unit, WeaponEffectSound.WEAPONTHROW);
	},
	
	_playShootSound: function() {
		WeaponEffectControl.playSound(this._unit, WeaponEffectSound.SHOOTARROW);
	}
}
);

var MagicBattlerType = {
	NORMAL: 0,
	INVOCATION: 1,
	MAGIC: 2,
	SCROLL: 3
};

// The move motion of "Mages" 
var MagicBattler = defineObject(BaseBattler,
{
	_invocationEffect: null,
	_magicEffect: null,
	_isLast: false,
	
	setAttackState: function() {
		var motionId = this.getAttackMotionId();
		
		this._motion.setMotionId(motionId);
		
		this._invocationEffect = null;
		this._magicEffect = null;
		this._loopFrameIndex = 0;
		this._isLast = false;
		
		if (this._motion.isMagicLoopStartFrame()) {
			this._startLoop();
		}
		else {
			this.changeCycleMode(MagicBattlerType.NORMAL);
		}
	},
	
	moveBattler: function() {
		if (this.getCycleMode() === MagicBattlerType.SCROLL) {
			if (this._realBattle.getAutoScroll().moveAutoScroll() !== MoveResult.CONTINUE) {
				this._createMagicEffect();
				this.changeCycleMode(MagicBattlerType.MAGIC);
			}
		}
		
		return BaseBattler.moveBattler.call(this);
	},
	
	moveMagic: function() {
		var mode = this.getCycleMode();
		var motion = this._motion;
		
		if (motion.isLastFrame()) {
			return MoveResult.CONTINUE;
		}
		
		if (mode === MagicBattlerType.NORMAL) {
			// If enter the frame which starts magic.
			if (this._motion.isMagicLoopStartFrame()) {
				this._startLoop();
			}
		}
		else if (mode === MagicBattlerType.INVOCATION) {
			// Check if the activation effect has ended.
			if (this._invocationEffect !== null && this._invocationEffect.isEffectLast()) {
				this._invocationEffect = null;
				this._startMagic();
			}
		}
		else if (mode === MagicBattlerType.MAGIC) {
			// Check if the magic effect has ended.
			if (this._magicEffect !== null && this._magicEffect.isEffectLast()) {
				this._magicEffect = null;
				
				// Prevent loop by setting an end flag.
				this._isLast = true;
			}
		}
		
		if (this._motion.isMagicLoopEndFrame() && !this._isLast) {
			// Get back to the loop start.
			motion.setFrameIndex(this._loopFrameIndex, true);
		}
		else {
			this._checkLoopZone();
		}
		
		return MoveResult.CONTINUE;
	},
	
	getFocusX: function() {
		var motion = this._motion;
		
		if (this._magicEffect === null) {
			return motion.getFocusX();
		}
		else {
			// If the effect is activated, focus on it.
			return this._magicEffect.getEffectX();
		}
	},
	
	checkForceScroll: function(isContinuous) {
		var motion = this._motion;
		
		// Check if the same unit attacks continuously.
		if (isContinuous) {
			// With an order of scroll, get the focus on back to the attacker.
			// If the scroll ends, call startBattler.
			this._realBattle.forceAutoScroll(motion.getKeyX());
			return true;
		}
		
		return false;
	},
	
	_startLoop: function() {
		this._loopFrameIndex = this._motion.getFrameIndex();
		
		this._createInvocationEffect();
		if (this._invocationEffect === null) {	
			// Immediately activate magic.
			this._startMagic();
		}
		else {
			this.changeCycleMode(MagicBattlerType.INVOCATION);
		}
		
		// While magic is activated, do not scroll based on the position of an enemy.
		this._realBattle.setMotionBaseScroll(false);
	},
	
	_startMagic: function() {
		if (this._realBattle.getAutoScroll().isApproach()) {
			this._createMagicEffect();
			this.changeCycleMode(MagicBattlerType.MAGIC);
		}
		else {
			// Scroll towards the opponent if no approach.
			this._realBattle.getAutoScroll().startScroll(this._realBattle.getPassiveBattler().getKeyX());
			
			// If magic activation effect ended, it means to use the magic.
			// But before that, with an order of scroll, the viewpoint is moved for the target.
			this.changeCycleMode(MagicBattlerType.SCROLL);
		}
	},
	
	_createInvocationEffect: function() {
		var isRight, dx, pos;
		var anime = this._getInvocationAnime();
		var weapon = BattlerChecker.getRealBattleWeapon(this._unit);
		var cls = BattlerChecker.getRealBattleClass(this._unit, weapon);
		var clsAnime = cls.getClassAnime(weapon.getWeaponCategoryType());
		
		if (anime === null || clsAnime.isInvocationDisabled(this._motion.getMotionId())) {
			return;
		}
		
		isRight = this === this._realBattle.getBattler(true);
		dx = 50;
		pos = this.getEffectPos(anime);
		
		if (isRight) {
			dx *= -1;
		}
		
		// RealBattle calls move of this._magicEffect or _invocationEffect.
		this._invocationEffect = this._realBattle.createEffect(anime, pos.x + dx, pos.y + 10, isRight, false);
	},
	
	_createMagicEffect: function() {
		var isRight;
		var anime = this._getMagicAnime();
		var pos = this._realBattle.getPassiveBattler().getEffectPos(anime);
		
		if (root.getAnimePreference().isEffectDefaultStyle()) {
			isRight = this._realBattle.getActiveBattler() === this._realBattle.getBattler(true);
		}
		else {
			isRight = this._realBattle.getPassiveBattler() === this._realBattle.getBattler(true);
		}
		
		// Activate magic
		this._magicEffect = this._realBattle.createEffect(anime, pos.x, pos.y, isRight, true);
	},
	
	_getInvocationAnime: function() {
		return WeaponEffectControl.getAnime(this._unit, WeaponEffectAnime.MAGICINVOCATION);
	},
	
	_getMagicAnime: function() {
		var weapon = BattlerChecker.getRealBattleWeapon(this._realBattle.getActiveBattler().getUnit());
		
		return weapon.getMagicAnime();
	}
}
);

var MagicWeaponAttackBattler = defineObject(MagicBattler,
{
	_getMagicAnime: function() {
		return WeaponEffectControl.getAnime(this._unit, WeaponEffectAnime.MAGICWEAPON);
	}
}
);

// Effect displayed at the real battle uses RealEffect, not DynamicAnime.
var RealEffect = defineObject(BaseCustomEffect,
{
	_motion: null,
	_isHitCheck: false,
	_realBattle: null,
	_isEasy: false,
	
	setupRealEffect: function(anime, x, y, isRight, realBattle) {
		var motionParam;
		
		this._realBattle = realBattle;
		
		if (anime === null) {
			return null;
		}
		
		motionParam = StructureBuilder.buildMotionParam();
		motionParam.animeData = anime;
		motionParam.x = x;
		motionParam.y = y;
		motionParam.isRight = isRight;
		motionParam.motionId = 0;
		
		this._motion = createObject(AnimeMotion);
		this._motion.setMotionParam(motionParam);
		
		return this._motion;
	},
	
	setHitCheck: function(isHitCheck) {
		this._isHitCheck = isHitCheck;
	},
	
	setEasyFlag: function(isEasy) {
		this._isEasy = isEasy;
	},
	
	moveEffect: function() {
		if (this._motion.moveMotion() !== MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		if (this._motion.isAttackHitFrame() && this._isHitCheck) {
			this._realBattle.doHitAction();
		}
		
		if (this._isHitCheck) {
			EnemyOffsetControl.checkOffset(this._motion);
		}
		
		this._motion.nextFrame();
		
		return MoveResult.CONTINUE;
	},
	
	drawEffect: function(xScroll, yScroll, isFront) {
		var anime;
		
		if (this._motion === null) {
			return;
		}
		
		if (this._isEasy) {
			this._motion.drawMotion(0, 0);
		}
		else {
			anime = this._motion.getAnimeData();
			if (isFront && !anime.isFrontDisplayable()) {
				return;
			}
			
			this._motion.drawMotion(xScroll, yScroll);
		}
	},
	
	endEffect: function() {
		this._motion = null;
	},
	
	isEffectLast: function() {
		if (this._motion === null) {
			return true;
		}
		
		return this._motion.isLastFrame();
	},
	
	getEffectX: function() {
		return this._motion.getKeyX();
	},
	
	getEffectY: function() {
		return this._motion.getKeyY();
	},
	
	getAnimeMotion: function() {
		return this._motion;
	}
}
);

var RealAutoScroll = defineObject(BaseObject,
{
	_dx: 0,
	_xGoal: 0,
	_xScroll: 0,
	_isAutoStart: false,
	_isApproach: false,
	_counter: null,
	
	startScroll: function(xGoal) {
		var dx = this._getScrollPixel();
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(0);
		
		this._xGoal = this._calculateScrollValue(xGoal);
		if (this._xScroll < this._xGoal) {
			this._dx = dx;
		}
		else {
			this._dx = dx * -1;
		}
		
		this._isAutoStart = true;
	},
	
	moveAutoScroll: function() {
		var result = MoveResult.CONTINUE;
		
		if (!this._isAutoStart) {
			return MoveResult.END;
		}
		
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this._xScroll += this._dx;
			
			if (this._dx > 0) {
				// Check the next processing if the auto scroll towards the right direction.
				if (this._xScroll >= this._xGoal) {
					this._xScroll = this._xGoal;
					result = MoveResult.END;
				}
			}
			else {
				// Check the next processing if the auto scroll towards the left direction.
				if (this._xScroll <= this._xGoal) {
					this._xScroll = this._xGoal;
					result = MoveResult.END;
				}
			}
		}
		
		if (result === MoveResult.END) {
			this._isAutoStart = false;
		}
		
		return result;
	},
	
	setScrollX: function(x) {
		// The scroll value can only be changed by moveAutoScroll when automatic scrolling is enabled.
		if (this._isAutoStart) {
			return;
		}
		
		// If already approached, the current scroll value is default.
		if (this._isApproach) {
			return;
		}
		
		this._xScroll = this._calculateScrollValue(x);
	},
	
	getScrollX: function() {
		if (root.getAnimePreference().isFixedFocus()) {
			return Math.floor((GraphicsFormat.BATTLEBACK_WIDTH - RealBattleArea.WIDTH) / 2);
		}
		else {
			return this._xScroll;
		}
	},
	
	isApproach: function() {
		if (root.getAnimePreference().isMoveMotionDisabled()) {
			// If skip the move motion, it's supposed to approach always.
			return true;
		}
		
		return this._isApproach;
	},
	
	setNear: function(isApproach) {
		this._isApproach = isApproach;
	},
	
	_calculateScrollValue: function(x) {
		var xScroll;
		var xBattleWidth = GraphicsFormat.BATTLEBACK_WIDTH;
		var xAreaWidth = RealBattleArea.WIDTH;
		var xCenter = Math.floor(xAreaWidth / 2);
		
		if (xAreaWidth > xBattleWidth) {
			return 0;
		}
		
		if (x - xCenter <= 0) {
			xScroll = 0;
		}
		else if (x + xCenter >= xBattleWidth) {
			xScroll = xBattleWidth - xAreaWidth;
		}
		else {
			xScroll = x - xCenter;
		}
		
		return xScroll;
	},
	
	_getScrollPixel: function() {
		return 15;
	}
}
);

var EnemyOffsetControl = {
	getOffsetPos: function(battler) {
		var obj = {};
		var animeRenderParam = battler.getAnimeMotion().getAnimeRenderParam();
		
		obj.x = animeRenderParam.offsetX;
		obj.y = animeRenderParam.offsetY;
		
		if (animeRenderParam.isRight) {
			obj.x *= -1;
		}
		
		return obj;
	},
	
	resetOffset: function(battler) {
		var animeRenderParam = battler.getAnimeMotion().getAnimeRenderParam();
		
		animeRenderParam.offsetX = 0;
		animeRenderParam.offsetY = 0;
		animeRenderParam.isOffsetReverse = false;
	},
	
	checkOffset: function(motion) {
		if (this._isOffsetAction(motion)) {
			this._doOffsetAction(motion);
		}
		else {
			this.resetOffset(AttackControl.getBattleObject().getPassiveBattler());
		}
	},
	
	_doOffsetAction: function(motionActive) {
		var animeRenderParam, weight, damageValue;
		var realBattle = AttackControl.getBattleObject();
		var animeActive = motionActive.getAnimeData();
		var battlerPassive = realBattle.getPassiveBattler();
		var motionPassive = battlerPassive.getAnimeMotion();
		var animePassive = motionPassive.getAnimeData();
		var motionId = motionActive.getMotionId();
		var frameIndex = motionActive.getFrameIndex();
		
		if (!animePassive.isEnemyOffsetDisabled()) {
			animeRenderParam = motionPassive.getAnimeRenderParam();
			animeRenderParam.offsetX = animeActive.getEnemyOffsetX(motionId, frameIndex);
			animeRenderParam.offsetY = animeActive.getEnemyOffsetY(motionId, frameIndex);
			animeRenderParam.isOffsetReverse = animeActive.isEnemyOffsetReverse(motionId, frameIndex);
			
			weight = animePassive.getEnemyOffsetWeight();
			animeRenderParam.offsetY = Math.floor((weight / 100) * animeRenderParam.offsetY);
		}
		
		damageValue = animeActive.getEnemyDamageMotionValue(motionId, frameIndex);
		if (damageValue !== 0) {
			motionId = root.getAnimePreference().getDamageIdFromOffsetValue(animePassive.getAttackTemplateType(), damageValue);
		}
		else {
			motionId = -1;
		}
		
		if (motionId !== -1) {
			motionPassive.setMotionId(motionId);
			battlerPassive._checkNewFrame();
		}
	},
	
	_isOffsetAction: function(motion) {
		var realBattle = AttackControl.getBattleObject();
		
		return motion.isEnemyOffsetFrame() && realBattle.getAttackOrder().isCurrentHit() && root.getAnimePreference().isEnemyOffsetEnabled();
	}
};

var UIBattleLayout = defineObject(BaseObject,
{
	_realBattle: null,
	_battlerRight: null,
	_battlerLeft: null,
	_gaugeRight: null,
	_gaugeLeft: null,
	_itemRight: null,
	_itemLeft: null,
	_statusRight: null,
	_statusLeft: null,
	_scrollBackground: null,
	_isMoveEnd: false,
	_battleContainer: null,
	
	setBattlerAndParent: function (battlerRight, battlerLeft, realBattle) {
		var unit, targetUnit;
		
		this._realBattle = realBattle;
		this._battlerRight = battlerRight;
		this._battlerLeft = battlerLeft;

		this._gaugeRight = createObject(GaugeBar);
		this._gaugeLeft = createObject(GaugeBar);
		
		if (battlerRight.isSrc()) {
			unit = battlerRight.getUnit();
			targetUnit = battlerLeft.getUnit();
			
			this._gaugeRight.setGaugeInfo(unit.getHp(), ParamBonus.getMhp(unit), 1);
			this._gaugeLeft.setGaugeInfo(targetUnit.getHp(), ParamBonus.getMhp(targetUnit), 1);
			
			this._itemRight = BattlerChecker.getRealBattleWeapon(unit);
			this._itemLeft = BattlerChecker.getRealBattleWeapon(targetUnit);
		}
		else {
			unit = battlerLeft.getUnit();
			targetUnit = battlerRight.getUnit();
			
			this._gaugeRight.setGaugeInfo(targetUnit.getHp(), ParamBonus.getMhp(targetUnit), 1);
			this._gaugeLeft.setGaugeInfo(unit.getHp(), ParamBonus.getMhp(unit), 1);
			
			this._itemRight = BattlerChecker.getRealBattleWeapon(targetUnit);
			this._itemLeft = BattlerChecker.getRealBattleWeapon(unit);
		}
		
		this._gaugeLeft.setPartsCount(14);
		this._gaugeRight.setPartsCount(14);
		
		this._statusRight = this._getAttackStatus(unit, targetUnit, battlerRight.isSrc());
		this._statusLeft = this._getAttackStatus(unit, targetUnit, battlerLeft.isSrc());
		
		this._scrollBackground = createObject(ScrollBackground);
		
		this._createBattleContainer(realBattle);
		
		this._isMoveEnd = false;	
	},
	
	moveBattleLayout: function() {
		var isLastRight = this._gaugeRight.moveGaugeBar() !== MoveResult.CONTINUE;
		var isLastLeft = this._gaugeLeft.moveGaugeBar() !== MoveResult.CONTINUE;
		
		if (isLastRight && isLastLeft) {
			this._isMoveEnd = true;
		}
		else {
			this._isMoveEnd = false;
		}
		
		this._scrollBackground.moveScrollBackground();
				
		return MoveResult.CONTINUE;
	},
	
	drawBattleLayout: function() {
		this._battleContainer.pushBattleContainer();
		
		this._drawMain();
		
		this._battleContainer.popBattleContainer();
	},
	
	startBattleLayout: function() {
		if (root.getAnimePreference().isFixedFocus()) {
			this._scrollBackground.startScrollBackground(this._getBackgroundImage());
		}
		
		this._battleContainer.startBattleContainer();
	},
	
	endBattleLayout: function() {
		this._battleContainer.endBattleContainer();
	},
	
	isUIMoveLast: function() {
		return this._isMoveEnd;
	},
	
	setDamage: function(battler, damage, isCritical, isFinish) {
		var gauge;
		
		if (battler === this._battlerRight) {
			gauge = this._gaugeRight;
		}
		else {
			gauge = this._gaugeLeft;
		}
		
		if (damage >= 0) {
			gauge.startMove(damage * -1);
			this._showDamageAnime(battler, isCritical, isFinish);
		}
		else {
			// If damage is minus, it means that recovery should be done.
			// However, func always requests positive number, so times -1. 
			gauge.startMove(damage * -1);
			this._showRecoveryAnime(battler);
		}
	},
	
	showAvoidAnime: function(battler) {
		this._showAvoidAnime(battler);
	},
	
	_drawMain: function() {
		var battler;
		var rightUnit = this._battlerRight.getUnit();
		var leftUnit = this._battlerLeft.getUnit();
		var xScroll = this._realBattle.getAutoScroll().getScrollX();
		var yScroll = 0;
		
		this._drawBackground(xScroll, yScroll);
		
		this._drawColor(EffectRangeType.MAP);
		
		battler = this._realBattle.getActiveBattler();
		if (battler === this._battlerRight) {
			this._drawBattler(xScroll, yScroll, this._battlerLeft, true);
			this._drawColor(EffectRangeType.MAPANDCHAR);
			this._drawBattler(xScroll, yScroll, this._battlerRight, true);
		}
		else {
			this._drawBattler(xScroll, yScroll, this._battlerRight, true);
			this._drawColor(EffectRangeType.MAPANDCHAR);
			this._drawBattler(xScroll, yScroll, this._battlerLeft, true);
		}
		
		this._drawCustomPicture(xScroll, yScroll);
		
		this._drawColor(EffectRangeType.ALL);
		
		this._drawEffect(xScroll, yScroll, false);
		
		this._drawFrame(true);
		this._drawFrame(false);
		
		this._drawNameArea(rightUnit, true);
		this._drawNameArea(leftUnit, false);
		
		this._drawWeaponArea(rightUnit, true);
		this._drawWeaponArea(leftUnit, false);
		
		this._drawFaceArea(rightUnit, true);
		this._drawFaceArea(leftUnit, false);
		
		this._drawInfoArea(rightUnit, true);
		this._drawInfoArea(leftUnit, false);
		
		this._drawHpArea(rightUnit, true);
		this._drawHpArea(leftUnit, false);
		
		this._drawEffect(xScroll, yScroll, true);
	},
	
	_drawBackground: function(xScroll, yScroll) {
		var pic;
		
		if (this._scrollBackground.isScrollable()) {
			this._scrollBackground.drawScrollBackground();
		}
		else {
			pic = this._getBackgroundImage();
			if (pic !== null) {
				pic.drawParts(0, 0, xScroll, yScroll, this._getBattleAreaWidth(), this._getBattleAreaHeight());
			}
			else {
				root.getGraphicsManager().fill(0x0);
			}
		}
	},
	
	_drawColor: function(rangeType) {
		var effect, battler, motion;
		var effectArray = this._realBattle.getEffectArray();
		
		this._drawColorAnime(rangeType);
		
		battler = this._realBattle.getActiveBattler();
		if (battler.getAnimeMotion().getScreenEffectRangeType() === rangeType) {
			battler.getAnimeMotion().drawScreenColor();
		}
		
		battler = this._realBattle.getPassiveBattler();
		if (battler.getAnimeMotion().getScreenEffectRangeType() === rangeType) {
			battler.getAnimeMotion().drawScreenColor();
		}
		
		if (effectArray.length > 0) {
			effect = effectArray[0];
			motion = effect.getAnimeMotion();
			if (motion !== null && motion.getScreenEffectRangeType() === rangeType) {
				motion.drawScreenColor();
			}
		}
	},
	
	_drawColorAnime: function(rangeType) {
		var effect, battler, motion;
		var effectArray = this._realBattle.getEffectArray();
		
		battler = this._realBattle.getActiveBattler();
		if (battler.getAnimeMotion().getBackgroundAnimeRangeType() === rangeType) {
			battler.getAnimeMotion().drawBackgroundAnime();
		}
		
		battler = this._realBattle.getPassiveBattler();
		if (battler.getAnimeMotion().getBackgroundAnimeRangeType() === rangeType) {
			battler.getAnimeMotion().drawBackgroundAnime();
		}
		
		if (effectArray.length > 0) {
			effect = effectArray[0];
			motion = effect.getAnimeMotion();
			if (motion !== null && motion.getBackgroundAnimeRangeType() === rangeType) {
				motion.drawBackgroundAnime();
			}
		}
	},
	
	_drawFrame: function(isTop) {
		var x, y, graphicsHandle;
		var dx = this._getIntervalX();
		
		if (isTop) {
			this._drawLifeGadget(339 + dx, 0, this._battlerRight);
			this._drawLifeGadget(220 + dx, 0, this._battlerLeft);
			
			x = dx;
			y = 0;
			graphicsHandle = this._getTopGraphicsHandle();
		}
		else {
			x = dx;
			y = 367;
			graphicsHandle = this._getBottomGraphicsHandle();
		}
		
		if (graphicsHandle !== null) {
			GraphicsRenderer.drawImage(x, y, graphicsHandle, GraphicsType.PICTURE);
		}
	},
	
	_drawLifeGadget: function(x, y, battler) {
		var handle = root.queryGraphicsHandle('battlecrystal');
		var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.PICTURE);
		var dx = 0;
		var type = battler.getUnit().getUnitType();
		
		if (type === UnitType.PLAYER) {
			dx = 0;
		}
		else if (type === UnitType.ENEMY) {
			dx = 84;
		}
		else {
			dx = 168;
		}
		
		if (pic !== null) {
			pic.drawStretchParts(x, y, 84, 84, dx, 0, 84, 84);
		}
	},
	
	_drawNameArea: function(unit, isRight) {
		var x, y, range;
		var text = unit.getName();
		var color = ColorValue.DEFAULT;
		var font = TextRenderer.getDefaultFont();
		var dx = this._getIntervalX();
		
		if (isRight) {
			x = 330 + dx;
			y = 385;
		}
		else {
			x = 115 + dx;
			y = 385;
		}
		
		range = createRangeObject(x, y, 185, 25);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
	},
	
	_drawWeaponArea: function(unit, isRight) {
		var x, y, width, height, item, text;
		var color = ColorValue.DEFAULT;
		var font = TextRenderer.getDefaultFont();
		var dx = this._getIntervalX();
		
		if (isRight) {
			item = this._itemRight;
		}
		else {
			item = this._itemLeft;
		}
		
		if (item === null) {
			return;
		}
		
		text = item.getName();
		width = TextRenderer.getTextWidth(text, font) + GraphicsFormat.ICON_WIDTH;
		height = 25;
		
		if (isRight) {
			x = 330 + dx;
			y = 417;
			
		}
		else {
			x = 115 + dx;
			y = 417;
		}
		
		x += (185 - width) / 2;
		y = Math.floor((y + (y + height)) / 2);
		
		if (item !== null) {
			ItemRenderer.drawItem(x, y, item, color, font, false);
		}
	},
	
	_drawFaceArea: function(unit, isRight) {
		var x, y;
		var dx = 20 + this._getIntervalX();
		var isReverse = false;
		
		if (isRight) {
			x = this._getBattleAreaWidth() - GraphicsFormat.FACE_WIDTH - dx;
		}
		else {
			x = 0 + dx;
			isReverse = true;
		}
		
		y = (0 + this._getBattleAreaHeight()) - GraphicsFormat.FACE_HEIGHT - 15;
		
		ContentRenderer.drawUnitFace(x, y, unit, isReverse, 255);
	},
	
	_drawInfoArea: function(unit, isRight) {
		var x, y, arr;
		var dx = 10 + this._getIntervalX();
		var color = ColorValue.KEYWORD;
		var font = TextRenderer.getDefaultFont();
		
		if (isRight) {
			x = this._getBattleAreaWidth() - 205 - dx;
			arr = this._statusRight;
		}
		else {
			x = dx;
			arr = this._statusLeft;
		}
		
		y = 65;
		StatusRenderer.drawAttackStatus(x, y, arr, color, font, 15);
	},
	
	_drawHpArea: function(unit, isRight) {
		var x, gauge, hp, xNumber, yNumber;
		var y = 40;
		var dx = 70 + this._getIntervalX();
		var dyNumber = 12;
		var pic = root.queryUI('battle_gauge');
		
		if (isRight) {
			x = this._getBattleAreaWidth() - this._gaugeRight.getGaugeWidth() - dx;
			gauge = this._gaugeRight;
			hp = this._gaugeRight.getBalancer().getCurrentValue();
			
			xNumber = 380 + this._getIntervalX();
			yNumber = y - dyNumber;
			
		}
		else {
			x = dx;
			gauge = this._gaugeLeft;
			hp = this._gaugeLeft.getBalancer().getCurrentValue();
			
			xNumber = 260 + this._getIntervalX();
			yNumber = y - dyNumber;
		}
		
		gauge.drawGaugeBar(x, y, pic);
		
		NumberRenderer.drawAttackNumberCenter(xNumber, yNumber, hp);
	},
	
	_drawCustomPicture: function(xScroll, yScroll) {
	},
	
	_drawBattler: function(xScroll, yScroll, battler, isRight) {
		battler.drawBattler(xScroll, yScroll);
	},
	
	_drawEffect: function(xScroll, yScroll, isFront) {
		var i, effect;
		var effectArray = this._realBattle.getEffectArray();
		var count = effectArray.length;
		
		for (i = 0; i < count; i++) {
			effect = effectArray[i];
			effect.drawEffect(xScroll, yScroll, isFront);
		}
	},
	
	_getIntervalX: function() {
		return Math.floor((RealBattleArea.WIDTH - 640) / 2);
	},
	
	_getAttackStatus: function(unit, targetUnit, isSrc) {
		var arr, isCounterattack;
		
		if (isSrc) {
			arr = AttackChecker.getAttackStatusInternal(unit, BattlerChecker.getRealBattleWeapon(unit), targetUnit);
		}
		else {
			isCounterattack = this._realBattle.getAttackInfo().isCounterattack;
			if (isCounterattack) {
				arr = AttackChecker.getAttackStatusInternal(targetUnit, BattlerChecker.getRealBattleWeapon(targetUnit), unit);
			}
			else {
				arr = AttackChecker.getNonStatus();
			}
		}
		
		return arr;
	},
	
	_showDamageAnime: function(battler, isCritical, isFinish) {
		var pos, effect, isRight;
		var anime = null;
		var isNoDamage = this._realBattle.getAttackOrder().getPassiveDamage() === 0;
		var offsetPos = EnemyOffsetControl.getOffsetPos(battler);
		
		if (root.getAnimePreference().isEffectDefaultStyle()) {
			isRight = this._realBattle.getActiveBattler() === this._realBattle.getBattler(true);
		}
		else {
			isRight = this._realBattle.getPassiveBattler() === this._realBattle.getBattler(true);
		}
		
		anime = WeaponEffectControl.getDamageAnime(this._realBattle.getActiveBattler().getUnit(), isCritical, true);
		if (anime !== null) {
			pos = battler.getEffectPos(anime);
			effect = this._realBattle.createEffect(anime, pos.x + offsetPos.x, pos.y + offsetPos.y, isRight, false);
			effect.setAsync(this._isDamageEffectAsync());
		}
		
		if (isNoDamage) {
			anime = root.queryAnime('realnodamage');
		}
		else if (isCritical) {
			anime = root.queryAnime('realcriticalhit');
		}
		else {
			anime = null;
		}
		
		if (anime !== null) {
			pos = battler.getEffectPos(anime);
			effect = this._realBattle.createEffect(anime, pos.x + offsetPos.x, pos.y + offsetPos.y + this._getTextAnimeOffsetY(), isRight, false);
			effect.setAsync(false);
		}
		
		if (!isNoDamage && this._isDamagePopupDisplayable()) {
			this._showDamagePopup(battler, this._realBattle.getAttackOrder().getPassiveFullDamage(), isCritical);
		}
	},
	
	_isDamageEffectAsync: function() {
		// If "Weapon Effects" is set, the battle tempo gets better by returning true with this method.
		return false;
	},
	
	_isDamagePopupDisplayable: function() {
		return EnvironmentControl.isDamagePopup();
	},
	
	_showDamagePopup: function(battler, damage, isCritical) {
		var effect = createObject(DamagePopupEffect);
		var pos = battler.getCenterPos(DamagePopup.WIDTH, DamagePopup.HEIGHT);
		var dy = 18;
		var offsetPos = EnemyOffsetControl.getOffsetPos(battler);
		
		effect.setPos(pos.x + offsetPos.x, pos.y + offsetPos.y + dy, damage);
		effect.setCritical(isCritical);
		effect.setAsync(true);
		
		this._realBattle.pushCustomEffect(effect);
	},
	
	_showRecoveryAnime: function(battler) {
		var anime = root.queryAnime('realrecovery');
		var pos = battler.getEffectPos(anime);
		var isRight = battler === this._realBattle.getBattler(true);
		
		this._realBattle.createEffect(anime, pos.x, pos.y, isRight, false);
	},
	
	_showAvoidAnime: function(battler) {
		var anime = root.queryAnime('realavoid');
		var pos = battler.getEffectPos(anime);
		var isRight = battler === this._realBattle.getBattler(true);
		
		this._realBattle.createEffect(anime, pos.x, pos.y + this._getTextAnimeOffsetY(), isRight, false);
	},
	
	_getTextAnimeOffsetY: function() {
		return -32;
	},
	
	_getLifeGadget: function(battler) {
		var gadget;
		var type = battler.getUnit().getUnitType();
		
		if (type === UnitType.PLAYER) {
			gadget = root.queryUI('battleplayer_gadget');
		}
		else if (type === UnitType.ENEMY) {
			gadget = root.queryUI('battleenemy_gadget');
		}
		else {
			gadget = root.queryUI('battlepartner_gadget');
		}
		
		return gadget;
	},
	
	_getBackgroundImage: function() {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var pic = mapInfo.getFixedBackgroundImage();
		
		if (pic === null) {
			pic = this._realBattle.getAttackInfo().picBackground;
		}
		
		return pic;
	},
	
	_getBattleAreaWidth: function() {
		return this._realBattle.getBattleArea().width;
	},
	
	_getBattleAreaHeight: function() {
		return this._realBattle.getBattleArea().height;
	},
	
	_getTopGraphicsHandle: function() {
		return root.queryGraphicsHandle('battletop');
	},
	
	_getBottomGraphicsHandle: function() {
		return root.queryGraphicsHandle('battlebottom');
	},
	
	_createBattleContainer: function(realBattle) {
		if (DataConfig.isHighResolution()) {
			if (EnvironmentControl.isRealBattleScaling()) {
				this._battleContainer = createObject(ScalingBattleContainer);
			}
			else {
				this._battleContainer = createObject(ClipingBattleContainer);
			}
		}
		else {
			this._battleContainer = createObject(BaseBattleContainer);
		}
		
		this._battleContainer.setBattleObject(realBattle);
	}
}
);

var BaseBattleContainer = defineObject(BaseObject,
{
	_realBattle: null,
	
	setBattleObject: function(realBattle) {
		this._realBattle = realBattle;
	},
	
	startBattleContainer: function() {
	},
	
	pushBattleContainer: function() {
	},
	
	popBattleContainer: function() {
	},
	
	endBattleContainer: function() {
	},
	
	_getBattleAreaWidth: function() {
		return this._realBattle.getBattleArea().width;
	},
	
	_getBattleAreaHeight: function() {
		return this._realBattle.getBattleArea().height;
	}
}
);

var ClipingBattleContainer = defineObject(BaseBattleContainer,
{
	_battleClippingArea: null,
	_safeClipping: null,
	_picCache: null,
	
	startBattleContainer: function() {
		var x = (root.getGameAreaWidth() - this._getBattleAreaWidth()) / 2;
		var y = (root.getGameAreaHeight() - this._getBattleAreaHeight()) / 2;
		
		this._realBattle.getBattleArea().x = x;
		this._realBattle.getBattleArea().y = y;
		
		if (x > 0 || y > 0) {
			x += root.getViewportX();
			y += root.getViewportY();
			this._battleClippingArea = root.getGraphicsManager().createClippingArea(x, y, this._getBattleAreaWidth(), this._getBattleAreaHeight());
			
			this._safeClipping = createObject(SafeClipping);
			
			this._picCache = this._createMapCache();
			
			this._changeMapState(false);
		}
	},
	
	pushBattleContainer: function() {
		var x = LayoutControl.getCenterX(-1, this._getBattleAreaWidth());
		var y = LayoutControl.getCenterY(-1, this._getBattleAreaHeight());
		
		if (x > 0 || y > 0) {
			this._picCache.draw(0, 0);
			
			// The reference position of drawing is not an origin (0, 0), but x, y.
			this._safeClipping.saveClipping(this._battleClippingArea);
		}
	},
	
	popBattleContainer: function() {
		var x = LayoutControl.getCenterX(-1, this._getBattleAreaWidth());
		var y = LayoutControl.getCenterY(-1, this._getBattleAreaHeight());
		
		if (x > 0 || y > 0) {
			this._safeClipping.restoreClipping();
		}
	},
	
	endBattleContainer: function() {
		var x = LayoutControl.getCenterX(-1, this._getBattleAreaWidth());
		var y = LayoutControl.getCenterY(-1, this._getBattleAreaHeight());
		
		if (x > 0 || y > 0) {
			this._changeMapState(true);
		}
	},
	
	_createMapCache: function() {
		var graphicsManager = root.getGraphicsManager();
		var cache = graphicsManager.createCacheGraphics(root.getGameAreaWidth(), root.getGameAreaHeight());
		
		// To avoid drawing the map or the unit every time at the battle, draw them in the cache.
		graphicsManager.setRenderCache(cache);
		MapLayer.drawMapLayer();
		MapLayer.drawUnitLayer();
		root.getGraphicsManager().fillRange(0, 0, root.getGameAreaWidth(), root.getGameAreaHeight(), 0, 128);
		graphicsManager.resetRenderCache();
		
		return cache;
	},
	
	_changeMapState: function(isEnabled) {
		// Cache is drawn, so the map or the unit is not drawn.
		root.getCurrentSession().setMapState(MapStateType.DRAWUNIT, isEnabled);
		root.getCurrentSession().setMapState(MapStateType.DRAWMAP, isEnabled);
	}
}
);

var ScalingBattleContainer = defineObject(BaseBattleContainer,
{
	_picCache: null,
	
	startBattleContainer: function() {
		this._picCache = root.getGraphicsManager().createCacheGraphics(this._getBattleAreaWidth(), this._getBattleAreaHeight());
		this._changeMapState(false);
	},
	
	pushBattleContainer: function() {
		root.getGraphicsManager().enableMapClipping(false);
		
		root.getGraphicsManager().setRenderCache(this._picCache);
	},
	
	popBattleContainer: function() {
		root.getGraphicsManager().resetRenderCache();
		this._picCache.drawStretchParts(0, 0, root.getGameAreaWidth(), root.getGameAreaHeight(), 0, 0, this._getBattleAreaWidth(), this._getBattleAreaHeight());
		
		root.getGraphicsManager().enableMapClipping(true);
	},
	
	endBattleContainer: function() {
		this._changeMapState(true);
	},
	
	_changeMapState: function(isEnabled) {
		// Battle background completely covers GameArea and no need to draw a map,
		// so disable to draw a map and the unit.
		root.getCurrentSession().setMapState(MapStateType.DRAWUNIT, isEnabled);
		root.getCurrentSession().setMapState(MapStateType.DRAWMAP, isEnabled);
	}
}
);
