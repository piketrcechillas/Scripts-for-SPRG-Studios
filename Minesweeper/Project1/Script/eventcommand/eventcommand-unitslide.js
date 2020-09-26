
var UnitSlideEventCommand = defineObject(BaseEventCommand,
{
	_slideObject: null,
	_targetUnit: null,
	_direction: null,
	_pixelIndex: null,
	_slideType: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		return this._slideObject.moveSlide();
	},
	
	drawEventCommandCycle: function() {
		this._slideObject.drawSlide();
	},
	
	mainEventCommand: function() {
		if (this._slideType === SlideType.START) {
			this._slideObject.skipSlide();
		}
		else {
			if (this._slideType === SlideType.UPDATEEND) {
				this._slideObject.updateUnitPos();
			}
			this._slideObject.endSlide();
		}
	},
	
	_prepareEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._slideObject = createObject(SlideObject);
		this._targetUnit = eventCommandData.getTargetUnit();
		this._direction = eventCommandData.getDirectionType();
		this._pixelIndex = eventCommandData.getPixelIndex();
		this._slideType = eventCommandData.getSlideType();
		
		// If direction is not set, set direction.
		// If move direction and unit image direction are unmatched, change it with "Unit State Change" in advance.
		if (this._targetUnit !== null && this._slideType === SlideType.START && this._targetUnit.getDirection() === DirectionType.NULL) {
			this._targetUnit.setDirection(this._direction);
		}
		
		this._slideObject.setSlideData(this._targetUnit, this._direction, this._pixelIndex);
	},
	
	_checkEventCommand: function() {
		if (this._targetUnit === null) {
			return false;
		}
		
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		this._slideObject.openSlide();
		
		if (this._slideType !== SlideType.START) {
			this.mainEventCommand();
			return EnterResult.NOTENTER;
		}
		
		return EnterResult.OK;
	}
}
);

var SlideObject = defineObject(BaseObject,
{
	_targetUnit: null,
	_direction: 0,
	_interval: 0,
	_max: 0,
	_count: 0,
	
	setSlideData: function(targetUnit, direction, pixelIndex) {
		this._targetUnit = targetUnit;
		this._direction = direction;
		this._interval = pixelIndex + 1;
		this._max = this._getMaxValue();
		this._count = 0;
	},
	
	openSlide: function() {
	},
	
	moveSlide: function() {
		if (this._direction === DirectionType.NULL) {
			return MoveResult.END;
		}
		
		this._checkSlide();
		
		if (++this._count === this._max) {
			this._playMovingSound();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawSlide: function() {
	},
	
	skipSlide: function() {
		var i;
		
		for (i = this._count; i < this._max; i++) {
			this._checkSlide();
		}
	},
	
	updateUnitPos: function() {
		var x = (this._targetUnit.getMapX() * GraphicsFormat.MAPCHIP_WIDTH) + this._targetUnit.getSlideX();
		var y = (this._targetUnit.getMapY() * GraphicsFormat.MAPCHIP_HEIGHT) + this._targetUnit.getSlideY();
		
		x = Math.floor(x / GraphicsFormat.MAPCHIP_WIDTH);
		y = Math.floor(y / GraphicsFormat.MAPCHIP_HEIGHT);
		
		this._targetUnit.setMapX(x);
		this._targetUnit.setMapY(y);
	},
	
	endSlide: function() {
		this._targetUnit.setSlideX(0);
		this._targetUnit.setSlideY(0);
		this._targetUnit.setDirection(DirectionType.NULL);
	},
	
	_checkSlide: function() {
		var dx = XPoint[this._direction] * this._interval;
		var dy = YPoint[this._direction] * this._interval;
		
		this._targetUnit.setSlideX(this._targetUnit.getSlideX() + dx);
		this._targetUnit.setSlideY(this._targetUnit.getSlideY() + dy);
	},
	
	_getMaxValue: function() {
		var i, n;
		var arr = [4, 2];
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			n = Math.floor(GraphicsFormat.MAPCHIP_WIDTH % arr[i]);
			if (n === 0) {
				return Math.floor(GraphicsFormat.MAPCHIP_WIDTH / arr[i]);
			}
		}
		
		return 8;
	},
	
	_playMovingSound: function() {
		Miscellaneous.playFootstep(this._targetUnit.getClass());
	}
}
);
