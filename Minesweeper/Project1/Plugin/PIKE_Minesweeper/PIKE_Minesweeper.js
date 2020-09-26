TurnChangeMapStart.doLastAction = function() {
		
		var turnType = TurnType.PLAYER;
		
		if (PlayerList.getSortieList().getCount() > 0) {
			turnType = TurnType.PLAYER;
		}
		else if (EnemyList.getAliveList().getCount() > 0) {
			turnType = TurnType.ENEMY;
		}
		else if (AllyList.getAliveList().getCount() > 0) {
			turnType = TurnType.ALLY;
		}

		var mapInfo = root.getCurrentSession().getCurrentMapInfo();

		if(mapInfo.custom.easy)
			var bomb = 10;
		if(mapInfo.custom.medium)
			var bomb = 35;
		if(mapInfo.custom.hard)
			var bomb = 99;
		var count = 0;
		
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var width =  mapInfo.getMapWidth();
		var height = mapInfo.getMapHeight()-1;
		var table = [];

		if(mapInfo.custom.easy){
			width = 9;
			height = 9;
		}

		root.log("passed")

		for(i = 0; i < height; i++){
			var row = [];
			for(j = 0; j < width; j++){
				row.push(0);
			}
			table.push(row);
			
		}



		while(count < bomb){
			var x = Math.floor(Math.random() * height);
			var y = Math.floor(Math.random() * width);
			if(table[x][y] != -1) {
				table[x][y] = -1;
				count++;
			}
		}

		for(i = 0; i < height; i++){
			for(j = 0; j < width; j++){
				if(table[i][j] != -1) {
					var value = MinesweeperController._getSurroundBomb(table, i, j, width-1, height-1);
					table[i][j] = value;
				}
			}
			
		}


		for(i = 0; i < height; i++){
			for(j = 0; j < width; j++){
				root.log("x: " + i + "y: " + j + "value: " + table[i][j] + " ")
			}
			root.log("-------------------")
		}

		MinesweeperController._displayTable(table, width, height)
		MinesweeperController._cover(table, width, height)

		root.getCurrentSession().setTurnCount(0);
		root.getCurrentSession().setTurnType(turnType);
	}


