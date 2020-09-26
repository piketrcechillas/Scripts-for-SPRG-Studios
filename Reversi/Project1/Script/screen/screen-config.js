
var ConfigScreen = defineObject(BaseScreen,
{
	_configWindow: null,
	
	setScreenData: function(screenParam) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	},
	
	moveScreenCycle: function() {
		return this._configWindow.moveWindow();
	},
	
	drawScreenCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._configWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._configWindow.getWindowHeight());
		
		this._configWindow.drawWindow(x, y);
	},
	
	drawScreenBottomText: function(textui) {
		var object = this._configWindow.getCurrentConfigItem();
		var text = object.getConfigItemDescription();
		
		if (object === null) {
			return;
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	},
	
	getScreenInteropData: function() {
		return root.queryScreen('Config');
	},
	
	_prepareScreenMemberData: function(screenParam) {
		this._configWindow = createWindowObject(ConfigWindow, this);
	},
	
	_completeScreenMemberData: function(screenParam) {
		this._configWindow.setConfigData();
	}
}
);

var ConfigWindow = defineObject(BaseWindow,
{
	_commandArray: null,
	_scrollbar: null,
	
	setConfigData: function() {
		var object;
		
		this._prepareConfigItem();
		this._createScrollbar();
		
		object = this._scrollbar.getObject();
		object.getSubScrollbar().setActive(true);
	},
	
	moveWindowContent: function() {
		var object;
		var result = MoveResult.CONTINUE;
		
		if (InputControl.isCancelAction()) {
			this._playCancelSound();
			result = MoveResult.END;
		}
		else if (InputControl.isInputState(InputType.UP) || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			this._moveUpDown();
		}
		else if (InputControl.isInputState(InputType.DOWN) || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			this._moveUpDown();
		}
		else {
			this._checkTracingScrollbar();
			
			object = this._scrollbar.getObject();
			object.moveConfigItem();
		}
		
		this._scrollbar.getEdgeCursor().moveCursor();
		MouseControl.checkScrollbarEdgeAction(this._scrollbar);
		
		return result;
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
	
	getCurrentConfigItem: function() {
		return this._scrollbar.getObject();
	},
	
	_prepareConfigItem: function() {
		var i, count;
		
		this._commandArray = [];
		this._configureConfigItem(this._commandArray);
		
		count = this._commandArray.length;
		for (i = 0; i < count; i++) {
			this._commandArray[i].setupConfigItem();
		}
	},
	
	_createScrollbar: function() {
		var count = LayoutControl.getObjectVisibleCount(38, 10);
		
		this._scrollbar = createScrollbarObject(ConfigScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setObjectArray(this._commandArray);
		this._scrollbar.setActiveSingle(true);
	},
	
	_moveUpDown: function() {
		var object = this._scrollbar.getObject();
		
		object.getSubScrollbar().setActiveSingle(false);
		this._scrollbar.moveScrollbarCursor();
		
		object = this._scrollbar.getObject();
		object.getSubScrollbar().setActiveSingle(true);
	},
	
	_checkTracingScrollbar: function() {
		var object;
		var objectPrev = this._scrollbar.getObject();
		
		if (MouseControl.moveScrollbarMouse(this._scrollbar)) {
			objectPrev.getSubScrollbar().setActiveSingle(false);
			object = this._scrollbar.getObject();
			object.getSubScrollbar().setActiveSingle(true);
			
			MouseControl.moveScrollbarMouse(object.getSubScrollbar());
		}
	},
	
	_playCancelSound: function() {
		MediaControl.soundDirect('commandcancel');
	},
	
	_isVisible: function(commandLayoutType, commandActionType) {
		var i, commandLayout;
		var list = root.getBaseData().getCommandLayoutList(commandLayoutType);
		var count = list.getCount();
		var result = false;
		
		for (i = 0; i < count; i++) {
			commandLayout = list.getData(i);
			if (commandLayout.getCommandActionType() === commandActionType) {
				if (commandLayout.getCommandVisibleType() !== CommandVisibleType.HIDE) {
					result = true;
				}
				break;
			}
		}
		
		return result;
	},
	
	_configureConfigItem: function(groupArray) {
		groupArray.appendObject(ConfigItem.MusicPlay);
		groupArray.appendObject(ConfigItem.SoundEffect);
		if (DataConfig.getVoiceCategoryName() !== '') {
			groupArray.appendObject(ConfigItem.Voice);
		}
		if (DataConfig.isMotionGraphicsEnabled()) {
			groupArray.appendObject(ConfigItem.RealBattle);
			if (DataConfig.isHighResolution()) {
				groupArray.appendObject(ConfigItem.RealBattleScaling);
			}
		}
		groupArray.appendObject(ConfigItem.AutoCursor);
		groupArray.appendObject(ConfigItem.AutoTurnEnd);
		groupArray.appendObject(ConfigItem.AutoTurnSkip);
		groupArray.appendObject(ConfigItem.EnemyMarking);
		groupArray.appendObject(ConfigItem.MapGrid);
		groupArray.appendObject(ConfigItem.UnitSpeed);
		groupArray.appendObject(ConfigItem.MessageSpeed);
		groupArray.appendObject(ConfigItem.ScrollSpeed);
		groupArray.appendObject(ConfigItem.UnitMenuStatus);
		groupArray.appendObject(ConfigItem.MapUnitHpVisible);
		groupArray.appendObject(ConfigItem.MapUnitSymbol);
		groupArray.appendObject(ConfigItem.DamagePopup);
		if (this._isVisible(CommandLayoutType.MAPCOMMAND, CommandActionType.LOAD)) {
			groupArray.appendObject(ConfigItem.LoadCommand);
		}
		groupArray.appendObject(ConfigItem.SkipControl);
		groupArray.appendObject(ConfigItem.MouseOperation);
		groupArray.appendObject(ConfigItem.MouseCursorTracking);
	}
}
);

var ConfigScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		object.drawConfigItem(x, y, index === this.getIndex());
	},
	
	drawCursor: function(x, y, isActive) {
		// Override the method to disable a normal cursor draw.
	},
	
	getObjectWidth: function() {
		return 500 + HorizontalLayout.OBJECT_WIDTH;
	},
	
	getObjectHeight: function() {
		return 38;
	}
}
);

