ContentRenderer.drawGaugeEx =  function(x, y, curValue, maxValue, colorIndex, totalWidth, pic) {
		var i, n, per, full;
		var width = UIFormat.GAUGE_WIDTH / 3;
		var height = UIFormat.GAUGE_HEIGHT / 4;
		var max = totalWidth / 10;
		
		if (pic === null) {
			return;
		}
		
		per = ((curValue / maxValue) * max);
		
		if (per > 0 && per < 1) {
			per = 0;
		}
		else {
			// per is greater than 1.
			// Subtract 1 so as to be 0 base.
			per -= 1;
		}
		
		for (i = max-1; i >-1 ; i--) {
			if (i === 0) {
				n = 0;
			}
			else if (i === max - 1) {
				n = 2;
			}
			else {
				n = 1;
			}
			
			if (max - per <= i + 1) {
				full = colorIndex;
			}
			else {
				full = 0;
			}
		
			pic.drawParts(x + (i * width), y, n * width, full * height, width, height);
		}
}


GaugeBar.drawGaugeBarEx = function(xBase, yBase, pic) {
		var curValue = this._balancer.getCurrentValue();
		var maxValue = this._balancer.getMaxValue();
		
		ContentRenderer.drawGaugeEx(xBase, yBase, curValue, maxValue, this._colorIndex, this.getGaugeWidth(), pic);
	}

UIBattleLayout._drawHpArea = function(unit, isRight) {
		var x, gauge, hp, xNumber, yNumber;
		var y = 40;
		var dx = 70 + this._getIntervalX();
		var dyNumber = 12;

	
		var pic = root.queryUI('battle_gauge');
		
		if (isRight) {
			x = this._getBattleAreaWidth() - this._gaugeRight.getGaugeWidth() - dx;
			gauge = this._gaugeRight;
			hp = this._gaugeRight.getBalancer().getCurrentValue();
			
			xNumber = 380 + this._getIntervalX();
			yNumber = y - dyNumber;
			
		}
		else {
			x = dx;
			gauge = this._gaugeLeft;
			hp = this._gaugeLeft.getBalancer().getCurrentValue();
			
			xNumber = 260 + this._getIntervalX();
			yNumber = y - dyNumber;
		}
		
		if(isRight)
			gauge.drawGaugeBar(x, y, pic);
		else
			gauge.drawGaugeBarEx(x, y, pic);
		
		NumberRenderer.drawAttackNumberCenter(xNumber, yNumber, hp);
	}