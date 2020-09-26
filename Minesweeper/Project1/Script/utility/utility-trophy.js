
var TrophyCollectType = {
	POOL: 0,
	STOCK: 1,
	UNIT: 2,
	DROP: 3
};

var TrophyCollector = defineObject(BaseObject,
{
	_unit: null,
	_dynamicEvent: null,
	_generator: null,
	
	prepareTrophy: function(unit) {
		this._unit = unit;
	},
	
	addTrophy: function(trophy) {
		var unit = this._unit;
		
		if (unit === null) {
			if (trophy.isImmediately()) {
				this._addStock(trophy);
			}
			else {
				this._addPool(trophy);
			}
		}
		else if (unit.getUnitType() !== UnitType.PLAYER) {
			this._addDrop(trophy);
		}
		else {
			if (trophy.isImmediately()) {
				this._addUnit(trophy, true);
			}
			else {
				this._addPool(trophy);
			}	
		}
	},
	
	deleteTrophy: function(trophy) {
		var unit = this._unit;
		
		if (unit === null) {
			if (trophy.isImmediately()) {
				this._deleteStock(trophy);
			}
			else {
				this._deletePool(trophy);
			}
		}
		else if (unit.getUnitType() !== UnitType.PLAYER) {
			this._deleteDrop(trophy);
		}
		else {
			if (trophy.isImmediately()) {
				this._deleteUnit(trophy);
			}
			else {
				this._deletePool(trophy);
			}	
		}
	},
	
	deleteAllTrophy: function() {
		var list;
		var unit = this._unit;
		var editor = root.getCurrentSession().getTrophyEditor();
		
		if (unit === null) {
			list = root.getCurrentSession().getTrophyPoolList();
		}
		else {
			list = unit.getDropTrophyList();
		}
		
		editor.deleteAllTrophy(list);
	},
	
	enterTrophyCollector: function() {
		if (this._dynamicEvent !== null) {
			return this._dynamicEvent.executeDynamicEvent();
		}
	
		return EnterResult.NOTENTER;
	},
	
	moveTrophyCollector: function() {
		if (this._dynamicEvent !== null) {
			return this._dynamicEvent.moveDynamicEvent();
		}
		
		return MoveResult.END;
	},
	
	drawTrophyCollector: function() {
	},
	
	_addPool: function(trophy) {
		var list = root.getCurrentSession().getTrophyPoolList();
		var editor = root.getCurrentSession().getTrophyEditor();
		
		editor.addTrophy(list, trophy);
	},
	
	_addStock: function(trophy) {
		var item;
		var flag = trophy.getFlag();
		var isSkipMode = CurrentMap.isCompleteSkipMode();
		
		if (this._dynamicEvent === null) {
			this._dynamicEvent = createObject(DynamicEvent);
			this._generator = this._dynamicEvent.acquireEventGenerator();
		}
			
		if (flag & TrophyFlag.ITEM) {
			item = trophy.getItem();
			if (item !== null) {
				this._generator.stockItemChange(item, IncreaseType.INCREASE, isSkipMode);
			}
		}
		if (flag & TrophyFlag.GOLD) {
			this._generator.goldChange(trophy.getGold(), IncreaseType.INCREASE, isSkipMode);
		}
		if (flag & TrophyFlag.BONUS) {
			this._generator.bonusChange(trophy.getBonus(), IncreaseType.INCREASE, isSkipMode);
		}
	},
	
	_addUnit: function(trophy, isAll) {
		var flag = trophy.getFlag();
		var unit = this._unit;
		var isSkipMode = CurrentMap.isCompleteSkipMode();
		
		if (this._dynamicEvent === null) {
			this._dynamicEvent = createObject(DynamicEvent);
			this._generator = this._dynamicEvent.acquireEventGenerator();
		}
			
		if (flag & TrophyFlag.ITEM) {
			this._generator.unitItemChange(unit, trophy.getItem(), IncreaseType.INCREASE, isSkipMode);
		}
		
		if (isAll) {
			if (flag & TrophyFlag.GOLD) {
				this._generator.goldChange(trophy.getGold(), IncreaseType.INCREASE, isSkipMode);
			}
			if (flag & TrophyFlag.BONUS) {
				this._generator.bonusChange(trophy.getBonus(), IncreaseType.INCREASE, isSkipMode);
			}
		}
	},
	
	_addDrop: function(trophy) {
		var list = this._unit.getDropTrophyList();
		var editor = root.getCurrentSession().getTrophyEditor();
		
		editor.addTrophy(list, trophy);
		
		// By specifying false, gold/bonus don't increase/decrease at that place.
		this._addUnit(trophy, false);
	},
	
	_deletePool: function(trophy) {
		this._deleteTrophy(root.getCurrentSession().getTrophyPoolList(), trophy);
	},
	
	_deleteStock: function(trophy) {
		var flag = trophy.getFlag();
		var isSkipMode = CurrentMap.isCompleteSkipMode();
		
		if (this._dynamicEvent === null) {
			this._dynamicEvent = createObject(DynamicEvent);
			this._generator = this._dynamicEvent.acquireEventGenerator();
		}
			
		if (flag & TrophyFlag.ITEM) {
			this._generator.stockItemChange(trophy.getItem(), IncreaseType.DECREASE, isSkipMode);
		}
		if (flag & TrophyFlag.GOLD) {
			this._generator.goldChange(trophy.getGold(), IncreaseType.DECREASE, isSkipMode);
		}
		if (flag & TrophyFlag.BONUS) {
			this._generator.bonusChange(trophy.getBonus(), IncreaseType.DECREASE, isSkipMode);
		}
	},
	
	_deleteUnit: function(trophy) {
		var flag = trophy.getFlag();
		var unit = this._unit;
		var isSkipMode = CurrentMap.isCompleteSkipMode();
		
		if (this._dynamicEvent === null) {
			this._dynamicEvent = createObject(DynamicEvent);
			this._generator = this._dynamicEvent.acquireEventGenerator();
		}
			
		if (flag & TrophyFlag.ITEM) {
			this._generator.unitItemChange(unit, trophy.getItem(), IncreaseType.DECREASE, isSkipMode);
		}
		if (flag & TrophyFlag.GOLD) {
			this._generator.goldChange(trophy.getGold(), IncreaseType.DECREASE, isSkipMode);
		}
		if (flag & TrophyFlag.BONUS) {
			this._generator.bonusChange(trophy.getBonus(), IncreaseType.DECREASE, isSkipMode);
		}
	},
	
	_deleteDrop: function(trophy) {
		this._deleteTrophy(this._unit.getDropTrophyList(), trophy);
	},
	
	_deleteTrophy: function(list, trophy) {
		var i, data;
		var count = list.getCount();
		var editor = root.getCurrentSession().getTrophyEditor();
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (data.getGold() === trophy.getGold() && data.getBonus() === trophy.getBonus() && ItemControl.compareItem(data.getItem(), trophy.getItem())) {
				editor.deleteTrophy(list, data);
				break;
			}
		}
	}
}
);

