import { createPosition, Position } from "./types/global";




export const PLACEMENT_TYPE_HERO = "HERO";
export const PLACEMENT_TYPE_HERO_SPAWN = "HERO_SPAWN";
export const PLACEMENT_TYPE_HERO_EDITING = "HERO_EDITING";
export const PLACEMENT_TYPE_GOAL = "GOAL";
export const PLACEMENT_TYPE_GOAL_ENABLED = "GOAL_ENABLED";
export const PLACEMENT_TYPE_WALL = "WALL";
export const PLACEMENT_TYPE_FLOUR = "FLOUR";
export const PLACEMENT_TYPE_CELEBRATION = "CELEBRATION";

export const PLACEMENT_TYPE_LOCK = "LOCK";
export const PLACEMENT_TYPE_KEY = "KEY";

export const PLACEMENT_TYPE_WATER = "WATER";
export const PLACEMENT_TYPE_FIRE = "FIRE";
export const PLACEMENT_TYPE_ICE = "ICE";
export const PLACEMENT_TYPE_CONVEYOR = "CONVEYOR";
export const PLACEMENT_TYPE_TELEPORT = "TELEPORT";
export const PLACEMENT_TYPE_THIEF = "THIEF";

export const PLACEMENT_TYPE_WATER_PICKUP = "WATER_PICKUP";
export const PLACEMENT_TYPE_FIRE_PICKUP = "FIRE_PICKUP";
export const PLACEMENT_TYPE_ICE_PICKUP = "ICE_PICKUP";

export const PLACEMENT_TYPE_GROUND_ENEMY = "GROUND_ENEMY";
export const PLACEMENT_TYPE_ENEMY_LEFT_SPAWN = "ENEMY_LEFT_SPAWN";
export const PLACEMENT_TYPE_ENEMY_RIGHT_SPAWN = "ENEMY_RIGHT_SPAWN";
export const PLACEMENT_TYPE_ENEMY_DOWN_SPAWN = "ENEMY_DOWN_SPAWN";
export const PLACEMENT_TYPE_ENEMY_UP_SPAWN = "ENEMY_UP_SPAWN";

export const PLACEMENT_TYPE_FLYING_ENEMY = "FLYING_ENEMY";
export const PLACEMENT_TYPE_ENEMY_FLYING_LEFT_SPAWN = "ENEMY_FLYING_LEFT_SPAWN";
export const PLACEMENT_TYPE_ENEMY_FLYING_RIGHT_SPAWN =
  "ENEMY_FLYING_RIGHT_SPAWN";
export const PLACEMENT_TYPE_ENEMY_FLYING_DOWN_SPAWN = "ENEMY_FLYING_DOWN_SPAWN";
export const PLACEMENT_TYPE_ENEMY_FLYING_UP_SPAWN = "ENEMY_FLYING_UP_SPAWN";

export const PLACEMENT_TYPE_ROAMING_ENEMY = "ROAMING_ENEMY";
export const PLACEMENT_TYPE_ENEMY_ROAMING_SPAWN = "ENEMY_ROAMING_SPAWN";
export const PLACEMENT_TYPE_CIABATTA = "CIABATTA";
export const PLACEMENT_TYPE_CIABATTA_SPAWN = "CIABATTA_SPAWN";

export const PLACEMENT_TYPE_SWITCH_DOOR = "SWITCH_DOOR";
export const PLACEMENT_TYPE_SWITCH = "SWITCH";

export const PLACEMENT_TYPES = [PLACEMENT_TYPE_HERO,PLACEMENT_TYPE_GOAL,PLACEMENT_TYPE_WALL,PLACEMENT_TYPE_FLOUR,PLACEMENT_TYPE_LOCK,
    PLACEMENT_TYPE_KEY, PLACEMENT_TYPE_WATER,PLACEMENT_TYPE_FIRE,PLACEMENT_TYPE_ICE,PLACEMENT_TYPE_CONVEYOR,PLACEMENT_TYPE_TELEPORT ,
    PLACEMENT_TYPE_THIEF,PLACEMENT_TYPE_WATER_PICKUP,PLACEMENT_TYPE_FIRE_PICKUP,PLACEMENT_TYPE_ICE_PICKUP,PLACEMENT_TYPE_SWITCH_DOOR,PLACEMENT_TYPE_SWITCH]


export const DIRECTION_LEFT:string = "LEFT";
export const DIRECTION_RIGHT:string = "RIGHT";
export const DIRECTION_UP:string = "UP";
export const DIRECTION_DOWN:string = "DOWN";

export const directionUpdateMap = new Map<string, Position>();

// 添加方向的更新
directionUpdateMap.set("LEFT", createPosition(0,1));
directionUpdateMap.set("RIGHT",createPosition(1,0));
directionUpdateMap.set("UP",createPosition(0,-1));
directionUpdateMap.set("DOWN", createPosition(0,1));

// 處理冰角轉向邏輯
export const iceTileCornerRedirection = new Map<string, Map<string, string>>();

// 添加鍵值對
let topLeft = new Map<string, string>();
topLeft.set("UP", "RIGHT");
topLeft.set("LEFT", "DOWN");
iceTileCornerRedirection.set("TOP_LEFT", topLeft);

let topRight = new Map<string, string>();
topRight.set("UP", "LEFT");
topRight.set("RIGHT", "DOWN");
iceTileCornerRedirection.set("TOP_RIGHT", topRight);

let bottomLeft = new Map<string, string>();
bottomLeft.set("LEFT", "UP");
bottomLeft.set("DOWN", "RIGHT");
iceTileCornerRedirection.set("BOTTOM_LEFT", bottomLeft);

let bottomRight = new Map<string, string>();
bottomRight.set("RIGHT", "UP");
bottomRight.set("DOWN", "LEFT");
iceTileCornerRedirection.set("BOTTOM_RIGHT", bottomRight);

// 處理冰角阻擋邏輯
export const iceTileCornerBlockedMoves = new Map<string, Map<string, boolean>>();

// 添加鍵值對
let topLeftBlocked = new Map<string, boolean>();
topLeftBlocked.set("UP", true);
topLeftBlocked.set("LEFT", true);
iceTileCornerBlockedMoves.set("TOP_LEFT", topLeftBlocked);

let topRightBlocked = new Map<string, boolean>();
topRightBlocked.set("UP", true);
topRightBlocked.set("RIGHT", true);
iceTileCornerBlockedMoves.set("TOP_RIGHT", topRightBlocked);

let bottomLeftBlocked = new Map<string, boolean>();
bottomLeftBlocked.set("DOWN", true);
bottomLeftBlocked.set("LEFT", true);
iceTileCornerBlockedMoves.set("BOTTOM_LEFT", bottomLeftBlocked);

let bottomRightBlocked = new Map<string, boolean>();
bottomRightBlocked.set("DOWN", true);
bottomRightBlocked.set("RIGHT", true);
iceTileCornerBlockedMoves.set("BOTTOM_RIGHT", bottomRightBlocked);




export const directions = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
