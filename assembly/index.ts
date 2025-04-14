import {
  DIRECTION_DOWN,
  DIRECTION_LEFT,
  DIRECTION_RIGHT,
  DIRECTION_UP,
  directions,
  directionUpdateMap,
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
  PLACEMENT_TYPE_FIRE,
  PLACEMENT_TYPE_FIRE_PICKUP,
  PLACEMENT_TYPE_FLOUR,
  PLACEMENT_TYPE_FLYING_ENEMY,
  PLACEMENT_TYPE_GOAL,
  PLACEMENT_TYPE_GOAL_ENABLED,
  PLACEMENT_TYPE_GROUND_ENEMY,
  PLACEMENT_TYPE_HERO,
  PLACEMENT_TYPE_HERO_SPAWN,
  PLACEMENT_TYPE_ICE,
  PLACEMENT_TYPE_ICE_PICKUP,
  PLACEMENT_TYPE_KEY,
  PLACEMENT_TYPE_LOCK,
  PLACEMENT_TYPE_ROAMING_ENEMY,
  PLACEMENT_TYPE_SWITCH,
  PLACEMENT_TYPE_SWITCH_DOOR,
  PLACEMENT_TYPE_TELEPORT,
  PLACEMENT_TYPE_THIEF,
  PLACEMENT_TYPE_WALL,
  PLACEMENT_TYPE_WATER,
  PLACEMENT_TYPE_WATER_PICKUP,
  PLACEMENT_TYPES,
} from "./consts";
import PriorityQueue from "./helper/PriorityQueue";
import {
  CellState,
  CompositeCellState,
  createCellState,
  createDoorMapResult,
  createFlourMapResult,
  createGameMapResult,
  DoorMapResult,
  ExtendedPlacementConfig,
  FlourMapResult,
  GameMapResult,
  LevelState,
  PlacementConfig,
  Position,
  PositionArray,
  QueueItem,
  SolutionPathType,
} from "./types/global";
import { handleIceSliding } from "./helper/handleIceSliding";
import { findPlacement } from "./helper/findPlacement";
import { findSwitchDoorAt } from "./helper/findSwitchDoorAt";
import { debugMap } from "./helper/debugMap";
import { print2DStringArray } from "./helper/print2DstringArray";
import { printPlacements } from "./helper/printPlacements";

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

// 查找指定物件所有位置
export function findPositions(
  placements: ExtendedPlacementConfig[],
  type: string
): Array<PositionArray> {
  let result: Array<PositionArray> = [];
  for (let i = 0; i < placements.length; i++) {
    if (placements[i].type === type) {
      let pos = new StaticArray<i32>(2);
      pos[0] = placements[i].x;
      pos[1] = placements[i].y;
      result.push(pos);
    }
  }
  return result;
}

export function getPlacementAt(
  placements: Array<ExtendedPlacementConfig>,
  type: string,
  x: i32,
  y: i32
): ExtendedPlacementConfig | null {
  for (let i = 0; i < placements.length; i++) {
    let p = placements[i];
    if (p.x == x && p.y == y && p.type == type) {
      return p;
    }
  }
  return null;
}

export function getHeroDirection(dx: i32, dy: i32): string {
  let entryDirection = "";
  // 根據移動方向確定進入方向
  if (dx > 0) {
    // 向右移動，從左側進入
    entryDirection = DIRECTION_RIGHT;
  } else if (dx < 0) {
    // 向左移動，從右側進入
    entryDirection = DIRECTION_LEFT;
  } else if (dy > 0) {
    // 向下移動，從上方進入
    entryDirection = DIRECTION_DOWN;
  } else if (dy < 0) {
    // 向上移動，從下方進入
    entryDirection = DIRECTION_UP;
  }

  return entryDirection;
}

//––––– 事前準備 –––––//
// 為面粉建立一個 mapping：key = "x,y" ； value = index（從 0 開始）
// 假設 placements 中面粉數量不多
export function buildFlourMapping(
  placements: ExtendedPlacementConfig[]
): FlourMapResult {
  const flourPositions = placements.filter(
    (p) => p.type === PLACEMENT_TYPE_FLOUR
  );
  const flourMap = new Map<string, i32>();
  for (let i = 0; i < flourPositions.length; i++) {
    const p = flourPositions[i];
    flourMap.set(`${p.x},${p.y}`, i);
  }
  return createFlourMapResult(flourMap, flourPositions.length);
}

