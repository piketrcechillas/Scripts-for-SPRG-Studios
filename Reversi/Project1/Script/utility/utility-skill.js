
var SkillProjector = defineObject(BaseObject,
{
	_projector: null,
	
	setupProjector: function(battleType, battleObject) {
		if (DataConfig.isSkillAnimeEnabled()) {
			this._projector = createObject(AnimeSkillProjector);
		}
		else {
			this._projector = createObject(TextSkillProjector);
		}
		
		this._projector.setupProjector(battleType, battleObject);
	},
	
	startProjector: function(rightSkillArray, leftSkillArray, isRight) {
		this._projector.startProjector(rightSkillArray, leftSkillArray, isRight);
	},
	
	moveProjector: function() {
		return this._projector.moveProjector();
	},
	
	drawProjector: function() {
		this._projector.drawProjector();
	}
}
);

var AnimeSkillProjector = defineObject(BaseObject,
{
	_battleType: 0,
	_battleObject: null,
	_order: null,
	_rightSkillArray: null,
	_leftSkillArray: null,
	_isRight: false,
	_rightAnime: null,
	_leftAnime: null,
	_rightIndex: 0,
	_leftIndex: 0,
	
	setupProjector: function(battleType, battleObject) {
		this._battleType = battleType;
		this._battleObject = battleObject;
		this._order = battleObject.getAttackOrder();
	},
	
	startProjector: function(rightSkillArray, leftSkillArray, isRight) {
		this._rightSkillArray = rightSkillArray;
		this._leftSkillArray = leftSkillArray;
		this._isRight = isRight;
		this._rightAnime = this._getNextAnime(rightSkillArray, true);
		this._leftAnime = this._getNextAnime(leftSkillArray, false);
	},
	
	moveProjector: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._rightAnime !== null) {
			if (this._moveAnime(this._rightAnime) !== MoveResult.CONTINUE) {
				this._rightAnime = this._getNextAnime(this._rightSkillArray, true);
			}
		}
		
		if (this._leftAnime !== null) {
			if (this._moveAnime(this._leftAnime) !== MoveResult.CONTINUE) {
				this._leftAnime = this._getNextAnime(this._leftSkillArray, false);
			}
		}
		
		if (this._rightAnime === null && this._leftAnime === null) {
			result = MoveResult.END;
		}
		
		return result;
	},
	
	drawProjector: function() {
		if (this._rightAnime !== null) {
			this._drawAnime(this._rightAnime);
		}
		
		if (this._leftAnime !== null) {
			this._drawAnime(this._leftAnime);
		}
	},
	
	_getNextAnime: function(skillArray, isRight) {
		var i, anime;
		var index = isRight ? this._rightIndex : this._leftIndex;
		var object = null;
		
		for (i = index; i < skillArray.length; i++) {
			index++;
			if (this._battleType === BattleType.REAL) {
				anime = skillArray[i].getRealAnime();
				if (anime !== null) {
					object = this._createRealSkillEffect(anime, isRight);
					break;
				}
			}
			else {
				anime = skillArray[i].getEasyAnime();
				if (anime !== null) {
					object = this._createEasySkillEffect(anime, isRight);
					break;
				}
			}	
		}
		
		if (isRight) {
			this._rightIndex = index;
		}
		else {
			this._leftIndex = index;
		}
		
		return object;
	},
	
	_moveAnime: function(anime) {
		return anime.isEffectLast() ? MoveResult.END : MoveResult.CONTINUE;
	},
	
	_drawAnime: function(anime) {
	},
	
	_createRealSkillEffect: function(anime, isRight) {
		var battler = this._battleObject.getBattler(isRight);
		var pos = battler.getEffectPos(anime);
		var x = pos.x;
		var y = pos.y;
		var scrollValue = AttackControl.getBattleObject().getAutoScroll().getScrollX();
		var offset = root.getAnimePreference().getSkillAnimeOffset() + 192;
		
		if (x - scrollValue < 0) {
			x = 0 + offset;
		}
		else if (x - scrollValue > RealBattleArea.WIDTH) {
			x = RealBattleArea.WIDTH - offset;
		}
		
		return this._battleObject.createEffect(anime, x, y, isRight, false);
	},
	
	_createEasySkillEffect: function(anime, isRight) {
		var battler = this._battleObject.getBattler(isRight);
		var pos = LayoutControl.getMapAnimationPos(battler.getMapUnitX(), battler.getMapUnitY(), anime);
		
		return this._battleObject.createEasyEffect(anime, pos.x, pos.y);
	}
}
);

var TextSkillProjector = defineObject(BaseObject,
{
	_battleType : 0,
	_battleObject: null,
	_rightAnime: null,
	_leftAnime: null,
	
	setupProjector: function(battleType, battleObject) {
		this._battleType = battleType;
		this._battleObject = battleObject;
	},
	
	startProjector: function(rightSkillArray, leftSkillArray, isRight) {
		this._rightAnime = createObject(TextCustomEffect);
		this._rightAnime.setEffectData(rightSkillArray, this._battleObject, this._battleType, isRight, true);
		
		this._leftAnime = createObject(TextCustomEffect);
		this._leftAnime.setEffectData(leftSkillArray, this._battleObject, this._battleType, isRight, false);
		
		this._playSkillInvocationSound();
	},
	
	moveProjector: function() {
		var result = MoveResult.CONTINUE;
		
		if (this._rightAnime !== null) {
			if (this._moveAnime(this._rightAnime) !== MoveResult.CONTINUE) {
				this._rightAnime = null;
			}
		}
		
		if (this._leftAnime !== null) {
			if (this._moveAnime(this._leftAnime) !== MoveResult.CONTINUE) {
				this._leftAnime = null;
			}
		}
		
		if (this._rightAnime === null && this._leftAnime === null) {
			result = MoveResult.END;
		}
		
		return result;
	},
	
	drawProjector: function() {
		if (this._rightAnime !== null) {
			this._drawAnime(this._rightAnime);
		}
		
		if (this._leftAnime !== null) {
			this._drawAnime(this._leftAnime);
		}
	},
	
	_moveAnime: function(anime) {
		if (this._battleType === BattleType.REAL) {
			return anime.isEffectLast() ? MoveResult.END : MoveResult.CONTINUE;
		}
		else {
			return anime.moveEffect();
		}
	},
	
	_drawAnime: function(anime) {
		if (this._battleType !== BattleType.REAL) {
			anime.drawEffect(0, 0);
		}
	},
	
	_playSkillInvocationSound: function() {
		MediaControl.soundDirect('skillinvocation');
	}
}
);