MinesweeperController = {
	_table: null,
	_width: null,
	_height: null,

	_getSurroundBomb: function(table, x, y, width, height) {
		var value = 0;
		if(x==0 && y==0){
			if(table[x+1][y] == -1)
				value += 1;
			if(table[x][y+1] == -1)
				value += 1;
			if(table[x+1][y+1] == -1)
				value += 1;
		}
		else if(x==height && y==width){
			if(table[x-1][y] == -1)
				value += 1;
			if(table[x][y-1] == -1)
				value += 1;
			if(table[x-1][y-1] == -1)
				value += 1;
		}
		else if(x==height && y==0){
			if(table[x-1][y] == -1)
				value += 1;
			if(table[x][y+1] == -1)
				value += 1;
			if(table[x-1][y+1] == -1)
				value += 1;
		}
		else if(x==0 && y==width){
			if(table[x+1][y] == -1)
				value += 1;
			if(table[x][y-1] == -1)
				value += 1;
			if(table[x+1][y-1] == -1)
				value += 1;
		}
		else if(x==0){
			if(table[x+1][y] == -1)
				value += 1;
			if(table[x+1][y-1] == -1)
				value += 1;
			if(table[x+1][y+1] == -1)
				value += 1;
			if(table[x][y+1] == -1)
				value += 1;
			if(table[x][y-1] == -1)
				value += 1;
		
		}
		else if(y==0){
			if(table[x+1][y] == -1)
				value += 1;
			if(table[x-1][y] == -1)
				value += 1;
			if(table[x+1][y+1] == -1)
				value += 1;
			if(table[x][y+1] == -1)
				value += 1;
			if(table[x-1][y+1] == -1)
				value += 1;
		}
		else if(x==height){
			if(table[x-1][y] == -1)
				value += 1;
			if(table[x-1][y-1] == -1)
				value += 1;
			if(table[x-1][y+1] == -1)
				value += 1;
			if(table[x][y+1] == -1)
				value += 1;
			if(table[x][y-1] == -1)
				value += 1;
		}
		else if(y==width){
			if(table[x+1][y] == -1)
				value += 1;
			if(table[x-1][y] == -1)
				value += 1;
			if(table[x+1][y-1] == -1)
				value += 1;
			if(table[x][y-1] == -1)
				value += 1;
			if(table[x-1][y-1] == -1)
				value += 1;
		}
		else{
			if(table[x+1][y+1] == -1)
				value += 1;
			if(table[x+1][y] == -1)
				value += 1;
			if(table[x+1][y-1] == -1)
				value += 1;
			if(table[x][y+1] == -1)
				value += 1;
			if(table[x][y-1] == -1)
				value += 1;
			if(table[x-1][y+1] == -1)
				value += 1;
			if(table[x-1][y] == -1)
				value += 1;
			if(table[x-1][y-1] == -1)
				value += 1;
		}


		return value;
	},	


	_displayTable: function(table, width, height) {
		var session = root.getCurrentSession();
		var zero = root.createResourceHandle(false, 0, 0, 0, 0);
		var one = root.createResourceHandle(false, 1, 0, 0, 0)
		var two = root.createResourceHandle(false, 2, 0, 0, 0)
		var three = root.createResourceHandle(false, 3, 0, 0, 0)
		var four = root.createResourceHandle(false, 4, 0, 0, 0)
		var five = root.createResourceHandle(false, 5, 0, 0, 0)
		var six = root.createResourceHandle(false, 6, 0, 0, 0)
		var seven = root.createResourceHandle(false, 7, 0, 0, 0)
		var eight = root.createResourceHandle(false, 8, 0, 0, 0)
		var bomb = root.createResourceHandle(false, 10, 0, 0, 0)
		for(i = 0; i < height; i++){
			for(j = 0; j < width; j++){
				var value = table[i][j];
				if(value == -1){
					session.setMapChipGraphicsHandle(j, i+1, false, bomb);
				}
				else if(value == 0){
					session.setMapChipGraphicsHandle(j, i+1, false, zero);
				}
				else if(value == 1){
					session.setMapChipGraphicsHandle(j, i+1, false, one);
				}
				else if(value == 2){
					session.setMapChipGraphicsHandle(j, i+1, false, two);
				}
				else if(value == 3){
					session.setMapChipGraphicsHandle(j, i+1, false, three);
				}
				else if(value == 4){
					session.setMapChipGraphicsHandle(j, i+1, false, four);
				}
				else if(value == 5){
					session.setMapChipGraphicsHandle(j, i+1, false, five);
				}
				else if(value == 6){
					session.setMapChipGraphicsHandle(j, i+1, false, six);
				}
				else if(value == 7){
					session.setMapChipGraphicsHandle(j, i+1, false, seven);
				}
				else if(value == 8){
					session.setMapChipGraphicsHandle(j, i+1, false, eight);
				}
			}
		}

	},

	_cover: function(table, width, height) {
		var session = root.getCurrentSession();
		var blank = root.createResourceHandle(false, 9, 0, 0, 0)
		for(i = 0; i < height; i++){
			for(j = 0; j < width; j++){
				session.setMapChipGraphicsHandle(j, i+1, true, blank);
			}
		}
		this._table = table;
		this._width = width;
		this._height = height;
	},

	_getTable: function() {
		return this._table;
	},

	_blankSpill: function(i, j) {
		var table = this._table;
		var width = this._width-1;
		var height = this._height-1;
		root.log("recursive")


		table[i][j] = -2;
		this._table = table;


		if(i==0 && j == 0){
			if(table[i+1][j] == 0){
				this._blankSpill(i+1, j)
			}
			if(table[i][j+1] == 0){
				this._blankSpill(i, j+1)
			}
			if(table[i+1][j+1] == 0){
				this._blankSpill(i+1, j+1)
			}
		}
		else if(i==height && j == width){
			if(table[i-1][j] == 0){
				this._blankSpill(i-1, j)
			}
			if(table[i][j-1] == 0){
				this._blankSpill(i, j-1)
			}
			if(table[i-1][j-1] == 0){
				this._blankSpill(i-1, j-1)
			}
		}
		else if(i==height && j == 0){
			if(table[i-1][j] == 0){
				this._blankSpill(i-1, j)
			}
			if(table[i][j+1] == 0){
				this._blankSpill(i, j+1)
			}
			if(table[i-1][j+1] == 0){
				this._blankSpill(i-1, j+1)
			}
		}
		else if(i==0 && j == width){
			if(table[i+1][j] == 0){
				this._blankSpill(i+1, j)
			}
			if(table[i][j-1] == 0){
				this._blankSpill(i, j-1)
			}
			if(table[i+1][j-1] == 0){
				this._blankSpill(i+1, j-1)
			}
		}
		else if(i==0){
			if(table[i+1][j] == 0){
				this._blankSpill(i+1, j)
			}
			if(table[i][j+1] == 0){
				this._blankSpill(i, j+1)
			}
			if(table[i][j-1] == 0){
				this._blankSpill(i, j-1)
			}
			if(table[i+1][j+1] == 0){
				this._blankSpill(i+1, j+1)
			}
			if(table[i+1][j-1] == 0){
				this._blankSpill(i+1, j-1)
			}
		}
		else if(j == 0){
			if(table[i+1][j] == 0){
				this._blankSpill(i+1, j)
			}
			if(table[i-1][j] == 0){
				this._blankSpill(i-1, j)
			}
			if(table[i][j+1] == 0){
				this._blankSpill(i, j+1)
			}
			if(table[i+1][j+1] == 0){
				this._blankSpill(i+1, j+1)
			}
			if(table[i-1][j+1] == 0){
				this._blankSpill(i-1, j+1)
			}
		}
		else if(i == height){
			if(table[i-1][j] == 0){
				this._blankSpill(i-1, j)
			}
			if(table[i-1][j+1] == 0){
				this._blankSpill(i-1, j+1)
			}
			if(table[i-1][j-1] == 0){
				this._blankSpill(i-1, j-1)
			}
			if(table[i][j+1] == 0){
				this._blankSpill(i, j+1)
			}
			if(table[i][j-1] == 0){
				this._blankSpill(i, j-1)
			}
		}
		else if(j == width){
			if(table[i+1][j] == 0){
				this._blankSpill(i+1, j)
			}
			if(table[i-1][j] == 0){
				this._blankSpill(i-1, j)
			}
			if(table[i][j-1] == 0){
				this._blankSpill(i, j-1)
			}
			if(table[i+1][j-1] == 0){
				this._blankSpill(i+1, j-1)
			}
			if(table[i-1][j-1] == 0){
				this._blankSpill(i-1, j-1)
			}
		}
		else {
			if(table[i+1][j] == 0){
				this._blankSpill(i+1, j)
			}
			if(table[i-1][j] == 0){
				this._blankSpill(i-1, j)
			}
			if(table[i][j+1] == 0){
				this._blankSpill(i, j+1)
			}
			if(table[i][j-1] == 0){
				this._blankSpill(i, j-1)
			}
			if(table[i+1][j+1] == 0){
				this._blankSpill(i+1, j+1)
			}
			if(table[i+1][j-1] == 0){
				this._blankSpill(i+1, j-1)
			}
			if(table[i-1][j+1] == 0){
				this._blankSpill(i-1, j+1)
			}
			if(table[i-1][j-1] == 0){
				this._blankSpill(i-1, j-1)
			}
		}

		var session = root.getCurrentSession();

		var reveal = root.createResourceHandle(false, 13, 0, 0, 0)
		var k = i+1

		session.setMapChipGraphicsHandle(j, k, true, reveal);
		session.setMapChipGraphicsHandle(j+1, k, true, reveal);
		session.setMapChipGraphicsHandle(j-1, k, true, reveal);
		session.setMapChipGraphicsHandle(j, k+1, true, reveal);
		session.setMapChipGraphicsHandle(j+1, k+1, true, reveal);
		session.setMapChipGraphicsHandle(j-1, k+1, true, reveal);
		if(i!=0){
			session.setMapChipGraphicsHandle(j, k-1, true, reveal);
			session.setMapChipGraphicsHandle(j-1, k-1, true, reveal);
			session.setMapChipGraphicsHandle(j+1, k-1, true, reveal);
		}


	},

	_revealAllBomb: function() {
		var width = this._width;
		var height = this._height;
		var session = root.getCurrentSession();
		var reveal = root.createResourceHandle(false, 13, 0, 0, 0)
		var table = this._table;
		for(i = 0; i < height; i++){
			for(j = 0; j < width; j++){
				if(table[i][j] == -1)
					session.setMapChipGraphicsHandle(j, i+1, true, reveal);
			}
		}
	},

	_revealAllBombFlagged: function() {
		var width = this._width;
		var height = this._height;
		var session = root.getCurrentSession();
		var reveal = root.createResourceHandle(false, 11, 0, 0, 0)
		var table = this._table;
		for(i = 0; i < height; i++){
			for(j = 0; j < width; j++){
				if(table[i][j] == -1)
					session.setMapChipGraphicsHandle(j, i+1, true, reveal);
			}
		}
	},

	_checkWinner: function() {
		var session = root.getCurrentSession();
		var result = true;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var width =  mapInfo.getMapWidth();
		var height = mapInfo.getMapHeight();
		for(i = 0; i < width; i++){
			for(j = 1; j < height; j++){
				var idup = session.getMapChipGraphicsHandle(i, j, true).getResourceId();
				var idown = session.getMapChipGraphicsHandle(i, j, false).getResourceId();
				if(idup == 9 && idown != 10){
					result = false;
				}

			}

		}
		root.log(result)
		return result;
	}


}