// 為 switchDoor 建立固定順序的 mapping：key = "x,y" ； value = index
function buildSwitchDoorMapping(
  placements: ExtendedPlacementConfig[]
): DoorMapResult {
  const doorPlacements = placements.filter(
    (p) => p.type === PLACEMENT_TYPE_SWITCH_DOOR
  );
  const doorMap = new Map<string, i32>();
  for (let i = 0; i < doorPlacements.length; i++) {
    const p = doorPlacements[i];
    doorMap.set(`${p.x},${p.y}`, i);
  }

  return createDoorMapResult(doorMap, doorPlacements.length);
}

// 將多個物品（火、水、冰、鑰匙）狀態合併成一個 bit mask
// 預設：bit0 = firePickup, bit1 = waterPickup, bit2 = icePickup, bit3 = blueKey,bit4 = greenKey
function buildItemMask(
  hasFire: boolean,
  hasWater: boolean,
  hasIce: boolean,
  hasBlueKey: boolean,
  hasGreenKey: boolean
): i32 {
  let mask: i32 = 0;
  if (hasFire) mask |= 1;
  if (hasWater) mask |= 2;
  if (hasIce) mask |= 4;
  if (hasBlueKey) mask |= 8;
  if (hasGreenKey) mask |= 16;
  return mask;
}

// 切換所有 switchDoor 狀態：假設每個門用一個 bit 表示，1 表示「關閉」（不可通行），0 表示「開啟」
function toggleSwitchDoorMask(doorMask: i32, totalDoors: i32): i32 {
  // 反轉所有位元，再與 ((1 << totalDoors) - 1) 相與（只保留 totalDoors 個 bit）
  return ~doorMask & ((1 << totalDoors) - 1);
}

