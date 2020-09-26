
var SetupControl = {
	setup: function() {
		GraphicsFormat.CHARCHIP_WIDTH = root.getCharChipWidth();
		GraphicsFormat.CHARCHIP_HEIGHT = root.getCharChipHeight();
		GraphicsFormat.ICON_WIDTH = root.getIconWidth();
		GraphicsFormat.ICON_HEIGHT = root.getIconHeight();
		GraphicsFormat.MAPCHIP_WIDTH = root.getMapChipWidth();
		GraphicsFormat.MAPCHIP_HEIGHT = root.getMapChipHeight();
		
		UIFormat.MAPCURSOR_WIDTH = GraphicsFormat.MAPCHIP_WIDTH * 2;
		UIFormat.MAPCURSOR_HEIGHT = GraphicsFormat.MAPCHIP_HEIGHT;
		UIFormat.PANEL_WIDTH = GraphicsFormat.MAPCHIP_WIDTH * 2;
		UIFormat.PANEL_HEIGHT = GraphicsFormat.MAPCHIP_HEIGHT;
		
		EventCommandManager.initSingleton();
		ParamGroup.initSingleton();
		InputControl.initSingleton();
		MouseControl.initSingleton();
		DataConfig.initSingleton();
		CustomCharChipGroup.initSingleton();
		CacheControl.clearCache();
		MapLayer.prepareMapLayer();
		MapSymbolDecorator.setupDecoration();
		MapHpDecorator.setupDecoration();
		MapIconDecorator.setupDecoration();
	},
	
	backup: function() {
	}
};

var RetryControl = {
	// It's called when retrying a game.
	// The argument is the return value of _getCustomObject.
	start: function(customObject) {
	},
	
	register: function() {
		// Save the temporary save data inside.
		// If the temporary save data exists when there is a script error, it will be loaded and restart a game.
		// If "Reload" is disabled in game.ini, this function does nothing.
		root.getLoadSaveManager().setTemporaryInterruptionData(root.getBaseScene(), root.getCurrentSession().getCurrentMapInfo().getId(), this._getCustomObject());
	},
	
	_getCustomObject: function() {
		return {};
	}
};

var EnvironmentControl = {
	isBgmOn: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(0) === 0;
	},
	
	isSeOn: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(1) === 0;
	},
	
	getBattleType: function() {
		var battleType;
		var n = root.getMetaSession().getDefaultEnvironmentValue(2);
		
		if (n === 0) {
			battleType = BattleType.REAL;
		}
		else if (n === 1) {
			battleType = BattleType.EASY;
		}
		else {
			battleType = BattleType.REAL;
		}
		
		return battleType;
	},
	
	isAutoTurnEnd: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(3) === 0;
	},
	
	getAutoTurnSkipType: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(4);
	},
	
	isMapGrid: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(5) === 0;
	},
	
	getUnitSpeedType: function() {
		var speedType;
		var n = root.getMetaSession().getDefaultEnvironmentValue(6);
		
		if (n === 0) {
			speedType = SpeedType.HIGH;
		}
		else if (n === 1) {
			speedType = SpeedType.NORMAL;
		}
		else {
			speedType = SpeedType.LOW;
		}
		
		return speedType;
	},
	
	getMessageSpeedType: function() {
		var speedType;
		var n = root.getMetaSession().getDefaultEnvironmentValue(7);
		
		if (n === 0) {
			speedType = SpeedType.HIGH;
		}
		else if (n === 1) {
			speedType = SpeedType.NORMAL;
		}
		else {
			speedType = SpeedType.LOW;
		}
		
		return speedType;
	},
	
	isMapUnitWindowDetail: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(8) === 0;
	},
	
	isLoadCommand: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(9) === 0;
	},
	
	isAutoCursor: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(10) === 0;
	},
	
	isMouseOperation: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(11) === 0;
	},
	
	isMouseCursorTracking: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(12) === 0;
	},
	
	isRealBattleScaling: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(14) === 0;
	},
	
	getScrollSpeedType: function() {
		var speedType;
		var n = root.getMetaSession().getDefaultEnvironmentValue(15);
		
		if (n === 0) {
			speedType = SpeedType.HIGH;
		}
		else if (n === 1) {
			speedType = SpeedType.NORMAL;
		}
		else {
			speedType = SpeedType.LOW;
		}
		
		return speedType;
	},
	
	isEnemyMarking: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(16) === 0;
	},
	
	getMapUnitHpType: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(17);
	},
	
	isDamagePopup: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(18) === 0;
	},
	
	isMapUnitSymbol: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(19) === 0;
	},
	
	getSkipControlType: function() {
		return root.getMetaSession().getDefaultEnvironmentValue(20);
	}
};

