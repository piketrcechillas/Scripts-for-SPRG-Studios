ListCommandScrollbar.drawScrollContentMenu = function(x, y, object, isSelect, index) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();

		//Change the number in getDataFromId() with your Middle Part ID
		var pic = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(1);
		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, pic, this._getPartsCount());
	}

ListCommandScrollbar.drawScrollContentMenuTop = function(x, y, object, isSelect, index) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();

		//Change the number in getDataFromId() with your Top Part ID
		var pictop = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(2);

		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, pictop, this._getPartsCount());
	}


ListCommandScrollbar.drawScrollContentMenuBot = function(x, y, object, isSelect, index) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();

		//Change the number in getDataFromId() with your Bottom Part ID
		var picbot = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(0);
		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, picbot, this._getPartsCount());
	}


ListCommandScrollbar.drawScrollContentMenuAll = function(x, y, object, isSelect, index) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();

		//Change the number in getDataFromId() with your All Part ID
		var picbot = root.getBaseData().getUIResourceList(UIType.TITLE, false).getDataFromId(1);
		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, picbot, this._getPartsCount());
	}


BaseListCommandManager._drawTitle = function() {
		var x = this.getPositionX();
		var y = this.getPositionY();
		
		this._commandScrollbar.drawScrollbarMenu(x, y);
	}

ListCommandScrollbar.drawScrollbarMenu = function(xStart, yStart) {
		var i, j, x, y, isSelect;
		var isLast = false;
		var objectCount = this.getObjectCount();
		var width = this._objectWidth + this.getSpaceX();
		var height = this._objectHeight + this.getSpaceY();
		var index = (this._yScroll * this._col) + this._xScroll;
		
		xStart += this.getScrollXPadding();
		yStart += this.getScrollYPadding();
		
		// The data shouldn't be updated with draw functions, but exclude so as to enable to refer to the position with move functions.
		this.xRendering = xStart;
		this.yRendering = yStart;
		MouseControl.saveRenderingPos(this);
		
		for (i = 0; i < this._rowCount; i++) {
			y = yStart + (i * height);
			
			this.drawDescriptionLine(xStart, y);
			
			for (j = 0; j < this._col; j++) {
				x = xStart + (j * width);
				
				isSelect = index === this.getIndex();

				if(this._rowCount == 1)
					this.drawScrollContentMenuAll(x, y, this._objectArray[index], isSelect, index);
				else {
					if(index == 0)
						this.drawScrollContentMenuTop(x, y, this._objectArray[index], isSelect, index);
					else if(index == this._rowCount - 1)
						this.drawScrollContentMenuBot(x, y, this._objectArray[index], isSelect, index);
					else
						this.drawScrollContentMenu(x, y, this._objectArray[index], isSelect, index);
				}
				if (isSelect && this._isActive) {
						this.drawCursor(x + 40, y, true);
				}
				
				if (index === this._forceSelectIndex) {
					this.drawCursor(x + 40 , y, false);
				}
				
				if (++index === objectCount) {
					isLast = true;
					break;
				}
			}
			if (isLast) {
				break;
			}
		}
		
		if (this._isActive) {
			this.drawEdgeCursor(xStart, yStart);
		}
	}