export function combineCellState(cell: string): Map<string, CellState> {
  // 同一個位置可能有兩個物件透過 "&" 區隔
  // eg. ICE&FLOUR 或是 ICE:TOP_LEFT&FIRE_PICKUP

  // 拆分 cell 字串，移除空白與空值
  const types = cell.split("&");
  const result: StaticArray<string> = new StaticArray<string>(types.length);
  let index = 0;

  // 去除空白字符並過濾掉空字符串
  for (let i = 0; i < types.length; i++) {
    const trimmed = types[i].trim();
    if (trimmed !== "") {
      result[index] = trimmed;
      index++;
    }
  }

  // 創建新陣列，將結果部分返回
  const filteredTypes = new StaticArray<string>(index);
  for (let i = 0; i < index; i++) {
    filteredTypes[i] = result[i];
  }

  // 創建一個 Map，將每個 placementType 對應的 boolean 和 string 資料合併進去
  let state = new Map<string, CellState>();

  // 將 booleanState 和 stringState 資料合併到 state 中
  state.set(
    PLACEMENT_TYPE_WALL,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_WALL), "")
  );
  state.set(
    PLACEMENT_TYPE_WATER,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_WATER), "")
  );
  state.set(
    PLACEMENT_TYPE_FIRE,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_FIRE), "")
  );
  state.set(
    PLACEMENT_TYPE_ICE,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_ICE), "")
  );
  state.set(
    PLACEMENT_TYPE_CONVEYOR,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_CONVEYOR), "")
  );
  state.set(
    PLACEMENT_TYPE_TELEPORT,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_TELEPORT), "")
  );
  state.set(
    PLACEMENT_TYPE_THIEF,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_THIEF), "")
  );
  state.set(
    PLACEMENT_TYPE_SWITCH,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_SWITCH), "")
  );
  state.set(
    PLACEMENT_TYPE_SWITCH_DOOR,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_SWITCH_DOOR), "")
  );
  state.set(
    PLACEMENT_TYPE_LOCK + ":BLUE",
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_LOCK + ":BLUE"), "")
  );
  state.set(
    PLACEMENT_TYPE_LOCK + ":GREEN",
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_LOCK + ":GREEN"), "")
  );
  state.set(
    PLACEMENT_TYPE_KEY + ":BLUE",
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_KEY + ":BLUE"), "")
  );
  state.set(
    PLACEMENT_TYPE_KEY + ":GREEN",
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_KEY + ":GREEN"), "")
  );
  state.set(
    PLACEMENT_TYPE_WATER_PICKUP,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_WATER_PICKUP), "")
  );
  state.set(
    PLACEMENT_TYPE_FIRE_PICKUP,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_FIRE_PICKUP), "")
  );
  state.set(
    PLACEMENT_TYPE_ICE_PICKUP,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_ICE_PICKUP), "")
  );
  state.set(
    PLACEMENT_TYPE_FLOUR,
    createCellState(filteredTypes.includes(PLACEMENT_TYPE_FLOUR), "")
  );

  // 為 iceCorner 和 conveyorDir 設置默認值
  state.set("iceCorner", createCellState(false, ""));
  state.set("conveyorDir", createCellState(false, ""));
  // 檢查所有拆解出來的 type，若包含 ICE（可能帶有角落資訊）
  for (let i = 0; i < filteredTypes.length; i++) {
    const t: string = filteredTypes[i];
    // 若 t 以 "ICE:" 開頭，則拆分出角落資訊
    if (t.startsWith(PLACEMENT_TYPE_ICE + ":")) {
      state.get(PLACEMENT_TYPE_ICE).booleanValue = true;
      const parts = t.split(":");
      if (parts.length > 1) {
        state.get("iceCorner").booleanValue = true
        state.get("iceCorner").stringValue = parts[1]; // 例如 "TOP_LEFT", "TOP_RIGHT" 等
      }
    } else if (t === PLACEMENT_TYPE_ICE) {
      // 普通冰
      state.get(PLACEMENT_TYPE_ICE).booleanValue = true;
    }
  }

  for (let i = 0; i < filteredTypes.length; i++) {
    const t: string = filteredTypes[i];
    // 若 t 以 "CONVEYOR:" 開頭，則拆分出方向資訊
    if (t.startsWith(PLACEMENT_TYPE_CONVEYOR + ":")) {
      state.get(PLACEMENT_TYPE_CONVEYOR).booleanValue = true;
      const parts: string[] = t.split(":");
      if (parts.length > 1) {
        state.get("conveyorDir").booleanValue = true
        state.get("conveyorDir").stringValue = parts[1]; // 例如 "RIGHT", "DOWN" 等
      }
    } else if (t === PLACEMENT_TYPE_CONVEYOR) {
      // 預設往右
      state.get("conveyorDir").stringValue = "RIGHT";
    }
  }


  return state;
}

//––––– 主函式 –––––//

