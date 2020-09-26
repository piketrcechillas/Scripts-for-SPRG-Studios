
var CommandMixer = defineObject(BaseObject,
{
	_arr: null,
	
	initialize: function() {
		this._arr = [];
	},
	
	pushCommand: function(command, type) {
		var obj = {};
		
		obj.command = command;
		obj.type = type;
		this._arr.push(obj);
	},
	
	mixCommand: function(index, groupArray, baseObject) {
		var i, commandLayout, isShared, obj;
		var screenLauncher = null;
		var list = root.getBaseData().getCommandLayoutList(index);
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			commandLayout = list.getData(i);
			if (!this._isVisible(commandLayout)) {
				continue;
			}
			
			isShared = false;
			
			obj = this._getObjectFromActionType(commandLayout.getCommandActionType());
			if (obj === null) {
				obj = this._inheritBaseObject(baseObject);
				isShared = true;
			}
			
			if (obj === null) {
				continue;
			}
			
			if (isShared) {
				screenLauncher = this._getScreenLauncher(commandLayout);
				if (screenLauncher === null) {
					continue;
				}
			}
			
			if (commandLayout.getCommandActionType() === CommandActionType.SHOPLIST) {
				this._pushShop(groupArray, commandLayout, obj, true);
			}
			else if (commandLayout.getCommandActionType() === CommandActionType.SHOP) {
				this._pushShop(groupArray, commandLayout, obj, false);
			}
			else if (commandLayout.getCommandActionType() === CommandActionType.BONUS) {
				this._pushBonus(groupArray, commandLayout, obj);
			}
			else {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				if (isShared) {
					groupArray[groupArray.length - 1].setScreenLauncher(screenLauncher);
				}
			}
			
		}
	},
	
	_pushShop: function(groupArray, commandLayout, obj, isList) {
		var i, count, list, shopData;
		
		if (isList && root.getRestPreference().isShopListView()) {
			if (root.getBaseData().getRestShopList().getCount() > 1) {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				groupArray[groupArray.length - 1].setScreenLauncher(ShopListScreenLauncher);
				return;
			}
		}
		
		if (isList) {
			list = root.getBaseData().getRestShopList();
		}
		else {
			list = root.getCurrentSession().getCurrentMapInfo().getShopDataList();
		}
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			shopData = list.getData(i);
			if (shopData.isShopDisplayable() && shopData.getShopItemArray().length > 0) {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				groupArray[groupArray.length - 1].setScreenLauncher(this._getScreenLauncher(commandLayout));
				groupArray[groupArray.length - 1].getScreenLauncher().setShopData(shopData);
			}
		}
	},
	
	_pushBonus: function(groupArray, commandLayout, obj) {
		var i, count, list, shopData;
		
		if (root.getRestPreference().isBonusListView()) {
			if (root.getBaseData().getRestBonusList().getCount() > 1) {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				groupArray[groupArray.length - 1].setScreenLauncher(BonusListScreenLauncher);
				return;
			}
		}
		
		list = root.getBaseData().getRestBonusList();
		count = list.getCount();
		for (i = 0; i < count; i++) {
			shopData = list.getData(i);
			if (shopData.isShopDisplayable() && shopData.getShopItemArray().length > 0) {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				groupArray[groupArray.length - 1].setScreenLauncher(this._getScreenLauncher(commandLayout));
				groupArray[groupArray.length - 1].getScreenLauncher().setShopData(shopData);
			}
		}
	},
	
	_getObjectFromActionType: function(commandActionType) {
		var i;
		var obj = null;
		var count = this._arr.length;
		
		for (i = 0; i < count; i++) {
			if (this._arr[i].type === commandActionType) {
				obj = this._arr[i].command;
				break;
			}
		}
		
		return obj;
	},
	
	_isVisible: function(commandLayout) {
		var commandVisibleType = commandLayout.getCommandVisibleType();
		
		if (commandVisibleType === CommandVisibleType.SHOW) {
			return true;
		}
		else if (commandVisibleType === CommandVisibleType.SWITCH && commandLayout.isGlobalSwitchOn()) {
			return true;
		}
		else if (commandVisibleType === CommandVisibleType.TESTPLAY && root.isTestPlay()) {
			return true;
		}
		
		return false;
	},
	
	_getScreenLauncher: function(commandLayout) {
		var screenLauncher = null;
		var commandActionType = commandLayout.getCommandActionType();
		
		if (commandActionType === CommandActionType.CONFIG) {
			screenLauncher = ConfigScreenLauncher;
		}
		else if (commandActionType === CommandActionType.EXTRA) {
			screenLauncher = ExtraScreenLauncher;
		}
		else if (commandActionType === CommandActionType.RECOLLECTION) {
			screenLauncher = RecollectionScreenLauncher;
		}
		else if (commandActionType === CommandActionType.CHARACTER) {
			screenLauncher = CharacterScreenLauncher;
		}
		else if (commandActionType === CommandActionType.WORD) {
			screenLauncher = WordScreenLauncher;
		}
		else if (commandActionType === CommandActionType.GALLERY) {
			screenLauncher = GalleryScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SOUNDROOM) {
			screenLauncher = SoundRoomScreenLauncher;
		}
		
		else if (commandActionType === CommandActionType.SHOP) {
			screenLauncher = ShopScreenLauncher;
		}
		else if (commandActionType === CommandActionType.BONUS) {
			screenLauncher = BonusScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SWITCH) {
			screenLauncher = SwitchScreenLauncher;
		}
		else if (commandActionType === CommandActionType.VARIABLE) {
			screenLauncher = VariableScreenLauncher;
		}
		else if (commandActionType === CommandActionType.LOAD) {
			screenLauncher = LoadScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SAVE) {
			screenLauncher = SaveScreenLauncher;
		}
		else if (commandActionType === CommandActionType.COMMUNICATION) {
			screenLauncher = CommunicationScreenLauncher;
		}
		else if (commandActionType === CommandActionType.OBJECTIVE) {
			screenLauncher = ObjectiveScreenLauncher;
		}
		else if (commandActionType === CommandActionType.TALKCHECK) {
			screenLauncher = TalkCheckScreenLauncher;
		}
		else if (commandActionType === CommandActionType.UNITSUMMARY) {
			screenLauncher = UnitSummaryScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SKILL) {
			screenLauncher = SkillScreenLauncher;
		}
		else if (commandActionType === CommandActionType.UNITMARSHAL) {
			screenLauncher = UnitMarshalScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SHOPLIST) {
			// It's not a ShopListScreenLauncher.
			screenLauncher = ShopScreenLauncher;
		}
		else if (commandActionType === CommandActionType.EXPERIENCEDISTRIBUTION) {
			screenLauncher = ExperienceDistributionScreenLauncher;
		}
		
		if (screenLauncher === null) {
			return null;
		}
		
		return screenLauncher.isLaunchable() ? screenLauncher : null;
	},
	
	_inheritBaseObject: function(baseObject) {
		var definition = {
			_screenLauncher: null,
			
			openCommand: function() {
				this._screenLauncher.openScreenLauncher();
			},
			
			moveCommand: function() {
				var result = this._screenLauncher.moveScreenLauncher();
				
				if (result !== MoveResult.CONTINUE) {
					if (this._screenLauncher.isRebuild()) {
						this._listCommandManager.rebuildCommandEx();
					}
				}
				
				return result;
			},
			
			setScreenLauncher: function(screenLauncher) {
				this._screenLauncher = createObject(screenLauncher);
			},
			
			getScreenLauncher: function() {
				return this._screenLauncher;
			},
			
			getCommandName: function() {
				var name = this._screenLauncher.getCommandName();
				
				// If ScreenLauncher doesn't define a name,
				// use the name which was set with Command Layout.
				if (name === '') {
					return BaseCommand.getCommandName.call(this);
				}
				
				return name;
			}
		};
		
		return defineObject(baseObject, definition);
	}
}
);

