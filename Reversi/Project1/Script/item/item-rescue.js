
var ItemRescueSelectMode = {
	TARGETSELECT: 0
};

var RescueItemSelection = defineObject(BaseItemSelection,
{
	setInitialSelection: function() {
		this.setUnitSelection();
		this.changeCycleMode(ItemTeleportationSelectMode.TARGETSELECT);
		return EnterResult.OK;
	},
	
	moveItemSelectionCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemTeleportationSelectMode.TARGETSELECT) {
			result = this._moveTargetSelect();
		}
		
		return result;
	},
	
	drawItemSelectionCycle: function() {
		this._posSelector.drawPosSelector();
	},
	
	isPosSelectable: function() {
		var mode = this.getCycleMode();
		
		if (mode === ItemRescueSelectMode.TARGETSELECT) {
			return this._posSelector.getSelectorTarget(true) !== null;
		}
		
		return true;
	},
	
	_moveTargetSelect: function() {
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this.isPosSelectable()) {
				this._targetUnit = this._posSelector.getSelectorTarget(false);
				this._targetPos = PosChecker.getNearbyPos(this._unit, this._targetUnit);
				if (this._targetPos === null) {
					this._isSelection = false;
				}
				else {
					this._isSelection = true;
				}
				this._posSelector.endPosSelector();
				return MoveResult.END;
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._isSelection = false;
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}
}
);

var ItemRescueUseMode = {
	SRC: 0,
	FOCUS: 1,
	DEST: 2,
	END: 3,
	SRCANIME: 4,
	DESTANIME: 5
};

var RescueItemUse = defineObject(BaseItemUse,
{
	_itemUseParent: null,
	_targetUnit: null,
	_targetPos: null,
	_dynamicAnime: null,
	
	enterMainUseCycle: function(itemUseParent) {
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		this._targetUnit = itemTargetInfo.targetUnit;
		this._targetPos = itemTargetInfo.targetPos;
		
		// For item use with AI, the position is not always initialized.
		if (this._targetPos === null) {
			this._targetPos = PosChecker.getNearbyPos(itemTargetInfo.unit, itemTargetInfo.targetUnit);
		}
		
		if (PosChecker.getUnitFromPos(this._targetPos.x, this._targetPos.y) !== null) {
			// Items are not reduced because the unit exists at the target position, so it cannot move.
			this._itemUseParent.disableItemDecrement();
			return EnterResult.NOTENTER;
		}
		
		if (itemUseParent.isItemSkipMode()) {
			this.mainAction();
			return EnterResult.NOTENTER;
		}
		
		this.changeCycleMode(ItemRescueUseMode.SRC);
		
		return EnterResult.OK;
	},
	
	moveMainUseCycle: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemRescueUseMode.SRC) {
			result = this._moveSrc();
		}
		else if (mode === ItemRescueUseMode.SRCANIME) {
			result = this._moveSrcAnime();
		}
		else if (mode === ItemRescueUseMode.FOCUS) {
			result = this._moveFocus();
		}
		else if (mode === ItemRescueUseMode.DEST) {
			result = this._moveDest();
		}
		else if (mode === ItemRescueUseMode.DESTANIME) {
			result = this._moveDestAnime();
		}
		else if (mode === ItemRescueUseMode.END) {
			result = this._moveEnd();
		}
		
		return result;
	},
	
	drawMainUseCycle: function() {
		var mode = this.getCycleMode();
		
		if (mode === ItemRescueUseMode.SRCANIME || mode === ItemRescueUseMode.DESTANIME) {
			this._dynamicAnime.drawDynamicAnime();
		}
	},
	
	mainAction: function() {
		this._targetUnit.setMapX(this._targetPos.x);
		this._targetUnit.setMapY(this._targetPos.y);
		this._targetUnit.setInvisible(false);
	},
	
	_moveSrc: function() {
		var unit = PosChecker.getUnitFromPos(this._targetPos.x, this._targetPos.y);
		
		// Cannot continue if there is the unit in the target position.
		if (unit !== null) {
			// The Item is not reduced because it could not move.
			this._itemUseParent.disableItemDecrement();
			return MoveResult.END;
		}
	
		this._showAnime(this._targetUnit.getMapX(), this._targetUnit.getMapY());
		this.changeCycleMode(ItemRescueUseMode.SRCANIME);
		
		return MoveResult.CONTINUE;
	},
	
	_moveSrcAnime: function() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ItemRescueUseMode.FOCUS);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveFocus: function() {
		var generator; 
		
		this._targetUnit.setInvisible(true);
		
		generator = root.getEventGenerator();
		generator.locationFocus(this._targetPos.x, this._targetPos.y, true);
		generator.execute();
		
		this.changeCycleMode(ItemRescueUseMode.DEST);
		
		return MoveResult.CONTINUE;
	},
	
	_moveDest: function() {
		this._showAnime(this._targetPos.x, this._targetPos.y);
		this.changeCycleMode(ItemRescueUseMode.DESTANIME);
		
		return MoveResult.CONTINUE;
	},
	
	_moveDestAnime: function() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ItemRescueUseMode.END);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveEnd: function() {
		this.mainAction();
		return MoveResult.END;
	},
	
	_showAnime: function(xTarget, yTarget) {
		var x = LayoutControl.getPixelX(xTarget);
		var y = LayoutControl.getPixelY(yTarget);
		var anime = this._itemUseParent.getItemTargetInfo().item.getItemAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime = createObject(DynamicAnime);
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
	}
}
);

var RescueItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Rescue));
		y += ItemInfoRenderer.getSpaceY();
		
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	},
	
	getInfoPartsCount: function() {
		return 2;
	}
}
);

var RescueItemPotency = defineObject(BaseItemPotency,
{
}
);

var RescueItemAvailability = defineObject(BaseItemAvailability,
{
}
);

var RescueItemAI = defineObject(BaseItemAI,
{
}
);
