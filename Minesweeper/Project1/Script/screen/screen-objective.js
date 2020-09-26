
var ObjectiveScreen = defineObject(BaseScreen,
{
	_objectiveWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		return this._objectiveWindow.moveWindow();
	},
	
	drawScreenCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._objectiveWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._objectiveWindow.getWindowHeight());
		
		this._objectiveWindow.drawWindow(x, y);
	},
	
	drawScreenBottomText: function(textui) {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		
		TextRenderer.drawScreenBottomText(mapInfo.getDescription(), textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Objective');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._objectiveWindow = createWindowObject(ObjectiveWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._objectiveWindow.setObjectiveData();
	}
}
);

var ObjectiveWindow = defineObject(BaseWindow,
{
	_scrollbarVictory: null,
	_scrollbarDefeat: null,
	_faceZone: null,
	_objectArray: null,
	
	setObjectiveData: function() {
		var text1, text2, text3, objectArray;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		
		this._scrollbarVictory = createScrollbarObject(ObjectiveScrollbar, this);
		this._scrollbarDefeat = createScrollbarObject(ObjectiveScrollbar, this);
		
		text1 = mapInfo.getVictoryCondition(0);
		text2 = mapInfo.getVictoryCondition(1);
		text3 = mapInfo.getVictoryCondition(2);
		
		objectArray = [text1, text2, text3];
		this._scrollbarVictory.setScrollFormation(1, objectArray.length);
		this._scrollbarVictory.setObjectArray(objectArray);
		
		text1 = mapInfo.getDefeatCondition(0);
		text2 = mapInfo.getDefeatCondition(1);
		text3 = mapInfo.getDefeatCondition(2);
		
		objectArray = [text1, text2, text3];
		this._scrollbarDefeat.setScrollFormation(1, objectArray.length);
		this._scrollbarDefeat.setObjectArray(objectArray);
		
		this._faceZone = createObject(ObjectiveFaceZone);
		
		this._objectArray = [];
		this._configureObjectiveParts(this._objectArray);
	},
	
	moveWindowContent: function() {
		if (InputControl.isCancelAction()) {
			this._playCancelSound();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		this._drawTop(x, y);
		this._faceZone.drawFaceZone(x, y);
		this._drawObjectiveArea(x, y);
		this._drawArea(x, y);
	},
	
	getWindowWidth: function() {
		return 560;
	},
	
	getWindowHeight: function() {
		return 340;
	},
	
	_drawObjectiveArea: function(x, y) {
		var dx = 10;
		var dy = 25;
		
		y += 150;
		
		this._drawTitle(x, y, StringTable.Objective_Victory);
		this._scrollbarVictory.drawScrollbar(x + dx, y + dy);
		
		this._drawTitle(x + 265, y, StringTable.Objective_Defeat);
		this._scrollbarDefeat.drawScrollbar(x + dx + 265, y + dy);
	},
	
	_drawTop: function(x, y) {
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var text = ChapterRenderer.getChapterText(mapInfo);
		var titleCount = 7;
		var sx = LayoutControl.getCenterX(-1, TitleRenderer.getTitlePartsWidth() * (titleCount + 2));
		
		text += '  ';
		text += mapInfo.getName();
		
		TextRenderer.drawFixedTitleText(sx, y - 48, text, color, font, TextFormat.CENTER, pic, titleCount);
	},
	
	_drawArea: function(x, y) {
		var i;
		var dx = 140;
		var count = this._objectArray.length;
		
		y += 260;
		
		x = LayoutControl.getCenterX(-1, count * dx);
		
		for (i = 0; i < count; i++) {
			this._objectArray[i].drawObjectiveParts(x, y);
			x += dx;
		}
		
	},
	
	_drawTitle: function(x, y, text) {
		var textui = this.getWindowTextUI();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, text, -1, ColorValue.KEYWORD, font);
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('objective_title');
	},
	
	_configureObjectiveParts: function(groupArray) {
		groupArray.appendObject(ObjectiveParts.Turn);
		groupArray.appendObject(ObjectiveParts.Gold);
	}
}
);

var ObjectiveScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = object;
		var length = this._getTextLength();
		
		TextRenderer.drawKeywordText(x, y, text, length, color, font);
	},
	
	getObjectWidth: function() {
		return 260;
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);

