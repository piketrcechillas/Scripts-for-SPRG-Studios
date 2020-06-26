/*-----------------------------------------------------------

Originally created by namae_kakkokari
Modified to apply to Speed based Turn Script, by piketrcechillas　
Import the banners of your choice to UI > Title, then set Global Parameters:

{playerQueue: <id>,
enemyQueue: <id>,
allyQueue: <id>}

whereas id is the id of your import queue banner. Sample banner provided
Also you need to manually set your Resolution width. Look for var width 
at line 47, then change the 640 to your resolution width



■規約
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問いません。フリーです。
・加工等、問題ありません。どんどん改造してください。
・クレジット明記無し　OK
・再配布、転載　OK
・wiki掲載　OK
・SRPG Studio利用規約は遵守してください。

-----------------------------------------------------------*/

(function() {


//----------------------------------------
// 設定
//----------------------------------------
var isUIResourceRunTime = true;			// 枠画像がランタイムか（true:ランタイム false:ランタイム以外）
			// 枠画像のID
var StatusTitlePartsCount = 1;			// 枠画像のパーツ数（この数値を増やすと枠が横に伸びます）
var StatusTitleTextColor  = 0xf9f09d;	// 文字の色
var StatusTitleTextHoseiX = 10;			// 文字の描画位置補正X
var StatusTitleTextHoseiY = 22;			// 文字の描画位置補正Y
var StatusTitleValueHoseiX = 0;		// 数値の描画位置補正X
var StatusTitleValueHoseiY = 18;		// 数値の描画位置補正Y

var MapDispOffGrobalSwId   = -1;		// 強制表示OFF用のグローバルスイッチID（-1なら無効）
var turnTable = SpeedGovernor.getUpcomingTurn();
var turnTableType = SpeedGovernor.getUpcomingTurnType();
var turnTableId = SpeedGovernor.getUpcomingTurnId();
var width = 640 - TitleRenderer.getTitlePartsWidth()*(StatusTitlePartsCount+2);
var height = -10;
// マップ画面で描画するデータ
var MapLayerDiplayObjectTable = [
	// MapLayerDiplayObjectTableのデータはここより下に記述して下さい
	
	// （以下はサンプルデータです）
	 { type: 0,  x:width     , y:height       , text:turnTable[0]       , value:'1' }	// タイプ0 20,550 に 文字列「変数Page1 ID:2の名前」を描画し、変数Page1 ID:2の値を表示
	,{ type: 0,  x:width        , y:height+20        , text:turnTable[1]       , value:'2' }	// タイプ1 20,590 に ランタイム以外(isRunTime:false)の画像（PICTURE）ID:2の絵を描画
	,{ type: 0,  x:width        , y:height+40        , text:turnTable[2]       , value:'3' }
	,{ type: 0,  x:width        , y:height+60      , text:turnTable[3]       , value:'4' }
	,{ type: 0,  x:width        , y:height+80       , text:turnTable[4]       , value:'5' }
	,{ type: 0,  x:width        , y:height+120       , text:turnTable[5]       , value:'6' }
	// MapLayerDiplayObjectTableのデータはここより上に記述して下さい
];







//----------------------------------------
// MapLayerクラス
//----------------------------------------
var alias01 = MapLayer.prepareMapLayer;
MapLayer.prepareMapLayer= function() {
		// 従来の処理を呼び出す
		alias01.call(this);
		
		// 制御文字変換用クラスを生成
		this._variableReplacer = null;
		this._variableReplacer = createObject(VariableReplacerForMapLayer);
}


var alias02 = MapLayer.drawUnitLayer;
MapLayer.drawUnitLayer = function() {
		// 従来の処理を呼び出す
		alias02.call(this);
		
		if( this.isMapDispGrobalSwOn() ) {
			return;
		}
		
		var sceneType = root.getCurrentScene();
		if ( sceneType === SceneType.FREE || sceneType === SceneType.EVENT || sceneType === SceneType.BATTLESETUP  || sceneType === SceneType.BATTLERESULT ) {
			// MapLayerDiplayObjectTableをチェックしてデータを描画する
			this._drawTitleAndGraphByTable();
		}
}


MapLayer.isMapDispGrobalSwOn = function() {
		// 
		if( MapDispOffGrobalSwId === -1 ) {
			return false;
		}
		
		var switchTable = root.getMetaSession().getGlobalSwitchTable();
		var index = switchTable.getSwitchIndexFromId(MapDispOffGrobalSwId);
		return switchTable.isSwitchOn(index);
}

MapLayer.reloadTable = function() {

	var turnTable = SpeedGovernor.getUpcomingTurn();
	turnTableType = SpeedGovernor.getUpcomingTurnType();
	turnTableId = SpeedGovernor.getUpcomingTurnId();
	MapLayerDiplayObjectTable = [
	// MapLayerDiplayObjectTableのデータはここより下に記述して下さい
	
	// （以下はサンプルデータです）
	 { type: 0,  x:width     , y:height       , text:turnTable[0]       , value:'1' }	// タイプ0 20,550 に 文字列「変数Page1 ID:2の名前」を描画し、変数Page1 ID:2の値を表示
	,{ type: 0,  x:width        , y:height+20        , text:turnTable[1]       , value:'2' }	// タイプ1 20,590 に ランタイム以外(isRunTime:false)の画像（PICTURE）ID:2の絵を描画
	,{ type: 0,  x:width        , y:height+40        , text:turnTable[2]       , value:'3' }
	,{ type: 0,  x:width        , y:height+60      , text:turnTable[3]       , value:'4' }
	,{ type: 0,  x:width        , y:height+80       , text:turnTable[4]       , value:'5' }
	,{ type: 0,  x:width        , y:height+100       , text:turnTable[5]       , value:'6' }

	];

}

// MapLayerDiplayObjectTableをチェックしてデータを描画する
MapLayer._drawTitleAndGraphByTable = function() {
		var i, data, x, y, text, value, isRuntime, id;

		this.reloadTable();
		var cnt = MapLayerDiplayObjectTable.length;
		
		for( i = 0;i < cnt;i++ ) {
			data = MapLayerDiplayObjectTable[i];
			
			// タイプ：0　枠描画して中に文字と値を表示する
			if( data.type === 0 ) {
				x = Number(this.checkValueAndConvert( data.x ));
				y = Number(this.checkValueAndConvert( data.y ));
				text = this.checkValueAndConvert( data.text );
				value = Number(this.checkValueAndConvert( data.value ));
				type = turnTableType[i];
				id = turnTableId[i];
				
				if( typeof x !== 'number' || typeof y !== 'number' || typeof text === 'undefined' || typeof value !== 'number' ) {
					//root.log(i+'番目のデータに異常あり。スキップ');
					continue;
				}

				var session = root.getCurrentSession();
				var xCursor = session.getMapCursorX();
				var yCursor = session.getMapCursorY();
				var unit = PosChecker.getUnitFromPos(xCursor, yCursor)
				if(unit != null) {
					var unitType;
					if(unit.getUnitType() == UnitType.PLAYER)
						unitType = 0;
					if(unit.getUnitType() == UnitType.ENEMY)
						unitType = 1;
					if(unit.getUnitType() == UnitType.ALLY)
						unitType = 2;

					if(id == unit.getId() && type == unitType)
						x = x - 10;
				}
				
				this._drawTitle(x, y, text, value, type);
			}
			// タイプ：1　指定IDの画像を表示する
			else if( data.type === 1 ) {
				x = Number(this.checkValueAndConvert( data.x ));
				y = Number(this.checkValueAndConvert( data.y ));
				isRunTime = Number(this.checkValueAndConvert( data.isRunTime ));
				id = Number(this.checkValueAndConvert( data.id ));
				
				if( typeof x !== 'number' || typeof y !== 'number' || typeof isRunTime !== 'number' || typeof id !== 'number' ) {
					//root.log(i+'番目のデータに異常あり。スキップ');
					continue;
				}
				
				this._drawGraphic(x, y, isRunTime, id);
			}
			else {
				//root.log('type異常:'+i);
			}
		}
}


// 枠描画して中に文字と値を表示する
MapLayer._drawTitle = function(x, y, text, value, type) {
	var playerQueue = root.getMetaSession().global.playerQueue;	
	var enemyQueue = root.getMetaSession().global.enemyQueue;	
	var allyQueue = root.getMetaSession().global.allyQueue;	
	var textui = root.queryTextUI('questreward_title')
	var color = StatusTitleTextColor;
	var font = textui.getFont();

	// UIのリソース：タイトル内にある指定IDの画像を取り出す
	var pic;
	if(type == 0)
		pic = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(playerQueue);
	if(type == 1)
		pic = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(enemyQueue);
	if(type == 2)
		pic = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(allyQueue);
	
	// 画像無しなら終了
	if( pic === null ) {
		return;
	}
	
	TitleRenderer.drawTitle(pic, x, y, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), StatusTitlePartsCount);
	
	TextRenderer.drawText(x + StatusTitleTextHoseiX, y + StatusTitleTextHoseiY, text, -1, color, font);
	
	NumberRenderer.drawNumber(x + StatusTitleValueHoseiX, y + StatusTitleValueHoseiY, value);
}


// 指定IDの画像を表示する
MapLayer._drawGraphic = function(x, y, isRuntime, picId) {
	// UIのリソース：タイトル内にある指定IDの画像を取り出す
	var pic = root.getBaseData().getGraphicsResourceList(GraphicsType.PICTURE, isRuntime).getDataFromId(picId);
	
	// 画像無しなら終了
	if( pic === null ) {
		return;
	}
	
	pic.draw(x, y);
}


// テーブルに記載された制御文字を解析して返す
MapLayer.checkValueAndConvert= function( value ) {
		// 文字列でなければそのまま返す
		if( typeof value !== 'string' ) {
			return value;
		}
		
		if( this._variableReplacer == null ) {
			return value;
		}
		
		// 文字列を置き換える
		return this._variableReplacer.startReplace(value);
}




// 以下は文字列内の制御文字を変換する為のクラス

//----------------------------------------
// VariableReplacerForMapLayerクラス
//----------------------------------------
var VariableReplacerForMapLayer = defineObject(VariableReplacer,
{
	_configureVariableObject: function(groupArray) {
		// VariableReplacerの_configureVariableObjectを呼び出す
		VariableReplacer._configureVariableObject.call(this, groupArray);
		
		// VariableReplacerがあまり遅くならないよう、今のところは別のクラスにして以下の変換処理を追加している
		
		groupArray.appendObject(DataVariable.PlvForMapLayer);		// 指定プレイヤーユニットのLV
		groupArray.appendObject(DataVariable.Vn1ForMapLayer);		// 変数の名前（ページ１）
		groupArray.appendObject(DataVariable.Vn2ForMapLayer);		// 変数の名前（ページ２）
		groupArray.appendObject(DataVariable.Vn3ForMapLayer);		// 変数の名前（ページ３）
		groupArray.appendObject(DataVariable.Vn4ForMapLayer);		// 変数の名前（ページ４）
		groupArray.appendObject(DataVariable.Vn5ForMapLayer);		// 変数の名前（ページ５）
		groupArray.appendObject(DataVariable.Vn6ForMapLayer);		// 変数の名前（ページ６）
	}
}
);




//----------------------------------------
// DataVariable.PlvForUnitMenuクラス
//----------------------------------------
DataVariable.PlvForMapLayer = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		var i, data;
		var id = this.getIdFromKey(text);
		var result = '';
		var list = this.getList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (data.getId() === id) {
				result = data.getLv();
				break;
			}
		}
		
		return result;
	},
	
	getList: function() {
		return PlayerList.getMainList();
	},
	
	getKey: function() {
		var key = /\\plv\[(\d+)\]/;
		
		return key;
	}
}
);




