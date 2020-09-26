
var UnitCommand = defineObject(BaseListCommandManager,
{
	_exitCommand: null,
	_isForceFinal: false,
	
	_moveOpen: function() {
		var object = this._commandScrollbar.getObject();
		var result = MoveResult.CONTINUE;
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			// Don't call this._commandScrollbar.setActive.
			// Even if cancelling with , move a mouse cursor for sure.
			this._commandScrollbar.setActiveSingle(true);
			MouseControl.changeCursorFromScrollbar(this._commandScrollbar, this._commandScrollbar.getIndex());
			
			this.changeCycleMode(ListCommandManagerMode.TITLE);
			
			if (this._isForceFinal) {
				this._isForceFinal = false;
				result = MoveResult.END;
			}
		}
		
		return result;
	},
	
	_checkTracingScroll: function() {
	},
	
	_playCommandOpenSound: function() {
	},
	
	endCommandAction: function(command) {
		this._exitCommand = command;
		this._isForceFinal = true;
	},
	
	setExitCommand: function(command) {
		this._exitCommand = command;
	},
	
	getExitCommand: function() {
		return this._exitCommand;
	},
	
	isRepeatMovable: function() {
		var object;
		var unit = this.getListCommandUnit();
		
		if (this._exitCommand !== null) {
			object = this._exitCommand;
		}
		else {
			object = this._commandScrollbar.getObject();
		}
		
		// A command doesn't allow to move again.
		if (!object.isRepeatMoveAllowed()) {
			return false;
		}
		
		// When it's unlimited action, move again doesn't occur.
		if (Miscellaneous.isPlayerFreeAction(unit)) {
			return false;
		}
		
		if (unit.getClass().getClassOption() & ClassOptionFlag.REPEATMOVE) {
			return true;
		}
		
		if (SkillControl.getPossessionSkill(unit, SkillType.REPEATMOVE) !== null) {
			return true;
		}
		
		return false;
	},
	
	getPositionX: function() {
		var width = this.getCommandScrollbar().getScrollbarWidth();
		return LayoutControl.getUnitBaseX(this.getListCommandUnit(), width);
	},
	
	getPositionY: function() {
		var height = this.getCommandScrollbar().getScrollbarHeight();
		return LayoutControl.getUnitBaseY(this.getListCommandUnit(), height);
	},
	
	getCommandTextUI: function() {
		return root.queryTextUI('unitcommand_title');
	},
	
	configureCommands: function(groupArray) {
		this._appendTalkEvent(groupArray);
		groupArray.appendObject(UnitCommand.Attack);
		groupArray.appendObject(UnitCommand.PlaceCommand);
		groupArray.appendObject(UnitCommand.Occupation);
		groupArray.appendObject(UnitCommand.Treasure);
		groupArray.appendObject(UnitCommand.Village);
		groupArray.appendObject(UnitCommand.Shop);
		groupArray.appendObject(UnitCommand.Gate);
		this._appendUnitEvent(groupArray);
		groupArray.appendObject(UnitCommand.Quick);
		groupArray.appendObject(UnitCommand.Steal);
		groupArray.appendObject(UnitCommand.Wand);
		groupArray.appendObject(UnitCommand.Information);
		this._appendMetamorphozeCommand(groupArray);
		this._appendFusionCommand(groupArray);
		groupArray.appendObject(UnitCommand.Item);
		groupArray.appendObject(UnitCommand.Trade);
		groupArray.appendObject(UnitCommand.Stock);
		groupArray.appendObject(UnitCommand.MetamorphozeCancel);
		groupArray.appendObject(UnitCommand.Wait);
	},
	
	_appendUnitEvent: function(groupArray) {
		var i, event, info;
		var unit = this.getListCommandUnit();
		var count = unit.getUnitEventCount();
		
		for (i = 0; i < count; i++) {
			event = unit.getUnitEvent(i);
			info = event.getUnitEventInfo();
			if (info.getUnitEventType() === UnitEventType.COMMAND && event.isEvent()) {
				groupArray.appendObject(UnitCommand.UnitEvent);
				groupArray[groupArray.length - 1].setEvent(event);
			}
		}
	},
	
	_appendTalkEvent: function(groupArray) {
		var i, j, x, y, targetUnit, event, text, talkInfo, src, dest, isEqual;
		var unit = this.getListCommandUnit();
		var arr = EventCommonArray.createArray(root.getCurrentSession().getTalkEventList(), EventType.TALK);
		var count = arr.length;
		var textArray = [];
		
		for (i = 0; i < count; i++) {
			event = arr[i];
			talkInfo = event.getTalkEventInfo();
			src = talkInfo.getSrcUnit();
			dest = talkInfo.getDestUnit();
			
			for (j = 0; j < DirectionType.COUNT; j++) {
				x = unit.getMapX() + XPoint[j];
				y = unit.getMapY() + YPoint[j];
				targetUnit = PosChecker.getUnitFromPos(x, y);
				if (targetUnit === null) {
					continue;
				}
				
				isEqual = false;
				
				if (unit === src && targetUnit === dest) {
					isEqual = true;
				}
				else if (talkInfo.isMutual()) {
					if (unit === dest && targetUnit === src) {
						isEqual = true;
					}
				}
				
				if (isEqual && event.isEvent() && event.getExecutedMark() === EventExecutedType.FREE) {
					text = talkInfo.getCommandText();
					if (textArray.indexOf(text) !== -1) {
						continue;
					}
					
					textArray.push(text);
					
					groupArray.appendObject(UnitCommand.Talk);
					groupArray[groupArray.length - 1].setCommandName(text);
				}
			}
		}
	},
	
	_appendFusionCommand: function(groupArray) {
		var i, count, arr;
		var unit = this.getListCommandUnit();
		var fusionData = FusionControl.getFusionData(unit);
		
		if (fusionData === null) {
			arr = FusionControl.getFusionArray(unit);
			count = arr.length;
			for (i = 0; i < count; i++) {
				fusionData = arr[i];
				if (fusionData.getFusionType() === FusionType.ATTACK) {
					groupArray.appendObject(UnitCommand.FusionAttack);
					groupArray[groupArray.length - 1].setFusionData(fusionData);
				}
				else {
					groupArray.appendObject(UnitCommand.FusionCatch);
					groupArray[groupArray.length - 1].setFusionData(fusionData);
				}
			}
			
			for (i = 0; i < count; i++) {
				fusionData = arr[i];
				groupArray.appendObject(UnitCommand.FusionUnitTrade);
				groupArray[groupArray.length - 1].setFusionData(fusionData);
			}
		}
		else {
			groupArray.appendObject(UnitCommand.FusionRelease);
			groupArray[groupArray.length - 1].setFusionData(fusionData);
			
			groupArray.appendObject(UnitCommand.FusionUnitTrade);
			groupArray[groupArray.length - 1].setFusionData(fusionData);
		}
	},
	
	_appendMetamorphozeCommand: function(groupArray) {
		var i, skillEntry;
		var unit = this.getListCommandUnit();
		var arr = SkillControl.getDirectSkillArray(unit, SkillType.METAMORPHOZE, '');
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			groupArray.appendObject(UnitCommand.Metamorphoze);
			skillEntry = arr[i];
			groupArray[groupArray.length - 1].setSkill(skillEntry.skill);
		}
	}
}
);

var UnitListCommand = defineObject(BaseListCommand,
{
	getCommandTarget: function() {
		return this._listCommandManager.getListCommandUnit();
	},
	
	endCommandAction: function() {
		this._listCommandManager.endCommandAction(this);
	},
	
	setExitCommand: function(command) {
		this._listCommandManager.setExitCommand(command);
	},
	
	rebuildCommand: function() {
		this._listCommandManager.rebuildCommand();
	},
	
	isRepeatMoveAllowed: function() {
		return false;
	}
}
);

var UnitEventCommandMode = {
	TOP: 0,
	EVENT: 1
};