export default function findSolutionPath(
  gameMap: Array<Array<string>>,
  width: i32,
  height: i32,
  placements: Array<ExtendedPlacementConfig>
): Array<PositionArray> {
  console.log("開始路徑搜尋");
  const startPosition = findPlacement(
    placements,
    (p) =>
      p.type === PLACEMENT_TYPE_HERO || p.type === PLACEMENT_TYPE_HERO_SPAWN
  );
  if (!startPosition) {
    console.error("找不到 HERO 位置");
    return [];
  }
  const goalPosition = findPlacement(
    placements,
    (p) =>
      p.type === PLACEMENT_TYPE_GOAL || p.type === PLACEMENT_TYPE_GOAL_ENABLED
  );

  if (!goalPosition) {
    console.error("找不到 GOAL 位置");
    return [];
  }

  // 事前準備：面粉 mapping 與 switch door mapping
  const flourResult = buildFlourMapping(placements);
  const flourMap = flourResult.flourMap;
  const totalFlours: i32 = flourResult.totalFlours;

  const switchDoorResult = buildSwitchDoorMapping(placements);
  const doorMap = switchDoorResult.doorMap;
  const totalDoors: i32 = switchDoorResult.totalDoors;

  // 初始面粉收集：使用 bit mask 表示（全 0 表示未收集）
  let initFlourMask: i32 = 0;
  // 初始 switchDoor 狀態：用 bit mask 表示，每個門的預設值從 door 物件中取得
  // 若 door 物件有 isRaised 屬性就採用它，否則預設為 0 (開啟)
  let initDoorMask: i32 = 0;
  // Use forEach for Map in AssemblyScript
  for (let i = 0; i < doorMap.size; i++) {
    const key: string = doorMap.keys()[i];
    const index: i32 = doorMap.get(key);
    const door = findSwitchDoorAt(placements, key);
    // 假設 isRaised === true 代表門是「關閉」（即阻擋），我們用 1 表示關閉
    if (door ? door.isRaised : false) {
      initDoorMask |= 1 << index;
    }
  }

  // PriorityQueue 中的 state 結構定義如下：
  // [ f, g, x, y, flourMask, itemMask, doorMask, path ]
  // 其中：
  //   - x,y: 當前位置
  //   - flourMask: 已收集面粉的 bit mask
  //   - itemMask: 物品（火、水、冰、鑰匙）狀態
  //   - doorMask: switch door 狀態 bit mask（1=關閉、0=開啟）
  //   - path: 走過的路徑陣列
  const queue = new PriorityQueue<QueueItem>((a, b) => a.f - b.f);
  const initItemMask = buildItemMask(false, false, false, false, false);
  const initPath: SolutionPathType = [];
  queue.push(
    new QueueItem(
      0, // f
      0, // g
      startPosition.x,
      startPosition.y,
      initFlourMask,
      initItemMask,
      initDoorMask,
      initPath
    )
  );
  const visited = new Set<string>();
  let longestPath: SolutionPathType = [];
  while (!queue.isEmpty()) {
    const current = queue.pop();
    if (!current) return [];
    const f: i32 = current.f;
    const g: i32 = current.g;
    const x: i32 = current.x;
    const y: i32 = current.y;
    const flourMask: i32 = current.flourMask;
    const itemMask: i32 = current.itemMask;
    const doorMask: i32 = current.doorMask;
    const path: SolutionPathType = current.path;
    const newPath: SolutionPathType = new Array<StaticArray<i32>>();
    for (let i = 0; i < path.length; i++) {
      newPath.push(path[i]);
    }

    let pos = new StaticArray<i32>(2);
    pos[0] = x;
    pos[1] = y;
    newPath.push(pos);

    if (longestPath.length < newPath.length) {
      longestPath = newPath;
    }

    // 若所有面粉都已收集：判斷方式是比對 bit mask 是否全 1
    if (
      flourMask === (1 << totalFlours) - 1 &&
      x === goalPosition.x &&
      y === goalPosition.y
    ) {
      // console.log("收集全部面粉並抵達目標，成功！");
      console.log(`${newPath}`);
      return newPath;
    }

    // 探索四個方向
    for (let i = 0; i < directions.length; i++) {
      let dx: i32 = directions[i][0];
      let dy: i32 = directions[i][1];
      let nx: i32 = x + dx;
      let ny: i32 = y + dy;
      // 超出邊界
      if (nx < 1 || nx > width || ny < 1 || ny > height) continue;
      let cell = gameMap[ny - 1][nx - 1];
      let compositeState = combineCellState(cell);
      debugMap(compositeState, PLACEMENT_TYPES);
      // console.log(`${compositeState.toString()}`)
      // console.log(`${compositeState.values().toString()}`)
      // console.log(`${compositeState.keys().toString()}`)
      // 先備份各狀態
      let newFlourMask: i32 = flourMask;
      let newItemMask: i32 = itemMask;
      let newDoorMask: i32 = doorMask;

      if (compositeState.get(PLACEMENT_TYPE_WALL).booleanValue) continue;

      // 處理 Conveyor
      // note1: 需放在處理ICE之前，確保走到conveyor 被移到 ICE 能正常
      if (compositeState.get(PLACEMENT_TYPE_CONVEYOR).booleanValue) {
        const direction = compositeState.get("conveyorDir").stringValue;
        if (direction === "UP") ny -= 1;
        else if (direction === "DOWN") ny += 1;
        else if (direction === "LEFT") nx -= 1;
        else if (direction === "RIGHT") nx += 1;

        if (directionUpdateMap.has(direction)) {
          dx = directionUpdateMap.get(direction).x;
          dy = directionUpdateMap.get(direction).y;
        }
      }

      // 若為冰面
      if (compositeState.get(PLACEMENT_TYPE_ICE).booleanValue) {
        const iceResult = handleIceSliding(
          placements,
          gameMap,
          width,
          height,
          dx,
          dy,
          nx,
          ny,
          newItemMask,
          doorMap,
          doorMask,
          flourMask
          // compositeState.iceCorner
          // compositeState.get(PLACEMENT_TYPE_ICE).stringValue
        );

        if (!iceResult.valid) {
          // 如果冰面路徑無效，跳過這個移動
          continue;
        }
        newItemMask = iceResult.itemMask;
        newFlourMask = iceResult.flourMask;

        // console.log(iceResult.path);
      
        console.log(`[${iceResult.path.length}]`)
        if(!iceResult.path.length) continue
        // 更新位置為最後滑行的位置
        nx = iceResult.path[iceResult.path.length - 1][0];
        ny = iceResult.path[iceResult.path.length - 1][1];
        console.log(`[${nx}, ${ny}]`)
        console.log(gameMap[ny - 1][nx - 1])

        compositeState = combineCellState(gameMap[ny - 1][nx - 1]);
      }

      // 若為 switchDoor，則檢查 doorMask 中對應的位元是否為 1（阻擋）
      if (compositeState.get(PLACEMENT_TYPE_SWITCH_DOOR).booleanValue) {
        const doorKey = `${nx},${ny}`;
        if (doorMap.has(doorKey)) {
          const doorIndex = doorMap.get(doorKey);
          if (doorMask & (1 << doorIndex)) continue;
        }
      }

      // 若為鎖，且 itemMask 中沒取得鑰匙 (bit3)
      if (compositeState.get(PLACEMENT_TYPE_LOCK + ":BLUE").booleanValue) {
        const hasBlueKey = newItemMask & 8;
        // console.log(`遇到藍鎖([${nx}${ny}])，有鑰匙 ${hasBlueKey}`);
        if (!(newItemMask & 8)) continue;
      }
      if (compositeState.get(PLACEMENT_TYPE_LOCK + ":GREEN").booleanValue) {
        const hasGreenKey = newItemMask & 16;
        // console.log(`遇到綠鎖([${nx}${ny}])，有鑰匙 ${hasGreenKey}`);
        if (!(newItemMask & 16)) continue;
      }

      // 如火、水，僅當有相應道具時才能通過
      if (
        compositeState.get(PLACEMENT_TYPE_FIRE).booleanValue &&
        !(newItemMask & 1)
      )
        continue;

      if (
        compositeState.get(PLACEMENT_TYPE_WATER).booleanValue &&
        !(newItemMask & 2)
      )
        continue;

      // 處理 switch：踩到 switch 時，全部 switchDoor 狀態取反
      if (compositeState.get(PLACEMENT_TYPE_SWITCH).booleanValue) {
        newDoorMask = <i32>toggleSwitchDoorMask(newDoorMask, totalDoors);
      }

      // 收集面粉：如果該位置在 flourMap 中，則將對應位元設為 1
      if (compositeState.get(PLACEMENT_TYPE_FLOUR).booleanValue) {
        const flourKey = `${nx},${ny}`;
        if (flourMap.has(flourKey)) {
          const index = flourMap.get(flourKey);
          newFlourMask |= 1 << (<i32>index);
        }
      }
      // 處理拾取道具：火焰、流水、冰、鑰匙等
      // 假設各拾取物件出現在某一位置時，就把對應的 bit 打開
      if (compositeState.get(PLACEMENT_TYPE_FIRE_PICKUP).booleanValue)
        newItemMask |= 1;

      if (compositeState.get(PLACEMENT_TYPE_WATER_PICKUP).booleanValue)
        newItemMask |= 2;

      if (compositeState.get(PLACEMENT_TYPE_ICE_PICKUP).booleanValue)
        newItemMask |= 4;

      if (compositeState.get(PLACEMENT_TYPE_KEY + ":BLUE").booleanValue)
        newItemMask |= 8;

      if (compositeState.get(PLACEMENT_TYPE_KEY + ":GREEN").booleanValue)
        newItemMask |= 16;

      // 處理 Teleport
      if (compositeState.get(PLACEMENT_TYPE_TELEPORT).booleanValue) {
        const teleportTargets = placements.filter(
          (p) => p.type === PLACEMENT_TYPE_TELEPORT
        );
        if (teleportTargets.length > 0) {
          // 計算目前傳送門的 index
          let currentIndex: i32 = -1;
          for (let i = 0; i < teleportTargets.length; i++) {
            if (teleportTargets[i].x === nx && teleportTargets[i].y === ny) {
              currentIndex = i;
              break;
            }
          }

          // 計算下一個傳送門的 index，並處理循環
          const nextIndex = (currentIndex + 1) % teleportTargets.length;
          const tp = teleportTargets[nextIndex];

          nx = tp.x;
          ny = tp.y;
          // console.log(`Teleported to (${nx}, ${ny})`);
        }
      }

      // 處理 Thief：若遇到小偷，重置所有道具
      if (compositeState.get(PLACEMENT_TYPE_THIEF).booleanValue) {
        newItemMask = 0;
      }

      // 生成新的 state key：用簡短的字串結合數值資訊
      const stateKey: string =
        nx.toString() +
        "," +
        ny.toString() +
        "," +
        newFlourMask.toString(10) +
        "," +
        newItemMask.toString(10) +
        "," +
        newDoorMask.toString(10);
      // const stateKey: string = `${nx},${ny},${newFlourMask},${newItemMask},${newDoorMask}`;

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const newG = g + 1;
      const newH = heuristicOptimized(
        nx,
        ny,
        flourMap,
        totalFlours,
        goalPosition
      );
      queue.push(
        new QueueItem(
          newG + newH,
          newG,
          nx,
          ny,
          newFlourMask,
          newItemMask,
          newDoorMask,
          newPath
        )
      );
    }
  }

  console.log(`${longestPath}`);
  console.log("找不到有效路徑");
  return [];
}