var ConfigTextScrollbar = defineObject(BaseScrollbar,
{	
	drawScrollContent: function(x, y, object, isSelect, index) {
		var range;
		var length = -1;
		var textui = root.queryTextUI('default_window');
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this.getParentInstance().getFlagValue() === index) {
			color = ColorValue.KEYWORD;
		}
		else {
			color = ColorValue.DISABLE;
		}
		
		range = createRangeObject(x, y, this.getObjectWidth(), this.getObjectHeight());
		TextRenderer.drawRangeText(range, TextFormat.CENTER, object, length, color, font);
	},
	
	drawDescriptionLine: function(x, y) {
	},
	
	getObjectWidth: function() {
		return 52 + HorizontalLayout.OBJECT_SPACE;
	},
	
	getObjectHeight: function() {
		return 38;
	}
}
);

var BaseConfigtItem = defineObject(BaseObject,
{
	_scrollbar: null,
	
	setupConfigItem: function() {
		this._scrollbar = createScrollbarObject(ConfigTextScrollbar, this);
		this._scrollbar.setScrollFormation(this.getFlagCount(), 1);
		this._scrollbar.setObjectArray(this.getObjectArray());
	},
	
	moveConfigItem: function() {
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			this.selectFlag(this._scrollbar.getIndex());
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawConfigItem: function(x, y, isActive) {
		this.drawLeft(x, y, isActive);
		this.drawRight(x, y, isActive);	
	},
	
	selectFlag: function(index) {
	},
	
	getFlagCount: function() {
		return 2;
	},
	
	getFlagValue: function() {
		return 0;
	},
	
	getConfigItemTitle: function() {
		return '';
	},
	
	getConfigItemDescription: function() {
		return '';
	},
	
	drawLeft: function(x, y, isActive) {
		var textui = this.getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		y -= 7;
		TextRenderer.drawFixedTitleText(x, y, this.getConfigItemTitle(), color, font, TextFormat.LEFT, pic, this.getTitlePartsCount());
	},
	
	drawRight: function(x, y, isActive) {
		this._scrollbar.drawScrollbar(x + this.getLeftWidth() - 16, y);
	},
	
	getTextUI: function() {
		return root.queryTextUI('configitem_title');
	},
	
	getLeftWidth: function() {
		return (this.getTitlePartsCount() + 2) * TitleRenderer.getTitlePartsWidth() + 28;
	},
	
	getTitlePartsCount: function() {
		return 6;
	},
	
	getObjectArray: function() {
		return [StringTable.Select_On, StringTable.Select_Off];
	},
	
	getSubScrollbar: function() {
		return this._scrollbar;
	}
}
);

var ConfigItem = {};

// Count from the left in order, 0(on), 1(off).

ConfigItem.MusicPlay = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		var arr = this.getVolumeArray();
		
		root.getMetaSession().setDefaultEnvironmentValue(0, index);
		
		root.getMediaManager().setMusicVolume(arr[index]);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(0);
	},
	
	getFlagCount: function() {
		return 5;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_MusicPlay;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_MusicPlayDescription;
	},
	
	getObjectArray: function() {
		return ['100%', '75%', '50%', '25%', '0%'];
	},
	
	getVolumeArray: function() {
		return [100, 75, 50, 25, 0];
	}
}
);

