/* Dynamic Theme, by piketrcechillas
For a special script, usage is also a bit complicated. Follow these steps closely.
BEWARE: You will be SACRIFICING voice functionality for this. There is no other way.

1. Create a new folder in Material folder and name it Voice
2. Go to Database -> config 2 -> Voice settings, and type Voice in Voice Folder 
3. Import the map theme to your media section as usual, and ALL of the map music to that theme (every phase, battles etc.)
4. Put the battle dynamic theme into the created Voice folder
5. Enter {filename: "your-file-name"} to the map custom parameter. Example: {filename:"FERain.ogg"}
6. Use WAV file for battle music if its track is lengthy, else the game will freeze a bit when loading OGGs or MP3s.
A performance - filesize tradeoff :D
You only need to use WAV for battle theme, no need to do with BGM.

Enjoy!


*/



(function () {
var enable = false;

MapStartFlowEntry._completeMemberData =function(battleSetupScene) {
		enable = true;
		root.getMediaManager().setVoiceVolume(0);
		return this._turnChangeMapStart.enterTurnChangeCycle();
	}

BaseBattleTable.endMusic = function() {
	if (this._isBattleStart && this._isMusicPlay) {
		//MediaControl.musicStop(MusicStopType.BACK);
	}
	
	//MediaControl.resetSoundList();
	//MediaControl.soundDirect('attackstart');

	var flag = ConfigItem.MusicPlay.getFlagValue();
	var arr = ConfigItem.MusicPlay.getVolumeArray();

	root.getMediaManager().setMusicVolume(arr[flag]);
	root.getMediaManager().setVoiceVolume(0);
}

BattleMusicControl.playBattleMusic = function(battleTable, isForce) {
	var handleActive;
	var data = this._getBattleMusicData(battleTable);
	var handle = data.handle;
	var isMusicPlay = false;
	root.log("check Music")

	var flag = ConfigItem.MusicPlay.getFlagValue();
	var arr = ConfigItem.MusicPlay.getVolumeArray();

	root.getMediaManager().setMusicVolume(0);
	root.getMediaManager().setVoiceVolume(arr[flag]);
	
	if (handle.isNullHandle()) {
		isMusicPlay = false;
	}
	else {
		handleActive = root.getMediaManager().getActiveMusicHandle();

		if (handle.isEqualHandle(handleActive)) {
			// Don't play background music because the background music which was about to be played has already been played.
			isMusicPlay = false;
		}
		else {
			if (data.isNew) {
				//MediaControl.resetMusicList();
				//MediaControl.musicPlayNew(handle);
				//this._arrangeMapMusic(handle);
			}
			else if (isForce) {
				//MediaControl.musicPlay(handle);
				isMusicPlay = true;
			}
		}
	}
	return isMusicPlay;
}

CoreAttack._playAttackStartSound = function() {
	if (this.isRealBattle()) {
		// Play the sound to start an attack at the real battle.
		MediaControl.soundDirect('attackstart');
	}
}

var count = 0;
var offset = 0;

var debug = false;


var alias101 = MapLayer.drawUnitLayer;
MapLayer.drawUnitLayer = function() {
	alias101.call(this);


	if(enable) {

		if(!root.getMaterialManager().isVoicePlaying(1)){
			debug = true;
			MediaControl.musicStop(SpeedType.DIRECT);
			MediaControl.resetMusicList();

			var mapInfo = root.getCurrentSession().getCurrentMapInfo();
			var file = mapInfo.custom.filename;
			var handle = mapInfo.getPlayerTurnMusicHandle();

			if(mapInfo.custom.offset!=null){
				offset = mapInfo.custom.offset;
			}

			if(count == 999) {
				count = offset;
			}

			SoundGenerator.play(file, handle);
				}
			}
		//count = 53;
	}


var SoundGenerator = {	
	play: function(file, handle) {
		root.log(count)
		if(count == offset) {
			root.getMaterialManager().voicePlay(DataConfig.getVoiceCategoryName(), file, 1);
			MediaControl.musicPlayNew(handle);
			count=999;
		}
		else if(count == 999){
		}
		else{
			count++;
		}

	}
}
})();