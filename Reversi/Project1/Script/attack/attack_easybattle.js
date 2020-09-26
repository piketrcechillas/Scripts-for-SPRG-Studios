
var EasyBattleMode = {
	BATTLESTART: 0,
	BATTLE: 1,
	ACTIONSTART: 2,
	ACTIONEND: 3,
	BATTLEEND: 4,
	IDLE: 5
};

var EasyBattle = defineObject(BaseBattle,
{
	_parentCoreAttack: null,
	_isUnitDraw: false,
	_idleCounter: null,
	_easyMenu: null,
	
	openBattleCycle: function(coreAttack) {
		this._prepareBattleMemberData(coreAttack);
		this._completeBattleMemberData(coreAttack);
	},
	
	moveBattleCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === EasyBattleMode.BATTLESTART) {
			result = this._moveBattleStart();
		}
		else if (mode === EasyBattleMode.BATTLE) {
			result = this._moveBattle();
		}
		else if (mode === EasyBattleMode.ACTIONSTART) {
			result = this._moveActionStart();
		}
		else if (mode === EasyBattleMode.ACTIONEND) {
			result = this._moveActionEnd();
		}
		else if (mode === EasyBattleMode.BATTLEEND) {
			result = this._moveBattleEnd();
		}
		else if (mode === EasyBattleMode.IDLE) {
			result = this._moveIdle();
		}
		
		this._moveAnimation();
		this._moveEffect();
		
		return result;
	},
	
	drawBattleCycle: function() {
		var mode = this.getCycleMode();
		
		this._drawArea();
		
		if (mode === EasyBattleMode.BATTLESTART) {
			this._drawBattleStart();
		}	
		else if (mode === EasyBattleMode.BATTLE || mode === EasyBattleMode.IDLE) {
			this._drawBattle();
		}
		else if (mode === EasyBattleMode.ACTIONSTART) {
			this._drawActionStart();
		}
		else if (mode === EasyBattleMode.ACTIONEND) {
			this._drawActionEnd();
		}
		else if (mode === EasyBattleMode.BATTLEEND) {
			this._drawBattleEnd();
		}
	},
	
	backBattleCycle: function() {
		if (this._parentCoreAttack !== null) {
			this._moveAnimation();
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
		var rootEffect = root.getScreenEffect();
		
		// Normally the checkNextAttack should have already been called,
		// but it needs to be executed by supposing a skip battle.
		rootEffect.resetEffect();
		this._enableDefaultCharChip(false);
		
		this._battleTable.endMusic();
		this._parentCoreAttack = null;
	},
	
	startDamageAnimation: function() {
		var order = this._order;
		var damageActive = order.getActiveDamage() * -1;
		var damagePassive = order.getPassiveDamage() * -1;
		
		if (this._isPosMenuDisplayable()) {
			if (this._battlerRight.getUnit() === order.getActiveUnit()) {
				this._easyMenu.startAnimation(damageActive, damagePassive);
			}
			else {
				this._easyMenu.startAnimation(damagePassive, damageActive);
			}
		}
	},
	
	isSyncopeErasing: function() {
		return false;
	},
	
	_prepareBattleMemberData: function(coreAttack) {
		this._parentCoreAttack = coreAttack;
		this._attackFlow = this._parentCoreAttack.getAttackFlow();
		this._order = this._attackFlow.getAttackOrder();
		this._attackInfo = this._attackFlow.getAttackInfo();
		this._battleTable = createObject(EasyBattleTable);
		this._isUnitDraw = false;
		this._idleCounter = createObject(IdleCounter);
		this._easyMenu = createObject(EasyAttackMenu);
		this._effectArray = [];
		
		this._createMapUnit();
	},
	
	_completeBattleMemberData: function(coreAttack) {
		this._setAttackMenuData();
		
		this._battleTable.setBattleObject(this);
		this._battleTable.enterBattleStart();
		
		this._enableDefaultCharChip(true);
		this.changeCycleMode(EasyBattleMode.BATTLESTART);
	},
	
	_createMapUnit: function() {
		var unitSrc = this._attackInfo.unitSrc;
		var unitDest = this._attackInfo.unitDest;
		var isRight = Miscellaneous.isUnitSrcPriority(unitSrc, unitDest);
		
		if (isRight) {
			this._battlerRight = createObject(EasyMapUnit);
			this._battlerRight.setupEasyBattler(unitSrc, true, this);
			
			this._battlerLeft = createObject(EasyMapUnit);
			this._battlerLeft.setupEasyBattler(unitDest, false, this);
		}
		else {
			this._battlerRight = createObject(EasyMapUnit);
			this._battlerRight.setupEasyBattler(unitDest, false, this);
			
			this._battlerLeft = createObject(EasyMapUnit);
			this._battlerLeft.setupEasyBattler(unitSrc, true, this);
		}
	},
	
	_setAttackMenuData: function() {
		var unitSrc = this._attackInfo.unitSrc;
		var unitDest = this._attackInfo.unitDest;
		
		// Check if the PosMenu is displayed as a default.
		if (!this._isPosMenuDisplayable()) {
			return;
		}
		
		this._easyMenu.setMenuUnit(unitSrc, unitDest, this);
	},
	
	_moveBattleStart: function() {
		if (this._battleTable.moveBattleStart() !== MoveResult.CONTINUE) {
			if (!this._attackFlow.validBattle()) {
				// Immediately end if the battle cannot be started.
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
			this._changeIdleMode(EasyBattleMode.BATTLE, 10);
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
			if (nextmode === EasyBattleMode.BATTLE) {
				this._changeBattle();
			}
			this.changeCycleMode(nextmode);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAnimation: function() {
		if (this._isPosMenuDisplayable()) {
			this._easyMenu.moveWindowManager();
		}
		
		this._battlerRight.moveMapUnit();
		this._battlerLeft.moveMapUnit();
		
		return MoveResult.CONTINUE;
	},
	
	_drawArea: function() {
		var battler;
		
		this._drawColor(EffectRangeType.MAP);
		
		battler = this.getActiveBattler();
		if (battler === this._battlerRight) {
			this._drawUnit(this._battlerLeft);
			this._drawColor(EffectRangeType.MAPANDCHAR);
			this._drawUnit(this._battlerRight);
		}
		else {
			this._drawUnit(this._battlerRight);
			this._drawColor(EffectRangeType.MAPANDCHAR);
			this._drawUnit(this._battlerLeft);
		}
		
		this._drawColor(EffectRangeType.ALL);
		
		this._drawEffect();
	},
	
	_drawUnit: function(battler) {
		if (this._isUnitDraw) {
			battler.drawMapUnit();
		}
	},
	
	_drawColor: function(rangeType) {
		var effect, motion;
		var effectArray = this.getEffectArray();
		
		this._drawColorAnime(rangeType);
		
		if (effectArray.length > 0) {
			effect = effectArray[0];
			motion = effect.getAnimeMotion();
			if (motion !== null && motion.getScreenEffectRangeType() === rangeType) {
				motion.drawScreenColor();
			}
		}
	},
	
	_drawColorAnime: function(rangeType) {
		var effect, motion;
		var effectArray = this.getEffectArray();
		
		if (effectArray.length > 0) {
			effect = effectArray[0];
			motion = effect.getAnimeMotion();
			if (motion !== null && motion.getBackgroundAnimeRangeType() === rangeType) {
				motion.drawBackgroundAnime();
			}
		}
	},
	
	_drawBattleStart: function() {
		this._battleTable.drawBattleStart();
	},
	
	_drawBattle: function() {
		if (this._isPosMenuDisplayable()) {
			this._easyMenu.drawWindowManager();
		}
	},
	
	_drawActionStart: function() {
		this._easyMenu.drawWindowManager();
		this._battleTable.drawActionStart();
	},
	
	_drawActionEnd: function() {
		this._easyMenu.drawWindowManager();
		this._battleTable.drawActionEnd();
	},
	
	_drawBattleEnd: function() {
		this._battleTable.drawBattleEnd();
	},
	
	_checkBattleContinue: function() {
		var isRightLast = this._battlerRight.isActionLast();
		var isLeftLast = this._battlerLeft.isActionLast();
		
		if (isRightLast && isLeftLast && this.getEffectArray().length === 0) {
			this._processModeActionEnd();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_checkNextAttack : function() {
		var result;

		this._attackFlow.executeAttackPocess();

		result = this._attackFlow.checkNextAttack();
		if (result === AttackFlowResult.CONTINUE) {
			// Continue the battle.
			this._processModeActionStart();
			return true;
		}
		else if (result === AttackFlowResult.NONE) {
			// Need to be default drawings at the time of displaying the exp after the battle ends.
			this._enableDefaultCharChip(false);
		}
		
		this._processModeBattleEnd();
		
		return false;
	},
	
	_enableDefaultCharChip: function(isDraw) {
		var enable;
		
		if (isDraw) {
			enable = true;
		}
		else {
			enable = false;
		}
		
		this._order.getActiveUnit().setInvisible(enable);
		this._order.getPassiveUnit().setInvisible(enable);
		this._isUnitDraw = isDraw;
	},
	
	_isPosMenuDisplayable: function() {
		return true;
	},
	
	_processModeActionStart: function() {
		if (this._battleTable.enterActionStart() === EnterResult.NOTENTER) {
			this._changeIdleMode(EasyBattleMode.BATTLE, 10);
		}
		else {
			this.changeCycleMode(EasyBattleMode.ACTIONSTART);
		}
	},
	
	_processModeActionEnd: function() {
		if (this._battleTable.enterActionEnd() === EnterResult.NOTENTER) {
			this._checkNextAttack();
		}
		else {
			this.changeCycleMode(EasyBattleMode.ACTIONEND);
		}
	},
	
	_processModeBattleEnd: function() {
		this._battleTable.enterBattleEnd();
		this.changeCycleMode(RealBattleMode.BATTLEEND);
	},
	
	_changeBattle: function() {
		this._battlerRight.startMove(this._order, this._attackInfo);
		this._battlerLeft.startMove(this._order, this._attackInfo);
	},
	
	_changeIdleMode: function(nextmode, value) {
		this._idleCounter.setIdleInfo(value, nextmode);
		this.changeCycleMode(EasyBattleMode.IDLE);
	}
}
);

var EasyAttackMenu = defineObject(BaseWindowManager,
{
	_leftWindow: null,
	_rightWindow: null,
	_unit: null,
	_currentTarget: null,
	
	setMenuUnit: function(unitSrc, unitDest) {
		var isLeft;
		
		this._leftWindow = createWindowObject(EasyAttackWindow, this);
		this._rightWindow = createWindowObject(EasyAttackWindow, this);
		
		isLeft = Miscellaneous.isUnitSrcPriority(unitSrc, unitDest);
		if (isLeft) {
			this._leftWindow.setEasyAttackUnit(unitSrc);
			this._rightWindow.setEasyAttackUnit(unitDest);
		}
		else {
			this._leftWindow.setEasyAttackUnit(unitDest);
			this._rightWindow.setEasyAttackUnit(unitSrc);
		}
		
		this._unit = unitSrc;
		this._currentTarget = unitDest;
	},
	
	moveWindowManager: function() {
		var resultLeft = this._leftWindow.moveWindow();
		var resultRight = this._rightWindow.moveWindow();
		
		return resultLeft && resultRight;
	},
	
	drawWindowManager: function() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		
		this._leftWindow.drawWindow(x, y);
		this._rightWindow.drawWindow(x + this._leftWindow.getWindowWidth() + this._getWindowInterval(), y);
	},
	
	startAnimation: function(leftValue, rightValue) {
		this._leftWindow.startAnimation(leftValue);
		this._rightWindow.startAnimation(rightValue);
	},
	
	getTotalWindowWidth: function() {
		return this._leftWindow.getWindowWidth() + this._rightWindow.getWindowWidth();
	},
	
	getTotalWindowHeight: function() {
		return this._leftWindow.getWindowHeight();
	},
	
	getPositionWindowX: function() {
		return LayoutControl.getCenterX(-1, this.getTotalWindowWidth());
	},
	
	getPositionWindowY: function() {
		return Miscellaneous.getDyamicWindowY(this._unit, this._currentTarget, 145);
	},
	
	_getWindowInterval: function() {
		return 0;
	}
}
);

var EasyAttackWindow = defineObject(BaseWindow,
{
	_unit: null,
	_isAnimation: false,
	_gaugeBar: null,
	
	setEasyAttackUnit: function(unit) {
		this._unit = unit;
		this._isAnimation = false;
		this._gaugeBar = createObject(GaugeBar);
		this._gaugeBar.setGaugeInfo(unit.getHp(), ParamBonus.getMhp(unit), 1);
	},
	
	startAnimation: function(value) {
		this._gaugeBar.startMove(value);
		this._isAnimation = true;
	},
	
	moveWindowContent: function() {		
		if (this._isAnimation) {
			if (this._gaugeBar.moveGaugeBar() !== MoveResult.CONTINUE) {
				this._isAnimation = false;
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		this._drawName(x, y);
		this._drawHP(x, y);
	},
	
	getWindowWidth: function() {
		return 190;
	},
	
	getWindowHeight: function() {
		return 100;
	},
	
	getWindowTextUI: function() {
		return Miscellaneous.getColorWindowTextUI(this._unit);
	},
	
	_drawName: function(xBase, yBase) {
		var x = xBase;
		var y = yBase;
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawText(x, y + 5, this._unit.getName(), -1, color, font);
	},
	
	_drawHP: function(xBase, yBase) {
		var balancer, textui, color, font;
		var x = xBase;
		var y = yBase;
		var pic = root.queryUI('battle_gauge');
		
		if (this._unit !== null) {
			balancer = this._gaugeBar.getBalancer();
			
			// Don't refer to the getWindowTextUI here.
			textui = root.queryTextUI('easyattack_window');
			color = textui.getColor();
			font = textui.getFont();
			
			TextRenderer.drawText(x + 20, y + 33, this._getHpText(), -1, color, font);
			NumberRenderer.drawAttackNumberColor(x + 70, y + 30, balancer.getCurrentValue(), 1, 255);
			this._gaugeBar.drawGaugeBar(x + 10, y + 55, pic);
		}
	},
	
	_getHpText: function() {
		var text = root.queryCommand('hp_param');
		
		return text;
	}
}
);

var MapUnitMode = {
	ATTACK_FORWARD: 0,
	ATTACK_BACK: 1,
	AVOID_FORWARD: 2,
	AVOID_BACK: 3,
	NONE: 4
};

var EasyMapUnit = defineObject(BaseObject,
{
	_unit: null,
	_isSrc: false,
	_xPixel: 0,
	_yPixel: 0,
	_direction: 0,
	_alpha: 0,
	_unitCounter: null,
	_stepCount: 0,
	_order: null,
	_easyBattle: null,
	_attackEffect: null,
	
	setupEasyBattler: function(unit, isSrc, easyBattle) {
		this._unit = unit;
		this._isSrc = isSrc;
		this._xPixel = LayoutControl.getPixelX(unit.getMapX());
		this._yPixel = LayoutControl.getPixelY(unit.getMapY());
		this._direction = DirectionType.NULL;
		this._alpha = 255;
		this._unitCounter = createObject(UnitCounter);
		this._easyBattle = easyBattle;
		
		this.changeCycleMode(MapUnitMode.NONE);
	},
	
	startMove: function(order, attackInfo) {
		this._order = order;
		this._stepCount = 0;
		
		if (this._isSrc) {
			// Decide the direction where the unit moves to.
			this._setPixelAndDirection(attackInfo.unitSrc, attackInfo.unitDest);
		}
		else {
			this._setPixelAndDirection(attackInfo.unitDest, attackInfo.unitSrc);
		}
		
		if (this._unit === order.getActiveUnit()) {
			this.changeCycleMode(MapUnitMode.ATTACK_FORWARD);
		}
		else {
			this._showAttackAnime();
		}
	},
	
	moveMapUnit: function() {
		var mode = this.getCycleMode();
		var max = this._getStepMax();
		var isMax = max <= this._stepCount;
		
		this._unitCounter.moveUnitCounter();
		
		if (mode === MapUnitMode.ATTACK_FORWARD) {
			this._moveNormal(true);
			if (isMax) {
				this.changeCycleMode(MapUnitMode.ATTACK_BACK);
			}
		}
		else if (mode === MapUnitMode.ATTACK_BACK) {
			this._moveNormal(false);
			if (isMax) {
				this.changeCycleMode(MapUnitMode.NONE);
			}
		}
		else if (mode === MapUnitMode.AVOID_FORWARD) {
			this._moveAvoid(true);
			if (isMax) {
				this.changeCycleMode(MapUnitMode.AVOID_BACK);
			}
		}
		else if (mode === MapUnitMode.AVOID_BACK) {
			this._moveAvoid(false);
			if (isMax) {
				this.changeCycleMode(MapUnitMode.NONE);
			}
		}
		else {
			if (this._isAttackEffectEnd()) {
				this._startDamage();
			}
		}
		
		if (isMax) {
			this._stepCount = 0;
			return MoveResult.CONTINUE;
		}
		
		if (this._attackEffect === null) {
			this._stepCount += this._getForwardValue();
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawMapUnit: function() {
		var unit = this._unit;
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		
		unitRenderParam.animationIndex = this._unitCounter.getAnimationIndexFromUnit(unit);
		unitRenderParam.direction = this._direction;
		unitRenderParam.alpha = this._alpha;
		
		UnitRenderer.drawScrollUnit(unit, this._xPixel, this._yPixel, unitRenderParam);
	},
	
	isActionLast: function() {
		return this.getCycleMode() === MapUnitMode.NONE;
	},
	
	getUnit: function() {
		return this._unit;
	},
	
	setColorAlpha: function(alpha) {
		this._alpha = alpha;
	},
	
	getMapUnitX: function() {
		return this._xPixel;
	},
	
	getMapUnitY: function() {
		return this._yPixel;
	},
	
	_moveNormal: function(isForward) {
		var dx, dy;
		var d = this._getForwardValue();
		
		if (!isForward) {
			d *= -1;
		}
		
		dx = this._getPointX(this._direction) * 1;
		dy = this._getPointY(this._direction) * 1;
		this._xPixel += (dx * d);
		this._yPixel += (dy * d);
		
		return MoveResult.CONTINUE;
	},
	
	_moveAvoid: function(isForward) {
		var dx, dy;
		var d = this._getForwardValue();
		
		if (!isForward) {
			d *= -1;
		}
		
		dx = this._getAvoidX(this._direction) * 1;
		dy = this._getAvoidY(this._direction) * 1;
		this._xPixel += (dx * d);
		this._yPixel += (dy * d);
		
		return MoveResult.CONTINUE;
	},
	
	_showAttackAnime: function() {
		var pos, effect;
		var anime = WeaponEffectControl.getAnime(this._order.getActiveUnit(), WeaponEffectAnime.EASYATTACK);
		
		if (anime !== null) {
			pos = LayoutControl.getMapAnimationPos(this._xPixel, this._yPixel, anime);
			effect = this._easyBattle.createEasyEffect(anime, pos.x, pos.y);
			effect.setAsync(true);
			this._attackEffect = effect;
		}
		else {
			this._startDamage();
		}
	},
	
	_isAttackEffectEnd: function() {
		return this._attackEffect !== null && (this._attackEffect.getAnimeMotion().isAttackHitFrame() || this._attackEffect.getAnimeMotion().isLastFrame());
	},
	
	_startDamage: function() {
		this._doHitAction();
		
		if (this._order.isCurrentHit()) {
			this._showDamageAnime();
			this._easyBattle.startDamageAnimation();
		}
		else {
			this._showAvoidAnime();
			this.changeCycleMode(MapUnitMode.AVOID_FORWARD);
		}
		
		this._attackEffect = null;
	},
	
	_showDamageAnime: function() {
		var pos, effect;
		var anime = null;
		var isCritical = this._order.isCurrentCritical();
		var isNoDamage = this._order.getPassiveDamage() === 0;
		
		anime = WeaponEffectControl.getDamageAnime(this._order.getActiveUnit(), isCritical, false);
		if (anime !== null) {
			pos = LayoutControl.getMapAnimationPos(this._xPixel, this._yPixel, anime);
			effect = this._easyBattle.createEasyEffect(anime, pos.x, pos.y);
			effect.setAsync(this._isDamageEffectAsync());
		}
		
		if (isNoDamage) {
			anime = root.queryAnime('easynodamage');
		}
		else if (isCritical) {
			anime = root.queryAnime('easycriticalhit');
		}
		else {
			anime = null;
		}
		
		if (anime !== null) {
			pos = LayoutControl.getMapAnimationPos(this._xPixel, this._yPixel, anime);
			effect = this._easyBattle.createEasyEffect(anime, pos.x, pos.y);
			effect.setAsync(true);
		}
		
		if (!isNoDamage && this._isDamagePopupDisplayable()) {
			this._showDamagePopup(this._order.getPassiveFullDamage(), isCritical);
		}
	},
	
	_isDamageEffectAsync: function() {
		return false;
	},
	
	_isDamagePopupDisplayable: function() {
		return EnvironmentControl.isDamagePopup();
	},
	
	_showDamagePopup: function(damage, isCritical) {
		var effect = createObject(DamagePopupEffect);
		var dx = Math.floor((DamagePopup.WIDTH - GraphicsFormat.CHARCHIP_WIDTH) / 2);
		var dy = Math.floor((DamagePopup.HEIGHT - GraphicsFormat.CHARCHIP_HEIGHT) / 2);
		
		if (this._direction === DirectionType.TOP || this._direction === DirectionType.BOTTOM) {
			if (this._xPixel >= root.getGameAreaWidth() - 64) {
				dx -= 64;
			}
		}
		else if (this._direction === DirectionType.LEFT || this._direction === DirectionType.RIGHT) {
			if (this._yPixel >= root.getGameAreaHeight() - 32) {
				dy -= 32;
			}
			else {
				dy += 32;
			}
			
			dx -= 32;
		}
		
		effect.setPos(this._xPixel + dx, this._yPixel + dy, damage);
		effect.setAsync(true);
		effect.setCritical(isCritical);
		this._easyBattle.pushCustomEffect(effect);
	},
	
	_showAvoidAnime: function() {
		var pos, effect;
		var anime = root.queryAnime('easyavoid');
		
		if (anime !== null) {
			pos = LayoutControl.getMapAnimationPos(this._xPixel, this._yPixel, anime);
			effect = this._easyBattle.createEasyEffect(anime, pos.x, pos.y);
			effect.setAsync(true);
		}
	},
	
	_doHitAction: function() {
		var order = this._order;
		var isHit = this._order.isCurrentHit();
		var damageActive = order.getActiveDamage();
		var damagePassive = order.getPassiveDamage();
		
		if (isHit) {
			// Reduce the HP at the side of being attacked to display damage with the UI.
			this._checkDamage(order.getActiveUnit(), damagePassive);
		}
		
		// Reduce the HP at the attacker to display damage with the UI.
		// Normally, neither damage nor recovery are implemented at the attacker,
		// so normally this if statement is not executed.
		if (damageActive !== 0) {
			this._checkDamage(order.getPassiveUnit(), damageActive);
		}
	},
	
	_checkDamage: function(unit, damage) {
		var order = this._order;
		var isCritical = order.isCurrentCritical();
		var isFinish = order.isCurrentFinish();
		
		if (damage >= 0) {
			if (damage !== 0 || root.queryAnime('easynodamage') === null) {
				WeaponEffectControl.playDamageSound(unit, isCritical, isFinish);
			}
		}
	},
	
	_getStepMax: function() {
		return 14;
	},
	
	_getForwardValue: function() {
		var n = 1;
		
		if (!DataConfig.isHighPerformance()) {
			n *= 2;
		}
		
		if (Miscellaneous.isGameAcceleration()) {
			n *= 2;
		}
		
		return n;
	},
	
	_setPixelAndDirection: function(src, dest) {
		this._unit = src;
		
		this._xPixel = LayoutControl.getPixelX(src.getMapX());
		this._yPixel = LayoutControl.getPixelY(src.getMapY());
		
		this._direction = PosChecker.getSideDirection(src.getMapX(), src.getMapY(), dest.getMapX(), dest.getMapY());
		if (this._direction === DirectionType.NULL) {
			// Decide the direction with this function when not being adjacent to the opponent.
			this._direction = this._getAdhocDirection(src, dest);
		}
	},
	
	_getAdhocDirection: function(src, dest) {
		var dx, dy, directionLeftRight, directionTopBottom, direction;
		
		// Right-pointing due to being on the left side from the opponent.
		if (src.getMapX() < dest.getMapX()) {
			directionLeftRight = DirectionType.RIGHT;
			dx = dest.getMapX() - src.getMapX();
		}
		else {
			directionLeftRight = DirectionType.LEFT;
			dx = src.getMapX() - dest.getMapX();
		}
		
		// Down-pointing due to being above the opponent.
		if (src.getMapY() < dest.getMapY()) {
			directionTopBottom = DirectionType.BOTTOM;
			dy = dest.getMapY() - src.getMapY();
		}
		else {
			directionTopBottom = DirectionType.TOP;
			dy = src.getMapY() - dest.getMapY();
		}
		
		// Prioritize the one having more distance.
		if (dx > dy) {
			direction = directionLeftRight;
		}
		else {
			direction = directionTopBottom;
		}

		return direction;
	},
	
	_getPointX: function(direction) {
		var point = 0;

		if (direction === DirectionType.LEFT) {
			point = -1;
		}
		else if (direction === DirectionType.RIGHT) {
			point = 1;
		}

		return point;
	},
	
	_getPointY: function(direction) {
		var point = 0;

		if (direction === DirectionType.TOP) {
			point = -1;
		}
		else if (direction === DirectionType.BOTTOM) {
			point = 1;
		}

		return point;
	},
	
	_getAvoidX: function(direction) {
		var point = 0;

		if (direction === DirectionType.TOP) {
			point = -1;
		}
		else if (direction === DirectionType.BOTTOM) {
			point = 1;
		}

		return point;
	},
	
	_getAvoidY: function(direction) {
		var point = 0;

		if (direction === DirectionType.LEFT) {
			point = -1;
		}
		else if (direction === DirectionType.RIGHT) {
			point = 1;
		}

		return point;
	}
}
);

var EvasionMapUnit = defineObject(EasyMapUnit,
{
	_dynamicAnime: null,
	
	setupEvasionMapUnit: function(unit, isSrc, easyBattle) {
		this.setupEasyBattler(unit, isSrc, null);
		this._dynamicAnime = createObject(DynamicAnime);
	},
	
	startEvasion: function(unit) {
		this._order = null;
		this._stepCount = 0;
		
		this._unit = unit;
		this._xPixel = LayoutControl.getPixelX(unit.getMapX());
		this._yPixel = LayoutControl.getPixelY(unit.getMapY());
		this._direction = DirectionType.BOTTOM;
		
		this._setAnimeEffect();
		this.changeCycleMode(MapUnitMode.AVOID_FORWARD);
	},
	
	isActionLast: function() {
		var isLast = true;
		
		if (this._dynamicAnime !== null) {
			isLast = this._dynamicAnime.isEffectLast();
		}
		
		return this.getCycleMode() === MapUnitMode.NONE && isLast;
	},
	
	moveMapUnit: function() {
		EasyMapUnit.moveMapUnit.call(this);
		this._dynamicAnime.moveDynamicAnime();
	},
	
	drawMapUnit: function() {
		EasyMapUnit.drawMapUnit.call(this);
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_setAnimeEffect: function() {
		var anime = root.queryAnime('easyavoid');
		var pos = LayoutControl.getMapAnimationPos(this._xPixel, this._yPixel, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
	}
}
);