var EventTrophyMode = {
	EVENT: 0,
	TROPHY: 1
};

var EventTrophy = defineObject(BaseObject,
{
	_unit: null,
	_event: null,
	_capsuleEvent: null,
	_trophyCollector: null,
	
	enterEventTrophyCycle: function(unit, event) {
		this._prepareMemberData(unit, event);
		return this._completeMemberData(unit, event);
	},
	
	moveEventTrophyCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === EventTrophyMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === EventTrophyMode.TROPHY) {
			result = this._moveTrophy();
		}
		
		return result;
	},
	
	drawEventTrophyCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === EventTrophyMode.TROPHY) {
			this._trophyCollector.drawTrophyCollector();
		}
	},
	
	_prepareMemberData: function(unit, event) {
		this._unit = unit;
		this._event = event;
		this._capsuleEvent = createObject(CapsuleEvent);
		this._trophyCollector = createObject(TrophyCollector);
	},
	
	_completeMemberData: function(unit, event) {
		var trophy;
		var placeInfo = event.getPlaceEventInfo();
		
		if (placeInfo === null) {
			return EnterResult.NOTENTER;
		}
		
		placeInfo.startMapChipChange();
		
		this._playOpenSound();
		
		this._capsuleEvent.enterCapsuleEvent(event, true);
		
		trophy = placeInfo.getTrophy();
		if (CurrentMap.isCompleteSkipMode()) {
			return this._doSkipAction(unit, trophy);
		}
		
		this.changeCycleMode(EventTrophyMode.EVENT);
		
		return EnterResult.OK;
	},
	
	_doSkipAction: function(unit, trophy) {
		var result = root.getEventExitCode();
		
		if (result === EventResult.PENDING) {
			// Enter the cycle because the event cannot be skipped.
			this.changeCycleMode(EventTrophyMode.EVENT);
			return EnterResult.OK;
		}
		
		if (trophy.getFlag() !== 0) {
			this._collectTrophy();
			result = this._trophyCollector.enterTrophyCollector();
			if (result !== EnterResult.NOTENTER) {
				// Enter the cycle because the trophy process cannot be skipped.
				this.changeCycleMode(EventTrophyMode.TROPHY);
				return EnterResult.OK;
			}
		}
		
		return EnterResult.NOTENTER;
	},
	
	_moveEvent: function() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			if (this._trophyCollector === null) {
				// If no trophy process, immediately end.
				return MoveResult.END;
			}
			
			this._collectTrophy();
			this._trophyCollector.enterTrophyCollector();
			this.changeCycleMode(EventTrophyMode.TROPHY);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveTrophy: function() {
		if (this._trophyCollector.moveTrophyCollector() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_collectTrophy: function() {
		var placeInfo = this._event.getPlaceEventInfo();
		var trophy = placeInfo.getTrophy();
		
		if (trophy.getFlag() !== 0) {
			this._trophyCollector.prepareTrophy(this._unit);
			this._trophyCollector.addTrophy(trophy);
		}
	},
	
	_playOpenSound: function() {
		var placeInfo = this._event.getPlaceEventInfo();
		var placeEventType = placeInfo.getPlaceEventType();
		
		if (placeEventType === PlaceEventType.TREASURE) {
			this._playTreasureOpenSound();
		}
		else if (placeEventType === PlaceEventType.GATE) {
			this._playGateOpenSound();
		}
	},
	
	_playTreasureOpenSound: function() {
		MediaControl.soundDirect('treasureopen');
	},
	
	_playGateOpenSound: function() {
		MediaControl.soundDirect('gateopen');
	}
}
);
