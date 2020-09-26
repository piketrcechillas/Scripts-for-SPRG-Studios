
var WeaponSelectMenu = defineObject(BaseWindowManager,
{
	_unit: null,
	_itemListWindow: null,
	_itemInfoWindow: null,
	
	setMenuTarget: function(unit) {
		this._unit = unit;
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this); 
		
		this._setWeaponFormation();
		this._setWeaponbar(unit);
		this._itemListWindow.setActive(true);
	},
	
	moveWindowManager: function() {
		var result = this._itemListWindow.moveWindow();
		
		if (this._itemListWindow.isIndexChanged()) {
			this._itemInfoWindow.setInfoItem(this._itemListWindow.getCurrentItem());
		}
		
		return result;
	},
	
	drawWindowManager: function() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);
		this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
	},
	
	getTotalWindowWidth: function() {
		return this._itemInfoWindow.getWindowWidth();
	},
	
	getTotalWindowHeight: function() {
		return this._itemListWindow.getWindowHeight() + this._getWindowInterval() + this._itemInfoWindow.getWindowHeight();
	},
	
	getPositionWindowX: function() {
		var width = this.getTotalWindowWidth();
		return LayoutControl.getUnitBaseX(this._unit, width);
	},
	
	getPositionWindowY: function() {
		return LayoutControl.getCenterY(-1, 340);
	},

	getWeaponCount: function() {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(this._unit);
		var weaponCount = 0;
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(this._unit, i);
			if (this._isWeaponAllowed(this._unit, item)) {
				weaponCount++;
			}
		}
		
		return weaponCount;
	},
	
	getSelectWeapon: function() {
		return this._itemListWindow.getCurrentItem();
	},
	
	_getWindowInterval: function() {
		return 10;
	},
	
	_setWeaponFormation: function() {
		var count = this.getWeaponCount();
		var visibleCount = 8;
		
		if (count > visibleCount) {
			count = visibleCount;
		}
		
		this._itemListWindow.setItemFormation(count);
	},
	
	_setWeaponbar: function(unit) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		var scrollbar = this._itemListWindow.getItemScrollbar();
		
		scrollbar.resetScrollData();
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (this._isWeaponAllowed(unit, item)) {
				scrollbar.objectSet(item);
			}
		}
		
		scrollbar.objectSetEnd();
	},
	
	_isWeaponAllowed: function(unit, item) {
		var indexArray;
		
		if (!ItemControl.isWeaponAvailable(unit, item)) {
			return false;
		}
	
		indexArray = AttackChecker.getAttackIndexArray(unit, item, true);
		
		return indexArray.length !== 0;
	}
}
);

var FusionWeaponSelectMenu = defineObject(WeaponSelectMenu,
{
	_isWeaponAllowed: function(unit, item) {
		var indexArray;
		var fusionData = FusionControl.getFusionAttackData(unit);
		
		if (!ItemControl.isWeaponAvailable(unit, item)) {
			return false;
		}
	
		indexArray = AttackChecker.getFusionAttackIndexArray(unit, item, fusionData);
		
		return indexArray.length !== 0;
	}
}
);

var WandSelectMenu = defineObject(BaseWindowManager,
{
	_unit: null,
	_itemListWindow: null,
	_itemInfoWindow: null,
	
	setMenuTarget: function(unit) {
		this._unit = unit;
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this); 
		
		this._setWandFormation();
		this._setWandbar(unit);
		this._itemListWindow.setActive(true);
	},
	
	moveWindowManager: function() {
		var result = this._itemListWindow.moveWindow();
		
		if (this._itemListWindow.isIndexChanged()) {
			this._itemInfoWindow.setInfoItem(this._itemListWindow.getCurrentItem());
		}
		
		return result;
	},
	
	drawWindowManager: function() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);
		this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
	},
	
	getTotalWindowWidth: function() {
		return this._itemInfoWindow.getWindowWidth();
	},
	
	getTotalWindowHeight: function() {
		return this._itemListWindow.getWindowHeight() + this._getWindowInterval() + this._itemInfoWindow.getWindowHeight();
	},
	
	getPositionWindowX: function() {
		var width = this.getTotalWindowWidth();
		return LayoutControl.getUnitBaseX(this._unit, width);
	},
	
	getPositionWindowY: function() {
		return LayoutControl.getCenterY(-1, 340);
	},
	
	getWandCount: function() {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(this._unit);
		var wandCount = 0;
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(this._unit, i);
			if (this._isWandAllowed(this._unit, item)) {
				wandCount++;
			}
		}
		
		return wandCount;
	},
	
	getSelectWand: function() {
		return this._itemListWindow.getCurrentItem();
	},
	
	_getWindowInterval: function() {
		return 10;
	},
	
	_setWandFormation: function() {
		var count = this.getWandCount();
		var visibleCount = 8;
		
		if (count > visibleCount) {
			count = visibleCount;
		}
		
		this._itemListWindow.setItemFormation(count);
	},
	
	_setWandbar: function(unit) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		var scrollbar = this._itemListWindow.getItemScrollbar();
		
		scrollbar.resetScrollData();
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (this._isWandAllowed(unit, item)) {
				scrollbar.objectSet(item);
			}
		}
		
		scrollbar.objectSetEnd();
	},
	
	_isWandAllowed: function(unit, item) {
		return WandChecker.isWandUsableInternal(unit, item);
	}
}
);
