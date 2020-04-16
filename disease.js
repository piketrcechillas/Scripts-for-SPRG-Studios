 //by piketrcechillas
 //Disease state prevents all kind of healings
 //Create a state with {disease: true} parameter

 RecoveryItemUse.enterMainUseCycle = function(itemUseParent) {
        var generator;
        var itemTargetInfo = itemUseParent.getItemTargetInfo();
        var recoveryInfo = itemTargetInfo.item.getRecoveryInfo();
        var type = itemTargetInfo.item.getRangeType();
        var plus = Calculator.calculateRecoveryItemPlus(itemTargetInfo.unit, itemTargetInfo.targetUnit, itemTargetInfo.item);
        
        var disease = false;
        var list = itemTargetInfo.targetUnit.getTurnStateList();
        var count = list.getCount();
        
        for (i = 0; i < count; i++) {
            turnState = list.getData(i);
            if (turnState.getState().custom.disease) {
               disease = true;
            }
        }

        var recoveryValue = recoveryInfo.getRecoveryValue() + plus;


        this._dynamicEvent = createObject(DynamicEvent);
        generator = this._dynamicEvent.acquireEventGenerator();
        
        if (type !== SelectionRangeType.SELFONLY) {
            generator.locationFocus(itemTargetInfo.targetUnit.getMapX(), itemTargetInfo.targetUnit.getMapY(), true);
        }
        
        if(!disease)
            generator.hpRecovery(itemTargetInfo.targetUnit, this._getItemRecoveryAnime(itemTargetInfo),
                recoveryValue, recoveryInfo.getRecoveryType(), itemUseParent.isItemSkipMode());
        
        return this._dynamicEvent.executeDynamicEvent();
    }


EntireRecoveryItemUse._recoveryHp = function(unit) {
        var hp = unit.getHp();
        var maxMhp = ParamBonus.getMhp(unit);
        
        hp += this._getValue(unit);
        
        if (hp > maxMhp) {
            hp = maxMhp;
        }

        var disease = false;
        var list = unit.getTurnStateList();
        var count = list.getCount();
        
        for (i = 0; i < count; i++) {
            turnState = list.getData(i);
            if (turnState.getState().custom.disease) {
               disease = true;
            }
        }

        root.log(disease);

        if(!disease)
            unit.setHp(hp);
    }

RecoveryAllFlowEntry._getRecoveryValue = function(unit) {
        var skill, terrain;
        var recoveryValue = 0;
        
        skill = SkillControl.getBestPossessionSkill(unit, SkillType.AUTORECOVERY);
        if (skill !== null) {
            recoveryValue += skill.getSkillValue();
        }
        
        terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
        if (terrain !== null) {
            recoveryValue += terrain.getAutoRecoveryValue();
        }
        
        recoveryValue += StateControl.getHpValue(unit);

        var disease = false;
        var list = unit.getTurnStateList();
        var count = list.getCount();
        
        for (i = 0; i < count; i++) {
            turnState = list.getData(i);
            if (turnState.getState().custom.disease) {
               disease = true;
            }
        }

        if(disease)
            recoveryValue = 0;

        return recoveryValue;
}