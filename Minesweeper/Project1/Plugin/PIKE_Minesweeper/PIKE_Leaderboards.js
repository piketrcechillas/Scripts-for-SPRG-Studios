function displayLeaderboard()
{
	var filename = null;
	var text = "Leaderboards";
	var generator;
	var fso = new ActiveXObject("Scripting.FileSystemObject");
    var ForReading = 1;


	var talkUnit;
	


	filename = "./easy.txt";

	var f1 = fso.OpenTextFile(filename, ForReading);
    text = text + "\n" + "Easy" + "\n" + "\n" + f1.ReadAll()
    f1.close();



	filename = "./medium.txt";

	var f2 = fso.OpenTextFile(filename, ForReading);
    text = text + "\n"  + "Medium" + "\n" + "\n" + f2.ReadAll()
    f2.close();


	filename = "./hard.txt";

	var f3 = fso.OpenTextFile(filename, ForReading);
    text = text + "\n" + "Hard" + "\n" + "\n" + f3.ReadAll()
    f3.close();
    generator = root.getEventGenerator()
	generator.infoWindow(text, 0, 0, 0, true)
	generator.execute()
}



function insertLeaderboard()
{	
	var time = root.getMetaSession().getPlayTime();
	var mapInfo = root.getCurrentSession().getCurrentMapInfo();

	
	var content = root.getEventCommandObject().getOriginalContent();
	var unit = content.getUnit();
	var filename;


	if(mapInfo.custom.easy)
		filename = "./easy.txt";

	if(mapInfo.custom.medium)
		filename = "./medium.txt";

	if(mapInfo.custom.hard)
		filename = "./hard.txt";


	var fso = new ActiveXObject("Scripting.FileSystemObject");
    var ForReading = 1;
    var f1 = fso.OpenTextFile(filename, ForReading);
	var text = f1.ReadAll()
    var textArr = text.split("\n")
    f1.close();

    var index = textArr.length;
    root.log("index: " + index)
    for(i = 0; i < textArr.length; i++){
    	var arr = textArr[i].split(":");
    	var ltime = parseInt(arr[1]);
    	if(time < ltime){
    		index = i;
    		break;
    	}
    }


    var newEntry = unit.getName() + "/Time:" + time;
    textArr.splice(index, 0 , newEntry);
    var f2 = fso.OpenTextFile(filename, 2);
    f2.Write("");
	root.log("index after: " + textArr.length)
    for(i = 0; i < textArr.length; i++){
    	var entry = textArr[i];
    	if(i>5)
    		break;
    	if(i==textArr.length-1)
    		f2.Write(entry)
    	else
    		f2.Write(entry + "\n")
     }

     f2.close();


}



TitleCommand.Leaderboard = defineObject(BaseTitleCommand,
{
	openCommand: function() {
		displayLeaderboard();
	},
	
	moveCommand: function() {
		// endGame can be called with openCommand, but it sounds as if the sound effect is interrupted.

		return MoveResult.END;
	},
	
	isSelectable: function() {
		return true;
	},

	getCommandName: function() {
		return "Leaderboard"
	}
}
);

var alias1 = TitleScene._configureTitleItem;
TitleScene._configureTitleItem = function(groupArray) {
	alias1.call(this, groupArray);
	
	groupArray.insertObject(TitleCommand.Leaderboard, 2);
	//groupArray.insertObject(TitleCommand.UploadFile, 4);
	//groupArray.insertObject(TitleCommand.DownloadFile, 5);
	
}