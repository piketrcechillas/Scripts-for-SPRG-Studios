
var DamagePopup = {
	WIDTH: 80,
	HEIGHT: 60
};

var DamagePopupEffect = defineObject(BaseCustomEffect,
{
	_x: 0,
	_y: 0,
	_damage: 0,
	_isCritical: false,
	_ballArray: null,
	
	setPos: function(x, y, damage) {
		this._x = x;
		this._y = y;
		this._damage = damage;
		
		this._setupBallArray();
		this._setupBallPos();
		this._setupBallState();
	},
	
	setCritical: function(isCritical) {
		this._isCritical = isCritical;
	},
	
	isCritical: function() {
		return this._isCritical;
	},
	
	moveEffect: function() {
		var i;
		var count = this._ballArray.length;
		
		if (this._isLast) {
			return MoveResult.END;
		}
		
		for (i = 0; i < count; i++) {
			this._ballArray[i].moveBall();
		}
		
		// If the last number move ends, end to process.
		if (this._ballArray[this._ballArray.length - 1].isBallLast()) {
			this.endEffect();
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEffect: function(xScroll, yScroll) {
		var i;
		var count = this._ballArray.length;
		
		this._drawBallBackground();
		
		for (i = 0; i < count; i++) {
			this._ballArray[i].drawBall(xScroll, yScroll);
		}
	},
	
	_setupBallArray: function() {
		var n;
		var count = 0;
		var number = this._damage;
		
		this._ballArray = [];
		
		if (number < 0) {
			number *= -1;
		}
		
		if (number === 0) {
			this._ballArray[0] = this._createBallObject();
			this._ballArray[0].setDamage(number);
		}
		else {
			while (number > 0) {
				n = Math.floor(number % 10);
				number = Math.floor(number / 10);
				this._ballArray[count] = this._createBallObject();
				this._ballArray[count].setDamage(n);
				count++;
			}
			this._ballArray.reverse();
		}
	},
	
	_setupBallPos: function() {
		var i;
		var x = this._x;
		var y = this._y;
		var dx = 0;
		var dy = 0;
		var number = this._damage;
		
		x += Math.floor(DamagePopup.WIDTH / 2);
		
		if (number >= 1000) {
			dx = 32;
		}
		else if (number >= 100) {
			dx = 24;
		}
		else if (number >= 10) {
			dx = 16;
		}
		else {
			dx = 8;
		}
		
		dx += this._getMarginX();
		dy += this._getMarginY();
		
		for (i = 0; i < this._ballArray.length; i++) {
			this._ballArray[i].setPos(x - dx, y + dy);
			x += 16;
		}
	},
	
	_setupBallState: function() {
		var i;
		var count = this._ballArray.length;
		
		// Set the wait time so that all numbers cannot be moved at the same time.
		for (i = 0; i < count; i++) {
			this._ballArray[i].setWaitValue(i * 3);
			this._ballArray[i].setParentEffect(this);
		}
	},
	
	_drawBallBackground: function() {
		// root.getGraphicsManager().fillRange(this._x, this._y, DamagePopup.WIDTH, DamagePopup.HEIGHT, 0x0, 255);	
	},
	
	_getMarginX: function () {
		return 0;
	},
	
	_getMarginY: function () {
		return 0;
	},
	
	_createBallObject: function() {
		var obj;
		
		if (this._damage >= 0) {
			obj = createObject(DamageBall);
		}
		else {
			obj = createObject(RecoveryBall);
		}
		
		return obj;
	}
}
);

var DamageBall = defineObject(BaseObject,
{
	_volumeCounter: null,
	_maxJump: 0,
	_x: 0,
	_y: 0,
	_damage: 0,
	_isLast: false,
	_counter: null,
	_parentEffect: null,
	
	initialize: function() {
		this._volumeCounter = createObject(VolumeCounter);
		this._volumeCounter.setChangeSpeed(this._getBallSpeed());
		
		this._maxJump = this._getStartJump();
		this._changeMaxJump(this._maxJump);
	},
	
	setDamage: function(n) {
		this._damage = n;
	},
	
	setPos: function(x, y) {
		this._x = x;
		this._y = y;
	},
	
	setWaitValue: function(n) {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(n);
	},
	
	setParentEffect: function(parentEffect) {
		this._parentEffect = parentEffect;
	},
	
	moveBall: function() {
		if (this._checkWait()) {
			return MoveResult.CONTINUE;
		}
		
		if (this._isLast) {
			return MoveResult.END;
		}
		
		this._volumeCounter.moveVolumeCounter();
		if (this._volumeCounter.getRoundCount() === 2) {
			if (this._maxJump < 1) {
				this._isLast = true;
			}
			else {
				this._changeMaxJump(this._maxJump);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawBall: function(xScroll, yScroll) {
		var n = this._volumeCounter.getVolume();
		var colorIndex = this._getNumberColorIndex();
		var x = this._x - xScroll;
		var y = this._y - yScroll - n;
		var width = UIFormat.BIGNUMBER_WIDTH / 10;
		var height = UIFormat.BIGNUMBER_HEIGHT / 5;
		var xSrc = this._damage * width;
		var ySrc = height * colorIndex;
		var pic = this._getNumberUI();
		
		if (pic === null) {
			return;
		}
		
		pic.drawStretchParts(x, y, width, height, xSrc, ySrc, width, height);
	},
	
	isBallLast: function() {
		return this._isLast;
	},
	
	_changeMaxJump: function(n) {
		this._volumeCounter.setVolumeRange(n, 0, 0, true);
		this._maxJump = Math.floor(this._maxJump / 2);
	},
	
	_checkWait: function() {
		if (this._counter !== null) {
			if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
				this._counter = null;
			}
			else {
				return true;
			}
		}
		
		return false;
	},
	
	_getBallSpeed: function() {
		return 3;
	},
	
	_getStartJump: function() {
		return 16;
	},
	
	_getNumberColorIndex: function() {
		return 0;
	},
	
	_getNumberUI: function() {
		if (this._parentEffect.isCritical()) {
			return root.queryUI('criticalpopup');
		}
		
		return root.queryUI('damagepopup');
	}
}
);

var RecoveryBall = defineObject(DamageBall,
{
}
);
