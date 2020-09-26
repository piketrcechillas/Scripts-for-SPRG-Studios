/*--------------------------------------------------------------------------
GBA•—FEí“¬ »ìF‚Ó‚í‚Ó‚í ŽQlFnamaemiteiŽ

»ìŽžSRPG Studioƒo[ƒWƒ‡ƒ“F1.176

™ŠT—v
íŽmŒnƒ‚[ƒVƒ‡ƒ“‚ÌˆÚ“®ƒ‚[ƒVƒ‡ƒ“A‹y‚Ñ‰æ–ÊƒXƒNƒ[ƒ‹‚ð“P”p‚µ‚ÄGBA”Å‚ÌFE‚É‹ß‚¢í“¬‰æ–Ê‚É•ÏX‚µ‚Ü‚·B
2ƒ}ƒXˆÈã—£‚ê‚½UŒ‚‚Å‚ÍƒfƒtƒHƒ‹ƒg’Ê‚è‚É—£‚ê‚½ˆÊ’u‚©‚ç‰æ–ÊƒXƒNƒ[ƒ‹‚ð”º‚Á‚ÄUŒ‚‚ðs‚¢‚Ü‚·B

™’ˆÓ
ƒc[ƒ‹‘¤‚ÌƒAƒjƒ[ƒVƒ‡ƒ“‚ÌƒIƒvƒVƒ‡ƒ“‚Ìuí“¬Žž‚ÉŽ‹“_‚ðŒÅ’è‚·‚évuí“¬Žž‚ÉˆÚ“®ƒ‚[ƒVƒ‡ƒ“‚ðƒXƒLƒbƒv‚·‚év
uƒ‚[ƒVƒ‡ƒ“‚Ì‰ŠúˆÊ’u‚ÍuˆÚ“®‚Ìv‘æˆêƒtƒŒ[ƒ€‚É€‹’v‚Í”½‰f‚³‚ê‚È‚­‚È‚è‚Ü‚·B

—×ÚUŒ‚‚Ìê‡‚Í¶‰E‚Ìƒ†ƒjƒbƒg‚Ì’†S“_‚ª160ƒsƒNƒZƒ‹‚Ù‚Ç—£‚ê‚Ä‚¢‚é‚Ì‚ÅA
“G‚ÉUŒ‚‚ð’¼Ú“–‚Ä‚Ä‚¢‚é‚æ‚¤‚ÉŒ©‚¹‚½‚¢ê‡‚Íƒ‚[ƒVƒ‡ƒ“‘¤‚Ì’¼ÚUŒ‚ƒ‚[ƒVƒ‡ƒ“‚ÌˆÊ’u‚ðC³‚µ‚Ä‘Î‰ž‚µ‚Ä‚­‚¾‚³‚¢B

--------------------------------------------------------------------------*/
(function () { 

//í“¬ƒ†ƒjƒbƒg“¯Žm‚ª—×Ú‚µ‚Ä‚¢‚é‚©‚Ç‚¤‚©‚Ì”»’è‚ÉŽg—p‚·‚é‚Ì‚ÉattackInfo‚ðŽg‚¤‚Ì‚Å
//BattlerPosChecker._getDefaultPos‚ÉattackInfo‚ð“n‚·€”õ‚»‚Ì‚P
	RealBattle._setBattlerData = function(battler, unit, isSrc, isRight, versusType) {
		var motionId, pos;
		var animeData = BattlerChecker.findBattleAnimeFromUnit(unit);
		var motionParam = StructureBuilder.buildMotionParam();
		var order = this.getAttackOrder();
		var attackInfo = this.getAttackInfo();
		
		if (unit === attackInfo.unitSrc) {
			motionId = order.getWaitIdSrc();
		}
		else {
			motionId = order.getWaitIdDest();
		}
		
		motionParam.animeData = animeData;
		motionParam.unit = unit;
		motionParam.isRight = isRight;
		motionParam.motionColorIndex = Miscellaneous.getMotionColorIndex(unit);
		motionParam.motionId = motionId;
		motionParam.versusType = versusType;

		//attackInfo‚ð’Ç‰Á
		pos = BattlerPosChecker.getRealInitialPos(motionParam, isSrc, order, attackInfo);
		motionParam.x = pos.x;
		motionParam.y = pos.y;
		
		battler.setupRealBattler(motionParam, isSrc, this);
	};

	//BattlerPosChecker._getDefaultPos‚ÉattackInfo‚ð“n‚·€”õ‚»‚Ì‚Q
	BattlerPosChecker.getRealInitialPos = function(motionParam, isSrc, order, attackInfo) {
		//ˆÚ“®ƒ‚[ƒVƒ‡ƒ“‚Ì‘æˆêƒtƒŒ[ƒ€‚ðl—¶‚·‚é•K—v‚Í–³‚¢‚Ì‚Å‚»‚Ì‚Ü‚Ü_getDefaultPos‚Å•Ô‚·
		return this._getDefaultPos(motionParam, attackInfo);
	};

	BattlerPosChecker._getDefaultPos = function(motionParam, attackInfo) {
		var isDirectAttack = attackInfo.isDirectAttack;
		var size = Miscellaneous.getFirstKeySpriteSize(motionParam.animeData, motionParam.motionId);
		var boundaryWidth = root.getAnimePreference().getBoundaryWidth();
		var boundaryHeight = root.getAnimePreference().getBoundaryHeight();

		//—×Ú‚µ‚Ä‚¢‚éê‡‚Í‹«ŠEü‚ÌÝ’è‚ð•Ï‚¦‚éiƒnƒCƒhƒ‰ƒSƒ““¯Žm‚ÅŠç‚ªƒMƒŠƒMƒŠ‚­‚Á‚Â‚©‚È‚¢’ö“x‚ÌÝ’èj
		if (isDirectAttack) {
			boundaryWidth = 372;
		}

		var x = GraphicsFormat.BATTLEBACK_WIDTH - boundaryWidth;
		var y = GraphicsFormat.BATTLEBACK_HEIGHT - boundaryHeight - size.height;
		
		if (!motionParam.isRight) {
			x = boundaryWidth - size.width;
		}
		
		return createPos(x, y);
	};

	//RealAutoScroll‚ÅattackInfo‚ðŽg‚¤ˆ×‚Ì€”õinamaemiteiŽŠ´ŽÓj
	//alias‚¾‚ÆƒGƒ‰[‹N‚±‚·‚Ì‚Å‚Ü‚é‚²‚Æ‘‚«Š·‚¦‚é
	RealBattle._prepareBattleMemberData = function(coreAttack) {
		this._parentCoreAttack = coreAttack;
		this._attackFlow = this._parentCoreAttack.getAttackFlow();
		this._order = this._attackFlow.getAttackOrder();
		this._attackInfo = this._attackFlow.getAttackInfo();
		this._battleTable = createObject(RealBattleTable);
		this._isMotionBaseScroll = false;
		this._effectArray = [];
		this._idleCounter = createObject(IdleCounter);
		this._autoScroll = createObject(RealAutoScroll);
		this._battleTransition = createObject(BattleTransition);
		this._uiBattleLayout = createObject(UIBattleLayout);
		
		this._createBattleArea();
		this._autoScroll.setInfo(this._attackInfo);
	};

	RealAutoScroll.setInfo = function(info) {
		this.info = info;
	};

	RealAutoScroll.getScrollX = function() {
		var isDirectAttack = this.info.isDirectAttack;

		//–{—ˆƒc[ƒ‹‘¤‚ÌƒAƒjƒ[ƒVƒ‡ƒ“‚ÌƒIƒvƒVƒ‡ƒ“‚Åu‰æ–Ê‚ðŒÅ’è‚·‚év‚Éƒ`ƒFƒbƒN‚ð“ü‚ê‚Ä‚¢‚é‚©‚Ç‚¤‚©‚Æ‚¢‚¤”»’è‚É‚ ‚½‚é•”•ª‚¾‚ª
		//‰æ–Ê‚ðŒÅ’è‚µ‚È‚¢‚Æ’¼ÚUŒ‚‚ÌÛ‚ÉƒJƒƒ‰ƒ[ƒN‚ª‚»‚ÌŽžUŒ‚‚·‚éƒ†ƒjƒbƒg‚ð’†‰›‚É‘¨‚¦‚æ‚¤‚Æ‚µ‚Ä‰æ–Ê‚ª‚ ‚ç‚Ô‚é‚Ì‚ÆA
		//‹«ŠEü‚ª—£‚ê‚½ó‘Ô‚Å‹|•ºƒ‚[ƒVƒ‡ƒ“‚ªUŒ‚‚·‚é‚Æ‰æ–ÊŠO‚©‚çŒ‚‚¿‡‚¢‚ðŽn‚ß‚Ä•sŠ†D‚É‚È‚é‚Ì‚Å
		//ƒ†ƒjƒbƒg“¯Žm‚ª—×Ú‚µ‚Ä‚¢‚éê‡‚Ì‚Ý‰æ–Ê‚ðŒÅ’è‚·‚é‚æ‚¤‚É•ÏX
		if (isDirectAttack) {
			return Math.floor((GraphicsFormat.BATTLEBACK_WIDTH - RealBattleArea.WIDTH) / 2);
		}
		else if (root.getAnimePreference().isFixedFocus()) {
			return Math.floor((GraphicsFormat.BATTLEBACK_WIDTH - RealBattleArea.WIDTH) / 2);
		}
		else {
			return this._xScroll;
		}
	};
	
	RealAutoScroll.isApproach = function() {
		var isDirectAttack = this.info.isDirectAttack;

		//–{—ˆƒc[ƒ‹‘¤‚ÌƒAƒjƒ[ƒVƒ‡ƒ“‚ÌƒIƒvƒVƒ‡ƒ“‚ÅuˆÚ“®ƒ‚[ƒVƒ‡ƒ“‚ðƒXƒLƒbƒv‚·‚év‚Éƒ`ƒFƒbƒN‚ð“ü‚ê‚Ä‚¢‚é‚©‚Ç‚¤‚©‚Æ‚¢‚¤”»’è‚É‚ ‚½‚é•”•ª‚¾‚ª
		//ˆÚ“®ƒ‚[ƒVƒ‡ƒ“‚ðƒXƒLƒbƒv‚µ‚Ä‚¢‚é‚Æ–‚“¹ŽmŒnƒ‚[ƒVƒ‡ƒ“‚ª‰“‹——£‚©‚çUŒ‚‚µ‚½Û‚É‰æ–Ê‚ªƒXƒNƒ[ƒ‹‚µ‚È‚¢‚Æ‚¢‚¤•Ï‚È‹““®‚ð‹N‚±‚·‚½‚ßA
		//ƒ†ƒjƒbƒg“¯Žm‚ª—×Ú‚µ‚Ä‚¢‚éê‡‚Ì‚ÝˆÚ“®ƒ‚[ƒVƒ‡ƒ“‚ðƒXƒLƒbƒv‚·‚é‚æ‚¤‚É•ÏX
		if (isDirectAttack) {
			return true;
		}
		if (root.getAnimePreference().isMoveMotionDisabled()) {
			// If skip the move motion, it's supposed to approach always.
			return true;
		}
		return this._isApproach;
	};

})();
