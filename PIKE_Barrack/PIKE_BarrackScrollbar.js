ItemRenderer.drawMercAlpha = function(x, y, item, color, font, isDrawLimit, alpha) {
		var interval = this._getItemNumberInterval();
		var iconWidth = GraphicsFormat.ICON_WIDTH + 5;
		var length = this._getTextLength();
		var handle = item.getIconResourceHandle();
		var graphicsRenderParam = StructureBuilder.buildGraphicsRenderParam();
		
		graphicsRenderParam.alpha = alpha;
		GraphicsRenderer.drawImageParam(x, y, handle, GraphicsType.ICON, graphicsRenderParam);
		
		TextRenderer.drawAlphaText(x + iconWidth, y + ContentLayout.KEYWORD_HEIGHT, item.custom.unit, length, color, alpha, font);
		
		if (isDrawLimit) {
			this.drawItemLimit(x + iconWidth + interval, y, item, alpha);
		}
	}

UnitCommand.Shop.isCommandDisplayable = function() {
		if(root.getCurrentSession().getCurrentMapInfo().custom.aw)
			return false;



		var event = this._getEvent();
		
		return event !== null && event.isEvent() && Miscellaneous.isItemAccess(this.getCommandTarget());
	}



ItemRenderer.drawMercItem = function(x, y, item, color, font, gold, amount) {
		var alpha = 255;
		var currGold = root.getMetaSession().getGold();
		var price = item.getGold();
		ItemRenderer.drawMerc(x, y, item, color, font, false);
		this.drawAmount(x + 140, y, item, color, font, amount);
		//ItemRenderer.drawItemLimit(x + 225, y, item, 255);
		if(price > currGold){
			alpha = 80;
		}
		else{
			alpha = 255;
		}

		NumberRenderer.drawNumberColor(x + 285, y, gold, 0, alpha);
	}

ItemRenderer.drawMerc = function(x, y, item, color, font, isDrawLimit) {
		var alpha = 255;
		var gold = root.getMetaSession().getGold();
		var price = item.getGold();
		if(price > gold){
			alpha = 80;
		}
		else{
			alpha = 255;
		}

		this.drawMercAlpha(x, y, item, color, font, isDrawLimit, alpha);
	}
