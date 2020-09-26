
var SceneType = {
	// Cannot use battle event command at the following scene.
	TITLE : 0,
	GAMEOVER : 1,
	ENDING : 2,

	// Can use battle event command at the following scene.
	BATTLESETUP : 3,
	FREE : 4,
	BATTLERESULT : 5,
	REST : 6,
	
	EVENTTEST : 9,

	// Event command to enable to use depends on the caller's scene.
	EVENT : 10	
};

//-----------------------------

var ObjectType = {
	UNIT: 0,
	CLASS: 1,
	WEAPON: 2,
	ITEM: 3,
	SKILL: 4,
	STATE: 5,
	
	TERRAIN: 101,
	FUSION: 218,
	
	NULL: -1
};

var UnitType = {
	PLAYER: 0,
	ENEMY: 1,
	ALLY: 2
};

var UnitGroup = {
	PLAYER: 0,
	ENEMY: 1,
	ENEMYEVENT: 2,
	ALLY: 3,
	ALLYEVENT: 4,
	REINFORCE: 5,
	GUEST: 6,
	GUESTEVENT: 7,
	BOOKMARK: 8
};

var AttackTemplateType = {
	FIGHTER: 0,
	ARCHER: 1,
	MAGE: 2,
	FREE: -1
};

var WeaponCategoryType = {
	PHYSICS: 0,
	SHOOT: 1,
	MAGIC: 2
};

var WeaponOption = {
	NONE: 0,
	HPABSORB: 1,
	NOGUARD: 2,
	HPMINIMUM: 3,
	HALVEATTACK: 4,
	HALVEATTACKBREAK: 5,
	SEALATTACK: 6,
	SEALATTACKBREAK: 7
};

var ImportanceType = {
	LEADER: 0,
	SUBLEADER: 1,
	MOB: 2
};

var NewSkillType = {
	NEW: 0,
	POWERUP: 1
};

var PatternType = {
	APPROACH: 0,
	WAIT: 1,
	MOVE: 2,
	CUSTOM: 100,
	ESTIMATE:200
};

var SkillType = {
	// Battle Attack Type
	FASTATTACK: 0,
	CONTINUOUSATTACK: 1,
	COUNTERATTACKCRITICAL: 2,
	DAMAGEABSORPTION: 3,
	TRUEHIT: 4,
	STATEATTACK: 5,
	// Battle Defence Type
	DAMAGEGUARD: 10,
	SURVIVAL: 11,
	// Battle Natural Type
	ROUNDATTACK: 20,
	CRITICAL: 21,
	INVALID: 22,
	NOWEAPONDECREMENT: 23,
	BATTLERESTRICTION: 24,
	COUNTERATTACK: 25,
	
	// Natural Type
	AUTORECOVERY: 30,
	GROWTH: 31,
	DISCOUNT: 32,
	SUPPORT: 33,
	PARAMBONUS: 34,
	// Command Type
	STEAL: 40,
	QUICK: 41,
	PICKING: 42,
	FUSION: 43,
	METAMORPHOZE: 44,
	// Action Type
	REPEATMOVE: 50,
	REACTION: 51,
	// Custom
	CUSTOM: 100
};

var MatchType = {
	MATCH: 0,
	MISMATCH: 1,
	MATCHALL: 2,
	MISMATCHALL: 3
};

var MoveAIType = {
	MOVEONLY: 0,
	BLOCK: 1,
	APPROACH: 2
};

var MoveGoalType = {
	POS: 0,
	UNIT: 1
};

var LockonType = {
	INCLUDE: 0,
	PRIORITY: 1,
	EXCLUDE: 2,
	NONE: -1
};

var AIDisableFlag = {
	WEAPON: 0x01,
	ITEM: 0x02,
	SKILL: 0x04
};

var DirectionType = {
	LEFT: 0,
	TOP: 1,
	RIGHT: 2,
	BOTTOM: 3,
	NULL: 4,
	COUNT: 4
};

var SpeedType = {
	DIRECT: 0,
	SUPERHIGH: 1,
	HIGH: 2,
	NORMAL: 3,
	LOW: 4,
	SUPERLOW: 5
};

var ParamType = {
	MHP: 0,
	POW: 1,
	MAG: 2,
	SKI: 3,
	SPD: 4,
	LUK: 5,
	DEF: 6,
	MDF: 7,
	MOV: 8,
	WLV: 9,
	BLD: 10,
	COUNT: 11
};