UnitCommand.UnitEvent = defineObject(UnitListCommand,
{
	_event: null,
	_capsuleEvent: null,
	_questionWindow: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === UnitEventCommandMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === UnitEventCommandMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === UnitEventCommandMode.TOP) {
			this._drawTop();
		}
	},
	
	isCommandDisplayable: function() {
		var event = this._getEvent();
		
		return event !== null && event.isEvent();
	},
	
	getCommandName: function() {
		var event = this._getEvent();
		
		if (event === null) {
			return '';
		}
		
		return event.getUnitEventInfo().getCommandText();
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.UNITEVENT);
	},
	
	setEvent: function(event) {
		this._event = event;
	},
	
	_prepareCommandMemberData: function() {
		this._capsuleEvent = createObject(CapsuleEvent);
		this._questionWindow = createWindowObject(QuestionWindow, this);
	},
	
	_completeCommandMemberData: function() {
		var event = this._getEvent();
		var msg = event.getUnitEventInfo().getQuestionText();
		
		if (msg !== '') {
			this._questionWindow.setQuestionMessage(msg);
			this._questionWindow.setQuestionActive(true);
			this.changeCycleMode(UnitEventCommandMode.TOP);
		}
		else {
			this._changeEvent();
		}
	},
	
	_moveTop: function() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._changeEvent();
				return MoveResult.CONTINUE;
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			if (!UnitEventChecker.isCancelFlag()) {
				// Cancel doesn't occur, it means that some operation is done, so end it.
				this.endCommandAction();
			}
			UnitEventChecker.setCancelFlag(false);
			return MoveResult.END;
		}
		
		return result;
	},
	
	_drawTop: function() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	},
	
	_changeEvent: function() {
		var event = this._getEvent();
		
		this._capsuleEvent.enterCapsuleEvent(event, true);
		
		UnitEventChecker.setCancelFlag(false);
		
		this.changeCycleMode(UnitEventCommandMode.EVENT);
	},
	
	_getEvent: function() {
		return this._event;
	}
}
);

UnitCommand.PlaceCommand = defineObject(UnitListCommand,
{
	_capsuleEvent: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return result;
	},
	
	isCommandDisplayable: function() {
		var event = this._getEvent();
		
		return event !== null && event.isEvent() && event.getPlaceEventInfo().getPlaceCustomType() === PlaceCustomType.COMMAND;
	},
	
	getCommandName: function() {
		var event = this._getEvent();
		
		return event.getPlaceEventInfo().getCommandText();
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.CUSTOM);
	},
	
	_prepareCommandMemberData: function() {
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeCommandMemberData: function() {
		var event = this._getEvent();
		
		this._capsuleEvent.enterCapsuleEvent(event, true);
	},
	
	_getEvent: function() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.CUSTOM, this.getCommandTarget());
	}
}
);

var TalkCommandMode = {
	TOP: 0,
	EVENT: 1
};

UnitCommand.Talk = defineObject(UnitListCommand,
{
	_posSelector: null,
	_capsuleEvent: null,
	_text: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === TalkCommandMode.TOP) {
			result = this._moveTopMode();
		}
		else if (mode === TalkCommandMode.EVENT) {
			result = this._moveEventMode();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === TalkCommandMode.TOP) {
			this._posSelector.drawPosSelector();
		}
	},
	
	isCommandDisplayable: function() {
		return true;
	},
	
	getCommandName: function() {
		return this._text;
	},
	
	setCommandName: function(text) {
		this._text = text;
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.TALK);
	},
	
	_prepareCommandMemberData: function() {
		this._posSelector = createObject(PosSelector);
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeCommandMemberData: function() {
		var unit = this.getCommandTarget();
		var filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY | UnitFilterFlag.ENEMY;
		var indexArray = this._getTalkEventArray(unit);
		
		this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Default, filter);
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(TalkCommandMode.TOP);
	},
	
	_moveTopMode: function() {
		var unit, dest, event, recollectionEvent;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				unit = this.getCommandTarget();
				dest = this._posSelector.getSelectorTarget(false);
				event = this._getTargetEvent();
				if (event !== null) {
					this._posSelector.endPosSelector();
					this._capsuleEvent.enterCapsuleEvent(event, true);
					
					this.changeCycleMode(TalkCommandMode.EVENT);
				}
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEventMode: function() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_getTalkEventArray: function(unit) {
		var i, x, y, targetUnit, event;
		var indexArray = [];
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null) {
				event = this._getTalkEvent(unit, targetUnit);
				if (event !== null) {
					indexArray.push(CurrentMap.getIndex(x, y));
				}
			}
		}
		
		return indexArray;
	},
	
	_isPosSelectable: function() {
		var event;
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		if (targetUnit!== null) {
			event = this._getTalkEvent(this.getCommandTarget(), targetUnit);
			if (event !== null) {
				return targetUnit;
			}
		}
		
		return null;
	},
	
	_getTalkEvent: function(unit, targetUnit) {
		var i, event, talkInfo, src, dest, isEqual;
		var arr = EventCommonArray.createArray(root.getCurrentSession().getTalkEventList(), EventType.TALK);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			event = arr[i];
			talkInfo = event.getTalkEventInfo();
			src = talkInfo.getSrcUnit();
			dest = talkInfo.getDestUnit();
			
			isEqual = false;
			
			if (unit === src && targetUnit === dest) {
				isEqual = true;
			}
			else if (talkInfo.isMutual()) {
				if (unit === dest && targetUnit === src) {
					isEqual = true;
				}
			}
			
			if (isEqual && talkInfo.getCommandText() === this._text) {
				if (event.isEvent() && event.getExecutedMark() === EventExecutedType.FREE) {
					return event;
				}
			}
		}
		
		return null;
	},
	
	_getTargetEvent : function() {
		var unit = this.getCommandTarget();
		var dest = this._posSelector.getSelectorTarget(true);
		
		return this._getTalkEvent(unit, dest);
	}
}
);

var StealCommandMode = {
	SELECT: 0,
	TRADE: 1,
	EXP: 2
};

UnitCommand.Steal = defineObject(UnitListCommand,
{
	_dynamicEvent: null,
	_posSelector: null,
	_exp: 0,
	_unitItemStealScreen: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === StealCommandMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === StealCommandMode.TRADE) {
			result = this._moveTrade();
		}
		else if (mode === StealCommandMode.EXP) {
			result = this._moveExp();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === StealCommandMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === StealCommandMode.TRADE) {
			this._drawTrade();
		}
		else if (mode === StealCommandMode.EXP) {
			this._drawExp();
		}
	},
	
	isCommandDisplayable: function() {
		var indexArray = this._getTradeArray(this.getCommandTarget());
		return indexArray.length !== 0;
	},
	
	getCommandName: function() {
		var text = '';
		var skill = SkillControl.getPossessionSkill(this.getCommandTarget(), SkillType.STEAL);
		
		if (skill !== null) {
			text = skill.getCustomKeyword();
		}
		
		return text;
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.STEAL);
	},
	
	_prepareCommandMemberData: function() {
		this._posSelector = createObject(PosSelector);
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeCommandMemberData: function() {
		this._changeSelect();
	},
	
	_moveSelect: function() {
		var screenParam;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				
				screenParam = this._createScreenParam();
				
				this._unitItemStealScreen = createObject(UnitItemStealScreen);
				SceneManager.addScreen(this._unitItemStealScreen, screenParam);
			
				this.changeCycleMode(StealCommandMode.TRADE);
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveTrade: function() {
		var unit, generator, resultCode;
		
		if (SceneManager.isScreenClosed(this._unitItemStealScreen)) {
			resultCode = this._unitItemStealScreen.getScreenResult();
			if (resultCode === UnitItemTradeResult.TRADEEND) {
				if (this._exp > 0) {
					unit = this.getCommandTarget();
					generator = this._dynamicEvent.acquireEventGenerator();
					generator.experiencePlus(unit, ExperienceCalculator.getBestExperience(unit, this._exp), false);
					this._dynamicEvent.executeDynamicEvent();
					this.changeCycleMode(StealCommandMode.EXP);
				}
				else {
					this.endCommandAction();
					return MoveResult.END;
				}
			}
			else {
				this._changeSelect();
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveExp: function() {
		var result = this._dynamicEvent.moveDynamicEvent();
		
		if (result === MoveResult.END) {
			this.endCommandAction();
		}
		
		return result;
	},
	
	_drawSelect: function() {
		this._posSelector.drawPosSelector();
	},
	
	_drawTrade: function() {
	},
	
	_drawExp: function() {
	},
	
	_changeSelect: function() {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getTradeArray(this.getCommandTarget());
		
		this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Default, filter);
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(StealCommandMode.SELECT);
	},
	
	_getTradeArray: function(unit) {
		var i, x, y, targetUnit, skill;
		var indexArray = [];
		
		skill = SkillControl.getBestPossessionSkill(unit, SkillType.STEAL);
		if (skill === null) {
			return indexArray;
		}
		
		// There is a possibility that "Steal" occurs with the item skill and it doesn't mean that skill can be learnt after trading,
		// so save it at the variable.
		this._exp = skill.getSkillSubValue();
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && targetUnit.getUnitType() === UnitType.ENEMY) {
				if (Miscellaneous.isStealEnabled(unit, targetUnit, skill.getSkillValue())) {
					indexArray.push(CurrentMap.getIndex(x, y));
				}
			}
		}
		
		return indexArray;
	},
	
	_isPosSelectable: function() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null;
	},
	
	_getUnitFilter: function() {
		return FilterControl.getReverseFilter(this.getCommandTarget().getUnitType());
	},
	
	_createScreenParam: function() {
		var skill = SkillControl.getBestPossessionSkill(this.getCommandTarget(), SkillType.STEAL);
		var screenParam = ScreenBuilder.buildUnitItemSteal();
		
		screenParam.unit = this.getCommandTarget();
		screenParam.targetUnit = this._posSelector.getSelectorTarget(false);
		if (skill !== null) {
			screenParam.stealFlag = skill.getSkillValue();
		}
		
		return screenParam;
	}
}
);

