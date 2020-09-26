
var CustomCharChipFlag = {
	UNIT: 0x01,
	GLOBAL: 0x02
};

var CustomCharChipGroup = {
	_objectArray: null,
	
	initSingleton: function() {
		this._objectArray = [];
		this._configureCustomCharChip(this._objectArray);
	},
	
	createCustomRenderer: function(unit) {
		var i, obj;
		var count = this._objectArray.length;
		var keyword = unit.getCustomCharChipKeyword();
		
		for (i = 0; i < count; i++) {
			if (this._objectArray[i].getKeyword() === keyword) {
				obj = createObject(this._objectArray[i]);
				unit.setCustomRenderer(obj);
				break;
			}
		}
	},
	
	drawMenuUnit: function(renderer, unit, xPixel, yPixel, unitRenderParam) {
		var cpData;
		
		if (renderer !== null) {
			cpData = this.createCustomCharChipDataFromUnit(unit, xPixel, yPixel, unitRenderParam);
			renderer.drawMenuCharChip(cpData);
		}
	},
	
	createCustomCharChipDataFromUnit: function(unit, xPixel, yPixel, unitRenderParam) {
		var cpData = {};
		var terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
		
		// Constructs the same object as the object specified when the system calls drawCustomCharChip.
		cpData.xPixel = xPixel;
		cpData.yPixel = yPixel;
		cpData.unit = unit;
		cpData.cls = unit.getClass();
		cpData.terrain = terrain;
		cpData.animationIndex = unitRenderParam.animationIndex;
		cpData.direction = unitRenderParam.direction;
		cpData.alpha = unitRenderParam.alpha;
		cpData.unitType = unit.getUnitType();
		
		// Drawing is done on the menu so the wait condition is not taken into account.
		cpData.isWait = false;
		
		cpData.keyword = unit.getCustomCharChipKeyword();
		
		// The following property is set to true when drawCustomCharChip is called from the system.
		cpData.isSymbol = false;
		cpData.isHpVisible = false;
		cpData.isStateIcon = false;
		
		return cpData;
	},
	
	getFlag: function() {
		return this._objectArray.length > 0 ? CustomCharChipFlag.UNIT : 0;
	},
	
	_configureCustomCharChip: function(groupArray) {
	}
};

var BaseCustomCharChip = defineObject(BaseObject,
{
	initialize: function() {
	},
	
	// This method is called from the system right after setCustomRenderer is called. 
	setupCustomCharChip: function(unit) {
	},
	
	// This method and drawCustomCharChip are called on a regular basis when setCustomRenderer is being called on units.
	// In cases like drawing charchips as effects, this is where frames advance.
	moveCustomCharChip: function() {
		return MoveResult.CONTINUE;
	},
	
	// By default the system draws existing units on the map since there are so many.
	// However, this method is called instead of drawing by default if setCustomRenderer is called on units. 
	drawCustomCharChip: function(cpData) {
	},
	
	// This method is called when drawing on the unit menu, movement on the map, and easy battles.
	// Even if there are multiple units who have the custom renderer applied to them,
	// this method's processing cost can be tolerated to a certain extent since the menu is only opened on one unit.
	drawMenuCharChip: function(cpData) {
	},
	
	// If this method returns true, original charchips will not be drawn on the unit menu.
	isDefaultMenuUnit: function() {
		return true;
	},
	
	// This function does not need to be changed if there is no intention of using the class's "Conditional Show" to change the look of charchips.
	getKeyword: function() {
		return '';
	},
	
	_drawSymbol: function(x, y, cpData) {
		if (cpData.isSymbol) {
			root.drawCharChipSymbol(x, y, cpData.unit);
		}
	},
	
	_drawHpGauge: function(x, y, cpData) {
		if (cpData.isHpVisible) {
			root.drawCharChipHpGauge(x, y, cpData.unit);
		}
	},
	
	_drawStateIcon: function(x, y, cpData) {
		if (cpData.isStateIcon) {
			root.drawCharChipStateIcon(x, y, cpData.unit);
		}
	},
	
	_drawWaitIcon: function(x, y, cpData) {
		if (cpData.isWait) {
			GraphicsRenderer.drawImage(x, y, this._getWaitIconResourceHandle(), GraphicsType.ICON);
		}
	},
	
	_getWaitIconResourceHandle: function() {
		if (typeof this._waitResourceHandle === 'undefined') {
			this._waitResourceHandle = root.createResourceHandle(true, 10, 0, 4, 0);
		}
		
		return this._waitResourceHandle;
	}
}
);

var CustomCharChip = {};
