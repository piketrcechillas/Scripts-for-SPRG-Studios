var coreTable;


var Offset = {
	x: 6,
	y: 6
}


ReversiController = {
	_table: null,

	_initializeTable: function(){
		coreTable = [[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,1,-1,0,0,0],
		[0,0,0,-1,1,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0]]

		this._table = coreTable;
	},

	_checkValidMove: function(x, y, turnType){
		var coeff;
		var main;

		this._table = coreTable;

		if(this._table[x][y] != 0) {
			return false;
		}

		if(turnType == TurnType.PLAYER){
			coeff = -1
			main = 1;
		}
		else {
			coeff = 1;
			main = -1;
		}

		var result = false;
		
		var col = x;
		var row = y;

		for(i = -1; i < 2; i++) {
			for(j = -1; j < 2; j++) {
				var value = this._checkNode(x+i, y+j);
				var posX = x+i;
				var posY = y+j;
				
			}
		}

		for(i = -1; i < 2; i++) {
			for(j = -1; j < 2; j++) {
				if(i==0 && j==0) {
				}
				else if(this._checkNode(x+i, y+j) == coeff) {
					var val = 0;
					var posX = x+i;
					var posY = y+j;
					


					if(i==-1 && j ==-1){
						var k = 1;
						while(this._checkNode(x-k, y-k) == coeff) {
							k++;
							var val = this._checkNode(x-k, y-k);
						}
						if(val == main) {
							return true
						}
					}

					if(i==-1 && j == 0){
						var k = 1;
						while(this._checkNode(x-k, y) == coeff) {
							k++;
							val = this._checkNode(x-k, y);
						}
						if(val == main) {
							return true
						}
					}

					if(i==-1 && j == 1){
						var k = 1;
						while(this._checkNode(x-k, y+k) == coeff) {
							k++;
							val = this._checkNode(x-k, y+k);
						}
						if(val == main) {
							return true
						}
					}

					if(i==0 && j == -1){
						var k = 1;
				

						while(this._checkNode(x, y-k) == coeff) {
							k++;
							val = this._checkNode(x, y-k);
						}
						if(val == main) {
							return true
						}
					}

					if(i==0 && j == 1){
						var k = 1;
						while(this._checkNode(x, y+k) == coeff) {

							k++;
							val = this._checkNode(x, y+k);
						}
						if(val == main) {
							return true
						}
					}

					if(i==1 && j == -1){
						var k = 1;
						while(this._checkNode(x+k, y-k) == coeff) {
				

							k++;
							val = this._checkNode(x+k, y-k);
						}
						if(val == main) {
							return true
						}
					}

					if(i==1 && j == 0){
						var k = 1;
						while(this._checkNode(x+k, y) == coeff) {
				

							k++;
							val = this._checkNode(x+k, y);
						}
						if(val == main) {
							return true
						}
					}

					if(i==1 && j == 1){
						var k = 1;
						while(this._checkNode(x+k, y+k) == coeff) {
					

							k++;
							val = this._checkNode(x+k, y+k);
						}
						if(val == main) {
							return true
						}
					}


				}//end loop 1
			}
		}


	return false;
	},


	_checkNode: function(x, y){
		if(x<0 || x>7 || y<0 || y>7){
			return 0;
		}

		return this._table[x][y];
	},


	_flip: function(x, y, turnType){
		var coeff;
		var main;
		if(turnType == TurnType.PLAYER){
			coeff = -1
			main = 1;
		}
		else {
			coeff = 1;
			main = -1;
		}

		this._table[x][y] = main;

		var result = false;
		this._table = coreTable;

		for(i = -1; i < 2; i++) {
			for(j = -1; j < 2; j++) {
				if(i==0 && j==0) {
				}
				else if(this._checkNode(x+i, y+j) == coeff) {
					var val = 0;
					var posX = x+i;
					var posY = y+j;
					
					if(i==-1 && j ==-1){
						var k = 1;
						while(this._checkNode(x-k, y-k) == coeff) {
							k++;
							var val = this._checkNode(x-k, y-k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x-k, y-k) == coeff) {
								this._table[x-k][y-k] = this._checkNode(x-k, y-k)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==-1 && j == 0){
						var k = 1;
						while(this._checkNode(x-k, y) == coeff) {
							k++;
							val = this._checkNode(x-k, y);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x-k, y) == coeff) {
								this._table[x-k][y] = this._checkNode(x-k, y)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==-1 && j == 1){
						var k = 1;
						while(this._checkNode(x-k, y+k) == coeff) {
							k++;
							val = this._checkNode(x-k, y+k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x-k, y+k) == coeff) {
								this._table[x-k][y+k] = this._checkNode(x-k, y+k)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==0 && j == -1){
						var k = 1;
						while(this._checkNode(x, y-k) == coeff) {
							k++;
							val = this._checkNode(x, y-k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x, y-k) == coeff) {
								this._table[x][y-k] = this._checkNode(x, y-k)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==0 && j == 1){
						var k = 1;
						while(this._checkNode(x, y+k) == coeff) {
							k++;
							val = this._checkNode(x, y+k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x, y+k) == coeff) {
								this._table[x][y+k] = this._checkNode(x, y+k)*-1;
								k++;
							}
						}
						else
							result = false;
						val = 0;
					}

					if(i==1 && j == -1){
						var k = 1;
						while(this._checkNode(x+k, y-k) == coeff) {
							k++;
							val = this._checkNode(x+k, y-k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x+k, y-k) == coeff) {
								this._table[x+k][y-k] = this._checkNode(x+k, y-k)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==1 && j == 0){
						var k = 1;
						while(this._checkNode(x+k, y) == coeff) {
							k++;
							val = this._checkNode(x+k, y);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x+k, y) == coeff) {
								this._table[x+k][y] = this._checkNode(x+k, y)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==1 && j == 1){
						var k = 1;
						while(this._checkNode(x+k, y+k) == coeff) {
							k++;
							val = this._checkNode(x+k, y+k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x+k, y+k) == coeff) {
								this._table[x+k][y+k] = this._checkNode(x+k, y+k)*-1;
								k++;
							}
						}
						else
							result = false;
					}


				}//end loop 1
			}
		}


		coreTable = this._table;
	},

	_tempFlip: function(x, y, turnType){

		var coeff;
		var main;
		if(turnType == TurnType.PLAYER){
			coeff = -1
			main = 1;
		}
		else {
			coeff = 1;
			main = -1;
		}

		var tempTable = this._generateTable();

		for(var i = 0; i < 8; i++) {
			for(var j = 0; j < 8; j++) {
				tempTable[i][j] = this._table[i][j];

			}
		}

		tempTable[x][y] = main;



		for(i = -1; i < 2; i++) {
			for(j = -1; j < 2; j++) {
				if(i==0 && j==0) {
				}
				else if(this._checkNode(x+i, y+j) == coeff) {
					var val = 0;
					var posX = x+i;
					var posY = y+j;
					
					if(i==-1 && j ==-1){
						var k = 1;
						while(this._checkNode(x-k, y-k) == coeff) {
							k++;
							var val = this._checkNode(x-k, y-k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x-k, y-k) == coeff) {
								tempTable[x-k][y-k] = this._checkNode(x-k, y-k)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==-1 && j == 0){
						var k = 1;
						while(this._checkNode(x-k, y) == coeff) {
							k++;
							val = this._checkNode(x-k, y);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x-k, y) == coeff) {
								tempTable[x-k][y] = this._checkNode(x-k, y)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==-1 && j == 1){
						var k = 1;
						while(this._checkNode(x-k, y+k) == coeff) {
							k++;
							val = this._checkNode(x-k, y+k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x-k, y+k) == coeff) {
								tempTable[x-k][y+k] = this._checkNode(x-k, y+k)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==0 && j == -1){
						var k = 1;
						while(this._checkNode(x, y-k) == coeff) {
							k++;
							val = this._checkNode(x, y-k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x, y-k) == coeff) {
								tempTable[x][y-k] = this._checkNode(x, y-k)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==0 && j == 1){
						var k = 1;
						while(this._checkNode(x, y+k) == coeff) {
							k++;
							val = this._checkNode(x, y+k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x, y+k) == coeff) {
								tempTable[x][y+k] = this._checkNode(x, y+k)*-1;
								k++;
							}
						}
						else
							result = false;
						val = 0;
					}

					if(i==1 && j == -1){
						var k = 1;
						while(this._checkNode(x+k, y-k) == coeff) {
							k++;
							val = this._checkNode(x+k, y-k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x+k, y-k) == coeff) {
								tempTable[x+k][y-k] = this._checkNode(x+k, y-k)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==1 && j == 0){
						var k = 1;
						while(this._checkNode(x+k, y) == coeff) {
							k++;
							val = this._checkNode(x+k, y);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x+k, y) == coeff) {
								tempTable[x+k][y] = this._checkNode(x+k, y)*-1;
								k++;
							}
						}
						else
							result = false;
					}

					if(i==1 && j == 1){
						var k = 1;
						while(this._checkNode(x+k, y+k) == coeff) {
							k++;
							val = this._checkNode(x+k, y+k);
						}
						if(val == main) {
							k = 1
							while(this._checkNode(x+k, y+k) == coeff) {
								tempTable[x+k][y+k] = this._checkNode(x+k, y+k)*-1;
								k++;
							}
						}
						else
							result = false;
					}


				}//end loop 1
			}
		}


		return tempTable;
	},

	
	

	_revalidate: function() {
		var session = root.getCurrentSession();
		var black = root.createResourceHandle(false, 1, 0, 0, 0)
		var white = root.createResourceHandle(false, 3, 0, 0, 0)
		var grid = root.createResourceHandle(false, 2, 0, 0, 0)

		for(i=0; i<8; i++){
			for(j=0; j<8; j++){
				if(this._table[i][j] == 1)
					session.setMapChipGraphicsHandle(j+Offset.y, i+Offset.x, true, white);
				if(this._table[i][j] == -1)
					session.setMapChipGraphicsHandle(j+Offset.y, i+Offset.x, true, black);
				if(this._table[i][j] == 0)
					session.setMapChipGraphicsHandle(j+Offset.y, i+Offset.x, true, grid);
			}
		}
		this._movable = 0;
		coreTable = this._table;
	},

	_getTable: function() {
		return this._table;
	},

	_setTable: function(table) {
		this._table = table;
	},

	_evaluateMovable: function(turnType) {
		var result;
		

		for(p = 0; p < 8; p++){
			for(q = 0; q < 8; q++) {
				result = this._checkValidMove(p, q, turnType);
			
				if(result) {
					
					return true;
				}
			}
		}
		
		return false;
	},


	_checkPossibleTable: function(table, turnType) {
		var result;
		var possible = [];
		this._table = table;

		for(p = 0; p < 8; p++){
			for(q = 0; q < 8; q++) {
				result = this._checkValidMove(p, q, turnType);
				if(result) {
					var tmpTable = this._tempFlip(p, q, turnType);
					possible.push(tmpTable);
				}
				
			}
		}
		
		this._resetTable();
		return possible;
	},

	_resetTable: function() {
		this._table = coreTable;
	},

	_getWhiteValue: function(table) {
		var count = 0;
		for(var row = 0 ; row < 8; row++){
			for (var col = 0; col < 8; col++){
				if(table[row][col] == 1){
					count++;
				}
			}
		}
		return count;
	},

	_getBlackValue: function(table) {
		var count = 0;
		for(var row = 0 ; row < 8; row++){
			for (var col = 0; col < 8; col++){
				if(table[row][col] == -1){
					count++;
				}
			}
		}
		return count;
	},

	_generateTable: function() {
		var table = [[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,1,-1,0,0,0],
		[0,0,0,-1,1,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0]]

		return table;

	},

	_readTable: function() {
		var session = root.getCurrentSession();

		for(i=0; i<8; i++){
			for(j=0; j<8; j++){
				var terrain = PosChecker.getTerrainFromPos(i+Offset.x, j+Offset.y);


				if(terrain.custom.black){
					root.log("black detected")
					this._table[j][i] = -1
				}
				if(terrain.custom.white){
					root.log("white detected")
					this._table[j][i] = 1;
				}
			}
		}

		this._revalidate();
	}


}


MapCommand.Put = defineObject(BaseListCommand,
{
	openCommand: function() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		var currX = x - Offset.x
		var currY = y - Offset.y
		ReversiController._flip(currY, currX, session.getTurnType());
		ReversiController._revalidate();

		root.getLoadSaveManager().saveInterruptionFile(SceneType.FREE, root.getCurrentSession().getCurrentMapInfo().getId(), LoadSaveScreen._getCustomObject());
		
		if(root.getCurrentSession().getCurrentMapInfo().custom.online){
			Upload();
			root.log("Uploaded")}


		TurnControl.turnEnd();

	},
	
	moveCommand: function() {
		

		return MoveResult.CUSTOM;
		
	},


	isCommandDisplayable: function() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		var currX = x - Offset.x
		var currY = y - Offset.y
		var result = false;
		var terrain = PosChecker.getTerrainFromPos(x, y);
		if(terrain != null){


			result = ReversiController._checkValidMove(currY, currX, session.getTurnType());
		}
		return result;
	},

	getCommandName: function() {
		return "Put";
	},
	
	
	drawCommand: function() {
	}
}
);

MapCommand.configureCommands = function(groupArray) {
	var mixer = createObject(CommandMixer);
	
	mixer.pushCommand(MapCommand.Put, CommandActionType.PUT);
	groupArray.appendObject(MapCommand.Put)

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

	PUT: 50
};

var MoveResult = {
	SELECT: 0,
	CANCEL: 1,
	CONTINUE: 200,
	END: 800,
	CUSTOM: 1000
};

MapCommand._moveOpen = function() {
		var object = this._commandScrollbar.getObject();
		var result = MoveResult.CONTINUE;

	

		if (object.moveCommand() === MoveResult.CUSTOM) {
		
			return MoveResult.END;
		}
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			this._commandScrollbar.setActive(true);
			this.changeCycleMode(ListCommandManagerMode.TITLE);
		}
		
		return result;
	}

SaveScreenLauncher.isLaunchable = function() {
    return false;
};


MapParts.Terrain.drawMapParts = function() {

}


RestCommand.Quest.getCommandName = function()  
{
	var switchTable = root.getMetaSession().getGlobalSwitchTable();
	if(!switchTable.isSwitchOn(7))
		return "Choose Mode"
	else
		return "Proceed to Match"
}

RestCommand.Next.isCommandDisplayable = function() {
	return false;
}

ExperienceDistributionScreenLauncher.isLaunchable = function() {
	return false;
}


TitleCommand.Continue.isCommandDisplayable = function() {
	return false;
}

TitleCommand.NewGame.getCommandName = function() {
	return "Single Player";
}