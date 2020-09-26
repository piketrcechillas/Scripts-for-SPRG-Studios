
var EventCommonArray = {
	createArray: function(eventList, eventType) {
		var i, count, event, list;
		var firstArray = [];
		var lastArray = [];
		var eventArray = [];
		
		if (this._isMapCommonDisabled || root.getBaseScene() === SceneType.REST) {
			count = eventList.getCount();
			for (i = 0; i < count; i++) {
				eventArray.push(eventList.getData(i));
			}
			return eventArray;
		}
		
		list = root.getCurrentSession().getMapCommonEventList();
		count = list.getCount();
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			if (event.getCommonEventInfo().getEventType() === eventType) {
				if (event.getCommonEventInfo().isFirst()) {
					firstArray.push(event);
				}
				else {
					lastArray.push(event);
				}
			}
		}
		
		count = firstArray.length;
		for (i = 0; i < count; i++) {
			eventArray.push(firstArray[i]);
		}
		
		count = eventList.getCount();
		for (i = 0; i < count; i++) {
			eventArray.push(eventList.getData(i));
		}
		
		count = lastArray.length;
		for (i = 0; i < count; i++) {
			eventArray.push(lastArray[i]);
		}
		
		return eventArray;
	}
};

var EventChecker = defineObject(BaseObject,
{
	_eventArray: null,
	_capsuleEvent: null,
	_eventIndex: 0,
	_isMapCommonDisabled: false,
	_isAllSkipEnabled: false,
	
	enterEventChecker: function(eventList, eventType) {
		this._eventArray = this._createEventArray(eventList, eventType);
		
		this._capsuleEvent = createObject(CapsuleEvent);
		this._eventIndex = 0;
		
		// EventCommandManager can track that the event ends
		EventCommandManager.setActiveEventChecker(this);
		
		return this._checkEvent();
	},
	
	moveEventChecker: function() {
		if (this._capsuleEvent === null) {
			EventCommandManager.setActiveEventChecker(null);
			return MoveResult.END;
		}
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			if (this._checkEvent() === EnterResult.NOTENTER) {
				EventCommandManager.setActiveEventChecker(null);
				this._capsuleEvent = null;
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	disableMapCommonEvent: function() {
		this._isMapCommonDisabled = true;
	},
	
	enableAllSkip: function() {
		this._isAllSkipEnabled = true;
	},
	
	_createEventArray: function(eventList, eventType) {
		return EventCommonArray.createArray(eventList, eventType);
	},
	
	_checkEvent: function() {
		var i, count, event, result;
		
		count = this._eventArray.length;
		for (i = this._eventIndex; i < count; i++) {
			this._eventIndex++;
			event = this._eventArray[i];
			
			if (event !== null && event.isEvent() && event.getExecutedMark() === EventExecutedType.FREE) {
				if (this._isAllSkipEnabled) {
					root.setEventSkipMode(true);
				}
				
				if (!this._isSessionEnabled()) {
					continue;
				}
				
				result = this._capsuleEvent.enterCapsuleEvent(event, true);
				if (result === EnterResult.OK) {
					return EnterResult.OK;
				}
			}
		}
		
		return EnterResult.NOTENTER;
	},
	
	// If the session doesn't exist or the map cannot be gotten, return false with this method.
	// For instance, when getting back to the title with "Change Scene" at the auto start event and
	// access to the map with the map common event, false is returned. 
	_isSessionEnabled: function() {
		var session = root.getCurrentSession();
		
		if (session === null) {
			return false;
		}
		
		return session.getCurrentMapInfo() !== null;
	}
}
);

// This object is used at the base opening event and the base ending event.
var RestEventChecker = defineObject(EventChecker,
{
	_isSessionEnabled: function() {
		return root.getCurrentSession() !== null;
	}
}
);

var RestAutoEventChecker = defineObject(EventChecker,
{
	_createEventArray: function(eventList, restAutoType) {
		var i, event;
		var count = eventList.getCount();
		var eventArray = [];
		
		for (i = 0; i < count; i++) {
			event = eventList.getData(i);
			if (event.getRestEventInfo().getRestAutoType() === restAutoType) {
				eventArray.push(event);
			}
		}
		
		return eventArray;
	},
	
	_isSessionEnabled: function() {
		return root.getCurrentSession() !== null;
	}
}
);

var CapsuleEventMode = {
	RECOLLECTION: 0,
	NORMAL: 1,
	NONE: 2
};

var CapsuleEvent = defineObject(BaseObject,
{
	_isExecuteMark: false,
	_event: null,
	_battleUnit: null,
	
	enterCapsuleEvent: function(event, isExecuteMark) {
		var mode, result, assocEvent;
		
		if (event === null) {
			return EnterResult.NOTENTER;
		}
		
		assocEvent = event.getAssociateRecollectionEvent();
		
		this._isExecuteMark = isExecuteMark;
		
		// Execute the recollection event.
		result = this._startRecollectionEvent(assocEvent);
		if (result === EnterResult.NOTENTER) {
			// The following code is executed, it means that the execution of the recollection event has ended,
			// or the recollection event has never existed.
			
			// Execute the normal event.
			result = this._startNormalEvent(event);
			if (result === EnterResult.NOTENTER) {
				this.changeCycleMode(CapsuleEventMode.NONE);
				return EnterResult.NOTENTER;
			}
			
			this._event = event;
			mode = CapsuleEventMode.NORMAL;
		}
		else {
			this._event = event;
			mode = CapsuleEventMode.RECOLLECTION;
		}
		
		this.changeCycleMode(mode);
		
		return result;
	},
	
	setBattleUnit: function(unit) {
		this._battleUnit = unit;
	},
	
	moveCapsuleEvent: function() {
		var result;
		var mode = this.getCycleMode();
		
		if (mode === CapsuleEventMode.NONE) {
			return MoveResult.END;
		}
		
		if (EventCommandManager.isEventRunning(this._event)) {
			// Don't continue because the event is still executed.
			return MoveResult.CONTINUE;
		}
		
		if (mode === CapsuleEventMode.RECOLLECTION) {
			// If the recollection event ends, execute the normal event.
			result = this._startNormalEvent(this._event);
			if (result === EnterResult.NOTENTER) {
				this._doEndAction();
				return MoveResult.END;
			}
			
			this.changeCycleMode(CapsuleEventMode.NORMAL);
		}
		else if (mode === CapsuleEventMode.NORMAL) {
			// If the normal event ends, it means to end to process.
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_startNormalEvent: function(event) {
		return this._startAndMarkEvent(event, this._isExecuteMark, this._battleUnit !== null);
	},
	
	_startRecollectionEvent: function(event) {
		// The recollection event is always executed, so the second argument is true.
		return this._startAndMarkEvent(event, true, false);
	},
	
	_startAndMarkEvent: function(event, isExecuteMark, isBattle) {
		if (event === null) {
			return EnterResult.NOTENTER;
		}
		
		// Execute before startEvent/startBattleEvent,
		// so that executed mark is disabled with "Event State Change" of the event command.
		if (isExecuteMark) {
			// With this calling, the event is executed.
			event.setExecutedMark(EventExecutedType.EXECUTED);
		}
		
		if (isBattle) {
			event.startBattleEvent(this._battleUnit);
		}
		else {
			event.startEvent();
		}
		
		return EventCommandManager.returnEnterCode();
	},
	
	_doEndAction: function() {
		root.setEventSkipMode(false);
	}
}
);

var DemoMapEventMode = {
	BLACKOUT: 0,
	EVENT: 1,
	BLACKIN: 2
};

var DemoMapEvent = defineObject(BaseObject,
{
	_mapId: 0,
	_eventChecker: null,
	_transition: null,
	_isTransitionEnabled: false,

	enterDemoMapEvent: function(mapId) {
		this._prepareMemberData(mapId);
		return this._completeMemberData(mapId);
	},
	
	moveDemoMapEvent: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === DemoMapEventMode.BLACKOUT) {
			result = this._moveBlackout();
		}
		else if (mode === DemoMapEventMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === DemoMapEventMode.BLACKIN) {
			result = this._moveBlackin();
		}
		
		return result;
	},
	
	drawDemoMapEvent: function() {
		if (this.getCycleMode() === DemoMapEventMode.EVENT) {
			MapLayer.drawMapLayer();
			MapLayer.drawUnitLayer();
		}
	},
	
	backDemoMapEvent: function() {
		MapLayer.moveMapLayer();
		
		return MoveResult.CONTINUE;
	},
	
	enableTransition: function(isEnabled) {
		this._isTransitionEnabled = isEnabled;
	},
	
	_moveBlackout: function() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			if (!this._startMap()) {
				if (!this._startBlackOut()) {
					return MoveResult.END;
				}
			}
			
			return MoveResult.CONTINUE;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEvent: function() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			root.closeMap();
			
			if (!this._startBlackOut()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveBlackin: function() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_prepareMemberData: function(mapId) {
		this._eventChecker = createObject(EventChecker);
		this._transition = createObject(SystemTransition);
		this._mapId = mapId;
	},
	
	_completeMemberData: function(mapId) {
		if (mapId === -1) {
			return EnterResult.NOTENTER;
		}
		
		if (this._isTransitionEnabled && !SceneManager.isScreenFilled()) {
			this._transition.setFadeSpeed(this._getChangeSpeed());
			this._transition.setDestOut();
			this.changeCycleMode(DemoMapEventMode.BLACKOUT);
			return EnterResult.OK;
		}
		
		return this._startMap() ? EnterResult.OK : EnterResult.NOENTER;
	},
	
	_startMap: function() {
		if (!root.openMap(this._mapId)) {
			return false;
		}
		
		SceneManager.resetCurrentMap();
		
		this._eventChecker.enterEventChecker(this._getEventList(), this._getEventType());
		
		this.changeCycleMode(DemoMapEventMode.EVENT);
		
		return true;
	},
	
	_startBlackOut: function() {
		if (this._isTransitionEnabled && SceneManager.isScreenFilled()) {
			this._transition.setFadeSpeed(this._getChangeSpeed());
			this._transition.setDestIn();
			this.changeCycleMode(DemoMapEventMode.BLACKIN);
			
			return true;
		}
		
		return false;
	},
	
	_getEventList: function() {
		// Session returned with this method is a Session of the map opened by OpenMap.
		return root.getCurrentSession().getOpeningEventList();
	},
	
	_getEventType: function() {
		return EventType.OPENING;
	},
	
	_getChangeSpeed: function() {
		return 8;
	}
}
);

var DynamicEvent = defineObject(BaseObject,
{
	_generator: null,
	_event: null,
	
	acquireEventGenerator: function() {
		this._generator = root.getEventGenerator();
		
		return this._generator;
	},
	
	executeDynamicEvent: function() {
		this._event = this._generator.execute();
		
		return EventCommandManager.returnEnterCode();
	},
	
	moveDynamicEvent: function() {
		if (EventCommandManager.isEventRunning(this._event)) {
			return MoveResult.CONTINUE;
		}
		
		return MoveResult.END;
	}
}
);

var DynamicAnime = defineObject(BaseObject,
{
	_motion: null,
	_isLoopMode: false,
	_defaultMotionColorIndex: 0,
	
	startDynamicAnime: function(anime, x, y) {
		var motionParam;
		
		if (anime === null) {
			return null;
		}
		
		motionParam = StructureBuilder.buildMotionParam();
		motionParam.animeData = anime;
		motionParam.x = x;
		motionParam.y = y;
		motionParam.isRight = true;
		motionParam.motionId = 0;
		motionParam.motionColorIndex = this._defaultMotionColorIndex;
		
		this._motion = createObject(AnimeMotion);
		this._motion.setMotionParam(motionParam);
		
		return this._motion;
	},
	
	moveDynamicAnime: function() {
		var result;
		
		if (this._motion === null || InputControl.isStartAction()) {
			return MoveResult.END;
		}
		
		result = this._motion.moveMotion();
		
		MapLayer.setEffectMotion(this._motion);
		
		if (result !== MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		this._motion.nextFrame();
		if (this._motion.isLastFrame()) {
			MapLayer.setEffectMotion(null);
			if (this._isLoopMode) {
				this._motion.setFrameIndex(0);
			}
			else {
				this._motion = null;
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawDynamicAnime: function() {
		if (this._motion === null) {
			return;
		}
		
		if (this._motion.getScreenEffectRangeType() === EffectRangeType.ALL) {
			// If it's EffectRangeType.ALL, draw explicitly.
			this._motion.drawBackgroundAnime();
			this._motion.drawScreenColor();
		}
		
		this._motion.drawMotion(0, 0);
	},
	
	endEffect: function() {
		this._motion = null;
	},
	
	isEffectLast: function() {
		if (this._motion === null) {
			return true;
		}
		
		return this._motion.isLastFrame();
	},
	
	getEffectX: function() {
		return this._motion.getX();
	},
	
	getEffectY: function() {
		return this._motion.getY();
	},
	
	getFrameIndex: function() {
		return this._motion.getFrameIndex();
	},
	
	getFrameCount: function() {
		return this._motion.getFrameCount();
	},
	
	getAnimeMotion: function() {
		return this._motion;
	},
	
	setLoopMode: function(isLoopMode) {
		this._isLoopMode = isLoopMode;
	},
	
	setDefaultMotionColorIndex: function(colorIndex) {
		this._defaultMotionColorIndex = colorIndex;
	}
}
);
