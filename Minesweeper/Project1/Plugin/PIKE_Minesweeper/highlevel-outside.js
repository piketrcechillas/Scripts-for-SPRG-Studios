/*--------------------------------------------------------------------------
  
  Without asking the value of "Enable to move to map edges" of the game option, invasion to the map edge is disabled.
  The empty space gets larger by disabling 2 tiles,
  so draw the turn numbers etc. at the area. It isn't shown with func.
  
  Author:
  SapphireSoft
  http://srpgstudio.com/
  
  History:
  2018/08/19 Released
  
--------------------------------------------------------------------------*/

(function() {

var outSidePartsArray = null;

function getDefaultMapBoundaryValue()
{
	return 0;
}

function setMapBoundaryValue(groupArray)
{
	groupArray.appendObject(OutSideParts.Turn);
	//groupArray.appendObject(OutSideParts.Gold);
	groupArray.appendObject(OutSideParts.Bonus);
}

function setupOutSideParts()
{
	var i;
	var count = outSidePartsArray.length;
	
	for (i = 0; i < count; i++) {
		outSidePartsArray[i].setupOutSideParts();
	}
}

function configureOutSideParts(groupArray)
{
	groupArray.appendObject(OutSideParts.Turn);
	//groupArray.appendObject(OutSideParts.Gold);
	groupArray.appendObject(OutSideParts.Bonus);
}

function isOutSidePartsVisible()
{
	return root.getBaseScene() === SceneType.FREE && SceneManager.getScreenCount() === 0;
}

var alias1 = CurrentMap._checkMapBoundaryValue;
CurrentMap._checkMapBoundaryValue = function(isEnabled) {
	outSidePartsArray = [];
	
	if (isEnabled) {
		root.getCurrentSession().setMapBoundaryValue(getDefaultMapBoundaryValue());
		configureOutSideParts(outSidePartsArray);
		setupOutSideParts();
	}
};

var alias2 = MapLayer.moveMapLayer;
MapLayer.moveMapLayer = function() {
	var i;
	var count = outSidePartsArray.length;
	
	alias2.call(this);
	
	if (!isOutSidePartsVisible()) {
		return;
	}
	
	for (i = 0; i < count; i++) {
		outSidePartsArray[i].moveOutSideParts();
	}
}; 

var alias3 = MapLayer.drawUnitLayer;
MapLayer.drawUnitLayer = function() {
	var i;
	var count = outSidePartsArray.length;
	
	alias3.call(this);
	
	if (!isOutSidePartsVisible()) {
		return;
	}
	
	for (i = 0; i < count; i++) {
		outSidePartsArray[i].drawOutSideParts();
	}
};

// The map unit window and terrain window are fixed at the bottom.

MapParts.UnitInfo._getPositionY = function() {
	var yBase = LayoutControl.getRelativeY(10) - 28;
	
	return root.getGameAreaHeight() - this._getWindowHeight() - yBase;
};

MapParts.UnitInfoSmall._getPositionY = function() {
	var yBase = LayoutControl.getRelativeY(10) - 28;
	
	return root.getGameAreaHeight() - this._getWindowHeight() - yBase;
};

MapParts.Terrain._getPositionY = function() {
	var yBase = LayoutControl.getRelativeY(10) - 28;
	
	return root.getGameAreaHeight() - this._getWindowHeight() - yBase;
};

var OutSideParts = {};

var BaseOutSideParts = defineObject(BaseObject,
{
	setupOutSideParts: function() {
	},
	
	moveOutSideParts: function() {
		return MoveResult.CONTINUE;
	},
	
	drawOutSideParts: function() {
		var text = this._getOutSidePartsName();
		var textui = this._getTitleTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var pos = this._getPos();
		var x = pos.x;
		var y = pos.y;
		
		TitleRenderer.drawTitle(pic, x, y - 26, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), this._getCount() - 2);
		TextRenderer.drawText(x + 15 + 20, y - 5, text, -1, color, font);
		NumberRenderer.drawNumber(x + 124 - 20, y - 8, this._getOutSidePartsValue());
	},
	
	_getOutSidePartsName: function() {
		return '';
	},
	
	_getOutSidePartsValue: function() {
		return 0;
	},
	
	_getPos: function() {
		return createPos(0, 0);
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('questreward_title');
	},
	
	_getWidth: function() {
		var width = TitleRenderer.getTitlePartsWidth() * this._getCount();
		
		return width + this._getSpace();
	},
	
	_getSpace: function() {
		return 70;
	},
	
	_getTotalWidth: function() {
		var width = TitleRenderer.getTitlePartsWidth() * this._getCount();
		
		return (width * outSidePartsArray.length) + (this._getSpace() * (outSidePartsArray.length - 1));
	},
	
	_getCount: function() {
		return 5;
	}
}
);

OutSideParts.Turn = defineObject(BaseOutSideParts,
{
	_getOutSidePartsName: function() {
		return "Bomb";
	},
	
	_getOutSidePartsValue: function() {
		var bomb = 0;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		if(mapInfo.custom.easy)
			bomb = 10;
		if(mapInfo.custom.medium)
			bomb = 35;
		if(mapInfo.custom.hard)
			bomb = 99;
		return bomb;
	},
	
	_getPos: function() {
		var x = root.getGameAreaWidth() - this._getTotalWidth();
		
		x = Math.floor(x / 2);
		
		return createPos(x, 10);
	}
}
);

OutSideParts.Gold = defineObject(BaseOutSideParts,
{
	_getOutSidePartsName: function() {
		return StringTable.Signal_Gold;
	},
	
	_getOutSidePartsValue: function() {
		return root.getMetaSession().getGold();
	},
	
	_getPos: function() {
		var x = root.getGameAreaWidth() - this._getTotalWidth();
		
		x = Math.floor(x / 2) + (this._getWidth() * 1);
		
		return createPos(x, 10);
	}
}
);

OutSideParts.Bonus = defineObject(BaseOutSideParts,
{
	_getOutSidePartsName: function() {
		return "Time";
	},
	
	_getOutSidePartsValue: function() {
		return root.getMetaSession().getPlayTime();
	},
	
	_getPos: function() {
		var x = root.getGameAreaWidth() - this._getTotalWidth();
		
		x = Math.floor(x / 2) + (this._getWidth() * 1);
		
		return createPos(x, 10);
	}
}
);

})();