var InvocationType = {
	HP: 0,
	POW: 1,
	MAG: 2,
	SKI: 3,
	SPD: 4,
	LUK: 5,
	DEF: 6,
	MDF: 7,
	MOV: 8,
	WLV: 9,
	BLD: 10,
	LV: 11,
	ABSOLUTE: 12,
	HPDOWN: 13
};

var ItemType = {
	UNUSABLE: 0,
	RECOVERY: 1,
	ENTIRERECOVERY: 2,
	DAMAGE: 3,
	DOPING: 4,
	CLASSCHANGE: 5,
	SKILLGET: 6,
	KEY: 7,
	QUICK: 8,
	TELEPORTATION: 9,
	RESCUE: 10,
	RESURRECTION: 11,
	DURABILITY: 12,
	STEAL: 13,
	STATE: 14,
	STATERECOVERY: 15,
	SWITCH: 16,
	FUSION: 17,
	METAMORPHOZE: 18,
	CUSTOM: 100
};

var RecoveryType = {
	SPECIFY: 0,
	MAX: 1
};

var DamageType = {
	FIXED: 0,
	PHYSICS: 1,
	MAGIC: 2
};

var ResurrectionType = {
	MIN: 0,
	HALF: 1,
	MAX: 2
};

var SelectionRangeType = {
	SELFONLY: 0,
	MULTI: 1,
	ALL: 2
};

var EventType = {
	PLACE: 0,
	AUTO: 1,
	TALK: 2,
	UNIT: 3,
	OPENING: 4,
	ENDING: 5,
	COMMUNICATION: 6,
	RECOLLECTION: 7,
	DYNAMIC: 8,
	MAPCOMMON: 9
};

var PlaceEventType = {
	VILLAGE: 0,
	TREASURE: 1,
	OCCUPATION: 2,
	SHOP: 3,
	GATE: 4,
	WAIT: 5,
	INFORMATION: 6,
	CUSTOM: 100
};

var UnitEventType = {
	DEAD: 0,
	INJURY: 1,
	ACTIVETURN: 2,
	BATTLE: 3,
	COMMAND: 4
};

var CommunicationEventType = {
	INFORMATION: 0,
	TALK: 1,
	TROPHY: 2,
	UNIT: 3,
	PRIVATE: 4
};

var PlaceCustomType = {
	COMMAND: 0,
	KEYWORD: 1
};

var MessagePos = {
	TOP: 0,
	CENTER: 1,
	BOTTOM: 2,
	NONE: -1
};

var BackgroundChangeType = {
	CHANGE: 0,
	NONE: 1,
	END: 2
};

var BackgroundTransitionType = {
	BLACK: 0,
	WHITE: 1,
	NONE: 2
};

var MapType = {
	NORMAL: 0,
	EXTRA: 1,
	QUEST: 2
};

var StartEndType = {
	MAP_START: 0,
	PLAYER_START: 1,
	PLAYER_END: 2,
	ENEMY_START: 3,
	ENEMY_END: 4,
	ALLY_START: 5,
	ALLY_END: 6,
	NONE: 7
};

var TurnType = {
	PLAYER: 0,
	ENEMY: 1,
	ALLY: 2
};

var SortieType = {
	SORTIE: 0,
	UNSORTIE: 1
};

var AliveType = {
	ALIVE: 0,
	ERASE: 1,
	DEATH: 2,
	INJURY: 3
};

var RemoveOption = {
	ERASE: 0,
	DEATH: 1,
	INJURY: 2
};

var PosChooseType = {
	ALL: 0,
	UNIT: 1,
	TERRAIN: 2
};

var MapPosOperationType = {
	ANIME: 0,
	MAPCHIP: 1
};

var BattleType = {
	REAL: 0,
	EASY: 1,
	// Even if the following value, it's treated as REAL or EASY in the end.
	DEFAULT: 2,
	FORCEREAL: 3,
	FORCEEASY: 4
};

var AnimePlayType = {
	SYNC: 0,
	ASYNC: 1,
	LOOP: 2
};

var BadStateFlag = {
	PHYSICS: 0x1,
	MAGIC: 0x02,
	ITEM: 0x04,
	WAND: 0x08
};

var BadStateOption = {
	NONE: 0,
	NOACTION: 1,
	BERSERK: 2,
	AUTO: 3
};

