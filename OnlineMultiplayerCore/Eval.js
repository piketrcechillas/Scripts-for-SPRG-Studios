var Eval = {
	setHp: function(x, y, hp) {
		eval('PosChecker.getPlaceEventFromPos(PlaceEventType.SHOP,' + x + ',' + y + ').custom.hp' + '=' + hp);
	},

	setTempHp: function(x, y, thp) {
		eval('PosChecker.getPlaceEventFromPos(PlaceEventType.SHOP,' + x + ',' + y + ').custom.thp' + '=' + thp);
	},

	setGlobal: function(id) {
		eval('root.getMetaSession().global.multiplayerID' + '=' + id);
	},

	setID: function(id) {
		eval('root.getMetaSession().global.playerID' + '=' + id);
	}
}