var DataConfig = {
	_gameOptionArray: null,
	_userOptionArray: null,
	_maxValueArray: null,
	_maxParameterArray: null,
	_battleValueArray: null,
	_criticalFactor: 0,
	_effectiveFactor: 0,
	_lowExperienceFactor: 0,
	_highExperienceFactor: 0,
	_supportRange: 0,
	_demoMapId: 0,
	_isDemoMapSoundEnabled: false,
	_voiceCategoryName: null,
	_voiceExtIndex: 0,
	
	initSingleton: function() {
		var i;
		
		this._gameOptionArray = [];
		for (i = 0; i < 8; i++) {
			this._gameOptionArray[i] = root.getConfigInfo().isGameOptionOn(i);
		}
		
		this._userOptionArray = [];
		for (i = 0; i < 26; i++) {
			this._userOptionArray[i] = root.getUserExtension().isUserOptionOn(i);
		}
		
		this._maxValueArray = [];
		for (i = 0; i < 7; i++) {
			this._maxValueArray[i] = root.getConfigInfo().getMaxValue(i);
		}
		
		this._maxParameterArray = [];
		for (i = 0; i < 11; i++) {
			this._maxParameterArray[i] = root.getConfigInfo().getMaxParameter(i);
		}
		
		this._battleValueArray = [];
		for (i = 0; i < 4; i++) {
			this._battleValueArray[i] = root.getConfigInfo().getBattleValue(i);
		}
		
		this._criticalFactor = root.getUserExtension().getCriticalFactor();
		this._effectiveFactor = root.getUserExtension().getEffectiveFactor();
		this._lowExperienceFactor = root.getUserExtension().getLowExperienceFactor();
		this._highExperienceFactor = root.getUserExtension().getHighExperienceFactor();
		this._supportRange = root.getUserExtension().getSupportRange();
		this._demoMapId = root.getUserExtension().getDemoMapId();
		this._isDemoMapSoundEnabled = root.getUserExtension().isDemoMapSoundEnabled();
		this._voiceCategoryName = root.getUserExtension().getVoiceCategoryName();
		this._voiceExtIndex = root.getUserExtension().getVoiceExtIndex();
	},
	
	isHighPerformance: function() {
		return root.isHighPerfMode();
	},
	
	isMapEdgePassable: function() {
		return this._gameOptionArray[0];
	},
	
	isBattleSetupItemUseAllowed: function() {
		return this._gameOptionArray[1];
	},
	
	isBattleSetupClassChangeAllowed: function() {
		return this._gameOptionArray[2];
	},
	
	isStockTradeWeaponTypeAllowed: function() {
		return this._gameOptionArray[3];
	},
	
	isMapVictoryDisplayable: function() {
		return this._gameOptionArray[4];
	},
	
	isItemWeightDisplayable: function() {
		return this._gameOptionArray[5];
	},
	
	isTreasureKeyEnabled: function() {
		return this._gameOptionArray[6];
	},
	
	isRuntimeDepended: function() {
		return this._gameOptionArray[7];
	},
	
	// --------------------------
	
	isMotionGraphicsEnabled: function() {
		return this._userOptionArray[0];
	},
	
	isWeaponInfinity: function() {
		return this._userOptionArray[1];
	},
	
	isGuestTradeEnabled: function() {
		return this._userOptionArray[2];
	},
	
	isFullItemTransportable: function() {
		return this._userOptionArray[3];
	},
	
	isFixedExperience: function() {
		return this._userOptionArray[4];
	},
	
	isClassLimitEnabled: function() {
		return this._userOptionArray[5];
	},
	
	isSkillInvocationBonusEnabled: function() {
		return this._userOptionArray[6];
	},
	
	isWeaponSelectSkippable: function() {
		return this._userOptionArray[7];
	},
	
	isLeaderGameOver: function() {
		return this._userOptionArray[8];
	},
	
	isWeaponLostDisplayable: function() {
		return this._userOptionArray[9];
	},
	
	isDropTrophyLinked: function() {
		return this._userOptionArray[10];
	},
	
	isAggregationVisible: function() {
		return this._userOptionArray[11];
	},
	
	isSkillAnimeEnabled: function() {
		return this._userOptionArray[12];
	},
	
	isEnemyTurnOptimized: function() {
		return this._userOptionArray[13];
	},
	
	isAllyBattleFixed: function() {
		return this._userOptionArray[14];
	},
	
	isFullDopingEnabled: function() {
		return this._userOptionArray[15];
	},
	
	isWeaponLevelDisplayable: function() {
		return this._userOptionArray[16];
	},
	
	isBuildDisplayable: function() {
		return this._userOptionArray[17];
	},
	
	isAIDamageZeroAllowed: function() {
		return this._userOptionArray[18];
	},
	
	isAIHitZeroAllowed: function() {
		return this._userOptionArray[19];
	},
	
	isTurnDamageFinishAllowed: function() {
		return this._userOptionArray[20];
	},
	
	isFullBackground: function() {
		return this._userOptionArray[21];
	},
	
	isBattleSetupRecoverable: function() {
		return this._userOptionArray[22];
	},
	
	isWaitMoveVisible: function() {
		return this._userOptionArray[23];
	},
	
	isSupportListView: function() {
		return this._userOptionArray[24];
	},
	
	isSaveScreenExtended: function() {
		return this._userOptionArray[25];
	},
	
	// --------------------------
	
	isUnitCommandMovable: function(id) {
		// It's not an index base, so don't use the array.
		return root.getUserExtension().isUnitCommandMovable(id);
	},
	
	// --------------------------
	
	getCriticalFactor: function() {
		return this._criticalFactor;
	},
	
	getEffectiveFactor: function() {
		return this._effectiveFactor;
	},
	
	getLowExperienceFactor: function() {
		return this._lowExperienceFactor;
	},
	
	getHighExperienceFactor: function() {
		return this._highExperienceFactor;
	},
	
	getSupportRange: function() {
		return this._supportRange;
	},
	
	getDemoMapId: function() {
		return this._demoMapId;
	},
	
	isDemoMapSoundEnabled: function() {
		return this._isDemoMapSoundEnabled;
	},
	
	getVoiceCategoryName: function() {
		return this._voiceCategoryName;
	},
	
	getVoiceExtIndex: function() {
		return this._voiceExtIndex;
	},
	
	getMaxGold: function() {
		return this._maxValueArray[0];
	},
	
	getMaxBonus: function() {
		return this._maxValueArray[1];
	},
	
	getMaxSkillCount: function() {
		return this._maxValueArray[2];
	},
	
	getMaxUnitItemCount: function() {
		return this._maxValueArray[3];
	},
	
	getMaxStockItemCount: function() {
		return this._maxValueArray[4];
	},
	
	getMaxAppearUnitCount: function() {
		return this._maxValueArray[5];
	},
	
	getMaxStateCount: function() {
		return 6;
	},
	
	getMaxLv: function() {
		return this._maxValueArray[6];
	},
	
	getMaxParameter: function(index) {
		return this._maxParameterArray[index];
	},
	
	getRoundDifference: function() {
		return this._battleValueArray[0];
	},
	
	getMinimumExperience: function() {
		return this._battleValueArray[1];
	},
	
	getLeaderExperience: function() {
		return this._battleValueArray[2];
	},
	
	getSubLeaderExperience: function() {
		return this._battleValueArray[3];
	},
	
	isHighResolution: function() {
		return root.getConfigInfo().getResolutionIndex() > 0;
	}
};

