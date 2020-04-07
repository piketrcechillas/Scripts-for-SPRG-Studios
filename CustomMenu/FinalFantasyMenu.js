ListCommandScrollbar.drawScrollContentMenu = function(x, y, object, isSelect, index) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(1);
		var pictop = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(2);
		var picbot = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(0);
		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, pic, this._getPartsCount());
	}

ListCommandScrollbar.drawScrollContentMenuTop = function(x, y, object, isSelect, index) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var pictop = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(2);
		var picbot = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(0);
		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, pictop, this._getPartsCount());
	}


ListCommandScrollbar.drawScrollContentMenuBot = function(x, y, object, isSelect, index) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var pictop = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(2);
		var picbot = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(0);
		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, picbot, this._getPartsCount());
	}


BaseListCommandManager._drawTitle = function() {
		var x = this.getPositionX();
		var y = this.getPositionY();
		
		this._commandScrollbar.drawScrollbarMenu(x, y);
	}