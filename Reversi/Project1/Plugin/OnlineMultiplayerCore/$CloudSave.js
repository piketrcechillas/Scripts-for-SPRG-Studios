
TitleCommand.UploadFile = defineObject(BaseTitleCommand,
{
	openCommand: function() {
		var stream = new ActiveXObject('ADODB.Stream');
		stream.Type = 1;
		stream.Open();
		stream.LoadFromFile("save/save01.sav")
		var binData = stream.Read();
		//root.log(binData);
		//stream.SaveToFile("D:/save02.sav", 2)
		stream.Close()
		stream = null;
		var http = new ActiveXObject("Msxml2.XMLHTTP.6.0")
		http.open('POST', "https://srpgstudioserver.azurewebsites.net/rest/connect/savefile", false);
		http.send(binData);

		root.log(http.readyState)
		if(http.readyState == 4){
			root.log("Response code: " + http.status);
			root.log(http.responseText)	
    	}
    	http = null;
	},
	
	getCommandName: function() {
		return 'Upload Save';
	},

	moveCommand: function() {
		// endGame can be called with openCommand, but it sounds as if the sound effect is interrupted.
		return MoveResult.END;
	},
	
	isSelectable: function() {
		var fso = new ActiveXObject('Scripting.FileSystemObject')
   		var pathing = fso.GetFolder('.\\save')
    	return pathing.Size > 0
	}
}
);

TitleCommand.DownloadFile = defineObject(BaseTitleCommand,
{
	openCommand: function() {

		var http = new ActiveXObject("Msxml2.XMLHTTP.6.0")
		http.open('GET', "https://srpgstudioserver.azurewebsites.net/rest/connect/loadfile", false);
		http.send();
		root.log(http.readyState)
		//stream.LoadFromFile("D:/save01.sav")
		var stream = new ActiveXObject('ADODB.Stream');
		stream.Type = 1;
		
		if(http.readyState == 4){
			stream.Open();
			root.log("Response code: " + http.status);
			root.log(http.responseBody)	
			//stream.Write(binData);
			data = http.responseBody;
			stream.Write(data);
			stream.SaveToFile("save/save01.sav", 2)
			stream.Close();

			//TitleCommand.Continue.isSelectable()
		}

		stream = null;
		http = null;
	},
	
	getCommandName: function() {
		return 'Download Save';
	},

	moveCommand: function() {
		// endGame can be called with openCommand, but it sounds as if the sound effect is interrupted.
		return MoveResult.END;
	},
	
	isSelectable: function() {
		return true;
	}
}
);

var FileUploader = {
	_file: null,
	getFile: function() {

	}

}

TitleCommand.Continue.isSelectable = function(){
    var fso = new ActiveXObject('Scripting.FileSystemObject')
    var pathing = fso.GetFolder('.\\save')
    return false;
}

TitleCommand.Continue.openCommand = function() {
    var screenParam = this._createLoadSaveParam();
    root.getLoadSaveManager().copyFile(99, 99); // <- execute root.getLoadSaveManager() to update. this is meaningless copy.
    this._loadSaveScreen = createObject(LoadSaveControl.getLoadScreenObject());
    SceneManager.addScreen(this._loadSaveScreen, screenParam);
    this._loadSaveScreen._setScrollData(DefineControl.getMaxSaveFileCount(), true);
};


Upload = function() {
		var id = root.getMetaSession().getVariableTable(4).getVariable(1)
		var stream = new ActiveXObject('ADODB.Stream');
		stream.Type = 1;
		stream.Open();
		stream.LoadFromFile("save/interruption.sav")
		var binData = stream.Read();
		//root.log(binData);
		//stream.SaveToFile("D:/save02.sav", 2stream.Flush();)
		stream.Flush();
		stream.Close()

		var http = new ActiveXObject("Msxml2.XMLHTTP.6.0")
		http.open('POST', "https://srpgstudioserver.azurewebsites.net/rest/connect/save?id=" + id, false);
		http.send(binData);

		root.log(http.readyState)
		if(http.readyState == 4){
			root.log("Response code: " + http.status);
			root.log(http.responseText)	
			http.abort();
    	}

    	delete stream;
		delete http;
}

Download = function() {
		var id = root.getMetaSession().getVariableTable(4).getVariable(1)
		var http = new ActiveXObject("Msxml2.XMLHTTP.6.0")
		http.open('POST', "https://srpgstudioserver.azurewebsites.net/rest/connect/load?id=" + id, false);
		http.send();
		root.log(http.readyState)
		//stream.LoadFromFile("D:/save01.sav")
		var stream = new ActiveXObject('ADODB.Stream');
		stream.Type = 1;
		
		if(http.readyState == 4){
			stream.Open();
			root.log("Response code: " + http.status);
			//stream.Write(binData);
			data = http.responseBody;
			stream.Write(data);
			stream.SaveToFile("save/interruption.sav", 2)
			stream.Flush();
			stream.Close();
			//TitleCommand.Continue.isSelectable()
			http.abort();
		}

		delete stream;
		delete http;
}