var ExtraControl = {
	isExtraDisplayable: function() {
		if (this.isCharacterDictionaryDisplayable()) {
			return true;
		}
		
		if (this.isWordDictionaryDisplayable()) {
			return true;
		}
		
		if (this.isGalleryDictionaryDisplayable()) {
			return true;
		}
		
		if (this.isMediaDictionaryDisplayable()) {
			return true;
		}
		
		return false;
	},
	
	isRecollectionDisplayable: function() {
		return root.getBaseData().getRecollectionEventList().getCount() > 0;
	},
	
	isCharacterDictionaryDisplayable: function() {
		return root.getBaseData().getCharacterDictionaryList().getCount() > 0;
	},
	
	isWordDictionaryDisplayable: function() {
		return root.getBaseData().getWordDictionaryList().getCount() > 0;
	},
	
	isGalleryDictionaryDisplayable: function() {
		return root.getBaseData().getGalleryDictionaryList().getCount() > 0;
	},
	
	isMediaDictionaryDisplayable: function() {
		return root.getBaseData().getMediaDictionaryList().getCount() > 0;
	}
};

var DefineControl = {
	getMaxSaveFileCount: function() {
		// The maximum value is 99.
		return 50;
	},
	
	getFaceXPadding: function() {
		return 14;
	},
	
	getFaceYPadding: function() {
		return 4;
	},
	
	getFaceWindowHeight: function() {
		return 104;
	},
	
	getWindowXPadding: function() {
		return 16;
	},
	
	getWindowYPadding: function() {
		return 16;
	},
	
	getWindowInterval: function() {
		return 0;
	},
	
	getMinDamage: function() {
		return 0;
	},
	
	getMinHitPercent: function() {
		return 0;
	},
	
	getMaxHitPercent: function() {
		return 100;
	},
	
	getBaselineExperience: function() {
		return 100;
	},
	
	getNumberSpace: function() {
		// Suppose 3 digits of number.
		return 20;
	},
	
	getNumberSpaceEx: function() {
		// Suppose 4 digits of number.
		return 30;
	},
	
	getTextPartsWidth: function() {
		return 135;
	},
	
	getTextPartsHeight: function() {
		// It's identical with value which ItemRenderer.getItemHeight returns.
		return 30;
	},
	
	getTextPartsLength: function() {
		return 9;
	},
	
	getDataNameLength: function() {
		return 9;
	},
	
	getVisibleUnitItemCount: function() {
		var count = Math.floor(root.getGameAreaHeight() / ItemRenderer.getItemHeight()) - 11;
		
		if (count > DataConfig.getMaxUnitItemCount()) {
			count = DataConfig.getMaxUnitItemCount();
		}
		
		return count;
	},
	
	getUnitMenuBottomWindowHeight: function() {
		var height = (DefineControl.getVisibleUnitItemCount() * ItemRenderer.getItemHeight()) + 74;
		
		return height;
	},
	
	getUnitMenuWindowWidth: function() {
		return 450;
	}
};

var MediaControl = {
	musicPlayNew: function(handle) {
		root.getMediaManager().musicPlay(handle, MusicPlayType.PLAYSAVE);
	},
	
	musicPlay: function(handle) {
		root.getMediaManager().musicPlay(handle, MusicPlayType.PLAY);
	},
	
	musicStop: function(musicStopType) {
		root.getMediaManager().musicStop(musicStopType, SpeedType.DIRECT);
	},
	
	soundPlay: function(handle) {
		root.getMediaManager().soundPlay(handle, 1);
	},
	
	soundDirect: function(text) {
		MediaControl.soundPlay(root.querySoundHandle(text));
	},
	
	soundStop: function() {
		root.getMediaManager().soundStop(1, false);
	},
	
	resetMusicList: function() {
		root.getMediaManager().resetMusicList();
	},
	
	resetSoundList: function() {
		root.getMediaManager().soundStop(0, true);
	},
	
	clearMusicCache: function() {
		// Call resetMusicList in advance to be silent.
		this.resetMusicList();
		
		// Release the background music data which exists in the memory.
		root.getMediaManager().clearMusicCache();
	}
};
