
var ItemUseEventCommand = defineObject(BaseEventCommand,
{
	_unit: null,
	_item: null,
	_targetUnit: null,
	_targetPos: null,
	_targetItem: null,
	_itemUse: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (this._itemUse.moveUseCycle() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		this._itemUse.drawUseCycle();
	},
	
	isEventCommandSkipAllowed: function() {
		// Don't allow the skip by pressing the Start.
		return false;
	},
	
	_prepareEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._unit = eventCommandData.getUseUnit();
		this._item = UnitItemControl.getMatchItem(this._unit, eventCommandData.getUseItem());
		this._targetUnit = eventCommandData.getTargetUnit();
		this._targetPos = createPos(eventCommandData.getTargetX(), eventCommandData.getTargetY());
		this._targetItem = eventCommandData.getTargetItem();
	},
	
	_checkEventCommand: function() {
		var isUseSkip;
		
		if (this._unit === null) {
			return false;
		}
		
		if (this._item === null || this._item.isWeapon()) {
			return false;
		}
		
		isUseSkip = this._preCheck();
		
		if (this._isSkipMode && isUseSkip) {
			// If item use can be skipped, return false so as not to enter the cycle.
			return false;
		}
		
		return true;
	},
	
	_completeEventCommandMemberData: function() {
		return EnterResult.OK;
	},
	
	_preCheck: function() {
		var itemTargetInfo = StructureBuilder.buildItemTargetInfo();
		
		itemTargetInfo.unit = this._unit;
		itemTargetInfo.item = this._item;
		itemTargetInfo.targetUnit = this._targetUnit;
		itemTargetInfo.targetPos = this._targetPos;
		itemTargetInfo.targetItem = this._targetItem;
		
		this._itemUse = ItemPackageControl.getItemUseParent(this._item);
		
		return this._itemUse.enterUseCycle(itemTargetInfo) === EnterResult.NOTENTER;
	}
}
);