ConfigItem.SoundEffect = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		var arr = this.getVolumeArray();
		
		root.getMetaSession().setDefaultEnvironmentValue(1, index);
		
		root.getMediaManager().setSoundVolume(arr[index]);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(1);
	},
	
	getFlagCount: function() {
		return 5;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_SoundEffect;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_SoundEffectDescription;
	},
	
	getObjectArray: function() {
		return ['100%', '75%', '50%', '25%', '0%'];
	},
	
	getVolumeArray: function() {
		return [100, 75, 50, 25, 0];
	}
}
);

ConfigItem.RealBattle = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(2, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(2);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_RealBattle;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_RealBattleDescription;
	}
}
);

ConfigItem.AutoTurnEnd = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(3, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(3);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_AutoTurnEnd;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_AutoTurnEndDescription;
	}
}
);

ConfigItem.AutoTurnSkip = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(4, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(4);
	},
	
	getFlagCount: function() {
		return 3;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_AutoTurnSkip;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_AutoTurnSkipDescription;
	},
	
	getObjectArray: function() {
		return [StringTable.AutoTurnSkip_Direct, StringTable.AutoTurnSkip_Quick, StringTable.AutoTurnSkip_None];
	}
}
);

ConfigItem.MapGrid = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(5, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(5);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_MapGrid;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_MapGridDescription;
	}
}
);

ConfigItem.UnitSpeed = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(6, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(6);
	},
	
	getFlagCount: function() {
		return 3;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_UnitSpeed;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_UnitSpeedDescription;
	},
	
	getObjectArray: function() {
		return [StringTable.Speed_High, StringTable.Speed_Normal, StringTable.Speed_Low];
	}
}
);

ConfigItem.MessageSpeed = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(7, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(7);
	},
	
	getFlagCount: function() {
		return 3;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_MessageSpeed;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_MessageSpeedDescription;
	},

	getObjectArray: function() {
		return [StringTable.Speed_High, StringTable.Speed_Normal, StringTable.Speed_Low];
	}
}
);

ConfigItem.UnitMenuStatus = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(8, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(8);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_MapUnitWindow;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_MapUnitWindowDescription;
	}
}
);

ConfigItem.LoadCommand = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(9, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(9);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_LoadCommand;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_LoadCommandDescription;
	}
}
);

ConfigItem.AutoCursor = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(10, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(10);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_AutoCursor;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_AutoCursorDescription;
	}
}
);

ConfigItem.MouseOperation = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(11, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(11);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_MouseOperation;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_MouseOperationDescription;
	}
}
);