// 改進版啟發函數：用 Manhattan 距離估算，這裡可依需要改成 MST 等更精準估算
export function heuristicOptimized(
  cx: i32,
  cy: i32,
  flourMap: Map<string, i32>,
  totalFlours: i32,
  goalPosition: ExtendedPlacementConfig
): i32 {
  // 初始值設為 Manhattan 距離（起點到目標）
  let minDist: i32 = <i32>(
    (Math.abs(goalPosition.x - cx) + Math.abs(goalPosition.y - cy))
  );

  // AssemblyScript中使用for循環遍歷Map
  const keys = flourMap.keys();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // 拆分 key "x,y"
    const parts = key.split(",");
    const fx: i32 = <i32>parseInt(parts[0]);
    const fy: i32 = <i32>parseInt(parts[1]);

    const d: i32 = <i32>(Math.abs(fx - cx) + Math.abs(fy - cy));
    if (d < minDist) minDist = d;
  }

  return minDist;
}


// assembly/index.ts 中添加一个新函数

// 接收简单格式编码的字符串
export function findSolutionPathSimple(encodedMap: string, width: i32, height: i32, encodedPlacements: string): StaticArray<i32>[] {
  // 解析地图数据
  const rows = encodedMap.split("|");
  const gameMap: string[][] = [];
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length > 0) { // 确保不是空行
      gameMap.push(rows[i].split(","));
    }
  }

  print2DStringArray(gameMap)
  
  // 解析放置数据
  const placementRows = encodedPlacements.split("|");
  const placements: ExtendedPlacementConfig[] = [];
  
  for (let i = 0; i < placementRows.length; i++) {
    if (placementRows[i].length > 0) {
      const parts = placementRows[i].split(",");
      if (parts.length >= 3) { // 确保至少有 x,y,type
        const placement = new ExtendedPlacementConfig();
        placement.x = <i32>parseInt(parts[0]);
        placement.y = <i32>parseInt(parts[1]);
        placement.type = parts[2];
        
        // 添加可选字段
        if (parts.length > 3) placement.direction = parts[3];
        if (parts.length > 4) placement.isRaised = parts[4] === "true";
        if (parts.length > 5) placement.color = parts[5];
        // 其他字段根据需要添加...
        
        placements.push(placement);
      }
    }
  }
  printPlacements(placements)

  
  // 调用原始函数
  return findSolutionPath(gameMap, width, height, placements);
}