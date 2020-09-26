
var UnitMetamorphozeEventCommand = defineObject(BaseEventCommand,
{
	_targetUnit: null,
	_metamorphozeData: null,
	_metamorphozeActionType: null,
	_dynamicAnime: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		this._dynamicAnime.drawDynamicAnime();
	},
	
	mainEventCommand: function() {
		if (this._metamorphozeActionType === MetamorphozeActionType.CHANGE) {
			MetamorphozeControl.startMetamorphoze(this._targetUnit, this._metamorphozeData);
		}
		else {
			MetamorphozeControl.clearMetamorphoze(this._targetUnit);
		}
	},
	
	_prepareEventCommandMemberData: function() {
		this._targetUnit = root.getEventCommandObject().getTargetUnit();
		this._metamorphozeData = root.getEventCommandObject().getMetamorphozeData();
		this._metamorphozeActionType = root.getEventCommandObject().getMetamorphozeActionType();
		this._dynamicAnime = createObject(DynamicAnime);
		
		if (this._targetUnit !== null && this._metamorphozeActionType === MetamorphozeActionType.CANCEL) {
			this._metamorphozeData = MetamorphozeControl.getMetamorphozeData(this._targetUnit);
		}
	},
	
	_checkEventCommand: function() {
		if (this._targetUnit === null || this._metamorphozeData === null) {
			return false;
		}
		
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		var x = LayoutControl.getPixelX(this._targetUnit.getMapX());
		var y = LayoutControl.getPixelY(this._targetUnit.getMapY());
		var anime = this._metamorphozeActionType === MetamorphozeActionType.CHANGE ? this._metamorphozeData.getChangeAnime() : this._metamorphozeData.getCancelAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
		
		return EnterResult.OK;
	}
}
);
