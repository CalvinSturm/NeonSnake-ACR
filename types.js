export var GameStatus;
(function (GameStatus) {
    GameStatus["IDLE"] = "IDLE";
    GameStatus["PLAYING"] = "PLAYING";
    GameStatus["PAUSED"] = "PAUSED";
    GameStatus["GAME_OVER"] = "GAME_OVER";
    GameStatus["LEVEL_UP"] = "LEVEL_UP";
    GameStatus["STAGE_TRANSITION"] = "STAGE_TRANSITION";
    GameStatus["DIFFICULTY_SELECT"] = "DIFFICULTY_SELECT";
    GameStatus["CHARACTER_SELECT"] = "CHARACTER_SELECT";
    GameStatus["RESUMING"] = "RESUMING";
})(GameStatus || (GameStatus = {}));
export var Difficulty;
(function (Difficulty) {
    Difficulty["EASY"] = "EASY";
    Difficulty["MEDIUM"] = "MEDIUM";
    Difficulty["HARD"] = "HARD";
    Difficulty["INSANE"] = "INSANE";
})(Difficulty || (Difficulty = {}));
export var Direction;
(function (Direction) {
    Direction["UP"] = "UP";
    Direction["DOWN"] = "DOWN";
    Direction["LEFT"] = "LEFT";
    Direction["RIGHT"] = "RIGHT";
})(Direction || (Direction = {}));
export var EnemyType;
(function (EnemyType) {
    EnemyType["HUNTER"] = "HUNTER";
    EnemyType["INTERCEPTOR"] = "INTERCEPTOR";
    EnemyType["SHOOTER"] = "SHOOTER";
    EnemyType["DASHER"] = "DASHER";
    EnemyType["BOSS"] = "BOSS";
})(EnemyType || (EnemyType = {}));
export var FoodType;
(function (FoodType) {
    FoodType["NORMAL"] = "NORMAL";
    FoodType["BONUS"] = "BONUS";
    FoodType["POISON"] = "POISON";
    FoodType["SLOW"] = "SLOW";
    FoodType["MAGNET"] = "MAGNET";
    FoodType["COMPRESSOR"] = "COMPRESSOR";
    FoodType["XP_ORB"] = "XP_ORB";
})(FoodType || (FoodType = {}));
export var MusicSection;
(function (MusicSection) {
    MusicSection["AMBIENT"] = "AMBIENT";
    MusicSection["COMBAT"] = "COMBAT";
    MusicSection["INTENSE"] = "INTENSE";
    MusicSection["HACKING"] = "HACKING";
    MusicSection["BOSS"] = "BOSS";
})(MusicSection || (MusicSection = {}));
