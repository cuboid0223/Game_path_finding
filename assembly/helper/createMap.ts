import {
  PLACEMENT_TYPE_CIABATTA,
  PLACEMENT_TYPE_CIABATTA_SPAWN,
  PLACEMENT_TYPE_CONVEYOR,
  PLACEMENT_TYPE_ENEMY_DOWN_SPAWN,
  PLACEMENT_TYPE_ENEMY_FLYING_DOWN_SPAWN,
  PLACEMENT_TYPE_ENEMY_FLYING_LEFT_SPAWN,
  PLACEMENT_TYPE_ENEMY_FLYING_RIGHT_SPAWN,
  PLACEMENT_TYPE_ENEMY_FLYING_UP_SPAWN,
  PLACEMENT_TYPE_ENEMY_LEFT_SPAWN,
  PLACEMENT_TYPE_ENEMY_RIGHT_SPAWN,
  PLACEMENT_TYPE_ENEMY_ROAMING_SPAWN,
  PLACEMENT_TYPE_ENEMY_UP_SPAWN,
  PLACEMENT_TYPE_ICE,
  PLACEMENT_TYPE_KEY,
  PLACEMENT_TYPE_LOCK,
  PLACEMENT_TYPE_ROAMING_ENEMY,
  PLACEMENT_TYPE_SWITCH_DOOR,
} from "../consts";
import {
  createGameMapResult,
  GameMapResult,
  LevelState,
} from "../types/global";

// 簡化地圖為二維矩陣，並記錄所有物件位置
export function createMap(level: LevelState): GameMapResult {
  const width = level.tilesWidth;
  const height = level.tilesHeight;
  const placements = level.placements;
  // const gameMap = Array.from({ length: height }, () => Array(width).fill(""));
  const gameMap = new Array<Array<string>>(height);

  for (let i = 0; i < height; i++) {
    gameMap[i] = new Array<string>(width).fill("");
  }

  for (let i = 0; i < placements.length; i++) {
    const p = placements[i];
    const adjustedX = p.x - 1;
    const adjustedY = p.y - 1;

    if (
      adjustedX >= 0 &&
      adjustedX < width &&
      adjustedY >= 0 &&
      adjustedY < height
    ) {
      const outputType = getOutputType(
        p.type,
        p.corner,
        p.direction,
        p.color,
        p.isRaised
      );

      if (gameMap[adjustedY][adjustedX] !== "") {
        gameMap[adjustedY][adjustedX] += `&${outputType}`;
      } else {
        gameMap[adjustedY][adjustedX] = outputType;
      }
    }
  }

  return createGameMapResult(gameMap, placements);
}

function getOutputType(
  type: string,
  corner: string | null,
  direction: string | null,
  color: string | null,
  isRaised: bool
): string {
  // 將OBJECT轉換成字串
  // eg. {type: 'ICE', x: 15, y: 5, corner:"TOP_LEFT"} -> "ICE:TOP_LEFT"
  if (!corner) corner = "";
  if (!direction) direction = "";
  if (!color) color = "";
  if (type === PLACEMENT_TYPE_ICE) {
    return corner ? `${type}:${corner}` : type;
  } else if (type === PLACEMENT_TYPE_CONVEYOR) {
    return direction ? `${type}:${direction}` : type;
  } else if (type === PLACEMENT_TYPE_KEY) {
    return color ? `${type}:${color}` : `${type}:BLUE`;
  } else if (type === PLACEMENT_TYPE_LOCK) {
    return color ? `${type}:${color}` : `${type}:BLUE`;
  } else if (type === PLACEMENT_TYPE_SWITCH_DOOR) {
    return isRaised ? `${type}_1` : `${type}_0`;
  } else if (type === PLACEMENT_TYPE_ENEMY_LEFT_SPAWN) {
    return "GROUND_ENEMY:LEFT";
  } else if (type === PLACEMENT_TYPE_ENEMY_RIGHT_SPAWN) {
    return "GROUND_ENEMY:RIGHT";
  } else if (type === PLACEMENT_TYPE_ENEMY_UP_SPAWN) {
    return "GROUND_ENEMY:UP";
  } else if (type === PLACEMENT_TYPE_ENEMY_DOWN_SPAWN) {
    return "GROUND_ENEMY:DOWN";
  } else if (type === PLACEMENT_TYPE_ENEMY_FLYING_LEFT_SPAWN) {
    return "FLYING_ENEMY:LEFT";
  } else if (type === PLACEMENT_TYPE_ENEMY_FLYING_RIGHT_SPAWN) {
    return "FLYING_ENEMY:RIGHT";
  } else if (type === PLACEMENT_TYPE_ENEMY_FLYING_UP_SPAWN) {
    return "FLYING_ENEMY:UP";
  } else if (type === PLACEMENT_TYPE_ENEMY_FLYING_DOWN_SPAWN) {
    return "FLYING_ENEMY:DOWN";
  } else if (type === PLACEMENT_TYPE_ENEMY_ROAMING_SPAWN) {
    return PLACEMENT_TYPE_ROAMING_ENEMY;
  } else if (type === PLACEMENT_TYPE_CIABATTA_SPAWN) {
    return PLACEMENT_TYPE_CIABATTA;
  } else {
    return type;
  }
}
