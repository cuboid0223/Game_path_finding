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
  PLACEMENT_TYPE_GOAL,
  PLACEMENT_TYPE_GOAL_ENABLED,
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
import { printMap } from "./helper/debug/printMap";
import { print2DStringArray } from "./helper/debug/print2DstringArray";
import { printPlacements } from "./helper/debug/printPlacements";
import { combineCellState } from "./helper/combineCellState";

//––––– 事前準備 –––––//
// 為面粉建立一個 mapping：key = "x,y" ； value = index（從 0 開始）
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
  hasFirePickup: boolean,
  hasWaterPickup: boolean,
  hasIcePickup: boolean,
  hasBlueKey: boolean,
  hasGreenKey: boolean
): i32 {
  let mask: i32 = 0;
  if (hasFirePickup) mask |= 1;
  if (hasWaterPickup) mask |= 2;
  if (hasIcePickup) mask |= 4;
  if (hasBlueKey) mask |= 8;
  if (hasGreenKey) mask |= 16;
  return mask;
}

// 切換所有 switchDoor 狀態：假設每個門用一個 bit 表示，1 表示「關閉」（不可通行），0 表示「開啟」
function toggleSwitchDoorMask(doorMask: i32, totalDoors: i32): i32 {
  // 反轉所有位元，再與 ((1 << totalDoors) - 1) 相與（只保留 totalDoors 個 bit）
  return ~doorMask & ((1 << totalDoors) - 1);
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

  // 事前準備：FLOUR mapping 與 switch door mapping
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
      // console.log(`${newPath}`);
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
      // debug use
      // debugMap(compositeState, PLACEMENT_TYPES);
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
        );

        if (!iceResult.valid) {
          // 如果冰面路徑無效，跳過這個移動
          continue;
        }
        newItemMask = iceResult.itemMask;
        newFlourMask = iceResult.flourMask;

        if (!iceResult.path.length) continue;
        // 更新位置為最後滑行的位置
        nx = iceResult.path[iceResult.path.length - 1][0];
        ny = iceResult.path[iceResult.path.length - 1][1];
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

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const newG = g + 1;
      const newH = heuristicOptimized(nx, ny, flourMap, goalPosition);
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

export function heuristicOptimized(
  cx: i32,
  cy: i32,
  flourMap: Map<string, i32>,
  goalPosition: ExtendedPlacementConfig
): i32 {
  // 初始值設為 Manhattan 距離（起點到目標）
  let minDist: i32 = <i32>(
    (Math.abs(goalPosition.x - cx) + Math.abs(goalPosition.y - cy))
  );

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

export function findSolutionPathSimple(
  encodedMap: string,
  width: i32,
  height: i32,
  encodedPlacements: string
): StaticArray<i32>[] {
  // 將傳入的 encodedMap 字串復原
  // 不直接傳入複雜物件，是因為 AssemblyScript
  // 不支援陣列物件，故先轉換成字串
  const rows = encodedMap.split("|");
  const gameMap: string[][] = [];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length > 0) {
      gameMap.push(rows[i].split(","));
    }
  }
  // debug use
  // print2DStringArray(gameMap);

  // 將傳入的 encodedPlacements 字串復原
  // 不直接傳入複雜物件，是因為 AssemblyScript
  // 不支援複雜物件，故先轉換成字串
  const placementRows = encodedPlacements.split("|");
  const placements: ExtendedPlacementConfig[] = [];

  for (let i = 0; i < placementRows.length; i++) {
    if (placementRows[i].length > 0) {
      const parts = placementRows[i].split(",");
      if (parts.length >= 3) {
        // 确保至少有 x,y,type
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
  // debug use
  // printPlacements(placements);

  // 轉換完後呼叫原函示
  return findSolutionPath(gameMap, width, height, placements);
}