var MoveResult = {
	SELECT: 0,
	CANCEL: 1,
	CONTINUE: 200,
	END: 800,
	MINE: 1000
};

MapCommand._moveOpen = function() {
		var object = this._commandScrollbar.getObject();
		var result = MoveResult.CONTINUE;

		root.log(object.moveCommand())

		if (object.moveCommand() === MoveResult.MINE) {
			root.log("custom")
			return MoveResult.END;
		}
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			this._commandScrollbar.setActive(true);
			this.changeCycleMode(ListCommandManagerMode.TITLE);
		}
		
		return result;
	}

MapCommand.Reveal = defineObject(BaseListCommand,
{
	openCommand: function() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		var reveal = root.createResourceHandle(false, 13, 0, 0, 0)
		session.setMapChipGraphicsHandle(x, y, true, reveal);

		var id = session.getMapChipGraphicsHandle(x, y, false).getResourceId();
		root.log("id: " + id)
		if(id == 0){
			
			MinesweeperController._blankSpill(y-1, x);
		}
		if(id == 10){
			MinesweeperController._revealAllBomb();
			var explode = root.createResourceHandle(false, 12, 0, 0, 0)
			session.setMapChipGraphicsHandle(x, y, false, explode);
			var table = root.getMetaSession().getGlobalSwitchTable();
			table.setSwitch(5, true);
		}
		

		this.moveCommand();
	},
	
	moveCommand: function() {
		root.log("CUSTOM")
		if(MinesweeperController._checkWinner()){
			MinesweeperController._revealAllBombFlagged();
			var table = root.getMetaSession().getGlobalSwitchTable();
			table.setSwitch(6, true);
		}
		return MoveResult.MINE;
		
	},


	isCommandDisplayable: function() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		var result = false;
		var terrain = PosChecker.getTerrainFromPos(x, y);
		if(terrain != null){
			if (terrain.custom.blank) {
				result = true;
			}
		}
		return result;
	},

	getCommandName: function() {
		return "Reveal";
	},
	
	
	drawCommand: function() {
	}
}
);