var StateAutoRemovalType = {
	NONE: 0,
	BATTLEEND: 1,
	ACTIVEDAMAGE: 2,
	PASSIVEDAMAGE: 3
};

// If the battle mode is EASY, EASYATTACK is always displayed.
// If the battle mode is EASY, EASYDAMAGE is displayed when the attack hits.
var WeaponEffectAnime = {
	REALDAMAGE: 0,
	EASYDAMAGE: 1,
	REALCRITICAL: 2,
	EASYCRITICAL: 3,
	MAGICINVOCATION: 4,
	MAGICWEAPON: 5,
	FIRSTATTACK: 6,
	EASYATTACK: 7
};

var WeaponEffectSound = {
	DAMAGE: 0,
	DAMAGEFINISH: 1,
	CRITICAL: 2,
	CRITICALFINISH: 3,
	WEAPONWAVE: 4,
	WEAPONTHROW: 5,
	SHOOTARROW: 6
};

var FusionType = {
	NORMAL: 0,
	ATTACK: 1
};

var FusionActionType = {
	CATCH: 0,
	RELEASE: 1,
	TRADE: 2
};

var FusionReleaseType = {
	NONE: 0,
	WAIT: 1,
	ERASE: 2
};

var SlideType = {
	START: 0,
	END: 1,
	UPDATEEND: 2
};

var MetamorphozeActionType = {
	CHANGE: 0,
	CANCEL: 1
};

var MetamorphozeCancelFlag = {
	AUTO: 0x01,
	MANUAL: 0x02
};

var ClassRank = {
	LOW: 0,
	HIGH: 1
};

//-----------------------------

var TrueHitValue = {
	NONE: 0,
	NOGUARD: 1,
	EFFECTIVE: 2,
	HPMINIMUM: 3,
	FINISH: 4
};

var SurvivalValue = {
	SURVIVAL: 0,
	AVOID: 1
};

var InvalidFlag = {
	CRITICAL: 0x01,
	EFFECTIVE: 0x02,
	SKILL: 0x04,
	BADSTATE: 0x08,
	HALVEATTACKBREAK: 0x10,
	SEALATTACKBREAK: 0x20
};

var BattleRestrictionValue = {
	HALVEATTACK: 0,
	SEALATTACK: 1
};

// Strong effect can make the number higher.
var StealFlag = {
	SPEED: 0x01,
	WEIGHT: 0x02,
	WEAPON: 0x04,
	MULTI: 0x08
};

//-----------------------------

var AnimeType = {
	MOTION: 0,
	EFFECT: 1
};

var MotionCategoryType = {
	NORMAL: 0,
	APPROACH: 1,
	ATTACK: 2,
	THROW: 3,
	AVOID: 4,
	SHOOT: 5,
	MAGIC: 6,
	DAMAGE: 7,
	MAGICATTACK: 8
};

var WeaponSilhouetteType = {
	SWORD: 0,
	SPEAR: 1,
	AXE: 2
};

var LoopValue = {
	START: 0,
	END: 1,
	NONE: 2,
	MAGICSTART: 3,
	MAGICEND: 4
};

var SpriteType = {
	KEY: 0,
	WEAPON: 1,
	ARROW: 2,
	OPTION: 3
};

var VersusType = {
	NONE: 0,
	SS: 1,
	SM: 2,
	SL: 3,
	MM: 4,
	ML: 5,
	LL: 6
};

var MotionFighter = {
	WAIT: 0,
	MOVE: 1,
	CRITICALMOVE: 2,
	CRITICALFINISHMOVE: 3,
	MOVEATTACK: 4,
	CRITICALMOVEATTACK: 5,
	CRITICALFINISHMOVEATTACK: 6,
	ATTACK1: 7,
	ATTACK2: 8,
	CRITICALATTACK1: 9,
	CRITICALATTACK2: 10,
	CRITICALFINISHATTACK: 11,
	INDIRECTATTACK: 12,
	CRITICALINDIRECTATTACK: 13,
	AVOID1: 14,
	AVOID2: 15,
	DAMAGE: 16,
	FINISHDAMAGE: 17,
	MAGICATTACK: 18,
	CRITICALMAGICATTACK: 19
};

var MotionArcher = {
	WAIT: 0,
	BOW: 1,
	CRITICALBOW: 2,
	AVOID1: 3,
	AVOID2: 4,
	DAMAGE: 5,
	FINISHDAMAGE: 6,
	CRITICALFINISH: 7
};