var ObjectiveFaceZone = defineObject(BaseObject,
{
	drawFaceZone: function(x, y) {
		var i, unitType, unit;
		var arr = [UnitType.PLAYER, UnitType.ENEMY, UnitType.ALLY];
		var count = arr.length;
		
		x += 15;
		y -= 10;
		
		for (i = 0; i < count; i++) {
			unitType = arr[i];
			
			unit = this._getLeaderUnit(unitType);
			if (unit !== null) {
				this._drawFaceImage(x, y, unit, unitType);
				this._drawInfo(x, y, unit, unitType);
			}
			
			x += 180;
		}
	},
	
	_drawFaceImage: function(x, y, unit, unitType) {
		var alpha = 255;
		var picFrame = root.queryUI('objectiveunit_frame');
		var xMargin = 16;
		var yMargin = 16;
		var frameWidth = Math.floor(UIFormat.FACEFRAME_WIDTH / 2);
		var frameHeight = UIFormat.FACEFRAME_HEIGHT;
		
		if (picFrame !== null) {
			picFrame.drawStretchParts(x, y, frameWidth, frameHeight, frameWidth, 0, frameWidth, frameHeight);
		}
		
		if (unit.getHp() === 0) {
			alpha = 128;
		}
		
		ContentRenderer.drawUnitFace(x + xMargin, y + yMargin, unit, false, alpha);
		
		if (picFrame !== null) {
			picFrame.drawStretchParts(x, y, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
		}
	},
	
	_drawInfo: function(x, y, unit, unitType) {
		var textui = this._getTitleTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var text = [StringTable.UnitType_Player, StringTable.UnitType_Enemy, StringTable.UnitType_Ally];
		
		y += 112;
		
		TitleRenderer.drawTitle(pic, x - 20 + 5, y - 10, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), 3);
		TextRenderer.drawText(x + 5, y + 12, text[unitType], -1, color, font);
		NumberRenderer.drawNumber(x + 100 + 5, y + 7, this._getTotalValue(unitType));
	},
	
	_getTotalValue: function(unitType) {
		var list;
		
		if (unitType === UnitType.PLAYER) {
			list = PlayerList.getSortieDefaultList();
		}
		else if (unitType === UnitType.ENEMY) {
			list = EnemyList.getAliveDefaultList();
		}
		else {
			list = AllyList.getAliveDefaultList();
		}
		
		return list.getCount();
	},
	
	_getLeaderUnit: function(unitType) {
		var i, list, count;
		var unit = null;
		var firstUnit = null;
		
		if (unitType === UnitType.PLAYER) {
			list = PlayerList.getMainList();
		}
		else if (unitType === UnitType.ENEMY) {
			list = EnemyList.getMainList();
		}
		else {
			list = AllyList.getMainList();
		}
		
		count = list.getCount();
		if (count === 0) {
			return null;
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.getSortieState() === SortieType.UNSORTIE) {
				continue;
			}
			
			if (unit.getAliveState() === AliveType.ERASE) {
				continue;
			}
			
			if (firstUnit === null) {
				firstUnit = unit;
			}
			
			if (unit.getImportance() === ImportanceType.LEADER) {
				break;
			}
		}
		
		// A leader cannot be found, so first unit to be found is a target.
		if (i === count) {
			unit = firstUnit;
		}
		
		return unit;
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('description_title');
	}
}
);

var BaseObjectiveParts = defineObject(BaseObject,
{
	drawObjectiveParts: function(x, y) {
		var text = this.getObjectivePartsName();
		var textui = this._getTitleTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		TitleRenderer.drawTitle(pic, x, y, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), 2);
		TextRenderer.drawKeywordText(x + 15, y + 14, text, -1, color, font);
		NumberRenderer.drawNumber(x + 100, y + 14, this.getObjectivePartsValue());
	},
	
	getObjectivePartsName: function() {
		return '';
	},
	
	getObjectivePartsValue: function() {
		return 0;
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('decoration_title');
	}
}
);

var ObjectiveParts = {};

ObjectiveParts.Turn = defineObject(BaseObjectiveParts,
{
	getObjectivePartsName: function() {
		return StringTable.Signal_Turn;
	},
	
	getObjectivePartsValue: function() {
		return root.getCurrentSession().getTurnCount();
	}
}
);

ObjectiveParts.Gold = defineObject(BaseObjectiveParts,
{
	getObjectivePartsName: function() {
		return StringTable.Signal_Gold;
	},
	
	getObjectivePartsValue: function() {
		return root.getMetaSession().getGold();
	}
}
);
