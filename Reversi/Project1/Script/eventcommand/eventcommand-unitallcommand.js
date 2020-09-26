
var UnitAllCommandEventCommand = defineObject(BaseEventCommand,
{
	_index: 0,
	_unitArray: null,
	_straightFlow: null,
	_isSkip: false,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (InputControl.isStartAction() || this.isSystemSkipMode()) {
			this._isSkip = true;
		}
		
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._index++;
			if (!this._checkFlow()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		this._straightFlow.drawStraightFlow();
	},
	
	mainEventCommand: function() {
	},
	
	isEventCommandSkipAllowed: function() {
		// "Reduce Hp" and "Increase Item" etc. can disable the skip, return false.
		return false;
	},
	
	getTargetUnit: function() {
		return this._unitArray[this._index];
	},
	
	getUnitArray: function() {
		return this._unitArray;
	},
	
	getUnitIndex: function() {
		return this._index;
	},
	
	isAllCommandSkip: function() {
		return this._isSkip;
	},
	
	_prepareEventCommandMemberData: function() {
		this._index = 0;
		this._unitArray = [];
		this._straightFlow = createObject(StraightFlow);
		this._isSkip = this.isSystemSkipMode();
	},
	
	_checkEventCommand: function() {
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._straightFlow.setStraightFlowData(this);
		
		if (eventCommandData.getAnimePlayType() === AnimePlayType.SYNC || eventCommandData.getAnime() === null) {
			this._pushFlowEntriesSync(this._straightFlow);
		}
		else {
			this._pushFlowEntriesAsync(this._straightFlow);
		}
		
		if (eventCommandData.getRangeType() === SelectionRangeType.ALL) {
			this._setUnitArray();
		}
		else {
			this._setPosUnitArray();
		}
		
		return this._checkFlow() ? EnterResult.OK : EnterResult.NOTENTER;
	},
	
	_checkFlow: function() {
		var i;
		var count = this._unitArray.length;
		
		for (i = this._index; i < count; i++) {
			this._straightFlow.resetStraightFlow();
			if (this._straightFlow.enterStraightFlow() === EnterResult.OK) {
				return true; 
			}
			
			this._index++;
		}
		
		return false;
	},
	
	_setUnitArray: function() {
		var i, j, count, list, targetUnit;
		var eventCommandData = root.getEventCommandObject();
		var filter = eventCommandData.getFilterFlag();
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				if (!eventCommandData.isDataCondition(targetUnit)) {
					continue;
				}
				
				this._unitArray.push(targetUnit);
			}
		}
	},
	
	_setPosUnitArray: function() {
		var i, index, x, y, targetUnit, filter;
		var eventCommandData = root.getEventCommandObject();
		var pos = this._getFocusPos();
		var indexArray = IndexArray.getBestIndexArray(pos.x, pos.y, 0, eventCommandData.getRangeValue());
		var count = indexArray.length;
		var baseFilter = eventCommandData.getFilterFlag();
		var commandtype = eventCommandData.getSubEventCommandType();
		var session = root.getCurrentSession();
			
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			if (commandtype === EventCommandType.UNITSTATECHANGE) {
				// Include the current non visible unit so as to enable the non visible state.
				targetUnit = session.getUnitFromPosEx(x, y);
			}
			else {
				targetUnit = session.getUnitFromPos(x, y);
			}
			if (targetUnit !== null && eventCommandData.isDataCondition(targetUnit)) {
				filter = FilterControl.getNormalFilter(targetUnit.getUnitType());
				if (filter & baseFilter) {
					this._unitArray.push(targetUnit);
				}
			}
		}
	},
	
	_getFocusPos: function() {
		var x, y, unit;
		var eventCommandData = root.getEventCommandObject();
		
		if (eventCommandData.isPosBase()) {
			x = eventCommandData.getX();
			y = eventCommandData.getY();
		}
		else {
			unit = eventCommandData.getTargetUnit();
			if (unit !== null) {
				x = unit.getMapX();
				y = unit.getMapY();
			}
			else {
				x = -1;
				y = -1;
			}
		}
		
		return createPos(x, y);
	},
	
	_pushFlowEntriesSync: function(straightFlow) {
		straightFlow.pushFlowEntry(AllScrollFlowEntry);
		straightFlow.pushFlowEntry(AllSyncAnimeFlowEntry);
		straightFlow.pushFlowEntry(AllEventFlowEntry);
	},
	
	_pushFlowEntriesAsync: function(straightFlow) {
		straightFlow.pushFlowEntry(AllAsyncAnimeFlowEntry);
		straightFlow.pushFlowEntry(AllScrollFlowEntry);
		straightFlow.pushFlowEntry(AllEventFlowEntry);
	}
}
);

var AllSyncAnimeFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicAnime: null,
	
	enterFlowEntry: function(commandParent) {
		var anime, pos;
		var targetUnit = commandParent.getTargetUnit();
		var x = LayoutControl.getPixelX(targetUnit.getMapX());
		var y = LayoutControl.getPixelY(targetUnit.getMapY());
		
		if (commandParent.isAllCommandSkip()) {
			return EnterResult.NOTENTER;
		}
		
		anime = root.getEventCommandObject().getAnime();
		pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime = createObject(DynamicAnime);
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
		
		return EnterResult.OK;
	},
	
	moveFlowEntry: function() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		this._dynamicAnime.drawDynamicAnime();
	}
}
);

var AllAsyncAnimeFlowEntry = defineObject(BaseFlowEntry,
{
	_commandParent: null,
	_index: 0,
	_animeArray: null,
	
	enterFlowEntry: function(commandParent) {
		this._commandParent = commandParent;
		
		if (commandParent.isAllCommandSkip()) {
			return EnterResult.NOTENTER;
		}
		
		// Asynchronous animation is only the first time.
		if (commandParent.getUnitIndex() > 0) {
			return EnterResult.NOTENTER;
		}
		
		this._setAnime();
		
		return this._animeArray.length > 0 ? EnterResult.OK : EnterResult.NOTENTER;
	},
	
	moveFlowEntry: function() {
		var i;
		var count = this._animeArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._animeArray[i].moveDynamicAnime() !== MoveResult.CONTINUE) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		var i;
		var count = this._animeArray.length;
		
		for (i = 0; i < count; i++) {
			this._animeArray[i].drawDynamicAnime();
		}
	},
	
	_setAnime: function() {
		var i, j, targetUnit;
		var arr = this._commandParent.getUnitArray();
		var count = arr.length;
		
		this._animeArray = [];
		
		for (i = this._index, j = 0; i < count; i++) {
			targetUnit = arr[i];
			if (MapView.isVisible(targetUnit.getMapX(), targetUnit.getMapY())) {
				this._startAnime(targetUnit, j);
				j++;
			}
		}
	},
	
	_startAnime: function(targetUnit, index) {
		var x = LayoutControl.getPixelX(targetUnit.getMapX());
		var y = LayoutControl.getPixelY(targetUnit.getMapY());
		var anime = root.getEventCommandObject().getAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		var obj = createObject(DynamicAnime);
		
		this._animeArray.push(obj);
		obj.startDynamicAnime(anime, pos.x, pos.y);
		
		if (index > 0) {
			// Sound effect isn't played other than the first animation.
			obj.getAnimeMotion().lockSound();
		}
	}
}
);

