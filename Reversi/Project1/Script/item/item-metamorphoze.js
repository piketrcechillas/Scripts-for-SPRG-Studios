
var MetamorphozeItemSelection = defineObject(BaseItemSelection,
{
	_metamorphozeSelectManager: null,
	
	setInitialSelection: function() {
		this._metamorphozeSelectManager = createObject(MetamorphozeSelectManager);
		this._metamorphozeSelectManager.setMetamorphozeSelectData(this._unit, this._item.getMetamorphozeInfo().getMetamorphozeReferenceList());
		return EnterResult.OK;
	},
	
	moveItemSelectionCycle: function() {
		if (this._metamorphozeSelectManager.moveWindowManager() !== MoveResult.CONTINUE) {
			this._targetMetamorphoze = this._metamorphozeSelectManager.getTargetMetamorphoze();
			if (this._targetMetamorphoze === null) {
				this._isSelection = false;
			}
			else {
				this._isSelection = true;
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawItemSelectionCycle: function() {
		this._metamorphozeSelectManager.drawWindowManager();
	}
}
);

var MetamorphozeItemUse = defineObject(BaseItemUse,
{
	_itemUseParent: null,
	_dynamicEvent: null,
	
	enterMainUseCycle: function(itemUseParent) {
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		
		if (itemTargetInfo.targetMetamorphoze === null) {
			itemTargetInfo.targetMetamorphoze = this._getDefaultMetamorphozeData();
			if (itemTargetInfo.targetMetamorphoze === null) {
				return EnterResult.NOTENTER;
			}
		}
		
		this._checkItemLimit();
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.unitMetamorphozeFromItem(itemTargetInfo.unit, itemTargetInfo.targetMetamorphoze, MetamorphozeActionType.CHANGE, itemUseParent.isItemSkipMode(), itemTargetInfo.item);
		
		return this._dynamicEvent.executeDynamicEvent();
	},
	
	moveMainUseCycle: function() {
		return this._dynamicEvent.moveDynamicEvent();
	},
	
	_checkItemLimit: function() {
		var i, itemSrc;
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var targetItem = itemTargetInfo.item;
		var metamorphozeData = itemTargetInfo.targetMetamorphoze;
		var count = metamorphozeData.getConvertItemCount();
		
		// Check if the used item is included in the conversion.
		for (i = 0; i < count; i++) {
			itemSrc = metamorphozeData.getConvertItemSrc(i);
			if (ItemControl.compareItem(itemSrc, targetItem)) {
				if (targetItem.getLimit() === 1) {
					// Mark so as to delete when the metamorphosis is deactivated.
					targetItem.setLimit(WeaponLimitValue.BROKEN);
				}
				else {
					// Reduce durability before conversion occurs.
					this._itemUseParent.decreaseItem();
				}
				
				// Disable because it's already been reduced.
				this._itemUseParent.disableItemDecrement();
				
				break;
			}
		}
	},
	
	_getDefaultMetamorphozeData: function() {
		var item = this._itemUseParent.getItemTargetInfo().item;
		var refList = item.getMetamorphozeInfo().getMetamorphozeReferenceList();
		
		if (refList.getTypeCount() === 0) {
			return null;
		}
		
		return refList.getTypeData(0);
	}
}
);

var MetamorphozeItemInfo = defineObject(BaseItemInfo,
{
	drawItemInfoCycle: function(x, y) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Metamorphoze));
	},
	
	getInfoPartsCount: function() {
		return 1;
	}
}
);

var MetamorphozeItemPotency = defineObject(BaseItemPotency,
{
}
);

var MetamorphozeItemAvailability = defineObject(BaseItemAvailability,
{
	isItemAvailableCondition: function(unit, item) {
		if (MetamorphozeControl.getMetamorphozeData(unit) !== null) {
			return false;
		}
		
		return item.getMetamorphozeInfo().getMetamorphozeReferenceList().getTypeCount() > 0;
	}
}
);

var MetamorphozeItemAI = defineObject(BaseItemAI,
{
	getItemScore: function(unit, combination) {
		var refList;
		
		if (MetamorphozeControl.getMetamorphozeData(unit) !== null) {
			return AIValue.MIN_SCORE;
		}
		
		refList = this._getReferenceList(unit, combination);
		
		return this._getScore(unit, combination, refList);
	},
	
	_getReferenceList: function(unit, combination) {
		var refList = null;
		
		if (combination.item !== null) {
			refList = combination.item.getMetamorphozeInfo().getMetamorphozeReferenceList();
		}
		else if (combination.skill !== null) {
			refList = combination.skill.getDataReferenceList();
		}
		
		return refList;
	},
	
	_getScore: function(unit, combination, refList) {
		if (refList === null) {
			return AIValue.MIN_SCORE;
		}
		
		combination.targetMetamorphoze = refList.getTypeData(0);
		if (!MetamorphozeControl.isMetamorphozeAllowed(unit, combination.targetMetamorphoze)) {
			return AIValue.MIN_SCORE;
		}
		
		return 150;
	}
}
);

var MetamorphozeSelectMode = {
	QUESTION: 0,
	SCREEN: 1
};

var MetamorphozeSelectManager = defineObject(BaseWindowManager,
{
	_unit: null,
	_refList: null,
	_metamorphozeScreen: null,
	_targetMetamorphoze: null,
	
	setMetamorphozeSelectData: function(unit, refList) {
		var screenParam;
		
		this._unit = unit;
		this._refList = refList;
		
		screenParam = this._createScreenParam();
		
		this._metamorphozeScreen = createObject(MetamorphozeScreen);
		SceneManager.addScreen(this._metamorphozeScreen, screenParam);
	},
	
	moveWindowManager: function() {
		if (SceneManager.isScreenClosed(this._metamorphozeScreen)) {
			this._targetMetamorphoze = this._metamorphozeScreen.getScreenResult();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawWindowManager: function() {
		
	},
	
	getTargetMetamorphoze: function() {
		return this._targetMetamorphoze;
	},
	
	_createScreenParam: function() {
		var screenParam = ScreenBuilder.buildMultiClassChange();
		
		screenParam.unit = this._unit;
		screenParam.isMapCall = true;
		screenParam.refList = this._refList;
		
		return screenParam;
	}
}
);