var QuickCommandMode = {
	SELECT: 0,
	QUICK: 1,
	DIRECT: 2,
	EXP: 3
};

UnitCommand.Quick = defineObject(UnitListCommand,
{
	_dynamicEvent: null,
	_dynamicAnime: null,
	_posSelector: null,
	_exp: 0,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === QuickCommandMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === QuickCommandMode.QUICK) {
			result = this._moveQuick();
		}
		else if (mode === QuickCommandMode.DIRECT) {
			result = this._moveDirect();
		}
		else if (mode === QuickCommandMode.EXP) {
			result = this._moveExp();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === QuickCommandMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === QuickCommandMode.QUICK) {
			this._drawQuick();
		}
		else if (mode === QuickCommandMode.DIRECT) {
			this._drawDirect();
		}
		else if (mode === QuickCommandMode.EXP) {
			this._drawExp();
		}
	},
	
	isCommandDisplayable: function() {
		var indexArray = this._getTradeArray(this.getCommandTarget());
		return indexArray.length !== 0;
	},
	
	getCommandName: function() {
		var text = '';
		var skill = SkillControl.getPossessionSkill(this.getCommandTarget(), SkillType.QUICK);
		
		if (skill !== null) {
			text = skill.getCustomKeyword();
		}
		
		return text;
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.QUICK);
	},
	
	_prepareCommandMemberData: function() {
		this._posSelector = createObject(PosSelector);
		this._dynamicEvent = createObject(DynamicEvent);
		this._dynamicAnime = createObject(DynamicAnime);
	},
	
	_completeCommandMemberData: function() {
		var skill;
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getTradeArray(this.getCommandTarget());
		
		skill = SkillControl.getBestPossessionSkill(this.getCommandTarget(), SkillType.QUICK);
		if (skill === null) {
			return;
		}
		
		this._exp = skill.getSkillSubValue();
		
		if (skill.getSkillValue() === 0) {
			this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Default, filter);
			this._posSelector.setFirstPos();
			this.changeCycleMode(QuickCommandMode.SELECT);
		}
		else {
			this._indexArray = indexArray;
			this._showAnime(this.getCommandTarget());
			this.changeCycleMode(QuickCommandMode.DIRECT);
		}
	},
	
	_moveSelect: function() {
		var screenParam;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				this._showAnime(this._posSelector.getSelectorTarget(true));
				this.changeCycleMode(QuickCommandMode.QUICK);
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveQuick: function() {
		var targetUnit;
		
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			targetUnit = this._posSelector.getSelectorTarget(true);
			targetUnit.setWait(false);
			if (this._exp > 0) {
				this._changeExp();
			}
			else {
				this.endCommandAction();
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveDirect: function() {
		var i, count, x, y, targetUnit;
		
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			count = this._indexArray.length;
			for (i = 0; i < count; i++) {
				x = CurrentMap.getX(this._indexArray[i]);
				y = CurrentMap.getY(this._indexArray[i]);
				targetUnit = PosChecker.getUnitFromPos(x, y);
				if (targetUnit !== null) {
					targetUnit.setWait(false);
				}
			}
			
			if (this._exp > 0) {
				this._changeExp();
			}
			else {
				this.endCommandAction();
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveExp: function() {
		var result = this._dynamicEvent.moveDynamicEvent();
		
		if (result === MoveResult.END) {
			this.endCommandAction();
		}
		
		return result;
	},
	
	_drawSelect: function() {
		this._posSelector.drawPosSelector();
	},
	
	_drawQuick: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_drawDirect: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_drawExp: function() {
	},
	
	_changeExp: function() {
		var generator = this._dynamicEvent.acquireEventGenerator();
		var unit = this.getCommandTarget();
		
		generator.experiencePlus(unit, ExperienceCalculator.getBestExperience(unit, this._exp), false);
		this._dynamicEvent.executeDynamicEvent();
		this.changeCycleMode(QuickCommandMode.EXP);
	},
	
	_getTradeArray: function(unit) {
		var i, x, y, targetUnit;
		var indexArray = [];
		
		if (SkillControl.getPossessionSkill(unit, SkillType.QUICK) === null) {
			return indexArray;
		}
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit.getUnitType() === targetUnit.getUnitType()) {
				if (targetUnit.isWait()) {
					indexArray.push(CurrentMap.getIndex(x, y));
				}
			}
		}
		
		return indexArray;
	},
	
	_isPosSelectable: function() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null;
	},
	
	_getUnitFilter: function() {
		return FilterControl.getNormalFilter(this.getCommandTarget().getUnitType());
	},
	
	_showAnime: function(unit) {
		var x = LayoutControl.getPixelX(unit.getMapX());
		var y = LayoutControl.getPixelY(unit.getMapY());
		var anime = root.queryAnime('quick');
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
	}
}
);

UnitCommand.Occupation = defineObject(UnitListCommand,
{
	_capsuleEvent: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	isCommandDisplayable: function() {
		var event;
		
		// The entry of "Seize" is shown only with a leader.
		if (this.getCommandTarget().getImportance() !== ImportanceType.LEADER) {
			return false;
		}

		event = this._getEvent();
		
		return event !== null && event.isEvent() && event.getExecutedMark() === EventExecutedType.FREE;
	},
	
	getCommandName: function() {
		return root.queryCommand('occupation_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.OCCUPATION);
	},
	
	_prepareCommandMemberData: function() {
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeCommandMemberData: function() {
		var event = this._getEvent();
		
		this._capsuleEvent.enterCapsuleEvent(event, true);
	},
	
	_getEvent: function() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.OCCUPATION, this.getCommandTarget());
	}
}
);

UnitCommand.Village = defineObject(UnitListCommand,
{
	_eventTrophy: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (this._eventTrophy.moveEventTrophyCycle() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return result;
	},
	
	drawCommand: function() {
		this._eventTrophy.drawEventTrophyCycle();
	},
	
	isCommandDisplayable: function() {
		var event = this._getEvent();
		
		return event !== null && event.isEvent() && event.getExecutedMark() === EventExecutedType.FREE;
	},
	
	getCommandName: function() {
		return root.queryCommand('village_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.VILLAGE);
	},
	
	_prepareCommandMemberData: function() {
		this._eventTrophy = createObject(EventTrophy);
	},
	
	_completeCommandMemberData: function() {
		var event = this._getEvent();
		
		this._eventTrophy.enterEventTrophyCycle(this.getCommandTarget(), event);
	},
	
	_getEvent: function() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.VILLAGE, this.getCommandTarget());
	}
}
);

UnitCommand.Information = defineObject(UnitListCommand,
{
	_capsuleEvent: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return result;
	},
	
	isCommandDisplayable: function() {
		var event = this._getEvent();
		
		return event !== null && event.isEvent();
	},
	
	getCommandName: function() {
		return root.queryCommand('information_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.INFRORMATION);
	},
	
	_prepareCommandMemberData: function() {
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeCommandMemberData: function() {
		var event = this._getEvent();
		
		// Specify false so as not to be executed.
		this._capsuleEvent.enterCapsuleEvent(event, false);
	},
	
	_getEvent: function() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.INFORMATION, this.getCommandTarget());
	}
}
);

var ShopCommandMode = {
	EVENT: 0,
	SCREEN: 1
};

