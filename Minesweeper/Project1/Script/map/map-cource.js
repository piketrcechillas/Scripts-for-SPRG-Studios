
var SimulateMove = defineObject(BaseObject,
{
	_unit: null,
	_moveCount: 0,
	_moveMaxCount: 0,
	_xPixel: 0,
	_yPixel: 0,
	_isMoveFinal: false,
	_dxSpeedValue: 0,
	_dySpeedValue: 0,
	_unitCounter: null,
	_moveCource: null,
	
	createCource: function(unit, x, y, simulator) {
		var index = CurrentMap.getIndex(x, y);
		
		return CourceBuilder.createRangeCource(unit, index, simulator);
	},
	
	getGoalPos: function(unit, moveCource) {
		var i, direction;
		var count = moveCource.length;
		var x = unit.getMapX();
		var y = unit.getMapY();
		
		for (i = 0; i < count; i++) {
			direction = moveCource[i];
			x += XPoint[direction];
			y += YPoint[direction];
		}
		
		return createPos(x, y);
	},
	
	skipMove: function(unit, moveCource) {
		var pos = this.getGoalPos(unit, moveCource);
		
		unit.setMapX(pos.x);
		unit.setMapY(pos.y);
		
		this._endMove(unit);
	},
	
	startMove: function(unit, moveCource) {
		var i;
		var moveMaxCount = moveCource.length;
		
		// Save a consume mov.
		this._saveMostResentMov(unit, moveCource);
		
		// If it's 0, no need to move from the current position.
		if (moveMaxCount === 0) {
			this._endMove(unit);
			return;
		}
		
		this._unit = unit;
		this._moveCount = 0;
		this._moveMaxCount = moveMaxCount;
		this._xPixel = this._unit.getMapX() * GraphicsFormat.MAPCHIP_WIDTH;
		this._yPixel = this._unit.getMapY() * GraphicsFormat.MAPCHIP_HEIGHT;
		this._isMoveFinal = false;
		this._dxSpeedValue = this._getUnitSppedValue(GraphicsFormat.MAPCHIP_WIDTH);
		this._dySpeedValue = this._getUnitSppedValue(GraphicsFormat.MAPCHIP_HEIGHT);
		this._unitCounter = createObject(UnitCounter);
		
		this._moveCource = [];
		for (i = 0; i < moveMaxCount; i++) {
			this._moveCource[i] = moveCource[i];
		}
		
		this._unit.setDirection(moveCource[0]);
		
		// Disable to draw the default so as to draw the moving unit explicitly.
		this._unit.setInvisible(true);
	},
	
	noMove: function(unit) {
		unit.setDirection(DirectionType.NULL);
		unit.setMostResentMov(0);
	},
	
	moveUnit: function() {
		var x, y;
		var dx = this._dxSpeedValue;
		var dy = this._dySpeedValue;
		var chipWidth = GraphicsFormat.MAPCHIP_WIDTH;
		var chipHeight = GraphicsFormat.MAPCHIP_HEIGHT;
		
		if (this._isMoveFinal) {
			return MoveResult.END;
		}
		
		if (DataConfig.isHighPerformance()) {
			dx /= 2;
			dy /= 2;
		}
		
		this._controlScroll(dx, dy);
		
		this._xPixel += XPoint[this._unit.getDirection()] * dx;
		this._yPixel += YPoint[this._unit.getDirection()] * dy;
		
		if ((this._xPixel % chipWidth) === 0 && (this._yPixel % chipHeight) === 0) {
			this._playMovingSound();
			this._moveCount++;
			if (this._moveCount === this._moveMaxCount) {
				x = Math.floor(this._xPixel / chipWidth);
				y = Math.floor(this._yPixel / chipHeight);
				this._unit.setMapX(x);
				this._unit.setMapY(y); 
				this._endMove(this._unit);
				return MoveResult.END;
			}
			else {
				this._unit.setDirection(this._moveCource[this._moveCount]);
			}
		}
		
		this._unitCounter.moveUnitCounter();
		
		return MoveResult.CONTINUE;
	},
	
	drawUnit: function() {
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		
		if (this._isMoveFinal) {
			return;
		}
		
		unitRenderParam.direction = this._unit.getDirection();
		unitRenderParam.animationIndex = this._unitCounter.getAnimationIndexFromUnit(this._unit);
		unitRenderParam.isScroll = true;
		UnitRenderer.drawScrollUnit(this._unit, this._xPixel, this._yPixel, unitRenderParam);
	},
	
	_saveMostResentMov: function(unit, moveCource) {
		var i, direction;
		var count = moveCource.length;
		var n = 0;
		var x = unit.getMapX();
		var y = unit.getMapY();
		
		for (i = 0; i < count; i++) {
			direction = moveCource[i];
			x += XPoint[direction];
			y += YPoint[direction];
			n += PosChecker.getMovePointFromUnit(x, y, unit);
		}
		
		unit.setMostResentMov(n);
	},
	
	_getUnitSppedValue: function(d) {
		var speedType = this._getSpeedType();
		
		if (Miscellaneous.isGameAcceleration()) {
			return d;
		}
		
		if (speedType === SpeedType.NORMAL) {
			d = Math.floor(d / 2);
		}
		else if (speedType === SpeedType.LOW) {
			d = Math.floor(d / 4);
		}
		
		return d;
	},
	
	_getSpeedType: function() {
		return EnvironmentControl.getUnitSpeedType();
	},
	
	_endMove: function(unit) {
		// Face the front because move ends.
		unit.setDirection(DirectionType.NULL);
		
		// Enable to draw the default because move ends.
		unit.setInvisible(false);
		
		this._isMoveFinal = true;
	},
	
	_playMovingSound: function() {
		if (this._moveCount % 2 === 0) {
			Miscellaneous.playFootstep(this._unit.getClass());
		}
	},
	
	_controlScroll: function(dx, dy) {
		var x, y;
		
		// If it's the player, it should have already scrolled up to the target position before moving.
		if (this._unit.getUnitType() === UnitType.PLAYER) {
			return;
		}
		
		// The enemy and the ally unit who have a high mov, sometimes are missed from the screen while moving.
		// To prevent this, adjust the scroll value.
		if (!MapView.isVisiblePixel(this._xPixel, this._yPixel)) {
			x = root.getCurrentSession().getScrollPixelX();
			y = root.getCurrentSession().getScrollPixelY();
			
			x += XPoint[this._unit.getDirection()] * dx;
			y += YPoint[this._unit.getDirection()] * dy;
			
			root.getCurrentSession().setScrollPixelX(x);
			root.getCurrentSession().setScrollPixelY(y);
		}
		
		// There is also a way to execute the following processing instead of the above if statement, but it moves too fast on the screen.
		// MapView.setScrollPixel(this._xPixel, this._yPixel);
	}
}
);