var TextCustomEffect = defineObject(BaseCustomEffect,
{
	_battleType: null,
	_battleObject: null,
	_skillArray: null,
	_isRight: false,
	_isFront: false,
	_counter: null,
	
	setEffectData: function(skillArray, battleObject, battleType, isRight, isFront) {
		this._battleType = battleType;
		this._battleObject = battleObject;
		this._skillArray = skillArray;
		this._isFront = isFront;
		this._isRight = isRight;
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(34);
		
		if (this._battleType === BattleType.REAL) {
			this._battleObject.pushCustomEffect(this);
		}
	},
	
	moveEffect: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this.endEffect();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEffect: function(xScroll, yScroll) {
		var active, passive;
		var order = this._battleObject.getAttackOrder();
		
		if (this._isRight) {
			active = order.getActiveUnit();
			passive = order.getPassiveUnit();
		}
		else {
			active = order.getPassiveUnit();
			passive = order.getActiveUnit();
		}
		
		if (this._isFront) {
			this._drawArea(active, passive, this._skillArray, true);
		}
		else {
			this._drawArea(passive, active, this._skillArray, false);
		}
	},
	
	_drawArea: function(active, passive, skillArray, isRight) {
		var x, y, pos, width, max;
		
		if (this._battleType === BattleType.REAL) {	
			pos = this._battleObject.getEffectPosFromUnit(null, active);
			x = pos.x;
			y = pos.y - 40;
			
			width = this._getWidth();
			max = RealBattleArea.WIDTH;
			if (x + width > max) {
				x = max - width;
			}
			else if (x < 0) {
				x = 0;
			}
			
			this._drawAreaTitle(x, y, skillArray, active, isRight);
		}
		else {
			if (isRight) {
				y = Miscellaneous.getDyamicWindowY(active, passive, 145);
				x = LayoutControl.getCenterX(-1, this._getWidth() * 2);
			}
			else {
				y = Miscellaneous.getDyamicWindowY(passive, active, 145);
				x = LayoutControl.getCenterX(-1, this._getWidth() * 2) + this._getWidth();
			}
			
			if (y < Math.floor(root.getGameAreaHeight() / 2)) {
				y += 98;
			}
			else {
				y -= this._getHeight(skillArray);
			}
			
			this._drawAreaWindow(x, y, skillArray, active, isRight);
		}
	},
	
	_drawAreaTitle: function(x, y, skillArray, unit, isRight) {
		var i;
		var count = skillArray.length;
		var textui = root.queryTextUI('skill_title');
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		
		for (i = 0; i < count; i++) {
			TitleRenderer.drawTitleNoCache(pic, x, y, width, height, this._getTitlePartsCount(skillArray[i], font));
			SkillRenderer.drawSkill(x + 42, y + 18, skillArray[i], color, font);
			y += 40;
		}
	},
	
	_drawAreaWindow: function(x, y, skillArray, unit, isRight) {
		var i;
		var count = skillArray.length;
		var textui = this._getWindowTextUI(unit);
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var width = this._getWidth();
		var height = this._getHeight(skillArray);
		var range = createRangeObject();
		
		if (count === 0) {
			return;
		}
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += DefineControl.getWindowXPadding();
		y += DefineControl.getWindowYPadding();
		
		for (i = 0; i < count; i++) {
			range.x = x + GraphicsFormat.ICON_WIDTH + 3;
			range.y = y;
			range.width = this._getWidth() - (DefineControl.getWindowXPadding() * 2) - (GraphicsFormat.ICON_WIDTH + 3);
			range.height = GraphicsFormat.ICON_HEIGHT;
			TextRenderer.drawRangeText(range, TextFormat.LEFT, skillArray[i].getName(), -1, color, font);
			
			GraphicsRenderer.drawImage(x, y, skillArray[i].getIconResourceHandle(), GraphicsType.ICON);
			
			y += GraphicsFormat.ICON_HEIGHT + 2;
		}
	},
	
	_getTitlePartsCount: function(skill, font) {
		var textWidth = TextRenderer.getTextWidth(skill.getName(), font) + (TitleRenderer.getTitlePartsWidth() * 2);
		var count = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
		
		return count > 4 ? count : 4;
	},
	
	_getHeight: function(skillArray) {
		var count = skillArray.length;
		
		return ((count + 1) * GraphicsFormat.ICON_HEIGHT) + 10;
	},
	
	_getWidth: function() {
		return 190;
	},
	
	_getWindowTextUI: function(unit) {
		return Miscellaneous.getColorWindowTextUI(unit);
	}
}
);
