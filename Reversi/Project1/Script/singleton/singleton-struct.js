
var ScreenBuilder = {
	buildLoadSave: function() {
		return {
			isLoad: false,
			scene: 0,
			mapId: 0
		};
	},
	
	buildUnitMenu: function() {
		return {
			unit: null,
			enummode: 0
		};
	},
	
	buildShopLayout: function() {
		return {
			unit: null,
			shopLayout: null,
			itemArray: null,
			inventoryArray: null
		};
	},
	
	buildBonusLayout: function() {
		return {
			unit: null,
			shopLayout: null,
			itemArray: null,
			inventoryArray: null,
			bonusArray: null
		};
	},
	
	buildMultiClassChange: function() {
		return {
			unit: null,
			isMapCall: false,
			refList: null
		};
	},
	
	buildResurrection: function() {
		return {
			filter: 0
		};
	},
	
	buildUnitItemTrade: function() {
		return {
			unit: null,
			targetUnit: null
		};
	},
	
	buildUnitItemSteal: function() {
		return {
			unit: null,
			targetUnit: null,
			stealFlag: 0
		};
	},
	
	buildStockItemTrade: function() {
		return {
			unit: null,
			unitList: null
		};
	},
	
	buildUnitSortie: function() {
		return {};
	},
	
	buildMarshal: function() {
		return {
			unit: null
		};
	},
	
	buildItemUse: function() {
		return {
			unit: null
		};
	},
	
	buildObjective: function() {
		return {};
	},
	
	buildConfig: function() {
		return {};
	},
	
	buildTalkCheck: function() {
		return {};
	},
	
	buildUnitSummary: function() {
		return {
			isMapCall: false
		};
	},
	
	buildSwitch: function() {
		return {};
	},
	
	buildVariable: function() {
		return {};
	},
	
	buildCommunication: function() {
		return {};
	},
	
	buildQuest: function() {
		return {};
	},
	
	buildImageTalk: function() {
		return {};
	},
	
	buildExtra: function() {
		return {};
	},
	
	buildScreen: function() {
		return {};
	}
};

