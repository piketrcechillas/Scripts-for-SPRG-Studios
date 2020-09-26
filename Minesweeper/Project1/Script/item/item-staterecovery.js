
var StateRecoveryItemSelection = defineObject(BaseItemSelection,
{
	isPosSelectable: function() {
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		if (targetUnit === null) {
			return false;
		}
		
		return StateControl.isStateRecoverable(targetUnit, this._item.getStateRecoveryInfo().getStateGroup());
	}
}
);

var StateRecoveryItemUse = defineObject(BaseItemUse,
{
	_itemUseParent: null,
	
	enterMainUseCycle: function(itemUseParent) {
		this._itemUseParent = itemUseParent;
		
		this.mainAction();
		
		return EnterResult.NOTENTER;
	},
	
	mainAction: function() {
		var i, count, list, state, arr;
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var info = itemTargetInfo.item.getStateRecoveryInfo();
		var unit = itemTargetInfo.targetUnit;
		var stateGroup = info.getStateGroup();
		
		if (stateGroup.isAllBadState()) {
			arr = [];
			list = unit.getTurnStateList();
			count = list.getCount();
			for (i = 0; i < count; i++) {
				state = list.getData(i).getState();
				if (state.isBadState()) {
					arr.push(state);	
				}
			}
			
			count = arr.length;
			for (i = 0; i < count; i++) {
				StateControl.arrangeState(unit, arr[i], IncreaseType.DECREASE);
			}
		}
		else {
			list = stateGroup.getStateReferenceList();
			count = list.getTypeCount();
			for (i = 0; i < count; i++) {
				state = list.getTypeData(i);
				StateControl.arrangeState(unit, state, IncreaseType.DECREASE);
			}
		}
	},
	
	getItemAnimePos: function(itemUseParent, animeData) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}
}
);

var StateRecoveryItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_StateRecovery));
		y += ItemInfoRenderer.getSpaceY();
		
		ItemInfoRenderer.drawState(x, y, this._item.getStateRecoveryInfo().getStateGroup(), true);
	},
	
	getInfoPartsCount: function() {
		return 1 + ItemInfoRenderer.getStateCount(this._item.getStateRecoveryInfo().getStateGroup());
	}
}
);

var StateRecoveryItemPotency = defineObject(BaseItemPotency,
{
}
);

var StateRecoveryItemAvailability = defineObject(BaseItemAvailability,
{
	isItemAllowed: function(unit, targetUnit, item) {
		// Prevent to use an antidote to poison even though it is not the poison state.
		return StateControl.isStateRecoverable(targetUnit, item.getStateRecoveryInfo().getStateGroup());
	}
}
);

var StateRecoveryItemAI = defineObject(BaseItemAI,
{
	getItemScore: function(unit, combination) {
		if (!StateControl.isStateRecoverable(combination.targetUnit, combination.item.getStateRecoveryInfo().getStateGroup())) {
			return AIValue.MIN_SCORE;
		}
		
		return 20 + combination.targetUnit.getLv();
	}
}
);