var CourceType = {
	RANGE: 0,
	EXTEND: 1,
	VIRTUAL: 2
};

var CourceBuilder = {
	// createRangeCource is called if a course is created to correspond to the unit mov.
	createRangeCource: function(unit, goalIndex, simulator) {
		if (unit.getMapX() === CurrentMap.getX(goalIndex) && unit.getMapY() === CurrentMap.getY(goalIndex)) {
			return [];
		}
		
		return this._createCource(unit, goalIndex, simulator, [], ParamBonus.getMov(unit), CourceType.RANGE);
	},
	
	// It's called at "Move Unit" of the event command.
	createLongCource: function(unit, goalIndex, simulator) {
		var cource;
		var moveCount = ParamBonus.getMov(unit);
		var indexArrayDisabled = [];
		
		if (unit.getMapX() === CurrentMap.getX(goalIndex) && unit.getMapY() === CurrentMap.getY(goalIndex)) {
			return [];
		}
		
		cource = this._createCource(unit, goalIndex, simulator, indexArrayDisabled, moveCount, CourceType.VIRTUAL);
		if (cource.length === 0) {
			return [];
		}
		
		return cource;
	},
	
	// createExtendCource is called if aim the distant place where the current mov cannot reach.
	createExtendCource: function(unit, goalIndex, simulator) {
		var cource;
		var moveCount = ParamBonus.getMov(unit);
		var indexArrayDisabled = [];
		
		if (unit.getMapX() === CurrentMap.getX(goalIndex) && unit.getMapY() === CurrentMap.getY(goalIndex)) {
			return [];
		}
		
		cource = this._createCource(unit, goalIndex, simulator, indexArrayDisabled, moveCount, CourceType.EXTEND);
		if (cource.length === 0) {
			// If cource.length is 0, it means that a course couldn't be created.
			// If indexArrayDisabled.length is 0,
			// don't continue to process because it's not the reason why the same army unit blocks.
			if (indexArrayDisabled.length === 0) {
				return [];
			}
			
			// If the current position <unit.x, unit.y> is (1, 1) and the goal <goalIndex> is (10, 1),
			// if the unit mov is 6, to move to (7, 1) is the shortcut.
			// However, that (7, 1) has a possibility that the other unit from the same army exists,
			// so need to find the other place than (7, 1).
			// In this example, the index of (7, 1) is stored at the indexArrayDisabled.
			goalIndex = this._getNewGoalIndex(unit, simulator, indexArrayDisabled, moveCount);
			if (goalIndex === -1) {
				return [];
			}
			
			// Delete the memory which is set at the previous _createCource.
			simulator.resetSimulationMark();
			
			// Recreate a course with a new goalIndex.
			cource = this._createCource(unit, goalIndex, simulator, indexArrayDisabled, moveCount, CourceType.RANGE);
		}
		else {
			this._validCource(unit, cource, simulator, moveCount);
		}
		
		return cource;
	},
	
	// If a course to reach a goalIndex cannot be recreated,
	// it has a possibility that it cannot move to the position from the beginning,
	// but also sometimes the different army surrounds that position.
	// To consider it, get a new goalIndex after disabling the different army to exist.
	getValidGoalIndex: function(unit, goalIndex, simulator, moveAIType) {
		var i, direction, simulatorMap, index, movePoint, cource, blockUnitArray;
		var newGoalIndex = goalIndex;
		var moveCount = ParamBonus.getMov(unit);
		var x = CurrentMap.getX(goalIndex);
		var y = CurrentMap.getY(goalIndex);
		var directionArray = [DirectionType.RIGHT, DirectionType.BOTTOM, DirectionType.LEFT, DirectionType.TOP];
		
		simulatorMap = root.getCurrentSession().createMapSimulator();
		// Disable the unit to exist on the map by calling disableMapUnit.
		simulatorMap.disableMapUnit();
		simulatorMap.startSimulation(unit, CurrentMap.getWidth() * CurrentMap.getHeight());
		
		// Specify simulatorMap not simulator to create a course excluding the unit on the map.
		cource = this._createCource(unit, goalIndex, simulatorMap, [], moveCount, CourceType.VIRTUAL);
		
		for (i = cource.length - 1; i >= 0; i--) {
			direction = directionArray[cource[i]];
			x += XPoint[direction];
			y += YPoint[direction];
			index = CurrentMap.getIndex(x, y);
			movePoint = simulator.getSimulationMovePoint(index);
			if (movePoint !== AIValue.MAX_MOVE) {
				// The place in which move point is set was found, so here is the goal.
				newGoalIndex = index;
				break;
			}
		}
		
		if (moveAIType === MoveAIType.BLOCK || moveAIType === MoveAIType.APPROACH) {
			blockUnitArray = this._getBlockUnitArray(unit, simulator, simulatorMap, goalIndex);
		}
		else {
			blockUnitArray = [];
		}
		
		return {
			goalIndex: newGoalIndex,
			blockUnitArray: blockUnitArray
		};
	},
	
	_getBlockUnitArray: function(unit, simulator, simulatorMap, goalIndex) {
		var i, j, k, x, y, x2, y2, index, list, movePoint, movePointMap, targetCount, targetUnit, mapIndex;
		var filter = FilterControl.getReverseFilter(unit.getUnitType());
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		var blockUnitArray = [];
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			targetCount = list.getCount();
			for (j = 0; j < targetCount; j++) {
				targetUnit = list.getData(j);
				x = targetUnit.getMapX();
				y = targetUnit.getMapY();
				
				mapIndex = CurrentMap.getIndex(x, y);
				if (mapIndex === goalIndex) {
					blockUnitArray.push(targetUnit);
					continue;
				}
				
				for (k = 0; k < DirectionType.COUNT; k++) {
					x2 = x + XPoint[k];
					y2 = y + YPoint[k];
					index = CurrentMap.getIndex(x2, y2);
					if (index === -1) {
						continue;
					}
					movePoint = simulator.getSimulationMovePoint(index);
					movePointMap = simulatorMap.getSimulationMovePoint(index);
					// Check if the place where cannot move is now possible to move to.
					if (movePoint === AIValue.MAX_MOVE && movePointMap !== AIValue.MAX_MOVE) {
						if (PosChecker.getUnitFromPos(x2, y2) === null) {
							blockUnitArray.push(targetUnit);
							break;
						}
					}
				}
			}
		}
		
		return blockUnitArray;
	},
	
	_createCource: function(unit, goalIndex, simulator, indexArrayDisabled, moveMaxCount, type) {
		var i, index, x, y, x2, y2, sideIndex, movePoint, newPoint, firstPoint, data, dataNew;
		var dataArray = [];
		var moveCource = [];
		var directionArray = [DirectionType.RIGHT, DirectionType.BOTTOM, DirectionType.LEFT, DirectionType.TOP];
		var xGoal = CurrentMap.getX(goalIndex);
		var yGoal = CurrentMap.getY(goalIndex);
		
		// This data is gotten at the first dataArray.pop.
		data = {};
		data.x = xGoal;
		data.y = yGoal;
		data.moveCource = [];
		data.moveCount = 0;
		data.direction = -1;
		dataArray.push(data);
		
		movePoint = simulator.getSimulationMovePoint(goalIndex);
		firstPoint = movePoint;
		
		// Create the move course, not to check from the unit current position until goalIndex,
		// but to check from the goalIndex as the starting position until movePoint becomes 0.
		// The move point of the unit current position is 0, so this processing is satisfied.
		for (;;) {
			data = dataArray.pop();
			if (typeof data === 'undefined') {
				moveCource = [];
				break;
			}
			
			x = data.x;
			y = data.y;
			index = CurrentMap.getIndex(x, y);
			movePoint = simulator.getSimulationMovePoint(index);
			// If movePoint is 0, it's the unit current position.
			if (movePoint === 0) {
				// Check if it can reach only one move.
				if (type !== CourceType.VIRTUAL && firstPoint <= moveMaxCount) {
					if (PosChecker.getUnitFromPos(xGoal, yGoal) !== null) {
						// The unit exists at the goalIndex, so mark that cannot move there.
						indexArrayDisabled.push(CurrentMap.getIndex(xGoal, yGoal));
						return [];
					}
				}
				
				// Can reach at the unit current position, so exit the loop.
				moveCource = data.moveCource;
				break;
			}
			
			sideIndex = this._getSideIndex(x, y, movePoint, simulator);
			if (sideIndex === -1) {
				continue;
			}
			
			i = sideIndex;
			x2 = x + XPoint[i];
			y2 = y + YPoint[i];
			index = CurrentMap.getIndex(x2, y2);
			newPoint = simulator.getSimulationMovePoint(index);
			
			// Mark things which were checked.
			simulator.setSimulationMark(index, true);
			
			if (type === CourceType.EXTEND) {
				// If it's the farthest position where the unit can reach only one move. 
				if (movePoint > moveMaxCount && newPoint <= moveMaxCount) {
					// If the unit exists at (x2, y2), overlap when move,
					// so don't treat it as a course.
					if (PosChecker.getUnitFromPos(x2, y2) !== null) {
						indexArrayDisabled.push(CurrentMap.getIndex(x2, y2));
						continue;
					}
				}
			}
			
			dataNew = {};
			dataNew.x = x2;
			dataNew.y = y2;
			dataNew.moveCource = this._copyCource(data.moveCource);
			dataNew.moveCource.push(directionArray[i]);
			dataNew.direction = i;
			
			dataArray.push(dataNew);
		}
		
		// Reverse the move course from the goalIndex to the unit current position.
		this._reverseCource(moveCource);
		
		return moveCource;
	},
	
	_getSideIndex: function(x, y, movePoint, simulator) {
		var i, x2, y2, index, newPoint;
		var sideIndex = -1;
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x2 = x + XPoint[i];
			y2 = y + YPoint[i];
			
			index = CurrentMap.getIndex(x2, y2);
			if (index === -1) {
				continue;
			}
			
			newPoint = simulator.getSimulationMovePoint(index);
			
			// If newPoint is lower than the current movePoint,
			// check the new position.
			if (newPoint < movePoint) {
				// Check if the specified index position is marked.
				if (!simulator.isSimulationMark(index)) {
					// Update movePoint to search the lower move point.
					movePoint = newPoint;
					sideIndex = i;
				}
			}
		}
		
		return sideIndex;
	},
	
	// Get the index of alternative position because cannot move to the place in which the unit exists.
	_getNewGoalIndex: function(unit, simulator, indexArrayDisabled, moveMaxCount) {
		var i, j, simulatorBlock, movePoint, mapIndex, xPrev, yPrev, count;
		var x = CurrentMap.getX(indexArrayDisabled[0]);
		var y = CurrentMap.getY(indexArrayDisabled[0]);
		var curPoint = simulator.getSimulationMovePoint(CurrentMap.getIndex(unit.getMapX(), unit.getMapY()));
		
		// Create move range based on goal.
		// Change the unit position to be a position where cannot reach temporarily.
		xPrev = unit.getMapX();
		yPrev = unit.getMapY();
		unit.setMapX(x);
		unit.setMapY(y);
		simulatorBlock = root.getCurrentSession().createMapSimulator();
		simulatorBlock.startSimulation(unit, moveMaxCount);
		unit.setMapX(xPrev);
		unit.setMapY(yPrev);
		
		count = simulatorBlock.getLoopCount();
		
		// Check from the lower move point because "i" starts from 1.
		// That's because the lower move point is closer to goal.
		for (i = 1; i <= moveMaxCount; i++) {
			for (j = 0; j < count; j++) {
				movePoint = simulatorBlock.getMovePointFromLoopIndex(j);
				if (i !== movePoint) {
					continue;
				}
				
				mapIndex = simulatorBlock.getPosIndexFromLoopIndex(j);	
				
				movePoint = simulator.getSimulationMovePoint(mapIndex);
				
				// Check if it's within a movable range.
				if (movePoint <= moveMaxCount) {
					// Check if head for the distant direction from the current position.
					if (curPoint >= movePoint) {
						return -1;
					}
					
					if (PosChecker.getUnitFromPos(CurrentMap.getX(mapIndex), CurrentMap.getY(mapIndex)) === null) {
						// The unit doesn't exist, so this position is goal.
						return mapIndex;
					}
				}
			}
		}
		
		return -1;
	},
	
	_validCource: function(unit, cource, simulator, moveCount) {
		var i, dx, dy, direction, index;
		var n = cource.length;
		var x = unit.getMapX();
		var y = unit.getMapY();
		
		// Move by number as much as movable.
		for (i = 0; i < n; i++) {
			direction = cource[i];
			dx = XPoint[direction];
			dy = YPoint[direction];
			
			index = CurrentMap.getIndex(x + dx, y + dy);
			if (simulator.getSimulationMovePoint(index) > moveCount) {
				// Exit the loop because mov is not enough until the position where index indicates.
				break;	
			}
			
			x += dx;
			y += dy;
		}
		
		cource.length = i;
	},
	
	_copyCource: function(cource) {
		var i;
		var count = cource.length;
		var newCource = [];
		
		for (i = 0; i < count; i++) {
			newCource[i] = cource[i];
		}
		
		return newCource;
	},
	
	_reverseCource: function(moveCource) {
		var tmp;
		var i = 0;
		var j = moveCource.length - 1;
		
		while (i < j) {
			tmp = moveCource[j];
			moveCource[j] = moveCource[i];
			moveCource[i] = tmp;
			i++;
			j--;
		}
	}
};
