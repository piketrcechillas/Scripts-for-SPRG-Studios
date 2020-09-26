
var UnitSimpleWindow = defineObject(BaseWindow,
{
	_unit: null,
	_mhp: 0,
	
	setFaceUnitData: function(unit) {
		this._unit = unit;
		this._mhp = ParamBonus.getMhp(unit);
	},
	
	moveWindowContent: function() {
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		UnitSimpleRenderer.drawContentEx(x, y, this._unit, this.getWindowTextUI(), this._mhp);
	},
	
	getWindowWidth: function() {
		return ItemRenderer.getItemWindowWidth();
	},
	
	getWindowHeight: function() {
		return DefineControl.getFaceWindowHeight();
	},
	
	getWindowXPadding: function() {
		return DefineControl.getFaceXPadding();
	},
	
	getWindowYPadding: function() {
		return DefineControl.getFaceYPadding();
	},
	
	getWindowTextUI: function() {
		return root.queryTextUI('face_window');
	},
	
	getWindowUI: function() {
		return root.queryTextUI('face_window').getUIImage();
	}
}
);

var UnitSimpleNameWindow = defineObject(BaseWindow,
{
	_unit: null,
	
	setFaceUnitData: function(unit) {
		this._unit = unit;
	},
	
	moveWindowContent: function() {
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var infoColor = ColorValue.KEYWORD;
		var width = TextRenderer.getTextWidth(StringTable.UnitSimple_Target, font) + 5;
		
		TextRenderer.drawKeywordText(x, y, StringTable.UnitSimple_Target, -1, infoColor, font);
		TextRenderer.drawKeywordText(x + width, y, this._unit.getName(), this._getLength(), color, font);
	},
	
	getWindowWidth: function() {
		return ItemRenderer.getItemWindowWidth();
	},
	
	getWindowHeight: function() {
		return 56;
	},
	
	_getLength: function() {
		return 175;
	}
}
);