var MotionMage = {
	WAIT: 0,
	MAGIC: 1,
	CRITICALMAGIC: 2,
	AVOID1: 3,
	AVOID2: 4,
	DAMAGE: 5,
	FINISHDAMAGE: 6,
	CRITICALFINISH: 7
};

var InterpolationMode = {
	NEARESTNEIGHBOR: 0,
	BILINEAR: 1
};

var OperatorSymbol = {
	NONE: 0,
	ADD: 1,
	SUBTRACT: 2,
	MULTIPLY: 3,
	DIVIDE: 4,
	MOD: 5,
	ASSIGNMENT: 6
};

//-----------------------------

var IncreaseType = {
	INCREASE: 0,
	DECREASE: 1,
	ALLRELEASE: 2,
	// not 3
	ASSIGNMENT: 2
};

var OverUnderType = {
	EQUAL: 0,
	OVER: 1,
	UNDER: 2,
	NONE: 3
};

var EffectRangeType = {
	MAP: 0,
	MAPANDCHAR: 1,
	ALL: 2,
	NONE: 4
};

var EventExecutedType = {
	FREE: 0,
	EXECUTED: 1,
	UNKNOWN: 2
};

var SpeakerType = {
	UNIT: 0,
	NPC: 1
};

var TrophyTargetType = {
	POOL: 0,
	DROP: 1
};

var SceneChangeType = {
	TITLE: 0,
	GAMEOVER: 1,
	ENDING: 2
};

var MapStateType = {
	DRAWMAP: 0,
	DRAWUNIT: 1,
	ANIMEMAP: 2,
	ANIMEUNIT: 3,
	REINFORCE: 4,
	STOCKSHOW: 5,
	PLAYERFREEACTION: 6,
	PLAYERZEROGAMEOVER: 7,
	GETEXPERIENCE: 8
};

var MusicPlayType = {
	PLAYSAVE: 0,
	PLAY: 1
};

var MusicStopType = {
	BACK: 0,
	STOP: 1,
	PAUSE: 2
};

var ForceEntryType = {
	HIT: 0,
	CRITICAL: 1,
	MISS: 2,
	NONE: -1
};

var CharChipLoopType = {
	NORMAL: 0,
	DOUBLE: 1,
	SINGLE: 2
};

var InfoWindowType = {
	NONE: 0,
	INFORMATION: 1,
	WARNING: 2
};

var ResourceHandleType = {
	ORIGINAL: 0,
	RUNTIME: 1
};

var RepeatMoveType = {
	VILLAGE: 0,
	KEY: 1,
	OCCUPATION: 2,
	SHOP: 3,
	INFRORMATION: 4,
	CUSTOM: 5,
	
	ATTACK: 20,
	ITEM: 21,
	TRADE: 22,
	STOCK: 23,
	TALK: 24,
	
	UNITEVENT: 40,
	STEAL: 41,
	QUICK: 42,
	
	FUSION: 50,
	METAMORPHOZE: 51
};

var SaveCallType = {
	CURRENT: 0,
	COMPLETE: 1
};

var SystemSettingsType = {
	SKIP : 0,
	UNITMOVESOUND: 1,
	ANIMESOUND: 2,
	MARKING: 3,
	MAPGRID: 4,
	MAPHP: 5
};

var RestSaveType = {
	NOSAVE: 0,
	SAVEONLY: 1,
	AREA: 2,
	AREANOSAVE: 3
};

var RestAutoType = {
	TOP: 0,
	QUEST: 1,
	TALK: 2
};

var ClearPointType = {
	CARRYOVER: 0,
	ZERO: 1,
	DEFAULT: 2
};

//-----------------------------

var CommandLayoutType = {
	TITLE: 0,
	BATTLESETUP: 1,
	MAPCOMMAND: 2,
	REST: 3,
	UNITMARSHAL: 4
};

var CommandActionType = {
	NEWGAME: 0,
	CONTINUE: 1,
	ENDGAME: 2,
	
	UNITSORTIE: 10,
	UNITMARSHAL: 11,
	COMMUNICATION: 12,
	SHOP: 13,
	BONUS: 14,
	BATTLESTART: 15,
	LOAD: 16,
	SAVE: 17,
	
	CONFIG: 20,
	OBJECTIVE: 21,
	TALKCHECK: 22,
	UNITSUMMARY: 23,
	SKILL: 24,
	SWITCH: 25,
	VARIABLE: 26,
	TURNEND: 27,
	
	EXTRA: 30,
	RECOLLECTION: 31,
	CHARACTER: 32,
	WORD: 33,
	GALLERY: 34,
	SOUNDROOM: 35,
	
	QUEST: 40,
	IMAGETALK: 41,
	NEXT: 42,
	SHOPLIST: 43,
	EXPERIENCEDISTRIBUTION: 44
};

