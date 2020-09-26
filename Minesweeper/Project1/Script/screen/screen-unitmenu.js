
var UnitMenuMode = {
	TOP: 0,
	HELP: 1
};

var UnitMenuEnum = {
	ALIVE: 0,
	SORTIE: 1,
	SINGLE: 2
};

var UnitMenuScreen = defineObject(BaseScreen,
{
	_unit: null,
	_unitEnumMode: 0,
	_unitList: null,
	_activePageIndex: 0,
	_topWindow: null,
	_bottomWindowArray: null,
	_unitSentenceWindow: null,
	_pageChanger: null,
	_dataChanger: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		this._moveAnimation();
		
		if (mode === UnitMenuMode.TOP) {
			result = this._moveTopMode();
		}
		else if (mode === UnitMenuMode.HELP) {
			result = this._moveHelpMode();
		}
		
		return result;
	},
	
	drawScreenCycle: function() {
		var x, y;
		var index = this._activePageIndex;
		var width = this._topWindow.getWindowWidth();
		var topHeight = this._topWindow.getWindowHeight();
		var bottomHeight = this._bottomWindowArray[index].getWindowHeight();
		var interval = DefineControl.getWindowInterval();
		
		if (this._isUnitSentenceVisible()) {
			x = LayoutControl.getCenterX(-1, width + this._unitSentenceWindow.getWindowWidth());
		}
		else {
			x = LayoutControl.getCenterX(-1, width);
		}
		y = LayoutControl.getCenterY(-1, topHeight + bottomHeight + interval);
		
		this._topWindow.drawWindow(x, y);
		if (this._isUnitSentenceVisible()) {
			this._unitSentenceWindow.drawWindow(x + width, y);
		}
		this._bottomWindowArray[index].drawWindow(x, y + topHeight + interval);
		
		// this._pageChanger.drawPage cannot be called after this._topWindow.drawWindow.
		// If it's done, scroll cursor is displayed over the item window.
		// For _setMenuData, by calling setDrawingMethod, the cursor is drawn before that.
	},
	
	drawScreenBottomText: function(textui) {
		var text;
		var index = this._activePageIndex;
		
		if (this._topWindow.isTracingHelp()) {
			text = this._topWindow.getHelpText();
		}
		else if (this._bottomWindowArray[index].isHelpMode() || this._bottomWindowArray[index].isTracingHelp()) {
			text = this._bottomWindowArray[index].getHelpText();
		}
		else {
			text = this._unit.getDescription();
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('UnitMenu');
	},
	
	getCurrentTarget: function() {
		return this._unit;
	},
	
	getPageChanger: function() {
		return this._pageChanger;
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._unit = screenParam.unit;
		this._unitEnumMode = screenParam.enummode;
		this._unitList = this._getUnitList(this._unit);
		this._activePageIndex = 0;
		this._topWindow = createObject(UnitMenuTopWindow);
		if (this._isUnitSentenceVisible()) {
			this._unitSentenceWindow = createObject(UnitSentenceWindow);
		}
		this._bottomWindowArray = [];
		this._pageChanger = createObject(HorizontalPageChanger);
		this._dataChanger = createObject(VerticalDataChanger);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._configureBottomWindows(this._bottomWindowArray);
		this._setMenuData();
		this._setNewTarget(this._unit);
		this._playMenuOpenSound();
		
		this._pageChanger.setPageData(this._bottomWindowArray.length, this._bottomWindowArray[0].getWindowWidth(), this._bottomWindowArray[0].getWindowHeight());
		
		this.changeCycleMode(UnitMenuMode.TOP);
	},
	
	_setMenuData: function() {
		var i, count;
		var method = function(x, y) {
			SceneManager.getLastScreen().getPageChanger().drawPage(x, y);
		};
		
		this._topWindow.setUnitMenuData();
		
		count = this._bottomWindowArray.length;
		for (i = 0; i < count; i++) {
			this._bottomWindowArray[i].setDrawingMethod(method);
			this._bottomWindowArray[i].setUnitMenuData();
		}
	},
	
	_setNewTarget: function(unit) {
		var i, count;
		
		this._unit = unit;
		
		if (this._isUnitSentenceVisible()) {
			this._unitSentenceWindow.setUnitData(unit);
		}
		
		this._topWindow.changeUnitMenuTarget(unit);
		
		count = this._bottomWindowArray.length;
		for (i = 0; i < count; i++) {
			this._bottomWindowArray[i].changeUnitMenuTarget(unit);
		}
	},
	
	_moveTopMode: function() {
		var index;
		var result = MoveResult.CONTINUE;
		
		this._pageChanger.movePage();
		
		if (this._pageChanger.checkPage()) {
			this._activePageIndex = this._pageChanger.getPageIndex();
			return result;
		}
		
		// If up/down key is pressed, the unit is switched with _changeTarget.
		if (InputControl.isSelectAction()) {
			result = this._selectAction();
		}
		else if (InputControl.isCancelAction()) {
			result = this._cancelAction();
		}
		else if (InputControl.isOptionAction()) {
			result = this._optionAction();
		}
		else {
			index = this._dataChanger.checkDataIndex(this._unitList, this._unit); 
			if (index !== -1) {
				this._setNewTarget(this._unitList.getData(index));
			}
		}
		
		return result;
	},
	
	_moveHelpMode: function() {
		if (!this._bottomWindowArray[this._activePageIndex].isHelpMode()) {
			this.changeCycleMode(UnitMenuMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAnimation: function() {
		this._topWindow.moveWindow();
		this._bottomWindowArray[this._activePageIndex].moveWindow();
		if (this._isUnitSentenceVisible()) {
			this._unitSentenceWindow.moveWindow();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_selectAction: function() {
		return this._optionAction();
	},
	
	_cancelAction: function() {
		this._playMenuCancelSound();
		return MoveResult.END;
	},
	
	_optionAction: function() {
		var result = this._bottomWindowArray[this._activePageIndex].setHelpMode();
		
		if (result) {
			this.changeCycleMode(UnitMenuMode.HELP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_getUnitList: function(unit) {
		var list = [];
		var type = unit.getUnitType();
		
		if (type === UnitType.PLAYER) {
			if (this._unitEnumMode === UnitMenuEnum.ALIVE) {
				if (unit.isGuest()) {
					// If the unit is a guest, switch it to the guest unit.
					list = root.getCurrentSession().getGuestList();
				}
				else {
					list = PlayerList.getAliveDefaultList();
				}
			}
			else if (this._unitEnumMode === UnitMenuEnum.SORTIE) {
				// If sortie ends, the guest is included in the PlayerList.
				list = PlayerList.getSortieDefaultList();
			}
			else if (this._unitEnumMode === UnitMenuEnum.SINGLE) {
				list = StructureBuilder.buildDataList();
				list.setDataArray([unit]);
			}
		}
		else if (type === UnitType.ENEMY) {
			list = EnemyList.getAliveDefaultList();
		}
		else if (type === UnitType.ALLY) {
			list = AllyList.getAliveDefaultList();
		}
		
		return list;
	},
	
	_isUnitSentenceVisible: function() {
		return true;
	},
	
	_playMenuOpenSound: function() {
		MediaControl.soundDirect('commandopen');
	},
	
	_playMenuCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	},
	
	_configureBottomWindows: function(groupArray) {
		groupArray.appendWindowObject(UnitMenuBottomWindow, this);
	}
}
);

var UnitMenuTopWindow = defineObject(BaseWindow,
{
	_unit: null,
	_mhp: 0,
	
	setUnitMenuData: function() {
	},
	
	changeUnitMenuTarget: function(unit) {
		this._unit = unit;
		this._mhp = ParamBonus.getMhp(unit);
	},
	
	moveWindowContent: function() {
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		this._drawUnitFace(x, y);
		this._drawUnitName(x, y);
		this._drawUnitClass(x, y);
		this._drawUnitLevel(x, y);
		this._drawUnitHp(x, y);
		this._drawFusionIcon(x, y);
	},
	
	getWindowWidth: function() {
		return DefineControl.getUnitMenuWindowWidth();
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
	},
	
	isTracingHelp: function() {
		var range = createRangeObject(this.xRendering + 120, this.yRendering + 50, 170, 32);
		
		return MouseControl.isHovering(range) && this._unit.getClass().getDescription() !== '';
	},
	
	getHelpText: function() {
		var text = '';
		
		if (this.isTracingHelp()) {
			text = this._unit.getClass().getDescription();
		}
		
		return text;
	},
	
	_drawUnitFace: function(xBase, yBase) {
		var alpha = 255;
		
		if (this._unit.getHp() === 0) {
			// Execute when revive.
			alpha = 128;
		}
		
		ContentRenderer.drawUnitFace(xBase, yBase, this._unit, false, alpha);
	},
	
	_drawUnitName: function(xBase, yBase) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = this._getUnitTextLength();
		var x = xBase + 130;
		var y = yBase + 15;
		
		TextRenderer.drawText(x, y, this._unit.getName(), length, color, font);
	},
	
	_drawUnitClass: function(xBase, yBase) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var length = this._getClassTextLength();
		var x = xBase + 120;
		var y = yBase + 50;
		var cls = this._unit.getClass();
		
		UnitRenderer.drawDefaultUnit(this._unit, x, y, null);
		TextRenderer.drawText(x + 45, y + 13, cls.getName(), length, color, font);
	},
	
	_drawUnitLevel: function(xBase, yBase) {
		var x = xBase + 303;
		var y = yBase + 10;
		
		ContentRenderer.drawLevelInfo(x, y, this._unit);
	},
	
	_drawUnitHp: function(xBase, yBase) {
		var x = xBase + 303;
		var y = yBase + 50;
		var pic = root.queryUI('unit_gauge');
		
		ContentRenderer.drawUnitHpZoneEx(x, y, this._unit, pic, this._mhp);
	},
	
	_drawFusionIcon: function(xBase, yBase) {
		var handle;
		var x = xBase + 102;
		var y = yBase + 11;
		
		if (FusionControl.getFusionParent(this._unit) === null) {
			return;
		}
		
		handle = FusionControl.getFusionData(this._unit).getIconResourceHandle();
		if (handle.isNullHandle()) {
			return;
		}
		
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
	},
	
	_getUnitTextLength: function() {
		return 180;
	},
	
	_getClassTextLength: function() {
		return 145;
	}
}
);

var BaseMenuBottomWindow = defineObject(BaseWindow,
{
	setUnitMenuData: function() {
	},
	
	changeUnitMenuTarget: function(unit) {
	},
	
	moveWindowContent: function() {
		return MoveResult.END;
	},
	
	drawWindowContent: function(x, y) {
	},
	
	getWindowWidth: function() {
		return DefineControl.getUnitMenuWindowWidth();
	},
	
	getWindowHeight: function() {
		return DefineControl.getUnitMenuBottomWindowHeight();
	},
	
	setHelpMode: function() {
		return false;
	},
	
	isHelpMode: function() {
		return false;
	},
	
	isTracingHelp: function() {
		return false;
	},
	
	getHelpText: function() {
		return '';
	}
}
);

var UnitMenuHelp = {
	ITEM: 0,
	SKILL: 1
};

var UnitMenuBottomWindow = defineObject(BaseMenuBottomWindow,
{
	_statusScrollbar: null,
	_unit: null,
	_unitMenuHelp: 0,
	_isTracingLocked: false,
	_skillInteraction: null,
	_itemInteraction: null,
	
	setUnitMenuData: function() {
		this._skillInteraction = createObject(SkillInteraction);
		this._itemInteraction = createObject(ItemInteraction);
		this._statusScrollbar = createScrollbarObject(UnitStatusScrollbar, this);	
	},
	
	changeUnitMenuTarget: function(unit) {
		this._unit = unit;
		this._unitMenuHelp = 0;
		
		this._itemInteraction.setData(unit);
		this._itemInteraction.setWindowTextUI(this.getWindowTextUI());
		this._setSkillData(unit);
		
		this._statusScrollbar.setStatusFromUnit(unit);
		
		this._skillInteraction.checkInitialTopic();
		this._itemInteraction.checkInitialTopic();
	},
	
	moveWindowContent: function() {
		var recentlyInput;
		
		this._itemInteraction.moveInteraction();
		this._skillInteraction.moveInteraction();
		
		if (!this.isHelpMode()) {
			return MoveResult.CONTINUE;
		}
		
		if (this._unitMenuHelp === UnitMenuHelp.ITEM) {
			recentlyInput = this._itemInteraction.getInteractionScrollbar().getRecentlyInputType();
			if (this._skillInteraction.isHelpAvailable() && (recentlyInput === InputType.LEFT || recentlyInput === InputType.RIGHT)) {
				this._itemInteraction.cancelInteraction();
				this._unitMenuHelp = UnitMenuHelp.SKILL;
				this._skillInteraction.setHelpMode();
			}
		}
		else if (this._unitMenuHelp === UnitMenuHelp.SKILL) {
			recentlyInput = this._skillInteraction.getInteractionScrollbar().getRecentlyInputType();
			if (this._itemInteraction.isHelpAvailable() && (recentlyInput === InputType.UP || recentlyInput === InputType.DOWN)) {
				this._skillInteraction.cancelInteraction();
				this._unitMenuHelp = UnitMenuHelp.ITEM;
				this._itemInteraction.setHelpMode();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowContent: function(x, y) {
		this._drawParamArea(x, y);
		this._drawItemArea(x, y);
		this._drawWeaponTypeArea(x, y);
		this._drawSkillArea(x, y);
		this._drawInfoWindow(x, y);
	},
	
	isHelpMode: function() {
		return this._itemInteraction.isHelpMode() || this._skillInteraction.isHelpMode();
	},
	
	isTracingHelp: function() {
		return this._itemInteraction.isTracingHelp() || this._skillInteraction.isTracingHelp();
	},
	
	setHelpMode: function() {
		if (this._itemInteraction.setHelpMode()) {
			this._unitMenuHelp = UnitMenuHelp.ITEM;
			return true;
		}
		
		if (this._skillInteraction.setHelpMode()) {
			this._unitMenuHelp = UnitMenuHelp.SKILL;
			return true;
		}
		
		return false;
	},
	
	getHelpText: function() {
		var text = '';
		var help = this._getActiveUnitMenuHelp();
		
		if (help === UnitMenuHelp.ITEM) {
			text = this._itemInteraction.getHelpText();
		}
		else if (help === UnitMenuHelp.SKILL) {
			text = this._skillInteraction.getHelpText();
		}
		
		return text;
	},
	
	lockTracing: function(isLocked) {
		this._isTracingLocked = isLocked;
	},
	
	_setSkillData: function(unit) {
		var i;
		var weapon = ItemControl.getEquippedWeapon(unit);
		var arr = SkillControl.getSkillMixArray(unit, weapon, -1, '');
		var count = arr.length;
		var newSkillArray = [];
		
		for (i = 0; i < count; i++) {
			if (!arr[i].skill.isHidden()) {
				newSkillArray.push(arr[i]);
			}
		}
		
		this._skillInteraction.setSkillArray(newSkillArray);
	},
	
	_drawItemArea: function(xBase, yBase) {
		this._itemInteraction.getInteractionScrollbar().drawScrollbar(xBase, yBase);
	},
	
	_drawParamArea: function(xBase, yBase) {
		var dx = 15;
		
		this._statusScrollbar.drawScrollbar(xBase + ItemRenderer.getItemWidth() + dx, yBase);
	},
	
	_drawWeaponTypeArea: function(xBase, yBase) {
		var dy = this._itemInteraction.getInteractionScrollbar().getScrollbarHeight() + 14;
		
		WeaponTypeRenderer.drawClassWeaponList(xBase, yBase + dy, this._unit.getClass());
	},
	
	_drawSkillArea: function(xBase, yBase) {
		var dy = this._itemInteraction.getInteractionScrollbar().getScrollbarHeight() + 14;
		var width = 230;
		
		this._skillInteraction.getInteractionScrollbar().drawScrollbar(xBase + width, yBase + dy);
	},
	
	_drawInfoWindow: function(xBase, yBase) {
		var x, help;
		
		if (this._isTracingLocked) {
			return;
		}
		
		help = this._getActiveUnitMenuHelp();
		
		if (help === UnitMenuHelp.SKILL) {
			this._skillInteraction.getInteractionWindow().drawWindow(xBase, yBase);
		}
		else if (help === UnitMenuHelp.ITEM) {
			x = xBase + ItemRenderer.getItemWidth();
			if (x + this._itemInteraction.getInteractionWindow().getWindowWidth() > root.getGameAreaWidth()) {
				x -= x + this._itemInteraction.getInteractionWindow().getWindowWidth() - root.getGameAreaWidth();
				x -= 8;
			}
			
			this._itemInteraction.getInteractionWindow().drawWindow(x, yBase);
		}
	},
	
	_getActiveUnitMenuHelp: function() {
		var help = -1;
		
		if (this._itemInteraction.isTracingHelp()) {
			help = UnitMenuHelp.ITEM;
		}
		else if (this._skillInteraction.isTracingHelp()) {
			help = UnitMenuHelp.SKILL;
		}
		else if (this._itemInteraction.isHelpMode()) {
			help = UnitMenuHelp.ITEM;
		}
		else if (this._skillInteraction.isHelpMode()) {
			help = UnitMenuHelp.SKILL;
		}
		
		return help;
	}
}
);

var IconItemScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		var handle = object.skill.getIconResourceHandle();
		
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	playSelectSound: function() {
	},
	
	getObjectWidth: function() {
		return 30;
	},
	
	getObjectHeight: function() {
		return GraphicsFormat.ICON_HEIGHT;
	}
}
);

var BaseInteraction = defineObject(BaseObject,
{
	_isHelpMode: false,
	_scrollbar: null,
	_window: null,
	
	moveInteraction: function() {
		var input, index;
		
		if (this._isHelpMode) {
			input = this._scrollbar.moveInput();
			if (input === ScrollbarInput.CANCEL) {
				this.cancelInteraction();
			}
			else {
				if (this._scrollbar.checkAndUpdateIndex()) {
					this._changeTopic();
				}
			}
		}
		else {
			index = this._getTracingIndex();
			if (index !== -1) {
				this._scrollbar.setIndex(index);
				this._changeTopic();
			}
		}
	
		return MoveResult.CONTINUE;
	},
	
	checkInitialTopic: function() {
		var index = MouseControl.getIndexFromMouse(this._scrollbar);
		
		if (index !== -1) {
			this._scrollbar.setIndex(index);
			this._changeTopic();
		}
		
		this._scrollbar.resetPreviousIndex();
	},
	
	cancelInteraction: function() {
		this._isHelpMode = false;
		this._scrollbar.setActive(false);
	},
	
	isInteraction: function() {
		return this.isHelpMode() || this.isTracingHelp();
	},
	
	isHelpMode: function() {
		return this._isHelpMode;
	},
	
	isTracingHelp: function() {
		return MouseControl.getIndexFromMouse(this._scrollbar) !== -1;
	},
	
	isHelpAvailable: function() {
		return this._scrollbar.getObjectCount() > 0;
	},
	
	setHelpMode: function() {
		if (!this.isHelpAvailable()) {
			return false;
		}
		
		this._isHelpMode = true;
		this._scrollbar.setActive(true);
		this._playHelpSelectSound();
		
		return true;	
	},
	
	getHelpText: function() {
		var item = this._scrollbar.getObject();
		
		return item.getDescription();
	},
	
	getInteractionScrollbar: function() {
		return this._scrollbar;
	},
	
	getInteractionWindow: function() {
		return this._window;
	},
	
	_changeTopic: function() {
	},
	
	_getTracingIndex: function() {
		return MouseControl.pointMouse(this._scrollbar);
	},
	
	_playHelpSelectSound: function() {
		MediaControl.soundDirect('commandselect');
	}
}
);

var ItemInteraction = defineObject(BaseInteraction,
{
	_textui: null,
	
	initialize: function() {
		this._scrollbar = createScrollbarObject(ItemDropListScrollbar, this);
		this._scrollbar.setScrollFormation(1, DefineControl.getVisibleUnitItemCount());
		
		this._window = createWindowObject(ItemInfoWindow, this);
	},
	
	setData: function(unit) {
		this._scrollbar.setUnitItemFormation(unit);
		this._scrollbar.resetDropMark();
	},
	
	getWindowTextUI: function() {
		return this._textui;
	},
	
	setWindowTextUI: function(textui) {
		this._textui = textui;
	},
	
	_changeTopic: function() {
		var item = this._scrollbar.getObject();
		
		this._window.setInfoItem(item);
	}
}
);

var SkillInteraction = defineObject(BaseInteraction,
{
	initialize: function() {
		this._scrollbar = createScrollbarObject(IconItemScrollbar, this);
		this._scrollbar.setScrollFormation(7, 1);
		this._window = createWindowObject(SkillInfoWindow, this);
	},
	
	setSkillArray: function(arr) {
		this._scrollbar.setObjectArray(arr);
	},
	
	getHelpText: function() {
		var skillEntry = this._scrollbar.getObject();
		
		return skillEntry.skill.getDescription();
	},
	
	_changeTopic: function() {
		var skillEntry = this._scrollbar.getObject();
		
		this._window.setSkillInfoData(skillEntry.skill, skillEntry.objecttype);
	}
}
);

var SkillInteractionLong = defineObject(SkillInteraction,
{
	initialize: function() {
		this._scrollbar = createScrollbarObject(IconItemScrollbar, this);
		this._scrollbar.setScrollFormation(7, 1);
		this._window = createWindowObject(SkillInfoWindowLong, this);
	}
}
);
