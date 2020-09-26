
var PosMenuType = {
	Attack: 0,
	Item: 1,
	Default: 2
};

var PosMenu = defineObject(BaseWindowManager,
{
	_unit: null,
	_item: null,
	_posWindowLeft: null,
	_posWindowRight: null,
	_currentTarget: null,
	
	createPosMenuWindow: function(unit, item, type) {
		var obj = this._getObjectFromType(type);
		
		this._posWindowLeft = createWindowObject(obj, this);
		this._posWindowRight = createWindowObject(obj, this);
		
		this._unit = unit;
		this._item = item;
	},
	
	moveWindowManager: function() {
		var resultLeft = this._posWindowLeft.moveWindow();
		var resultRight = this._posWindowRight.moveWindow();
		
		return resultLeft && resultRight;
	},
	
	drawWindowManager: function() {
		var x, y;
		
		if (this._currentTarget === null) {
			return;
		}
		
		x = this.getPositionWindowX();
		y = this.getPositionWindowY();
		
		this._posWindowLeft.drawWindow(x, y);
		this._posWindowRight.drawWindow(x + this._posWindowLeft.getWindowWidth() + this._getWindowInterval(), y);
	},
	
	getTotalWindowWidth: function() {
		return this._posWindowLeft.getWindowWidth() + this._posWindowRight.getWindowWidth();
	},
	
	getTotalWindowHeight: function() {
		return this._posWindowLeft.getWindowHeight();
	},
	
	getPositionWindowX: function() {
		return LayoutControl.getCenterX(-1, this.getTotalWindowWidth());
	},
	
	getPositionWindowY: function() {
		return Miscellaneous.getDyamicWindowY(this._unit, this._currentTarget, this._posWindowLeft.getWindowHeight());
	},
	
	startPosAnimation: function(leftValue, rightValue) {
		this._posWindowLeft.startPosAnimation(leftValue);
		this._posWindowRight.startPosAnimation(rightValue);
	},
	
	changePosTarget: function(targetUnit) {
		var targetItem, isLeft;
		
		if (this._unit === null || !this._isTargetAllowed(targetUnit)) {
			this._currentTarget = null;
			return;
		}
		
		this._currentTarget = targetUnit;
		targetItem = ItemControl.getEquippedWeapon(targetUnit);
		
		// Always display the src at the left side.
		isLeft = Miscellaneous.isUnitSrcPriority(this._unit, targetUnit);
		
		// Prioritize to display the player on the left side (decide that it's easy to see on the left side).
		// So if the player launches an attack, the player is naturally displayed on the left side.
		// However, even if the player has received an attacked, the player is also displayed on the left side.
		// If both are players, those who launched the attack is displayed on the left side.
		if (isLeft) {
			// The player launched an attack, so specify the _unit as the _posWindowLeft.
			this._posWindowLeft.setPosTarget(this._unit, this._item, targetUnit, targetItem, true);
			this._posWindowRight.setPosTarget(targetUnit, targetItem, this._unit, this._item, false);
		}
		else {
			// The player hasn't launched an attack.
			// So the data is the player and the targetUnit is specified as the _posWindowLeft.
			this._posWindowLeft.setPosTarget(targetUnit, targetItem, this._unit, this._item, true);
			this._posWindowRight.setPosTarget(this._unit, this._item, targetUnit, targetItem, false);
		}
	},
	
	_getObjectFromType: function(type) {
		var obj = PosDefaultWindow;
		
		if (type === PosMenuType.Attack) {
			obj = PosAttackWindow;
		}
		else if (type === PosMenuType.Item) {
			obj = PosItemWindow;
		}
		else if (type === PosMenuType.Default) {
			obj = PosDefaultWindow;
		}
		
		return obj;
	},
	
	_isTargetAllowed: function(targetUnit) {
		if (targetUnit === null) {
			return false;
		}
		
		return true;
	},
	
	_getWindowInterval: function() {
		return 0;
	}
}
);