var CommandVisibleType = {
	SHOW: 0,
	SWITCH: 1,
	TESTPLAY: 2,
	HIDE: 3
};

//-----------------------------

var MessageLayout = {
	TOP: 0,
	CENTER: 1,
	BOTTOM: 2,
	TEROP: 3,
	STILL: 4
};

var FaceVisualType = {
	VISIBLE: 0,
	INVISIBLE: 1
};

var CharIllustVisualType = {
	LEFT: 0,
	CENTER: 1,
	RIGHT: 2,
	NONE: 3
};

//-----------------------------

var UnitFilterFlag = {
	PLAYER: 0x01,
	ENEMY: 0x02,
	ALLY: 0x04,
	OPTIONAL: 0x08
};

var ClassOptionFlag = {
	WAND: 0x01,
	KEY: 0x02,
	STOCK: 0x04,
	REPEATMOVE: 0x08,
	STATEICONDISABLED: 0x10,
	HPGUAGEDISABLED: 0x20
};

var KeyFlag = {
	TREASURE: 0x01,
	GATE: 0x02,
	ALL: 0x03
};

var TrophyFlag = {
	ITEM: 0x01,
	GOLD: 0x02,
	BONUS: 0x04
};

var DifficultyFlag = {
	ROUNDATTACK: 0x1,
	CRITICAL: 0x2,
	INJURY: 0x4,
	GROWTH: 0x8,
	COUNTERATTACK: 0x20
};

var ClassMotionFlag = {
	FIGHTER: 0x01,
	ARCHER: 0x02,
	MAGE: 0x04
};

var PlaceEventFilterFlag = {
	VILLAGE: 0x01,
	TREASURE: 0x02,
	OCCUPATION: 0x04,
	SHOP: 0x08,
	GATE: 0x10,
	WAIT: 0x20,
	INFORMATION: 0x40,
	CUSTOM: 0x1000
};

var UnitStateChangeFlag = {
	WAIT: 0x01,
	INVISIBLE: 0x02,
	IMMORTAL: 0x04,
	INJURY: 0x08,
	BADSTATEGUARD: 0x10,
	SORTIE: 0x20,
	DIRECTION: 0x100
};

//----------------------------

var AppScreenMode = {
	WINDOW: 0,
	
	// Return value of root.getAppScreenMode.
	HARDFULLSCREEN: 1,
	SOFTFULLSCREEN: 2,
	
	// Argument of root.setAppScreenMode.
	FULLSCREEN: 3
};

var LanguageCode = {
	JAPANESE: 1,
	ENGLISH: 2,
	SCHINESE: 3,
	SPANISH: 4,
	FRENCH: 5,
	GERMAN: 6,
	
	TCHINESE: 8
};

//----------------------------

var GradientType = {
	RADIAL: 0,
	LINEAR: 1
};

//----------------------------

var GraphicsType = {
	MAPCHIP: 0,
	CHARCHIP: 1,
	FACE: 2,
	ICON: 3,
	MOTION: 4,
	EFFECT: 5,
	WEAPON: 6,
	BOW: 7,
	THUMBNAIL: 8,
	BATTLEBACK: 9,
	EVENTBACK: 10,
	SCREENBACK: 11,
	WORLDMAP: 12,
	EVENTSTILL: 13,
	CHARILLUST: 14,
	PICTURE: 15
};

var UIType = {
	MENUWINDOW: 0,
	TEXTWINDOW: 1,
	TITLE: 2,
	NUMBER: 3,
	BIGNUMBER: 4,
	GAUGE: 5,
	LINE: 6,
	RISECURSOR: 7,
	MAPCURSOR: 8,
	PAGECURSOR: 9,
	SELECTCURSOR: 10,
	SCROLLBAR: 11,
	PANEL: 12,
	FACEFRAME: 13,
	SCREENFRAME: 14
};

var MediaType = {
	MUSIC: 0,
	SE: 1
};

