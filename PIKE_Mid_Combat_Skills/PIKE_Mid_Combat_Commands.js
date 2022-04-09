StringTable.AttackMenu_AttackCount = "Action Count"

PosAttackWindow.drawInfoBottom = function(xBase, yBase) {
}

PosAttackWindow.setPosTarget = function(unit, item, targetUnit, targetItem, isSrc) {
	var isCalculation = false;
	if (item !== null && item.isWeapon()) {
		if (isSrc) {
			// If the player has launched an attack, the status can be obtained without conditions.
			this._statusArray = AttackChecker.getAttackStatusInternal(unit, item, targetUnit);
			isCalculation = true;
		}
		else {
			if (AttackChecker.isCounterattack(targetUnit, unit)) {
				this._statusArray = AttackChecker.getAttackStatusInternal(unit, item, targetUnit);
				isCalculation = true;
			}
			else {
				this._statusArray = AttackChecker.getNonStatus();	
			}
		}
	}
	else {
		this._statusArray = AttackChecker.getNonStatus();
	}
	
	var count = UnitItemControl.getPossessionItemCount(unit);

	for(i = 0; i < count; i++) {
		var curr = UnitItemControl.getItem(unit, i);
		if(curr.custom.engage){
			this.setPosInfo(unit, curr, isSrc);	
			break;	
		}
	}
	
	var attackCount = unit.custom.count
	this._roundAttackCount = attackCount;
}

PosAttackWindow.drawInfo = function(xBase, yBase) {
	var textui, color, font, pic, x, y, text;
	
	PosBaseWindow.drawInfo.call(this, xBase, yBase);
	
	textui = root.queryTextUI('attacknumber_title');
	color = textui.getColor();
	font = textui.getFont();
	pic = textui.getUIImage();
	x = xBase + 10;
	y = yBase + this.getWindowHeight() - 40;
	text = StringTable.AttackMenu_AttackCount + StringTable.SignWord_Multiple + this._roundAttackCount;
	TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, 4);
}

WeaponSelectMenu._isWeaponAllowed = function(unit, item) {
	var indexArray;

	if (!ItemControl.isWeaponAvailable(unit, item)) {
		return false;
	}

	if (!item.custom.engage) {
		return false;
	}

	indexArray = AttackChecker.getAttackIndexArray(unit, item, true);
	
	return indexArray.length !== 0;
}

UIBattleLayout._drawAttackCount = function(unit, isRight) {
	textui = root.queryTextUI('support_title');
	color = textui.getColor();
	font = textui.getFont();
	pic = textui.getUIImage();

	var dx = this._getIntervalX();
	if (isRight) {
		x = 407 + dx;
		y = 340;
	}
	else {
		x = 115 + dx;
		y = 340;
	}
		
	text = unit.custom.tempCount + " left";
	TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, 2);
}

UIBattleLayout._drawMain = function() {
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

	this._drawAttackCount(rightUnit, true);
	this._drawAttackCount(leftUnit, false);
}

UIBattleLayout._getAttackStatus = function(unit, targetUnit, isSrc) {
	var arr, isCounterattack;
	
	if (isSrc) {
		if(!ItemControl.getEquippedWeapon(unit).custom.wait) {
			arr = AttackChecker.getAttackStatusInternal(unit, BattlerChecker.getRealBattleWeapon(unit), targetUnit);
		}
		else {
			arr = AttackChecker.getNonStatus();
		}
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
}

UnitCommand.Attack._createAttackParam = function() {
	ConfigItem.SkipControl.selectFlag(0);
	var attackParam = StructureBuilder.buildAttackParam();
	
	attackParam.unit = this.getCommandTarget();
	attackParam.targetUnit = this._posSelector.getSelectorTarget(false);
	attackParam.attackStartType = AttackStartType.NORMAL;
	
	return attackParam;
}