ConfigItem.MouseCursorTracking = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(12, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(12);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_MouseCursorTracking;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_MouseCursorTrackingDescription;
	}
}
);

ConfigItem.Voice = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		var arr = [100, 75, 50, 25, 0];
		
		root.getMetaSession().setDefaultEnvironmentValue(13, index);
		
		root.getMediaManager().setVoiceVolume(arr[index]);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(13);
	},
	
	getFlagCount: function() {
		return 5;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_Voice;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_VoiceDescription;
	},
	
	getObjectArray: function() {
		return ['100%', '75%', '50%', '25%', '0%'];
	},
	
	getVolumeArray: function() {
		return [100, 75, 50, 25, 0];
	}
}
);

ConfigItem.RealBattleScaling = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(14, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(14);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_RealBattleScaling;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_RealBattleScalingDescription;
	}
}
);

ConfigItem.ScrollSpeed = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(15, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(15);
	},
	
	getFlagCount: function() {
		return 3;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_ScrollSpeed;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_ScrollSpeedDescription;
	},

	getObjectArray: function() {
		return [StringTable.Speed_High, StringTable.Speed_Normal, StringTable.Speed_Low];
	}
}
);

ConfigItem.EnemyMarking = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(16, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(16);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_EnemyMarking;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_EnemyMarkingDescription;
	}
}
);

ConfigItem.MapUnitHpVisible = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(17, index);
		MapHpDecorator.setupDecoration();
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(17);
	},
	
	getFlagCount: function() {
		return 3;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_MapUnitHpVisible;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_MapUnitHpVisibleDescription;
	},

	getObjectArray: function() {
		return [StringTable.MapUnitHp_Number, StringTable.MapUnitHp_Gauge, StringTable.MapUnitHp_None];
	}
}
);

ConfigItem.DamagePopup = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(18, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(18);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_DamagePopup;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_DamagePopupDescription;
	}
}
);

ConfigItem.MapUnitSymbol = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(19, index);
		MapSymbolDecorator.setupDecoration();
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(19);
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_MapUnitSymbol;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_MapUnitSymbolDescription;
	}
}
);

ConfigItem.SkipControl = defineObject(BaseConfigtItem,
{
	selectFlag: function(index) {
		root.getMetaSession().setDefaultEnvironmentValue(20, index);
	},
	
	getFlagValue: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(20);
	},
	
	getFlagCount: function() {
		return 3;
	},
	
	getConfigItemTitle: function() {
		return StringTable.Config_SkipControl;
	},
	
	getConfigItemDescription: function() {
		return StringTable.Config_SkipControlDescription;
	},

	getObjectArray: function() {
		return [StringTable.SkipControl_AllInput, StringTable.SkipControl_Mouse, StringTable.SkipControl_None];
	}
}
);

var ConfigVolumeControl = {	
	setDefaultVolume: function() {
		var i, obj, volume, tilte;
		var groupArray = [];
		
		this._configureConfigItem(groupArray);
		
		for (i = 0; i < groupArray.length; i++) {
			obj = groupArray[i];
			volume = this._getVolume(obj);
			tilte = obj.getConfigItemTitle();
			
			if (tilte === StringTable.Config_MusicPlay) {
				root.getMediaManager().setMusicVolume(volume);
			}
			else if (tilte === StringTable.Config_SoundEffect) {
				root.getMediaManager().setSoundVolume(volume);
			}
			else if (tilte === StringTable.Config_Voice) {
				root.getMediaManager().setVoiceVolume(volume);
			}
		}
	},
	
	_getVolume: function(obj) {
		var arr = obj.getVolumeArray();
		var index = obj.getFlagValue();
		
		return arr[index];
	},
	
	_configureConfigItem: function(groupArray) {
		groupArray.appendObject(ConfigItem.MusicPlay);
		groupArray.appendObject(ConfigItem.SoundEffect);
		if (DataConfig.getVoiceCategoryName() !== '') {
			groupArray.appendObject(ConfigItem.Voice);
		}
	}
};