var GraphicsFormat = {
	MAPCHIP_WIDTH: 32,
	MAPCHIP_HEIGHT: 32,
	CHARCHIP_WIDTH: 64,
	CHARCHIP_HEIGHT: 64,
	FACE_WIDTH: 96,
	FACE_HEIGHT: 96,
	ICON_WIDTH: 24,
	ICON_HEIGHT: 24,
	MOTION_WIDTH: 192,
	MOTION_HEIGHT: 192,
	EFFECT_WIDTH: 192,
	EFFECT_HEIGHT: 192,
	WEAPON_WIDTH: 192,
	WEAPON_HEIGHT: 40,
	BOW_WIDTH: 300,
	BOW_HEIGHT: 192,
	THUMBNAIL_WIDTH: 120,
	THUMBNAIL_HEIGHT: 90,
	
	// The following size is the lowest value.
	
	BATTLEBACK_WIDTH: 840,
	BATTLEBACK_HEIGHT: 480,
	EVENTBACK_WIDTH: 640,
	EVENTBACK_HEIGHT: 480,
	SCREENBACK_WIDTH: 640,
	SCREENBACK_HEIGHT: 480,
	WORLDMAP_WIDTH: 640,
	WORLDMAP_HEIGHT: 480,
	EVENTSTILL_WIDTH: 640,
	EVENTSTILL_HEIGHT: 480,
	CHARILLUST_WIDTH: 1,
	CHARILLUST_HEIGHT: 1,
	PICTURE_WIDTH: 1,
	PICTURE_HEIGHT: 1
};

var UIFormat = {
	MENUWINDOW_WIDTH: 128,
	MENUWINDOW_HEIGHT: 64,
	
	// This size is the lowest value.
	TEXTWINDOW_WIDTH: 640,
	TEXTWINDOW_HEIGHT: 110,
	
	TITLE_WIDTH: 90,
	TITLE_HEIGHT: 60,
	NUMBER_WIDTH: 100,
	NUMBER_HEIGHT: 120,
	BIGNUMBER_WIDTH: 160,
	BIGNUMBER_HEIGHT: 120,
	GAUGE_WIDTH: 30,
	GAUGE_HEIGHT: 56,
	LINE_WIDTH: 24,
	LINE_HEIGHT: 32,
	RISECURSOR_WIDTH: 48,
	RISECURSOR_HEIGHT: 48,
	MAPCURSOR_WIDTH: 64,
	MAPCURSOR_HEIGHT: 32,
	PAGECURSOR_WIDTH: 64,
	PAGECURSOR_HEIGHT: 32,
	SELECTCURSOR_WIDTH: 64,
	SELECTCURSOR_HEIGHT: 64,
	SCROLLCURSOR_WIDTH: 128,
	SCROLLCURSOR_HEIGHT: 64,
	PANEL_WIDTH: 64,
	PANEL_HEIGHT: 32,
	FACEFRAME_WIDTH: 256,
	FACEFRAME_HEIGHT: 128,
	
	// This size is the lowest value.
	SCREENFRAME_WIDTH: 640,
	SCREENFRAME_HEIGHT: 100
};

//-----------------------------------

var EventResult = {
	OK: 0,
	CANCEL: 1,
	PENDING: 2
};

var CycleResult = {
	CONTINUE: true,
	END: false
};

var EnterResult = {
	OK: true,
	NOTENTER: false
};

var OrderMarkType = {
	FREE: 0,
	EXECUTED: 1
};

var ActionTargetType = {
	UNIT: 0,
	SINGLE: 1,
	KEY: 2,
	ENTIRERECOVERY: 3,
	RESURRECTION: 4
};

var UnitStatusType = {
	NORMAL: 0,
	UNITMENU: 1
};

var AttackStartType = {
	NORMAL: 0,
	FORCE: 1
};

var MoveResult = {
	SELECT: 0,
	CANCEL: 1,
	CONTINUE: 200,
	END: 800
};

var AIValue = {
	MAX_MOVE: 500,
	MIN_SCORE: -1
};

var MessageEraseFlag = {
	TOP: 0x01,
	CENTER: 0x02,
	BOTTOM: 0x04,
	ALL: 0x7
};

var ItemIdValue = {
	BASE: 100000
};

var MapIdValue = {
	COMPLETE: -1
};

var WeaponLimitValue = {
	BROKEN: -1
};

var MotionIdValue = {
	NONE: -1
};

var XPoint = [-1, 0, 1, 0];

var YPoint = [0, -1, 0, 1];