var StructureBuilder = {
	buildCostData: function() {
		return {
			posIndex: 0,
			movePoint: 0
		};
	},
	
	buildCombination: function() {
		return {
			item: null,
			skill: null,
			targetUnit: null,
			targetPos: null,
			rangeMetrics: null,
			costArray: [],
			cource: [],
			plusScore: 0,
			isPriority: false,
			posIndex: 0,
			movePoint: 0
		};
	},
	
	buildRangeMetrics: function() {
		return {
			startRange: 1,
			endRange: 1,
			rangeType: SelectionRangeType.MULTI
		};
	},
	
	buildAttackInfo: function() {
		return {
			unitSrc: null,
			unitDest: null,
			terrain: null,
			terrainLayer: null,
			battleType: BattleType.REAL,
			attackStartType: AttackStartType.NORMAL,
			isExperienceEnabled: false,
			isDirectAttack: false,
			isMagicWeaponAttackSrc: false,
			isMagicWeaponAttackDest: false,
			isCounterattack: false,
			isPosBaseAttack: false,
			picBackground: null
		};
	},
	
	buildVirtualAttackUnit: function() {
		return {
			unitSelf: null,
			hp: null,
			weapon: null,
			damageTotal: 0,
			weaponUseCount: 0,
			isWeaponLimitless: false,
			isSrc: false,
			isCounterattack: false,
			isInitiative: false,
			attackNumber: 0,
			attackCount: 0,
			roundCount: 0,
			skillFastAttack: null,
			skillContinuousAttack: null,
			motionAttackCount: 0,
			motiondDmageCount: 0,
			motionAvoidCount: 0,
			stateArray: null,
			totalStatus: null,
			isApproach: false
		};
	},
	
	buildAttackEntry: function() {
		return {
			isSrc: false,
			isHit: false,
			isCritical: false,
			isFinish: false,
			isItemDecrement: false,
			damageActive: 0,
			damagePassive: 0,
			motionIdActive: 0,
			motionIdPassive: 0,
			motionActionTypeActive: 0,
			motionActionTypePassive: 0,
			moveIdActive: -1, // This property is referenced at getRealInitialPos even in battles where nothing happens (seal attacks).
			moveActionTypeActive: 0,
			skillArrayActive: null,
			skillArrayPassive: null,
			stateArrayActive: null,
			stateArrayPassive: null
		};
	},
	
	buildAttackExperience: function() {
		return {
			active: null,
			activeHp: 0,
			activeDamageTotal: 0,
			passive: null,
			passiveHp: 0,
			passiveDamageTotal: 0
		};
	},
	
	buildItemTargetInfo: function() {
		return {
			unit: null,
			item: null,
			targetUnit: null,
			targetPos: null,
			targetClass: null,
			targetItem: null,
			targetMetamorphoze: null,
			isPlayerSideCall: false
		};
	},
	
	buildDictionaryScrollbarParam: function() {
		return {
			isRecollectionMode: false,
			funcCondition: null
		};
	},
	
	buildSortiePos: function() {
		return {
			x: null,
			y: null,
			unit: null
		};
	},
	
	buildReinforcementUnit: function() {
		return {
			x: 0,
			y: 0,
			xPixel: 0,
			yPixel: 0,
			direction: 0,
			unit: 0,
			unitCounter: null,
			moveCount: 0,
			isMoveFinal: false
		};
	},
	
	buildMessageAnalyzerParam: function() {
		return {
			color: 0,
			font: null,
			voiceSoundHandle: null,
			pageSoundHandle: null,
			messageSpeedType: null,
			maxTextLength: -1
		};
	},
	
	buildMessagePagerParam: function() {
		return {
			color: 0,
			font : null,
			picUnderLine: null,
			rowCount: 0,
			isScrollLocked: false
		};
	},
	
	buildParserInfo: function() {
		return {
			defaultColor: 0,
			defaultFont: null,
			maxTextLength: 0,
			wait: 0,
			autoWait: 0,
			speed: -1,
			voiceRefId: -1,
			isVoiceIncluded: true
		};
	},
	
	buildLevelupViewParam: function() {
		return {
			targetUnit: null,
			getExp: 0,
			xAnime: 0,
			yAnime: 0,
			anime: 0,
			growthArray: null
		};
	},
	
	buildMessageViewParam: function() {
		return {
			messageLayout: null,
			text: null,
			pos: 0,
			speakerType: 0,
			handle: null,
			unit: null,
			npc: null,
			facialExpressionId: 0,
			isNameDisplayable: true,
			isWindowDisplayable: true
		};
	},
	
	buildAttackParam: function() {
		return {
			unit: null,
			targetUnit: null,
			attackStartType: 0,
			forceBattleObject: null,
			fusionAttackData: null
		};
	},
	
	buildFusionParam: function() {
		return {
			parentUnit: null,
			targetUnit: null,
			fusionData: 0,
			direction: null
		};
	},
	
	buildScrollTextParam: function() {
		return {
			margin: 0,
			x: 0,
			speed: 0,
			text: null
		};
	},
	
	buildMultiClassEntry: function() {
		return {
			name: null,
			isChange: false,
			cls: null
		};
	},
	
	buildListEntry: function() {
		return {
			name: null,
			isAvailable: false,
			data: null
		};
	},
	
	buildMixSkillEntry: function() {
		return {
			objecttype: 0,
			skill: false
		};
	},
	
	buildStatusEntry: function() {
		return {
			type: 0,
			param: 0,
			bonus: 0,
			index: 0,
			isRenderable: false
		};
	},
	
	buildUnitRenderParam: function() {
		return {
			animationIndex: 1,
			direction: DirectionType.NULL,
			colorIndex: -1,
			handle: null,
			alpha: 255,
			degree: 0,
			isReverse: false,
			isScroll: false
		};
	},
	
	buildGraphicsRenderParam: function() {
		return {
			alpha: 255,
			isReverse: false,
			degree: 0
		};
	},
	
	buildMotionParam: function() {
		return {
			animeData: null,
			unit: null,
			x: 0,
			y: 0,
			isRight: false,
			motionColorIndex: 0,
			motionId: -1,
			versusType: VersusType.NONE
		};
	},
	
	buildAnimeRenderParam: function() {
		return {
			alpha: 255,
			isRight: false,
			motionColorIndex: 0,
			parentMotion: null,
			offsetX: 0,
			offsetY: 0
		};
	},
	
	buildAnimeCoordinates: function() {
		return {
			xBase: 0,
			yBase: 0,
			xCenter: 0,
			yCenter: 0,
			keySpriteWidth: 0,
			keySpriteHeight: 0,
			dx: 0,
			dy: 0
		};
	},
	
	buildDataList: function() {
		return {
			_arr: null,
			
			setDataArray: function(arr) {
				this._arr = arr;
			},
			
			getCount: function() {
				return this._arr.length;
			},
			
			getData: function(index) {
				var count = this._arr.length;
				
				if (index < 0 || index > count - 1) {
					return null;
				}
				
				return this._arr[index];
			},
			
			exchangeUnit: function(unitSrc, unitDest) {
				var i;
				var srcIndex = 0;
				var destIndex = 0;
				var count = this._arr.length;
				
				for (i = 0; i < count; i++) {
					if (this._arr[i] === unitSrc) {
						srcIndex = i;
					}
					else if (this._arr[i] === unitDest) {
						destIndex = i;
					}
				}
				
				this._arr[srcIndex] = unitDest;
				this._arr[destIndex] = unitSrc;
			}
		};
	}
};