UnitCommand.Shop = defineObject(UnitListCommand,
{
	_capsuleEvent: null,
	_shopLayoutScreen: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ShopCommandMode.EVENT) {
			result = this._moveTop();
		}
		else if (mode === ShopCommandMode.SCREEN) {
			result = this._moveScreen();
		}
		
		return result;
	},
	
	isCommandDisplayable: function() { 
		var event = this._getEvent();
		
		return event !== null && event.isEvent() && Miscellaneous.isItemAccess(this.getCommandTarget());
	},
	
	getCommandName: function() {
		return this._getEvent().getPlaceEventInfo().getShopData().getShopLayout().getCommandName();
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.SHOP);
	},
	
	_prepareCommandMemberData: function() {
		this._capsuleEvent = createObject(CapsuleEvent);
	},
	
	_completeCommandMemberData: function() {
		var event = this._getEvent();
		
		// Specify false so as not to be executed.
		this._capsuleEvent.enterCapsuleEvent(event, false);
		this.changeCycleMode(ShopCommandMode.EVENT);
	},
	
	_moveTop: function() {
		var screenParam;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			screenParam = this._createScreenParam();
			this._shopLayoutScreen = createObject(ShopLayoutScreen);
			this._shopLayoutScreen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
			SceneManager.addScreen(this._shopLayoutScreen, screenParam);
			
			this.changeCycleMode(ShopCommandMode.SCREEN);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveScreen: function() {
		if (SceneManager.isScreenClosed(this._shopLayoutScreen)) {
			if (this._shopLayoutScreen.getScreenResult() === ShopLayoutResult.ACTION) {
				this.endCommandAction();
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_getEvent: function() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.SHOP, this.getCommandTarget());
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildShopLayout();
		var shopData = this._getEvent().getPlaceEventInfo().getShopData();
		
		screenParam.unit = this.getCommandTarget();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		screenParam.shopLayout = shopData.getShopLayout();
		
		return screenParam;
	}
}
);