var AllScrollFlowEntry = defineObject(BaseFlowEntry,
{
	_mapLineScroll: null,
	
	enterFlowEntry: function(commandParent) {
		var targetUnit = commandParent.getTargetUnit();
		var eventCommandData = root.getEventCommandObject();
		var command = eventCommandData.getSubEventCommandObject();
		var commandtype = eventCommandData.getSubEventCommandType();
		
		if (commandParent.isAllCommandSkip()) {
			return EnterResult.NOTENTER;
		}
		
		if (eventCommandData.getAnimePlayType() === AnimePlayType.SYNC && eventCommandData.getAnime() !== null) {
		}
		else {
			if (!this._isCommandScrollable(targetUnit, command, commandtype)) {
				return EnterResult.NOTENTER;
			}
		}
		
		this._setPos(targetUnit);
		
		this._mapLineScroll = createObject(MapLineScroll);
		this._mapLineScroll.startLineScroll(targetUnit.getMapX(), targetUnit.getMapY());
		
		return EnterResult.OK;
	},
	
	moveFlowEntry: function() {
		if (this._mapLineScroll.moveLineScroll() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_setPos: function(targetUnit) {
		var session = root.getCurrentSession();
		
		session.setMapCursorX(targetUnit.getMapX());
		session.setMapCursorY(targetUnit.getMapY());
	},
	
	_isCommandScrollable: function(targetUnit, command, commandType) {
		var result = false;
		
		if (commandType === EventCommandType.UNITREMOVE) {
			result = this._isUnitRemoveScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITASSIGN) {
			result = this._isUnitAssignScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.ITEMCHANGE) {
			result = this._isItemChangeScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.PARAMATERCHANGE) {
			result = this._isParameterChangeScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.SKILLCHANGE) {
			result = this._isSkillChangeScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.HPRECOVERY) {
			result = this._isHpRecoveryScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.DAMAGEHIT) {
			result = this._isDamageHitScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.EXPERIENCEPLUS) {
			result = this._isExperiencePlusScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.CLASSCHANGE) {
			result = this._isClassChangeScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITSTATECHANGE) {
			result = this._isUnitStateChangeScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.TROPHYCHANGE) {
			result = this._isTrophyChangeScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.DURABILITYCHANGE) {
			result = this._isItemDurabilityChangeScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITSTATEADDITION) {
			result = this._isUnitStateAdditionScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITCAPACITYCHANGE) {
			result = this._isUnitCapacityChange(targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITMETAMORPHOZE) {
			result = this._isUnitMetamorphozeScrollable(targetUnit, command);
		}
		else if (commandType === EventCommandType.MAPPOSOPERATION) {
			result = this._isMapPosOperationScrollable(targetUnit, command);
		}
		
		return result;
	},
	
	_isUnitRemoveScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isUnitAssignScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isItemChangeScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isParameterChangeScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isSkillChangeScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isHpRecoveryScrollable: function(targetUnit, command) {
		if (command.isGraphicsSkip()) {
			return false;
		}
		
		return command.getRecoveryAnime() !== null;
	},
	
	_isDamageHitScrollable: function(targetUnit, command) {
		if (command.isGraphicsSkip()) {
			return false;
		}
		
		return command.getDamageAnime() !== null;
	},
	
	_isExperiencePlusScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isClassChangeScrollable: function(targetUnit, command) {
		if (command.isGraphicsSkip()) {
			return false;
		}
		
		return root.queryAnime('classchange') !== null;
	},
	
	_isUnitStateChangeScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isTrophyChangeScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isItemDurabilityChangeScrollable: function(targetUnit, command) {
		return false;
	},
	
	_isUnitStateAdditionScrollable: function(targetUnit, command) {
		var stateInvocation = command.getStateInvocation();
		
		if (command.isGraphicsSkip() || command.getIncreaseValue() !== IncreaseType.INCREASE) {
			return false;
		}
		
		return stateInvocation.getState().getEasyAnime() !== null;
	},
	
	_isUnitCapacityChange: function(targetUnit, command) {
		return false;
	},
	
	_isUnitMetamorphozeScrollable: function(targetUnit, command) {
		var anime;
		var metamorphoze = command.getMetamorphozeData();
		
		if (command.isGraphicsSkip()) {
			return false;
		}
		
		if (command.getMetamorphozeActionType() === MetamorphozeActionType.CHANGE) {
			anime = metamorphoze.getChangeAnime();
		}
		else {
			anime = metamorphoze.getCancelAnime();
		}
		
		return anime !== null;
	},
	
	_isMapPosOperationScrollable: function(targetUnit, command) {
		return false;
	}
}
);

var AllEventFlowEntry = defineObject(BaseFlowEntry,
{
	_commandParent: null,
	_dynamicEvent: null,
	
	enterFlowEntry: function(commandParent) {
		var generator;
		var targetUnit = commandParent.getTargetUnit();
		var eventCommandData = root.getEventCommandObject();
		var command = eventCommandData.getSubEventCommandObject();
		var commandtype = eventCommandData.getSubEventCommandType();
		
		// There is no event command for "Anime Only".
		if (commandtype === -1) {
			return EnterResult.NOTENTER;
		}
		
		this._commandParent = commandParent;
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		this._setEventCommand(generator, targetUnit, command, commandtype);
		
		return this._dynamicEvent.executeDynamicEvent();
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_setEventCommand: function(generator, targetUnit, command, commandType) {
		if (commandType === EventCommandType.UNITREMOVE) {
			this._unitRemove(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITASSIGN) {
			this._unitAssign(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.ITEMCHANGE) {
			this._itemChange(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.PARAMATERCHANGE) {
			this._parameterChange(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.SKILLCHANGE) {
			this._skillChange(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.HPRECOVERY) {
			this._hpRecovery(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.DAMAGEHIT) {
			this._damagehit(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.EXPERIENCEPLUS) {
			this._experiencePlus(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.CLASSCHANGE) {
			this._classChange(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITSTATECHANGE) {
			this._unitStateChange(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.TROPHYCHANGE) {
			this._trophyChange(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.DURABILITYCHANGE) {
			this._itemDurabilityChange(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITSTATEADDITION) {
			this._unitStateAddition(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITCAPACITYCHANGE) {
			this._unitCapacityChange(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.UNITMETAMORPHOZE) {
			this._unitMetamorphoze(generator, targetUnit, command);
		}
		else if (commandType === EventCommandType.MAPPOSOPERATION) {
			this._mapPosOperation(generator, targetUnit, command);
		}
	},
	
	_unitRemove: function(generator, targetUnit, command) {
		generator.unitRemove(targetUnit, -1, 0);
	},
	
	_unitAssign: function(generator, targetUnit, command) {
		generator.unitAssign(targetUnit, -1);
	},
	
	_itemChange: function(generator, targetUnit, command) {
		generator.unitItemChange(targetUnit, command.getTargetItem(), -1, this._isCommandSkip(command));
	},
	
	_parameterChange: function(generator, targetUnit, command) {
		generator.parameterChange(targetUnit, command.getDopingParameter(), this._isCommandSkip(command));
	},
	
	_skillChange: function(generator, targetUnit, command) {
		generator.skillChange(targetUnit, command.getTargetSkill(), command.getIncreaseValue(), this._isCommandSkip(command));
	},
	
	_hpRecovery: function(generator, targetUnit, command) {
		generator.hpRecovery(targetUnit, command.getRecoveryAnime(), command.getRecoveryValue(), command.getRecoveryType(), this._isCommandSkip(command));
	},
	
	_damagehit: function(generator, targetUnit, command) {
		var launchUnit = command.getLaunchUnit();
		if (launchUnit == null) {
			launchUnit = {};
		}
		generator.damageHitEx(targetUnit, command.getDamageAnime(), command.getDamageValue(), command.getDamageType(), command.getHit(), launchUnit, this._isCommandSkip(command));
	},
	
	_experiencePlus: function(generator, targetUnit, command) {
		generator.experiencePlusEx(targetUnit, command.getExperienceValue(), command.getExperiencePlusType(), this._isCommandSkip(command));
	},
	
	_classChange: function(generator, targetUnit, command) {
		generator.classChange(targetUnit, command.getTargetClass(), this._isCommandSkip(command));
	},
	
	_unitStateChange: function(generator, targetUnit, command) {
		generator.unitStateChange(targetUnit, -1, 0);
	},
	
	_trophyChange: function(generator, targetUnit, command) {
		generator.trophyChange(targetUnit, command.getIncreaseValue(), command.getTrophy());
	},
	
	_itemDurabilityChange: function(generator, targetUnit, command) {
		generator.itemDurabilityChange(targetUnit, command.getTargetItem(), command.getDurability(), command.getIncreaseValue(), this._isCommandSkip(command));
	},
	
	_unitStateAddition: function(generator, targetUnit, command) {
		var launchUnit = command.getLaunchUnit();
		if (launchUnit == null) {
			launchUnit = {};
		}
		generator.unitStateAddition(targetUnit, command.getStateInvocation(), command.getIncreaseValue(), launchUnit, this._isCommandSkip(command));
	},
	
	_unitCapacityChange: function(generator, targetUnit, command) {
		generator.unitCapacityChange(targetUnit, -1);
	},
	
	_unitMetamorphoze: function(generator, targetUnit, command) {
		generator.unitMetamorphoze(targetUnit, command.getMetamorphozeData(), command.getMetamorphozeActionType(), this._isCommandSkip(command));
	},
	
	_mapPosOperation: function(generator, targetUnit, command) {
		generator.mapPosOperation(targetUnit, targetUnit.getMapX(), targetUnit.getMapY(), command.getMapChipGraphicsHandle());
	},
	
	_isCommandSkip: function(command) {
		return command.isGraphicsSkip() || this._commandParent.isAllCommandSkip();
	}
}
);