//----------------------------------------
// DataVariable.Vn1ForMapLayerクラス
//----------------------------------------
DataVariable.Vn1ForMapLayer = defineObject(BaseDataVariable,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 1);
	},
	
	// getVariableValueという名称だが、テーブルの名前を返すよう変更している
	getVariableValue: function(text, n) {
		var id = this.getIdFromKey(text);
		var table = root.getMetaSession().getVariableTable(n - 1);
		var index = table.getVariableIndexFromId(id);
		
		// テーブルの名前を返すよう変更
		return table.getVariableName(index);
	},
	
	getKey: function() {
		var key = /\\vn1\[(\d+)\]/;
		
		return key;
	}
}
);




//----------------------------------------
// DataVariable.Vn2ForMapLayerクラス
//----------------------------------------
DataVariable.Vn2ForMapLayer = defineObject(DataVariable.Vn1ForMapLayer,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 2);
	},
	
	getKey: function() {
		var key = /\\vn2\[(\d+)\]/;
		
		return key;
	}
}
);




//----------------------------------------
// DataVariable.Vn3ForMapLayerクラス
//----------------------------------------
DataVariable.Vn3ForMapLayer = defineObject(DataVariable.Vn1ForMapLayer,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 3);
	},
	
	getKey: function() {
		var key = /\\vn3\[(\d+)\]/;
		
		return key;
	}
}
);




//----------------------------------------
// DataVariable.Vn4ForMapLayerクラス
//----------------------------------------
DataVariable.Vn4ForMapLayer = defineObject(DataVariable.Vn1ForMapLayer,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 4);
	},
	
	getKey: function() {
		var key = /\\vn4\[(\d+)\]/;
		
		return key;
	}
}
);




//----------------------------------------
// DataVariable.Vn5ForMapLayerクラス
//----------------------------------------
DataVariable.Vn5ForMapLayer = defineObject(DataVariable.Vn1ForMapLayer,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 5);
	},
	
	getKey: function() {
		var key = /\\vn5\[(\d+)\]/;
		
		return key;
	}
}
);




//----------------------------------------
// DataVariable.Vn6ForMapLayerクラス
//----------------------------------------
DataVariable.Vn6ForMapLayer = defineObject(DataVariable.Vn1ForMapLayer,
{
	getReplaceValue: function(text) {
		return this.getVariableValue(text, 6);
	},
	
	getKey: function() {
		var key = /\\vn6\[(\d+)\]/;
		
		return key;
	}
}
);


})();