UnitCommand.Treasure = defineObject(UnitListCommand,
{
	_keyData: null,
	_keyNavigator: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		if (this._keyNavigator.moveKeyNavigator() !== MoveResult.CONTINUE) {
			if (this._keyNavigator.isUsed()) {
				this.endCommandAction();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawCommand: function() {
		this._keyNavigator.drawKeyNavigator();
	},
	
	isCommandDisplayable: function() {
		var skill, item;
		var requireFlag = KeyFlag.TREASURE;
		var unit = this.getCommandTarget();
		
		this._keyData = null;
		
		if (!DataConfig.isTreasureKeyEnabled()) {
			this._keyData = KeyEventChecker.buildKeyDataDefault();
		}
		
		if (this._keyData === null) {
			skill = SkillControl.getPossessionSkill(unit, SkillType.PICKING);
			if (skill !== null) {
				this._keyData = KeyEventChecker.buildKeyDataSkill(skill, requireFlag);
			}
		}
		
		if (this._keyData === null) {
			item = ItemControl.getKeyItem(unit, requireFlag);
			if (item !== null) {
				this._keyData = KeyEventChecker.buildKeyDataItem(item, requireFlag);
			}
		}
		
		if (this._keyData === null) {
			return false;
		}
		
		return KeyEventChecker.getIndexArrayFromKeyType(unit, this._keyData).length > 0;
	},
	
	getCommandName: function() {
		return root.queryCommand('treasure_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.KEY);
	},
	
	_prepareCommandMemberData: function() {
		this._keyNavigator = createObject(KeyNavigator);
	},
	
	_completeCommandMemberData: function() {
		this._keyNavigator.openKeyNavigator(this.getCommandTarget(), this._keyData);
	}
}
);

UnitCommand.Gate = defineObject(UnitListCommand,
{
	_keyData: null,
	_keyNavigator: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		if (this._keyNavigator.moveKeyNavigator() !== MoveResult.CONTINUE) {
			if (this._keyNavigator.isUsed()) {
				this.endCommandAction();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawCommand: function() {
		this._keyNavigator.drawKeyNavigator();
	},
	
	isCommandDisplayable: function() {
		var skill, item;
		var requireFlag = KeyFlag.GATE;
		var unit = this.getCommandTarget();
		
		this._keyData = null;
		
		skill = SkillControl.getPossessionSkill(unit, SkillType.PICKING);
		if (skill !== null) {
			this._keyData = KeyEventChecker.buildKeyDataSkill(skill, requireFlag);
		}
		
		if (this._keyData === null) {
			item = ItemControl.getKeyItem(unit, requireFlag);
			if (item !== null) {
				this._keyData = KeyEventChecker.buildKeyDataItem(item, requireFlag);
			}
		}
		
		if (this._keyData === null) {
			return false;
		}
		
		return KeyEventChecker.getIndexArrayFromKeyType(unit, this._keyData).length > 0;
	},
	
	getCommandName: function() {
		return root.queryCommand('gate_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.KEY);
	},
	
	_prepareCommandMemberData: function() {
		this._keyNavigator = createObject(KeyNavigator);
	},
	
	_completeCommandMemberData: function() {
		this._keyNavigator.openKeyNavigator(this.getCommandTarget(), this._keyData);
	}
}
);

var AttackCommandMode = {
	TOP: 0,
	SELECTION: 1,
	RESULT: 2
};

UnitCommand.Attack = defineObject(UnitListCommand,
{
	_weaponSelectMenu: null,
	_posSelector: null,
	_isWeaponSelectDisabled: false,
	_weaponPrev: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === AttackCommandMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === AttackCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === AttackCommandMode.RESULT) {
			result = this._moveResult();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === AttackCommandMode.TOP) {
			this._drawTop();
		}
		else if (mode === AttackCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === AttackCommandMode.RESULT) {
			this._drawResult();
		}
	},
	
	isCommandDisplayable: function() {
		return AttackChecker.isUnitAttackable(this.getCommandTarget());
	},
	
	getCommandName: function() {
		return root.queryCommand('attack_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.ATTACK);
	},
	
	_prepareCommandMemberData: function() {
		this._weaponSelectMenu = createObject(WeaponSelectMenu);
		this._posSelector = createObject(PosSelector);
		this._isWeaponSelectDisabled = false;
	},
	
	_completeCommandMemberData: function() {
		if (DataConfig.isWeaponSelectSkippable()) {
			if (this._getWeaponCount() === 1) {
				this._isWeaponSelectDisabled = true;
			}
		}
		
		if (this._isWeaponSelectDisabled) {
			this._startSelection(ItemControl.getEquippedWeapon(this.getCommandTarget()));
		}
		else {
			this._weaponSelectMenu.setMenuTarget(this.getCommandTarget());
			this._weaponPrev = this._weaponSelectMenu.getSelectWeapon();
			this.changeCycleMode(AttackCommandMode.TOP);
		}
	},
	
	_getWeaponCount: function() {
		var i, weapon;
		var unit = this.getCommandTarget();
		var count = UnitItemControl.getPossessionItemCount(unit);
		var weaponCount = 0;
		
		for (i = 0; i < count; i++) {
			weapon = UnitItemControl.getItem(unit, i);
			if (weapon === null) {
				continue;
			}
			
			if (ItemControl.isWeaponAvailable(unit, weapon)) {
				weaponCount++;
			}
		}
		
		return weaponCount;
	},
	
	_startSelection: function(weapon) {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getIndexArray(unit, weapon);
		
		// Equip with the selected item.
		ItemControl.setEquippedWeapon(unit, weapon);
		
		this._posSelector.setUnitOnly(unit, weapon, indexArray, PosMenuType.Attack, filter);
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(AttackCommandMode.SELECTION);
	},
	
	_moveTop: function() {
		var weapon;
		var input = this._weaponSelectMenu.moveWindowManager();
		
		if (input === ScrollbarInput.SELECT) {
			weapon = this._weaponSelectMenu.getSelectWeapon();
			this._startSelection(weapon);
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._weaponPrev !== this._weaponSelectMenu.getSelectWeapon()) {
				// Rebuild the command because the equipped weapon has changed.
				// For example, if the equipped weapon includes "Steal" as "Optional Skills", "Steal" must be removed from the command.
				this.rebuildCommand();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveSelection: function() {
		var attackParam;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				
				attackParam = this._createAttackParam();
				
				this._preAttack = createObject(PreAttack);
				result = this._preAttack.enterPreAttackCycle(attackParam);
				if (result === EnterResult.NOTENTER) {
					this.endCommandAction();
					return MoveResult.END;
				}
				
				this.changeCycleMode(AttackCommandMode.RESULT);
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			if (this._isWeaponSelectDisabled) {
				return MoveResult.END;
			}
			
			this._weaponSelectMenu.setMenuTarget(this.getCommandTarget());
			this.changeCycleMode(AttackCommandMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveResult: function() {
		if (this._preAttack.movePreAttackCycle() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawTop: function() {
		this._weaponSelectMenu.drawWindowManager();
	},
	
	_drawSelection: function() {
		this._posSelector.drawPosSelector();
	},
	
	_drawResult: function() {
		if (this._preAttack.isPosMenuDraw()) {
			// Without the following code, it flickers at the easy battle.
			this._posSelector.drawPosMenu();
		}
		
		this._preAttack.drawPreAttackCycle();
	},
	
	_isPosSelectable: function() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null;
	},
	
	_getUnitFilter: function() {
		return FilterControl.getReverseFilter(this.getCommandTarget().getUnitType());
	},
	
	_getIndexArray: function(unit, weapon) {
		return AttackChecker.getAttackIndexArray(unit, weapon, false);
	},
	
	_createAttackParam: function() {
		var attackParam = StructureBuilder.buildAttackParam();
		
		attackParam.unit = this.getCommandTarget();
		attackParam.targetUnit = this._posSelector.getSelectorTarget(false);
		attackParam.attackStartType = AttackStartType.NORMAL;
		
		return attackParam;
	}
}
);

var WandCommandMode = {
	TOP: 0,
	SELECTION: 1,
	USE: 2
};

UnitCommand.Wand = defineObject(UnitListCommand,
{
	_itemUse: null,
	_itemSelection: null,
	_itemSelectMenu: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === WandCommandMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === WandCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === WandCommandMode.USE) {
			result = this._moveUse();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === WandCommandMode.TOP) {
			this._drawTop();
		}
		else if (mode === WandCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === WandCommandMode.USE) {
			this._drawUse();
		}
	},
	
	isCommandDisplayable: function() {
		return WandChecker.isWandUsable(this.getCommandTarget());
	},
	
	getCommandName: function() {
		return root.queryCommand('wand_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.ITEM);
	},
	
	_prepareCommandMemberData: function() {
		this._itemUse = null;
		this._itemSelection = null;
		this._itemSelectMenu = createObject(WandSelectMenu);
	},
	
	_completeCommandMemberData: function() {
		this._itemSelectMenu.setMenuTarget(this.getCommandTarget());
		this.changeCycleMode(WandCommandMode.TOP);
	},
	
	_moveTop: function() {
		var item;
		var unit = this.getCommandTarget();
		var input = this._itemSelectMenu.moveWindowManager();
		
		if (input === ScrollbarInput.SELECT) {
			item = this._itemSelectMenu.getSelectWand();
			this._itemSelection = ItemPackageControl.getItemSelectionObject(item);
			if (this._itemSelection !== null) {
				if (this._itemSelection.enterItemSelectionCycle(unit, item) === EnterResult.NOTENTER) {
					this._useItem();
					this.changeCycleMode(WandCommandMode.USE);
				}
				else {
					this.changeCycleMode(WandCommandMode.SELECTION);
				}
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveSelection: function() {
		if (this._itemSelection.moveItemSelectionCycle() !== MoveResult.CONTINUE) {
			if (this._itemSelection.isSelection()) {
				this._useItem();
				this.changeCycleMode(WandCommandMode.USE);
			}
			else {
				this._itemSelectMenu.setMenuTarget(this.getCommandTarget());
				this.changeCycleMode(WandCommandMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveUse: function() {
		if (this._itemUse.moveUseCycle() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawTop: function() {
		this._itemSelectMenu.drawWindowManager();
	},
	
	_drawSelection: function() {
		this._itemSelection.drawItemSelectionCycle();
	},
	
	_drawUse: function() {
		this._itemUse.drawUseCycle();
	},
	
	_useItem: function() {
		var itemTargetInfo;
		var item = this._itemSelectMenu.getSelectWand();
		
		this._itemUse = ItemPackageControl.getItemUseParent(item);
		itemTargetInfo = this._itemSelection.getResultItemTargetInfo();
		
		itemTargetInfo.unit = this.getCommandTarget();
		itemTargetInfo.item = item;
		itemTargetInfo.isPlayerSideCall = true;
		this._itemUse.enterUseCycle(itemTargetInfo);
	}
}
);

var ItemCommandMode = {
	TOP: 0,
	SELECTION: 1,
	USE: 2
};

UnitCommand.Item = defineObject(UnitListCommand,
{
	_itemUse: null,
	_itemSelectMenu: null,
	_itemSelection: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemCommandMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ItemCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === ItemCommandMode.USE) {
			result = this._moveUse();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === ItemCommandMode.TOP) {
			this._drawTop();
		}
		else if (mode === ItemCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === ItemCommandMode.USE) {
			this._drawUse();
		}
	},
	
	isCommandDisplayable: function() {
		return UnitItemControl.getPossessionItemCount(this.getCommandTarget()) > 0;
	},
	
	getCommandName: function() {
		return root.queryCommand('item_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.ITEM);
	},
	
	_prepareCommandMemberData: function() {
		this._itemUse = null;
		this._itemSelection = null;
		this._itemSelectMenu = createObject(ItemSelectMenu);
	},
	
	_completeCommandMemberData: function() {
		this._itemSelectMenu.setMenuTarget(this.getCommandTarget());
		this.changeCycleMode(ItemCommandMode.TOP);
	},
	
	_moveTop: function() {
		var item;
		var unit = this.getCommandTarget();
		var result = this._itemSelectMenu.moveWindowManager();
		
		if (result === ItemSelectMenuResult.USE) {
			item = this._itemSelectMenu.getSelectItem();
			this._itemSelection = ItemPackageControl.getItemSelectionObject(item);
			if (this._itemSelection !== null) {
				if (this._itemSelection.enterItemSelectionCycle(unit, item) === EnterResult.NOTENTER) {
					this._useItem();
					this.changeCycleMode(ItemCommandMode.USE);
				}
				else {
					this.changeCycleMode(ItemCommandMode.SELECTION);
				}
			}
		}
		else if (result === ItemSelectMenuResult.CANCEL) {
			// Rebuild the command. This is because the weapons equipped on the unit may have been changed or items may have been discarded.
			this.rebuildCommand();
			
			// If the item is discarded, it's supposed that action has occurred.
			if (this._itemSelectMenu.isDiscardAction()) {
				this.endCommandAction();
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveSelection: function() {
		if (this._itemSelection.moveItemSelectionCycle() !== MoveResult.CONTINUE) {
			if (this._itemSelection.isSelection()) {
				this._useItem();
				this.changeCycleMode(ItemCommandMode.USE);
			}
			else {
				this._itemSelectMenu.setMenuTarget(this.getCommandTarget());
				this.changeCycleMode(ItemCommandMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveUse: function() {
		if (this._itemUse.moveUseCycle() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawTop: function() {
		this._itemSelectMenu.drawWindowManager();
	},
	
	_drawSelection: function() {
		this._itemSelection.drawItemSelectionCycle();
	},
	
	_drawUse: function() {
		this._itemUse.drawUseCycle();
	},
	
	_useItem: function() {
		var itemTargetInfo;
		var item = this._itemSelectMenu.getSelectItem();
		
		this._itemUse = ItemPackageControl.getItemUseParent(item);
		itemTargetInfo = this._itemSelection.getResultItemTargetInfo();
		
		itemTargetInfo.unit = this.getCommandTarget();
		itemTargetInfo.item = item;
		itemTargetInfo.isPlayerSideCall = true;
		this._itemUse.enterUseCycle(itemTargetInfo);
	}
}
);

var TradeCommandMode = {
	SELECT: 0,
	TRADE: 1
};

UnitCommand.Trade = defineObject(UnitListCommand,
{
	_posSelector: null,
	_unitItemTradeScreen: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === TradeCommandMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === TradeCommandMode.TRADE) {
			result = this._moveTrade();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === TradeCommandMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === TradeCommandMode.TRADE) {
			this._drawTrade();
		}
	},
	
	isCommandDisplayable: function() {
		var indexArray = this._getTradeArray(this.getCommandTarget());
		return indexArray.length !== 0;
	},
	
	getCommandName: function() {
		return root.queryCommand('exchange_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.TRADE);
	},
	
	_prepareCommandMemberData: function() {
		this._posSelector = createObject(PosSelector);
	},
	
	_completeCommandMemberData: function() {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getTradeArray(this.getCommandTarget());
		
		this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Default, filter);
		this._posSelector.setFirstPos();
		this._posSelector.includeFusion();
		
		this.changeCycleMode(TradeCommandMode.SELECT);
	},
	
	_moveSelect: function() {
		var screenParam;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				
				screenParam = this._createScreenParam();
				
				this._unitItemTradeScreen = createObject(UnitItemTradeScreen);
				SceneManager.addScreen(this._unitItemTradeScreen, screenParam);
			
				this.changeCycleMode(TradeCommandMode.TRADE);
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveTrade: function() {
		var resultCode;
		
		if (SceneManager.isScreenClosed(this._unitItemTradeScreen)) {
			resultCode = this._unitItemTradeScreen.getScreenResult();
			if (resultCode === UnitItemTradeResult.TRADEEND) {
				// For trading items, after trading it, it isn't immediately a wait mode, but mark it with some sort of operation has been done.
				this.setExitCommand(this);
				
				// With trading items, commands which can be executed may be increased, so rebuild it.
				this.rebuildCommand();
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawSelect: function() {
		this._posSelector.drawPosSelector();
	},
	
	_drawTrade: function() {
	},
	
	_getTradeArray: function(unit) {
		var i, x, y, targetUnit;
		var indexArray = [];
		
		if (!Miscellaneous.isItemAccess(unit)) {
			return indexArray;
		}
		
		if (this._isFusionTradable(unit)) {
			indexArray.push(CurrentMap.getIndex(unit.getMapX(), unit.getMapY()));
		}
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && this._isTradable(targetUnit)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	},
	
	_isTradable: function(targetUnit) {
		if (targetUnit.getUnitType() !== UnitType.PLAYER) {
			return false;
		}
		
		if (!Miscellaneous.isItemAccess(targetUnit)) {
			return false;
		}
		
		// If "Berserk" state, cannot trade the item.
		if (StateControl.isBadStateOption(targetUnit, BadStateOption.BERSERK)) {
			return false;
		}
		
		return true;
	},
	
	_isFusionTradable: function(unit) {
		var targetUnit;
		
		if (!FusionControl.isItemTradable(unit)) {
			return false;
		}
		
		targetUnit = FusionControl.getFusionChild(unit);
		if (targetUnit === null) {
			return false;
		}
		
		return targetUnit.getUnitType() !== UnitType.ALLY;
	},
	
	_isPosSelectable: function() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null && Miscellaneous.isItemAccess(unit);
	},
	
	_getUnitFilter: function() {
		return FilterControl.getNormalFilter(this.getCommandTarget().getUnitType());
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildUnitItemTrade();
		
		screenParam.unit = this.getCommandTarget();
		screenParam.targetUnit = this._posSelector.getSelectorTarget(false);
		
		return screenParam;
	}
}
);

UnitCommand.Stock = defineObject(UnitListCommand,
{
	_stockItemTradeScreen: null,
	
	openCommand: function() {
		var screenParam = this._createScreenParam();
		
		this._stockItemTradeScreen = createObject(DataConfig.isStockTradeWeaponTypeAllowed() ? CategoryStockItemTradeScreen : StockItemTradeScreen);
		SceneManager.addScreen(this._stockItemTradeScreen, screenParam);
	},
	
	moveCommand: function() {
		var resultCode;
		
		if (SceneManager.isScreenClosed(this._stockItemTradeScreen)) {
			resultCode = this._stockItemTradeScreen.getScreenResult();
			if (resultCode === StockItemTradeResult.TRADEEND) {
				// For trading the stock, after trading it, it isn't immediately a wait mode, but mark it with some sort of operation has been done.
				this.setExitCommand(this);
				
				// With trading stock, commands which can be executed may be increased, so rebuild it.
				this.rebuildCommand();
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	isCommandDisplayable: function() {
		var indexArray;
		
		if (!root.getCurrentSession().isMapState(MapStateType.STOCKSHOW)) {
			return false;
		}
		
		// Check if it's the unit who can access the stock.
		if (this._isTradable(this.getCommandTarget())) {
			return true;
		}
		
		// Check if the adjacent unit can access the stock.
		indexArray = this._getStockArray(this.getCommandTarget());
		
		return indexArray.length !== 0;
	},
	
	getCommandName: function() {
		return root.queryCommand('stock_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.STOCK);
	},
	
	_getStockArray: function(unit) {
		var i, x, y, targetUnit;
		var indexArray = [];
		
		if (!Miscellaneous.isItemAccess(unit)) {
			return indexArray;
		}
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && this._isTradable(targetUnit)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	},
	
	_isTradable: function(targetUnit) {
		return targetUnit.getUnitType() === UnitType.PLAYER && Miscellaneous.isStockAccess(targetUnit) && Miscellaneous.isItemAccess(targetUnit);
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildStockItemTrade();
		
		screenParam.unit = this.getCommandTarget();
		
		return screenParam;
	}	
}
);

UnitCommand.Wait = defineObject(UnitListCommand,
{
	openCommand: function() {
		this.endCommandAction();
	},
	
	moveCommand: function() {
		return false;
	},
	
	drawCommand: function() {
	},
	
	isCommandDisplayable: function() {
		return true;
	},
	
	getCommandName: function() {
		return root.queryCommand('wait_unitcommand');
	},
	
	isRepeatMoveAllowed: function() {
		// "Wait" mode doesn't allow to move again.
		return false;
	}
}
);

var MetamorphozeCommandMode = {
	SELECT: 0,
	EVENT: 1
};

UnitCommand.Metamorphoze = defineObject(UnitListCommand,
{
	_selectManager: null,
	_dynamicEvent: null,
	_metamorphozeData: null,
	_skill: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === MetamorphozeCommandMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === MetamorphozeCommandMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === MetamorphozeCommandMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === MetamorphozeCommandMode.EVENT) {
			this._drawEvent();
		}
	},
	
	isCommandDisplayable: function() {
		if (MetamorphozeControl.getMetamorphozeData(this.getCommandTarget()) !== null) {
			return false;
		}
		
		return this._skill !== null;
	},
	
	getCommandName: function() {
		var text = '';
		
		if (this._skill !== null) {
			text = this._skill.getCustomKeyword();
		}
		
		return text;
	},
	
	setSkill: function(skill) {
		this._skill = skill;
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.METAMORPHOZE);
	},
	
	_prepareCommandMemberData: function() {
		this._selectManager = createObject(MetamorphozeSelectManager);
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeCommandMemberData: function() {
		this._selectManager.setMetamorphozeSelectData(this.getCommandTarget(), this._skill.getDataReferenceList());
		this.changeCycleMode(MetamorphozeCommandMode.SELECT);
	},
	
	_moveSelect: function() {
		if (this._selectManager.moveWindowManager() !== MoveResult.CONTINUE) {
			this._metamorphozeData = this._selectManager.getTargetMetamorphoze();
			if (this._metamorphozeData === null) {
				return MoveResult.END;
			}
			
			this._changeEvent();
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		var result = this._dynamicEvent.moveDynamicEvent();
		
		if (result === MoveResult.END) {
			this.endCommandAction();
		}
		
		return result;
	},
	
	_drawSelect: function() {
		this._selectManager.drawWindowManager();
	},
	
	_drawEvent: function() {
	},
	
	_changeEvent: function() {
		var unit = this.getCommandTarget();
		var exp = this._skill.getSkillSubValue();
		var isSkipMode = false;
		var generator = this._dynamicEvent.acquireEventGenerator();
		
		generator.unitMetamorphoze(unit, this._metamorphozeData, MetamorphozeActionType.CHANGE, isSkipMode);
		
		if (exp !== 0) {
			generator.experiencePlus(unit, ExperienceCalculator.getBestExperience(unit, exp), isSkipMode);
		}
		
		this._dynamicEvent.executeDynamicEvent();
		
		this.changeCycleMode(MetamorphozeCommandMode.EVENT);
	}
}
);

UnitCommand.MetamorphozeCancel = defineObject(UnitListCommand,
{
	_dynamicEvent: null,
	
	openCommand: function() {
		var generator;
		var isSkipMode = false;
		
		this._dynamicEvent = createObject(DynamicEvent);
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.unitMetamorphoze(this.getCommandTarget(), {}, MetamorphozeActionType.CANCEL, isSkipMode);
		this._dynamicEvent.executeDynamicEvent();
	},
	
	moveCommand: function() {
		if (this._dynamicEvent.moveDynamicEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawCommand: function() {
	},
	
	isCommandDisplayable: function() {
		var metamorphozeData = MetamorphozeControl.getMetamorphozeData(this.getCommandTarget());
		
		if (metamorphozeData === null) {
			return false;
		}
		
		return metamorphozeData.getCancelFlag() & MetamorphozeCancelFlag.MANUAL;
	},
	
	getCommandName: function() {
		var metamorphozeData = MetamorphozeControl.getMetamorphozeData(this.getCommandTarget());
		
		return metamorphozeData.getCancelManualName();
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.METAMORPHOZE);
	}
}
);

UnitCommand.FusionAttack = defineObject(UnitCommand.Attack,
{
	_fusionData: null,
	
	isCommandDisplayable: function() {
		var i, item, indexArray;
		var unit = this.getCommandTarget();
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && ItemControl.isWeaponAvailable(unit, item)) {
				indexArray = this._getIndexArray(unit, item);
				if (indexArray.length !== 0) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	getCommandName: function() {
		return this._fusionData.getCatchName();
	},
	
	setFusionData: function(fusionData) {
		this._fusionData = fusionData;
	},
	
	_prepareCommandMemberData: function() {
		UnitCommand.Attack._prepareCommandMemberData.call(this);
		this._weaponSelectMenu = createObject(FusionWeaponSelectMenu);
	},
	
	_completeCommandMemberData: function() {
		// When the status is shown with PosMenu before battle starts,
		// correction of "Fusion Attack" should be added, so call it at this time.
		FusionControl.startFusionAttack(this.getCommandTarget(), this._fusionData);
		
		UnitCommand.Attack._completeCommandMemberData.call(this);
	},
	
	_moveTop: function() {
		var result = UnitCommand.Attack._moveTop.call(this);
		
		if (result !== MoveResult.CONTINUE) {
			FusionControl.endFusionAttack(this.getCommandTarget());
		}
		
		return result;
	},
	
	_getIndexArray: function(unit, weapon) {
		return AttackChecker.getFusionAttackIndexArray(unit, weapon, this._fusionData);
	},
	
	_createAttackParam: function() {
		var attackParam = UnitCommand.Attack._createAttackParam.call(this);
		
		attackParam.fusionAttackData = this._fusionData;
		
		return attackParam;
	}
}
);

var FusionCommandMode = {
	SELECTION: 0,
	ACTION: 1
};

var BaseFusionCommand = defineObject(UnitListCommand,
{
	_posSelector: null,
	_dynamicEvent: null,
	_fusionData: null,
	
	openCommand: function() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	},
	
	moveCommand: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === FusionCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === FusionCommandMode.ACTION) {
			result = this._moveAction();
		}
		
		return result;
	},
	
	drawCommand: function() {
		var mode = this.getCycleMode();
		
		if (mode === FusionCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === FusionCommandMode.ACTION) {
			this._drawAction();
		}
	},
	
	isCommandDisplayable: function() {
		var indexArray = this._getFusionIndexArray(this.getCommandTarget());
		return indexArray.length !== 0;
	},
	
	getCommandName: function() {
		return '';
	},
	
	setFusionData: function(fusionData) {
		this._fusionData = fusionData;
	},
	
	isRepeatMoveAllowed: function() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.FUSION);
	},
	
	_prepareCommandMemberData: function() {
		this._posSelector = createObject(PosSelector);
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeCommandMemberData: function() {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getFusionIndexArray(this.getCommandTarget());
		
		if (this._isUnitSelection()) {
			this._posSelector.setUnitOnly(unit, null, indexArray, PosMenuType.Default, filter);
		}
		else {
			this._posSelector.setPosOnly(unit, null, indexArray, PosMenuType.Default);
		}
		
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(FusionCommandMode.SELECTION);
	},
	
	_moveSelection: function() {
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				this._changeAction();
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveAction: function() {
		if (this._dynamicEvent.moveDynamicEvent() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_drawSelection: function() {
		this._posSelector.drawPosSelector();
	},
	
	_drawAction: function() {
	},
	
	_doEndAction: function() {
		this.endCommandAction();
	},
	
	_changeAction: function() {
		var generator = this._dynamicEvent.acquireEventGenerator();
		
		this._addFusionEvent(generator);
		this._dynamicEvent.executeDynamicEvent();
		this.changeCycleMode(FusionCommandMode.ACTION);
	},
	
	_addFusionEvent: function(generator) {
	},
	
	_getFusionIndexArray: function(unit) {
		return [];
	},
	
	_isUnitSelection: function() {
		return true;
	},
	
	_isPosSelectable: function() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null;
	},
	
	_getUnitFilter: function() {
		return FilterControl.getBestFilter(this.getCommandTarget().getUnitType(), this._fusionData.getFilterFlag());
	}
}
);

UnitCommand.FusionCatch = defineObject(BaseFusionCommand,
{
	getCommandName: function() {
		return this._fusionData.getCatchName();
	},
	
	_addFusionEvent: function(generator) {
		var unit = this.getCommandTarget();
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		generator.unitFusion(unit, targetUnit, this._fusionData, DirectionType.NULL, FusionActionType.CATCH, false);
	},
	
	_getFusionIndexArray: function(unit) {
		var i, x, y, targetUnit;
		var indexArray = [];
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && FusionControl.isCatchable(unit, targetUnit, this._fusionData)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	}
}
);

UnitCommand.FusionRelease = defineObject(BaseFusionCommand,
{
	getCommandName: function() {
		return this._fusionData.getReleaseName();
	},
	
	_completeCommandMemberData: function() {
		if (this._fusionData.getFusionReleaseType() === FusionReleaseType.ERASE) {
			this._changeAction();
		}
		else {
			BaseFusionCommand._completeCommandMemberData.call(this);
		}
	},
	
	_addFusionEvent: function(generator) {
		var direction;
		var unit = this.getCommandTarget();
		
		if (this._fusionData.getFusionReleaseType() === FusionReleaseType.ERASE) {
			direction = this._getEraseDirection(unit);
		}
		else {
			direction = this._getNormalDirection(unit);
		}
		
		generator.unitFusion(unit, {}, {}, direction, FusionActionType.RELEASE, false);
	},
	
	_getFusionIndexArray: function(unit) {
		var i, x, y, targetUnit;
		var indexArray = [];
		var child = FusionControl.getFusionChild(unit);
		
		if (child === null) {
			return indexArray;
		}
		
		if (this._fusionData.getFusionReleaseType() === FusionReleaseType.ERASE) {
			return [0];
		}
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			if (!this._isPosEnabled(x, y)) {
				continue;
			}
			
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit === null && PosChecker.getMovePointFromUnit(x, y, child) !== 0) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	},
	
	_isUnitSelection: function() {
		return false;
	},
	
	_isPosSelectable: function() {
		var pos = this._posSelector.getSelectorPos(true);
		
		return pos !== null;
	},
	
	_getNormalDirection: function(unit) {
		var i, x, y;
		var pos = this._posSelector.getSelectorPos(true);
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			if (x === pos.x && y === pos.y) {
				return i;
			}
		}
		
		return DirectionType.NULL;
	},
	
	_getEraseDirection: function(unit) {
		var i, x, y, targetUnit, direction;
		var indexArray = [];
		var child = FusionControl.getFusionChild(unit);
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit === null && PosChecker.getMovePointFromUnit(x, y, child) !== 0) {
				return i;
			}
		}
		
		if (CurrentMap.isMapInside(unit.getMapX() - 1, unit.getMapY())) {
			direction = DirectionType.LEFT;
		}
		else {
			direction = DirectionType.RIGHT;
		}
		
		return direction;
	},
	
	_isPosEnabled: function(x, y) {
		var n = root.getCurrentSession().getMapBoundaryValue();
		
		if (x < n || y < n) {
			return false;
		}
		
		if (x > CurrentMap.getWidth() - 1 - n || y > CurrentMap.getHeight() - 1 - n) {
			return false;
		}
		
		return true;
	}
}
);

UnitCommand.FusionUnitTrade = defineObject(BaseFusionCommand,
{
	getCommandName: function() {
		return this._fusionData.getTradeName();
	},
	
	_doEndAction: function() {
		this.setExitCommand(this);
		this.rebuildCommand();
	},
	
	_addFusionEvent: function(generator) {
		var unit = this.getCommandTarget();
		var targetUnit = this._posSelector.getSelectorTarget(true);
		var child = FusionControl.getFusionChild(unit);
		
		if (child !== null) {
			generator.unitFusion(unit, targetUnit, {}, DirectionType.NULL, FusionActionType.TRADE, false);
		}
		else {
			generator.unitFusion(targetUnit, unit, {}, DirectionType.NULL, FusionActionType.TRADE, false);
		}
	},
	
	_getFusionIndexArray: function(unit) {
		var i, x, y, targetUnit, targetChild;
		var indexArray = [];
		var child = FusionControl.getFusionChild(unit);
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit === null) {
				continue;
			}
			
			// Check if targetUnit can receive a child (the unit catches it).
			if (child !== null && this._isTradable(targetUnit, child)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
			else {
				targetChild = FusionControl.getFusionChild(targetUnit);
				// Check if the unit can receive targetChild (targetUnit catches it).
				if (targetChild !== null && this._isTradable(unit, targetChild)) {
					indexArray.push(CurrentMap.getIndex(x, y));
				}
			}
		}
		
		return indexArray;
	},
	
	_isTradable: function(unit, targetUnit) {
		if (!this._fusionData.isUnitTradable()) {
			return false;
		}
		
		if (FusionControl.getFusionChild(unit) !== null) {
			return false;
		}
		
		if (FusionControl.getFusionData(targetUnit) !== this._fusionData) {
			return false;
		}
		
		return FusionControl.isControllable(unit, targetUnit, this._fusionData);
	},
	
	_getUnitFilter: function() {
		var i, x, y, targetUnit, targetChild;
		var filterFlag = 0;
		var unit = this.getCommandTarget();
		var child = FusionControl.getFusionChild(unit);
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit === null) {
				continue;
			}
			
			if (child !== null && this._isTradable(targetUnit, child)) {
				filterFlag |= FusionControl.getFusionData(unit).getFilterFlag();
			}
			else {
				targetChild = FusionControl.getFusionChild(targetUnit);
				if (targetChild !== null && this._isTradable(unit, targetChild)) {
					filterFlag |= FusionControl.getFusionData(targetUnit).getFilterFlag();
				}
			}
		}
		
		return FilterControl.getBestFilter(unit.getUnitType(), filterFlag);
	}
}
);

var KeyNavigatorMode = {
	SELECTION: 0,
	FLOW: 1
};

var KeyNavigator = defineObject(BaseObject,
{
	_unit: null,
	_keyData: null,
	_requireFlag: 0,
	_isUsed: false,
	_itemSelection: null,
	_straightFlow: null,
	_placeEvent: null,

	openKeyNavigator: function(unit, keyData) {
		this._prepareMemberData(unit, keyData);
		this._completeMemberData(unit, keyData);
	},
	
	moveKeyNavigator: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === KeyNavigatorMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === KeyNavigatorMode.FLOW) {
			result = this._moveFlow();
		}
		
		return result;
	},
	
	drawKeyNavigator: function() {
		var mode = this.getCycleMode();
		
		if (mode === KeyNavigatorMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === KeyNavigatorMode.FLOW) {
			this._drawFlow();
		}
	},
	
	isUsed: function() {
		return this._isUsed;
	},
	
	getUnit: function() {
		return this._unit;
	},
	
	getRequireFlag: function() {
		return this._requireFlag;
	},
	
	getPlaceEvent: function() {
		return this._placeEvent;
	},
	
	getKeyData: function() {
		return this._keyData;
	},
	
	_prepareMemberData: function(unit, keyData) {
		this._unit = unit;
		this._keyData = keyData;
		this._posSelector = createObject(PosSelector);
		this._straightFlow = createObject(StraightFlow);
	},
	
	_completeMemberData: function(unit, keyData) {
		var indexArray;
		
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		
		if (keyData.rangeType === SelectionRangeType.SELFONLY) {
			this._isUsed = true;
			this._placeEvent = KeyEventChecker.getKeyEvent(unit.getMapX(), unit.getMapY(), keyData);
			this._straightFlow.enterStraightFlow();
			this.changeCycleMode(KeyNavigatorMode.FLOW);
		}
		else {
			indexArray = KeyEventChecker.getIndexArrayFromKeyType(unit, keyData);
			this._posSelector.setPosOnly(unit, null, indexArray, PosMenuType.Default);
			this._posSelector.setFirstPos();
			this.changeCycleMode(KeyNavigatorMode.SELECTION);
		}
	},
	
	_moveSelection: function() {
		var event;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			event = this._getTargetEvent();
			if (event !== null) {
				this._posSelector.endPosSelector();
				
				this._isUsed = true;
				this._placeEvent = event;
				result = this._straightFlow.enterStraightFlow();
				if (result === EnterResult.NOTENTER) {
					return MoveResult.END;
				}
				else {
					this.changeCycleMode(KeyNavigatorMode.FLOW);
				}
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}

		return MoveResult.CONTINUE;
	},
	
	_moveFlow: function() {
		return this._straightFlow.moveStraightFlow();
	},
	
	_drawSelection: function() {
		this._posSelector.drawPosSelector();
	},
	
	_drawFlow: function() {
		this._straightFlow.drawStraightFlow();
	},
	
	_getTargetEvent: function() {
		var pos = this._posSelector.getSelectorPos(true);
		
		if (pos === null) {
			return null;
		}
		
		return KeyEventChecker.getKeyEvent(pos.x, pos.y, this._keyData);
	},
	
	_pushFlowEntries: function(straightFlow) {
		straightFlow.pushFlowEntry(KeyAnimeFlowEntry);
		straightFlow.pushFlowEntry(KeyTrophyFlowEntry);
		straightFlow.pushFlowEntry(KeyExpFlowEntry);
	}
}
);

// Display an animation which is set at the key item.
var KeyAnimeFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicAnime: null,
	
	enterFlowEntry: function(keyNavigator) {
		this._prepareMemberData(keyNavigator);
		return this._completeMemberData(keyNavigator);
	},
	
	moveFlowEntry: function() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawFlowEntry: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	_prepareMemberData: function(keyNavigator) {
		this._dynamicAnime = createObject(DynamicAnime);
	},
	
	_completeMemberData: function(keyNavigator) {
		var animeData, pos;
		var keyData = keyNavigator.getKeyData();
		
		if (keyData.item === null) {
			return EnterResult.NOTENTER;
		}
		
		animeData = keyData.item.getItemAnime();
		if (animeData === null) {
			return EnterResult.NOTENTER;
		}
		
		pos = this._getPlaceAnimePos(keyNavigator, animeData);
		this._dynamicAnime.startDynamicAnime(animeData, pos.x, pos.y);
		
		return EnterResult.OK;
	},
	
	_getPlaceAnimePos: function(keyNavigator, animeData) {
		var info = keyNavigator.getPlaceEvent().getPlaceEventInfo();
		var x = LayoutControl.getPixelX(info.getX());
		var y = LayoutControl.getPixelY(info.getY());
		
		return LayoutControl.getMapAnimationPos(x, y, animeData);
	}
}
);

// Get the trophy.
var KeyTrophyFlowEntry = defineObject(BaseFlowEntry,
{
	_eventTrophy: null,
	
	enterFlowEntry: function(keyNavigator) {
		this._prepareMemberData(keyNavigator);
		return this._completeMemberData(keyNavigator);
	},
	
	moveFlowEntry: function() {
		return this._eventTrophy.moveEventTrophyCycle();
	},
	
	drawFlowEntry: function() {
		this._eventTrophy.drawEventTrophyCycle();
	},
	
	_prepareMemberData: function(keyNavigator) {
		this._eventTrophy = createObject(EventTrophy);
	},
	
	_completeMemberData: function(keyNavigator) {
		var unit = keyNavigator.getUnit();
		var keyData = keyNavigator.getKeyData();
		
		if (keyData.item !== null) {
			ItemControl.decreaseItem(unit, keyData.item);
		}
		
		return this._eventTrophy.enterEventTrophyCycle(unit, keyNavigator.getPlaceEvent());
	}
}
);

// Obtain the exp which is set at the key item.
var KeyExpFlowEntry = defineObject(BaseFlowEntry,
{
	_dynamicEvent: null,
	
	enterFlowEntry: function(keyNavigator) {
		this._prepareMemberData(keyNavigator);
		return this._completeMemberData(keyNavigator);
	},
	
	moveFlowEntry: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	drawFlowEntry: function() {
	},
	
	_prepareMemberData: function(keyNavigator) {
		this._keyNavigator = keyNavigator;
		this._dynamicEvent = createObject(DynamicEvent);
	},
	
	_completeMemberData: function(keyNavigator) {
		var generator, exp;
		var unit = keyNavigator.getUnit();
		var keyData = keyNavigator.getKeyData();
		var isSkipMode = false;
		
		if (keyData.item === null) {
			return EnterResult.NOTENTER;
		}
		
		exp = ExperienceCalculator.getBestExperience(unit, keyData.item.getExp());
		if (exp === 0) {
			return EnterResult.NOTENTER;
		}
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.experiencePlus(unit, exp, isSkipMode);
		
		return this._dynamicEvent.executeDynamicEvent();
	}
}
);
