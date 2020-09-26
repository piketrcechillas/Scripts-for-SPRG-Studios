
var SkillScreenMode = {
	SKILLSIDE: 0,
	OWNERSIDE: 1
};

var SkillScreen = defineObject(BaseScreen,
{
	_skillListWindow: null,
	_skillInfoWindow: null,
	_ownerListWindow: null,
	_unitSimpleWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === SkillScreenMode.SKILLSIDE) {
			result = this._moveSkillSide();
		}
		else if (mode === SkillScreenMode.OWNERSIDE) {
			result = this._moveOwnerSide();
		}
		
		this._unitSimpleWindow.moveWindow();
		
		return result;
	},
	
	drawScreenCycle: function() {
		var height = this._skillListWindow.getWindowHeight();
		var width = this._skillInfoWindow.getWindowWidth() + this._skillListWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._skillListWindow.drawWindow(x, y);
		this._ownerListWindow.drawWindow(x + this._skillListWindow.getWindowWidth(), y);
		this._skillInfoWindow.drawWindow(x + this._skillListWindow.getWindowWidth(), y + (height - this._skillInfoWindow.getWindowHeight()));
			
		this._drawOwnerTitle(x + this._skillListWindow.getWindowWidth(), y);
		
		if (this.getCycleMode() === SkillScreenMode.OWNERSIDE) {
			this._unitSimpleWindow.drawWindow(x, y + (height - this._unitSimpleWindow.getWindowHeight()));
		}
	},
	
	drawScreenBottomText: function(textui) {
		var description = '';
		var skill = this._skillInfoWindow.getSkill();
		
		if (skill !== null) {
			description = skill.getDescription();
		}
		
		TextRenderer.drawScreenBottomText(description, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('SkillList');
	},
	
	changeSkill: function(obj) {
		this._skillInfoWindow.setSkillInfoData(obj.skill, ObjectType.NULL);
		this._ownerListWindow.setOwnerArray(obj.unitArray);
	},
	
	changeUnit: function(unit) {
		this._unitSimpleWindow.setFaceUnitData(unit);
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._skillListWindow = createWindowObject(SkillListWindow, this);
		this._skillInfoWindow = createWindowObject(SkillInfoWindow, this);
		this._ownerListWindow = createWindowObject(OwnerListWindow, this);
		this._unitSimpleWindow = createWindowObject(UnitSimpleWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		var arr = this._getArray();
		
		this._skillListWindow.setWindowData();
		this._skillListWindow.setSkillArray(arr);
		
		this._skillInfoWindow.setSkillInfoData(arr[0].skill, ObjectType.NULL);
		
		this._ownerListWindow.setWindowData();
		this._ownerListWindow.setOwnerArray(arr[0].unitArray);
	},
	
	_moveSkillSide: function() {
		var input = this._skillListWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			if (this._ownerListWindow.getOwnerCount() > 0) {
				this._changeActiveWindow();
				this.changeCycleMode(SkillScreenMode.OWNERSIDE);
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = MoveResult.END;
		}
		else {
			if (this._skillListWindow.isIndexChanged()) {
				this.changeSkill(this._skillListWindow.getSkillObject());
			}
		}
		
		return result;
	},
	
	_moveOwnerSide: function() {
		var input = this._ownerListWindow.moveWindow();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.CANCEL) {
			this._changeActiveWindow();
			this.changeCycleMode(SkillScreenMode.SKILLSIDE);
		}
		else {
			if (this._ownerListWindow.isIndexChanged()) {
				this.changeUnit(this._ownerListWindow.getUnit());
			}
		}
		
		return result;
	},
	
	_drawOwnerTitle: function(x, y) {
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var text = StringTable.SkillList_Owner;
		var titleCount = 4;
		var width = this._ownerListWindow.getWindowWidth() - (TitleRenderer.getTitlePartsWidth() * (titleCount + 2));
		
		width = Math.floor(width / 2);
		TextRenderer.drawFixedTitleText(x + width, y - 38, text, color, font, TextFormat.CENTER, pic, titleCount);
	},
	
	_changeActiveWindow: function() {
		if (this.getCycleMode() === SkillScreenMode.SKILLSIDE) {
			this._ownerListWindow.setActive(true);
			this._skillListWindow.setActive(false);
		}
		else {
			this._ownerListWindow.setActive(false);
			this._skillListWindow.setActive(true);
		}
	},
	
	_getArray: function() {
		var i, skill, obj;
		var list = root.getBaseData().getSkillList();
		var count = list.getCount();
		var arr = [];
		var unitSkillArray = this._getUnitSkillArray();
		
		for (i = 0; i < count; i++) {
			skill = list.getData(i);
			if (!this._isSkillAllowed(skill)) {
				continue;
			}
			
			obj = {};
			obj.skill = skill;
			obj.unitArray = this._getUnitArray(skill, unitSkillArray);
			arr.push(obj);
		}
		
		return arr;
	},
	
	_getUnitSkillArray: function() {
		var i, count, list, unit, skillArray, obj;
		var arr = [];
		
		if (root.getCurrentScene() === SceneType.BATTLESETUP) {
			list = PlayerList.getAliveList();
		}
		else {
			list = PlayerList.getSortieList();
		}
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			skillArray = SkillControl.getSkillObjectArray(unit, ItemControl.getEquippedWeapon(unit), -1, '', this._getObjectFlag());
			
			obj = {};
			obj.unit = unit;
			obj.skillArray = skillArray;
			arr.push(obj);
		}
		
		return arr;
	},
	
	_getUnitArray: function(skill, unitSkillArray) {
		var i, j, count2;
		var count = unitSkillArray.length;
		var arr = [];
		
		for (i = 0; i < count; i++) {
			count2 = unitSkillArray[i].skillArray.length;
			for (j = 0; j < count2; j++) {
				if (unitSkillArray[i].skillArray[j].skill === skill) {
					arr.push(unitSkillArray[i].unit);
					break;
				}
			}
		}
		
		return arr;
	},
	
	_getObjectFlag: function() {
		// If only the unit skill is a target, return ObjectFlag.UNIT only.
		return ObjectFlag.UNIT | ObjectFlag.CLASS | ObjectFlag.WEAPON | ObjectFlag.ITEM | ObjectFlag.STATE | ObjectFlag.TERRAIN | ObjectFlag.FUSION;
	},
	
	_isSkillAllowed: function(skill) {
		// The blank is supposed to be a space on the data setting and not treated as a skill.
		return skill.getName() !== '';
	},
	
	_getTitleTextUI: function() {
		return root.queryTextUI('objective_title');
	}
}
);

var SkillListWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(SkillScrollbar, this);
		this._scrollbar.setActive(true);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.enablePageChange();
	},
	
	setSkillArray: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
	},
	
	setActive: function(isActive) {
		this._scrollbar.setActive(isActive);
		
		if (isActive) {
			this._scrollbar.setForceSelect(-1);
		}
		else {
			this._scrollbar.setForceSelect(this._scrollbar.getIndex());
		}
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	getListIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	getSkillObject: function() {
		return this._scrollbar.getObject();
	}
}
);

var SkillScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawIcon(x, y, object, isSelect, index);
		this._drawName(x, y, object, isSelect, index);
	},
	
	getObjectWidth: function() {
		return ItemRenderer.getItemWidth();
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_drawIcon: function(x, y, object, isSelect, index) {
		if (this._isVisible(object)) {
			GraphicsRenderer.drawImage(x, y, object.skill.getIconResourceHandle(), GraphicsType.ICON);
		}
	},
	
	_drawName: function(x, y, object, isSelect, index) {
		var name;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this._isVisible(object)) {
			name = object.skill.getName();
		}
		else {
			name = StringTable.HideData_Question;
		}
		
		x += GraphicsFormat.ICON_WIDTH + 10;
		TextRenderer.drawKeywordText(x, y, name, length, color, font);
	},
	
	_isVisible: function(object) {
		return true;
	//	return object.unitArray.length !== 0;
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);

var OwnerListWindow = defineObject(BaseWindow,
{
	_scrollbar: null,
	
	setWindowData: function() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 5);
		
		this._scrollbar = createScrollbarObject(OwnerListScrollbar, this);
		this._scrollbar.setActive(false);
		this._scrollbar.setScrollFormation(1, count);
	},
	
	setOwnerArray: function(objectArray) {
		this._scrollbar.setObjectArray(objectArray);
	},
	
	setActive: function(isActive) {
		this._scrollbar.setActive(isActive);
		if (isActive) {
			this.getParentInstance().changeUnit(this._scrollbar.getObject());
		}
	},
	
	getOwnerCount: function() {
		return this._scrollbar.getObjectCount();
	},
	
	moveWindowContent: function() {
		return this._scrollbar.moveInput();
	},
	
	drawWindowContent: function(x, y) {
		this._scrollbar.drawScrollbar(x, y);
	},
	
	getWindowWidth: function() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	},
	
	getWindowHeight: function() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	},
	
	getRecentlyInputType: function() {
		return this._scrollbar.getRecentlyInputType();
	},
	
	getListIndex: function() {
		return this._scrollbar.getIndex();
	},
	
	isIndexChanged: function() {
		return this._scrollbar.checkAndUpdateIndex();
	},
	
	getUnit: function() {
		return this._scrollbar.getObject();
	}
}
);

var OwnerListScrollbar = defineObject(BaseScrollbar,
{
	drawScrollContent: function(x, y, object, isSelect, index) {
		this._drawName(x, y, object, isSelect, index);
	},
	
	getObjectWidth: function() {
		return 240 - (this.getParentInstance().getWindowXPadding() * 2);
	},
	
	getObjectHeight: function() {
		return DefineControl.getTextPartsHeight();
	},
	
	_drawName: function(x, y, object, isSelect, index) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, object.getName(), length, color, font);
	},
	
	_getTextLength: function() {
		return this.getObjectWidth();
	}
}
);