var PosBaseWindow = defineObject(BaseWindow,
{
	_unit: null,
	_item: null,
	_gaugeBar: null,
	_isAnimation: false,
	
	initialize: function() {
		this._gaugeBar = createObject(GaugeBar);
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
		this.drawInfo(x, y);
		this.drawUnit(x + this.getInfoWidth(), y);
	},
	
	getWindowWidth: function() {
		return this.getInfoWidth() + this.getUnitWidth() + 20;
	},
	
	getWindowHeight: function() {
		return 145;
	},
	
	setPosTarget: function(unit, item, targetUnit, targetItem, isLeft) {
	},
	
	setPosInfo: function(unit, item, isSrc) {
		this._unit = unit;
		this._item = item;
		this._gaugeBar.setGaugeInfo(unit.getHp(), ParamBonus.getMhp(unit), 1);
	},
	
	startPosAnimation: function(value) {
		this._gaugeBar.startMove(value);
		this._isAnimation = true;
	},
	
	getInfoWidth: function() {
		return 140;
	},
	
	getUnitWidth: function() {
		return 70;
	},
	
	drawInfo: function(xBase, yBase) {
		this.drawName(xBase, yBase);
		this.drawInfoTop(xBase, yBase);
		this.drawInfoCenter(xBase, yBase);
		this.drawInfoBottom(xBase, yBase);
	},
	
	drawName: function(xBase, yBase) {
		var x = xBase;
		var y = yBase;
		var length = this._getTextLength();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawText(x, y, this._unit.getName(), length, color, font);
	},
	
	drawInfoTop: function(xBase, yBase) {
		var x = xBase;
		var y = yBase;
		var pic = root.queryUI('unit_gauge');
		var balancer = this._gaugeBar.getBalancer();
		
		if (this._unit !== null) {
			ContentRenderer.drawHp(x, y + 20, balancer.getCurrentValue(), balancer.getMaxValue());
			this._gaugeBar.drawGaugeBar(x, y + 40, pic);
		}
	},
	
	drawInfoCenter: function(xBase, yBase) {
		var x, y;
		var item = this._item;
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (item !== null) {
			x = xBase;
			y = yBase + 60;
			ItemRenderer.drawItem(x, y, item, color, font, false);
		}
	},
	
	drawInfoBottom: function(xBase, yBase) {
	},
	
	drawUnit: function(x, y) {
		var unit = this._unit;
		
		if (unit !== null) {
			y += 20;
			UnitRenderer.drawDefaultUnit(unit, x, y, null);
		}
	},
	
	getWindowTextUI: function() {
		return Miscellaneous.getColorWindowTextUI(this._unit);
	},
	
	_getTextLength: function() {
		return this.getInfoWidth() + 20;
	}
}
);

var PosItemWindow = defineObject(PosBaseWindow,
{
	_obj: null,
	
	setPosTarget: function(unit, item, targetUnit, targetItem, isSrc) {
		if (item !== null && !item.isWeapon()) {
			this._obj = ItemPackageControl.getItemPotencyObject(item);
			this._obj.setPosMenuData(unit, item, targetUnit);
		}
		
		this.setPosInfo(unit, item, isSrc);
	},
	
	drawInfoBottom: function(xBase, yBase) {
		if (this._obj !== null) {
			this._obj.drawPosMenuData(xBase, yBase + 90, this.getWindowTextUI());
		}
	}
}
);

var PosDefaultWindow = defineObject(PosBaseWindow,
{
	setPosTarget: function(unit, item, targetUnit, targetItem, isSrc) {
		// In this window, items are always null.
		this.setPosInfo(unit, null, isSrc);
	}
}
);

var PosAttackWindow = defineObject(PosBaseWindow,
{
	_statusArray: null,
	_roundAttackCount: 0,
	
	setPosTarget: function(unit, item, targetUnit, targetItem, isSrc) {
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
		
		if (isCalculation) {
			this._roundAttackCount = Calculator.calculateRoundCount(unit, targetUnit, item);
			this._roundAttackCount *= Calculator.calculateAttackCount(unit, targetUnit, item);
		}
		else {
			this._roundAttackCount = 0;
		}
		
		this.setPosInfo(unit, item, isSrc);		
	},
	
	drawInfo: function(xBase, yBase) {
		var textui, color, font, pic, x, y, text;
		
		PosBaseWindow.drawInfo.call(this, xBase, yBase);
		
		if (this._roundAttackCount < 2) {
			return;
		}
		
		textui = root.queryTextUI('attacknumber_title');
		color = textui.getColor();
		font = textui.getFont();
		pic = textui.getUIImage();
		x = xBase + 10;
		y = yBase + this.getWindowHeight() - 40;
		text = StringTable.AttackMenu_AttackCount + StringTable.SignWord_Multiple + this._roundAttackCount;
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, 4);
	},
	
	drawInfoBottom: function(xBase, yBase) {
		var x = xBase;
		var y = yBase + 90;
		var textui = this.getWindowTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		
		StatusRenderer.drawAttackStatus(x, y, this._statusArray, color, font, 20);
	}
}
);
