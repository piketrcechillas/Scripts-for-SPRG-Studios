//by piketrcechillas
//The script will make the game only highlights attackable target! Just plug it in and use

UnitRangePanel._setLight = function(isWeapon) {
		var enemyIndexArray = [];
		var weaponIndexArray = this._simulator.getSimulationWeaponIndexArray();
		this._mapChipLight.setLightType(MapLightType.MOVE);
		this._mapChipLight.setIndexArray(this._simulator.getSimulationIndexArray());
		var count = weaponIndexArray.length;
		if (isWeapon) {
			this._mapChipLightWeapon.setLightType(MapLightType.RANGE);

			for (i = 0; i < count; i++) {
				index = weaponIndexArray[i];
				x = CurrentMap.getX(index);
				y = CurrentMap.getY(index);
				var targetUnit = PosChecker.getUnitFromPos(x, y);
				if(targetUnit != null && targetUnit.getUnitType() == UnitType.ENEMY) {
					enemyIndexArray.push(index);
				}
			}

			this._mapChipLightWeapon.setIndexArray(enemyIndexArray);
		}
		else{
			this._mapChipLightWeapon.endLight();
		}
	}