var BaseScreenLauncher = defineObject(BaseObject,
{
	_screen: null,
	
	openScreenLauncher: function() {
		var screenParam = this._createScreenParam();
		
		this._screen = createObject(this._getScreenObject());
		SceneManager.addScreen(this._screen, screenParam);
	},
	
	moveScreenLauncher: function() {
		if (SceneManager.isScreenClosed(this._screen)) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	isLaunchable: function() {
		return true;
	},
	
	isRebuild: function() {
		return false;
	},
	
	getCommandName: function() {
		return '';
	},
	
	_createScreenParam: function() {
		return {};
	},
	
	_getScreenObject: function() {
		return null;
	},
	
	_doEndAction: function() {
	}	
}
);

var ConfigScreenLauncher = defineObject(BaseScreenLauncher,
{
	_getScreenObject: function() {
		return ConfigScreen;
	},
	
	_doEndAction: function() {
		var playerTurnObject;
		
		if (typeof SceneManager.getActiveScene().getTurnObject !== 'undefined') {
			playerTurnObject = SceneManager.getActiveScene().getTurnObject();
			// If MapParts doesn't define a name, use the name which was set with Command Layout.
			playerTurnObject.getMapEdit().rebuildMapPartsCollection();
			
			if (!EnvironmentControl.isEnemyMarking()) {
				MapLayer.getMarkingPanel().resetMarkingPanel();
			}
		}
	}
}
);

var ExtraScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return ExtraControl.isExtraDisplayable();
	},
	
	_getScreenObject: function() {
		return ExtraScreen;
	}
}
);

var RecollectionScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return ExtraControl.isRecollectionDisplayable();
	},
	
	_getScreenObject: function() {
		return DataConfig.isSupportListView() ? SupportScreen : RecollectionScreen;
	}
}
);

var CharacterScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return ExtraControl.isCharacterDictionaryDisplayable();
	},
	
	_getScreenObject: function() {
		return CharacterScreen;
	}
}
);

var WordScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return ExtraControl.isWordDictionaryDisplayable();
	},
	
	_getScreenObject: function() {
		return WordScreen;
	}
}
);

var GalleryScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return ExtraControl.isGalleryDictionaryDisplayable();
	},
	
	_getScreenObject: function() {
		return GalleryScreen;
	}
}
);

var SoundRoomScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return ExtraControl.isMediaDictionaryDisplayable();
	},
	
	_getScreenObject: function() {
		return SoundRoomScreen;
	}
}
);

var SwitchScreenLauncher = defineObject(BaseScreenLauncher,
{
	isRebuild: function() {
		return true;
	},
	
	_getScreenObject: function() {
		return SwitchScreen;
	}
}
);

var ShopListScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return root.getBaseData().getRestShopList().getCount() > 0;
	},
	
	_getScreenObject: function() {
		return ShopListScreen;
	}
}
);

var BonusListScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return root.getBaseData().getRestBonusList().getCount() > 0;
	},
	
	_getScreenObject: function() {
		return BonusListScreen;
	}
}
);

var ShopScreenLauncher = defineObject(BaseScreenLauncher,
{
	_shopData: null,
	
	openScreenLauncher: function() {
		var screenParam = this._createScreenParam();
		
		this._screen = createObject(ShopLayoutScreen);
		this._screen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._screen, screenParam);
	},
	
	getCommandName: function() {
		return this._shopData.getName();
	},
	
	setShopData: function(shopData) {
		this._shopData = shopData;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildShopLayout();
		var shopData = this._shopData;
		
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		
		return screenParam;
	}
}
);

var BonusScreenLauncher = defineObject(BaseScreenLauncher,
{
	_shopData: null,
	
	openScreenLauncher: function() {
		var screenParam = this._createScreenParam();
		
		this._screen = createObject(BonusLayoutScreen);
		this._screen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._screen, screenParam);
	},
	
	getCommandName: function() {
		return this._shopData.getName();
	},
	
	setShopData: function(shopData) {
		this._shopData = shopData;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildShopLayout();
		var shopData = this._shopData;
		
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		screenParam.bonusArray = shopData.getBonusNumberArray();
		
		return screenParam;
	}
}
);

var VariableScreenLauncher = defineObject(BaseScreenLauncher,
{
	_getScreenObject: function() {
		return VariableScreen;
	}
}
);

var LoadScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		if (root.getCurrentScene() === SceneType.FREE) {
			return EnvironmentControl.isLoadCommand();
		}
		
		return true;
	},
	
	_getScreenObject: function() {
		return LoadSaveControl.getLoadScreenObject();
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildLoadSave();
		
		screenParam.isLoad = true;
		
		return screenParam;
	}
}
);

var SaveScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		if (root.getCurrentScene() === SceneType.FREE) {
			return !SceneManager.getActiveScene().getTurnObject().isPlayerActioned();
		}
		
		return true;
	},
	
	_getScreenObject: function() {
		return LoadSaveControl.getSaveScreenObject();
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildLoadSave();
		
		screenParam.isLoad = false;
		screenParam.scene = root.getBaseScene();
		if (screenParam.scene === SceneType.REST) {
			screenParam.mapId = root.getSceneController().getNextMapId();
		}
		else {
			screenParam.mapId = root.getCurrentSession().getCurrentMapInfo().getId();
		}
		
		return screenParam;
	}
}
);

var CommunicationScreenLauncher = defineObject(BaseScreenLauncher,
{
	isRebuild: function() {
		return true;
	},
	
	_getScreenObject: function() {
		return CommunicationScreen;
	}
}
);

var ObjectiveScreenLauncher = defineObject(BaseScreenLauncher,
{
	_getScreenObject: function() {
		return ObjectiveScreen;
	}
}
);

var TalkCheckScreenLauncher = defineObject(BaseScreenLauncher,
{
	_getScreenObject: function() {
		return TalkCheckScreen;
	}
}
);

var UnitSummaryScreenLauncher = defineObject(BaseScreenLauncher,
{
	_getScreenObject: function() {
		return UnitSummaryScreen;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildUnitSummary();
		
		screenParam.isMapCall = root.getBaseScene() !== SceneType.REST;
		
		return screenParam;
	}
}
);

var SkillScreenLauncher = defineObject(BaseScreenLauncher,
{
	_getScreenObject: function() {
		return SkillScreen;
	}
}
);

var UnitMarshalScreenLauncher = defineObject(BaseScreenLauncher,
{
	isLaunchable: function() {
		return PlayerList.getMainList().getCount() > 0;
	},
	
	_getScreenObject: function() {
		return MarshalScreen;
	}
}
);

var ExperienceDistributionScreenLauncher = defineObject(BaseScreenLauncher,
{
	_getScreenObject: function() {
		return ExperienceDistributionScreen;
	}
}
);
