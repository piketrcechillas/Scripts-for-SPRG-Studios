
var BonusChangeEventCommand = defineObject(BaseEventCommand,
{
	_bonusChangeView: null,
	
	enterEventCommandCycle: function() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	},
	
	moveEventCommandCycle: function() {
		if (this._bonusChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	drawEventCommandCycle: function() {
		var x = LayoutControl.getCenterX(-1, this._bonusChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._bonusChangeView.getNoticeViewHeight());
		
		this._bonusChangeView.drawNoticeView(x, y);
	},
	
	mainEventCommand: function() {
		var bonus;
		var max = DataConfig.getMaxBonus();
		
		bonus = root.getMetaSession().getBonus();
		bonus += root.getEventCommandObject().getBonus();

		if (bonus < 0) {
			bonus = 0;
		}
		else if (bonus > max) {
			bonus = max;
		}
		
		root.getMetaSession().setBonus(bonus);
	},
	
	_prepareEventCommandMemberData: function() {
		this._bonusChangeView = createWindowObject(BonusChangeNoticeView, this);
	},
	
	_checkEventCommand: function() {
		return this.isEventCommandContinue();
	},
	
	_completeEventCommandMemberData: function() {
		var eventCommandData = root.getEventCommandObject();
		
		this._bonusChangeView.setBonusChangeData(eventCommandData.getBonus());
		
		return EnterResult.OK;
	}
}
);

var BonusNoticeMode = {
	WAIT: 0,
	COUNT: 1,
	INPUT: 2
};

var BonusChangeNoticeView = defineObject(BaseNoticeView,
{
	_bonus: 0,
	_counter: null,
	_balancer: null,
	
	setBonusChangeData: function(n) {
		var speed = 30;
		
		this._bonus = n;
		if (n < 0) {
			n *= -1;
		}
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(4);
		
		this._balancer = createObject(SimpleBalancer);
		this._balancer.setBalancerInfo(0, n);
		this._balancer.setBalancerSpeed(speed);
		this._balancer.startBalancerMove(n);
		
		this.changeCycleMode(BonusNoticeMode.WAIT);
	},
	
	moveNoticeView: function() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === BonusNoticeMode.WAIT) {
			result = this._moveWait();
		}
		else if (mode === BonusNoticeMode.COUNT) {
			result = this._moveCount();
		}
		else if (mode === BonusNoticeMode.INPUT) {
			result = this._moveInput();
		}
		
		return result;
	},
	
	drawNoticeViewContent: function(x, y) {
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = this._bonus > 0 ? StringTable.GetTitle_BonusChange : StringTable.LostTitle_BonusChange;
		var infoColor = this._bonus > 0 ? ColorValue.KEYWORD : ColorValue.INFO;
		var n = this._balancer.getCurrentValue();
		var width = TextRenderer.getTextWidth(text, font) + 5;
		
		TextRenderer.drawKeywordText(x, y, text, -1, infoColor, font);
		TextRenderer.drawKeywordText(x + width, y, this._bonus > 0 ? '+' : '-', -1, color, font);
		NumberRenderer.drawRightNumber(x + width + 10, y, n);
	},
	
	_moveWait: function() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this.changeCycleMode(GoldNoticeMode.COUNT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveCount: function() {
		if (this._balancer.moveBalancer() !== MoveResult.CONTINUE) {
			this._playBonusChangeSound();
			this.changeCycleMode(GoldNoticeMode.INPUT);
		}
		
		return MoveResult.CONTINUE;
	},
	
	_moveInput: function() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	},
	
	_playBonusChangeSound: function() {
		MediaControl.soundDirect('itemsale');
	}
}
);