MapCommand.Flag = defineObject(BaseListCommand,
{
	openCommand: function() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		var flag = root.createResourceHandle(false, 11, 0, 0, 0)
		var blank = root.createResourceHandle(false, 9, 0, 0, 0)

		var terrain = PosChecker.getTerrainFromPos(x, y);
		if(terrain != null){
			if (terrain.custom.flag) {
				session.setMapChipGraphicsHandle(x, y, true, blank);
			}
			else{
				session.setMapChipGraphicsHandle(x, y, true, flag);
			}
		}

		this.moveCommand()
	},
	
	moveCommand: function() {
		return MoveResult.MINE;
	},

	isCommandDisplayable: function() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		var result = false;
		var terrain = PosChecker.getTerrainFromPos(x, y);
		if(terrain != null){
			if (terrain.custom.blank) {
				result = true;
			}
		}
		return result;
	},

	getCommandName: function() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		var terrain = PosChecker.getTerrainFromPos(x, y);
		if(terrain != null){
			if(terrain.custom.flag){
				return "Unflag"
			}
		}
		return "Flag";
	},
	
	
	drawCommand: function() {
	}
}
);




MapCommand.configureCommands = function(groupArray) {
	var mixer = createObject(CommandMixer);
	
	mixer.pushCommand(MapCommand.TurnEnd, CommandActionType.TURNEND);
	root.log("Check");
	mixer.pushCommand(MapCommand.Reveal, CommandActionType.REVEAL);
	groupArray.appendObject(MapCommand.Reveal)
	mixer.pushCommand(MapCommand.Flag, CommandActionType.FLAG);
	groupArray.appendObject(MapCommand.Flag)

	mixer.mixCommand(CommandLayoutType.MAPCOMMAND, groupArray, BaseListCommand);
}

var CommandActionType = {
	NEWGAME: 0,
	CONTINUE: 1,
	ENDGAME: 2,
	
	UNITSORTIE: 10,
	UNITMARSHAL: 11,
	COMMUNICATION: 12,
	SHOP: 13,
	BONUS: 14,
	BATTLESTART: 15,
	LOAD: 16,
	SAVE: 17,
	
	CONFIG: 20,
	OBJECTIVE: 21,
	TALKCHECK: 22,
	UNITSUMMARY: 23,
	SKILL: 24,
	SWITCH: 25,
	VARIABLE: 26,
	TURNEND: 27,
	
	EXTRA: 30,
	RECOLLECTION: 31,
	CHARACTER: 32,
	WORD: 33,
	GALLERY: 34,
	SOUNDROOM: 35,
	
	QUEST: 40,
	IMAGETALK: 41,
	NEXT: 42,
	SHOPLIST: 43,
	EXPERIENCEDISTRIBUTION: 44,

	REVEAL: 50,
	FLAG: 51
};

SaveScreenLauncher.isLaunchable = function() {
    return false;
};

TurnMarkFlowEntry.drawFlowEntry = function() {

}

MapParts.Terrain.drawMapParts = function() {

}


RestCommand.Quest.getCommandName = function()  
{
	
	return "Choose Difficulty"
}

RestCommand.Next.isCommandDisplayable = function() {
	return false;
}

ExperienceDistributionScreenLauncher.isLaunchable = function() {
	return false;
}


