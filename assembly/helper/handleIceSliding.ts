import {
  buildFlourMapping,
  combineCellState,
  getHeroDirection,
  getPlacementAt,
} from "..";
import {
  DIRECTION_DOWN,
  DIRECTION_LEFT,
  DIRECTION_RIGHT,
  DIRECTION_UP,
  directions,
  directionUpdateMap,
  iceTileCornerBlockedMoves,
  iceTileCornerRedirection,
  PLACEMENT_TYPE_CONVEYOR,
  PLACEMENT_TYPE_FIRE,
  PLACEMENT_TYPE_FIRE_PICKUP,
  PLACEMENT_TYPE_FLOUR,
  PLACEMENT_TYPE_ICE,
  PLACEMENT_TYPE_ICE_PICKUP,
  PLACEMENT_TYPE_KEY,
  PLACEMENT_TYPE_LOCK,
  PLACEMENT_TYPE_SWITCH_DOOR,
  PLACEMENT_TYPE_THIEF,
  PLACEMENT_TYPE_WALL,
  PLACEMENT_TYPE_WATER,
  PLACEMENT_TYPE_WATER_PICKUP,
} from "../consts";
import {
  createIceSlidingResult,
  ExtendedPlacementConfig,
  IceSlidingResult,
  SolutionPathType,
} from "../types/global";

// 修正返回類型和函數定義的語法
export function handleIceSliding(
  placements: Array<ExtendedPlacementConfig>,
  gameMap: string[][],
  width: i32,
  height: i32,
  dx: i32,
  dy: i32,
  initialX: i32,
  initialY: i32,
  itemMask: i32,
  doorMap: Map<string, i32>,
  doorMask: i32,
  flourMask: i32
): IceSlidingResult {
  let nx: i32 = initialX;
  let ny: i32 = initialY;
  let movingTrace: SolutionPathType = [[nx, ny]];
  const hasIcePickup: i32 = itemMask & 4;
  let entryDirection: string = getHeroDirection(dx, dy);
  const flourMapping = buildFlourMapping(placements);
  const flourMap = flourMapping.flourMap;
  // const totalFlours = flourMapping.totalFlours;
  const currentTile: string = gameMap[ny - 1][nx - 1];
  let compositeState = combineCellState(currentTile);

  // 如果有hasIcePickup，則不滑動（僅返回起始位置）
  if (hasIcePickup) {
    // 處理冰角阻擋
    movingTrace = handleIceCornerBlocking(
      placements,
      gameMap,
      nx,
      ny,
      dx,
      dy,
      entryDirection,
      movingTrace
    );

    return createIceSlidingResult(true, movingTrace, itemMask, flourMask);
  }

  // 使用訪問集合來檢測迴圈
  let visited = new Set<string>();

  while (true) {
    // 處理冰角轉向邏輯
    if (compositeState && compositeState.get("iceCorner").booleanValue) {
      const corner = compositeState.get("iceCorner").stringValue;
      let newDirection: string = "";
      if (iceTileCornerRedirection.has(corner)) {
        const redirection = iceTileCornerRedirection.get(corner);
        if (redirection.has(entryDirection)) {
          newDirection = redirection.get(entryDirection);
        }
      }

      if (newDirection.length !== 0) {
        // 根據新方向更新 dx 和 dy
        if (newDirection === DIRECTION_RIGHT) {
          dx = 1;
          dy = 0;
        } else if (newDirection === DIRECTION_LEFT) {
          dx = -1;
          dy = 0;
        } else if (newDirection === DIRECTION_DOWN) {
          dx = 0;
          dy = 1;
        } else if (newDirection === DIRECTION_UP) {
          dx = 0;
          dy = -1;
        }

        entryDirection = newDirection;
        // console.log(
        //   `Hero 在 ${corner} [${nx},${ny}] 轉向至往 ${entryDirection}`
        // );
      } else {
        // console.log(
        //   `Hero 在 [${nx},${ny}] 往 ${entryDirection} 被角落${corner}阻擋`
        // );
        movingTrace.push([nx - dx, ny - dy]);

        return createIceSlidingResult(true, movingTrace, itemMask, flourMask);
      }
    }

    // 計算下一格座標
    let nextX = nx + dx;
    let nextY = ny + dy;

    // 邊界檢查
    if (nextX < 1 || nextX > width || nextY < 1 || nextY > height) break;

    // 檢查是否存在無窮迴圈
    const stateKey = `${nx},${ny},${dx},${dy},${itemMask}`;
    if (visited.has(stateKey)) {
      console.error(`檢測到無窮迴圈 ${stateKey}`);
      break;
    }
    visited.add(stateKey);

    // 獲取下一格的狀態
    let nextTile = gameMap[nextY - 1][nextX - 1];
    compositeState = combineCellState(nextTile);

    // 撿到 FLOUR
    if (compositeState.get(PLACEMENT_TYPE_FLOUR).booleanValue) {
      const flourKey = `${nextX},${nextY}`;
      if (flourMap.has(flourKey)) {
        const index: i32 = flourMap.get(flourKey);
        flourMask |= 1 << index;
      }
    }

    // 遇到牆壁停止
    if (compositeState.get(PLACEMENT_TYPE_WALL).booleanValue) break;

    // 滑到鎖沒鑰匙則停止
    if (
      compositeState.get(PLACEMENT_TYPE_LOCK + ":BLUE").booleanValue &&
      !(itemMask & 8)
    )
      break;
    if (
      compositeState.get(PLACEMENT_TYPE_LOCK + ":GREEN").booleanValue &&
      !(itemMask & 16)
    )
      break;

    // 道具收集
    if (compositeState.get(PLACEMENT_TYPE_FIRE_PICKUP).booleanValue)
      itemMask |= 1;
    if (compositeState.get(PLACEMENT_TYPE_WATER_PICKUP).booleanValue)
      itemMask |= 2;
    if (compositeState.get(PLACEMENT_TYPE_ICE_PICKUP).booleanValue)
      itemMask |= 4;
    if (compositeState.get(PLACEMENT_TYPE_KEY + ":BLUE").booleanValue)
      itemMask |= 8;
    if (compositeState.get(PLACEMENT_TYPE_KEY + ":GREEN").booleanValue)
      itemMask |= 16;

    // 升降門邏輯
    if (compositeState.get(PLACEMENT_TYPE_SWITCH_DOOR).booleanValue) {
      const doorKey = `${nextX},${nextY}`;
      const doorIndex = doorMap.get(doorKey);
      if (!doorIndex) {
        if (doorMask & (1 << doorIndex)) break;
      }
    }

    // 危險區域檢查
    if (
      compositeState.get(PLACEMENT_TYPE_WATER).booleanValue &&
      !(itemMask & 2)
    ) {
      return createIceSlidingResult(false, [], itemMask, flourMask);
    }

    if (
      compositeState.get(PLACEMENT_TYPE_FIRE).booleanValue &&
      !(itemMask & 1)
    ) {
      return createIceSlidingResult(false, [], itemMask, flourMask);
    }

    // 處理 Conveyor
    if (compositeState.get(PLACEMENT_TYPE_CONVEYOR).booleanValue) {
      const direction = compositeState.get("conveyorDir").stringValue;

      if (direction === "UP") nextY -= 1;
      else if (direction === "DOWN") nextY += 1;
      else if (direction === "LEFT") nextX -= 1;
      else if (direction === "RIGHT") nextX += 1;
      if (directionUpdateMap.has(direction)) {
        dx = directionUpdateMap.get(direction).x;
        dy = directionUpdateMap.get(direction).y;
      }
    }

    // 如果滑進 THIEF，itemMask 清空，但整個路徑有效
    if (compositeState.get(PLACEMENT_TYPE_THIEF).booleanValue) {
      movingTrace.push([nextX, nextY]);
      return createIceSlidingResult(true, movingTrace, 0, flourMask);
    }

    nx = nextX;
    ny = nextY;
    movingTrace.push([nx, ny]);
    compositeState = combineCellState(gameMap[ny - 1][nx - 1]);

    // 如果下一格不是冰，停止滑行
    if (!compositeState.get(PLACEMENT_TYPE_ICE).booleanValue) {
      break;
    }
  }

  return createIceSlidingResult(true, movingTrace, itemMask, flourMask);
}

// 處理冰角邏輯，將其封裝為一個函數，避免重複程式碼
function handleIceCornerBlocking(
  placements: ExtendedPlacementConfig[],
  gameMap: string[][],
  nx: i32,
  ny: i32,
  dx: i32,
  dy: i32,
  entryDirection: string,
  movingTrace: SolutionPathType
): SolutionPathType {
  // 從 placements 中尋找當前位置是否有冰角
  // const icePlacement = getPlacementAt(placements, PLACEMENT_TYPE_ICE, nx, ny);
  const compositeState = combineCellState(gameMap[ny - 1][nx - 1]);

  if (compositeState && compositeState.get("iceCorner").booleanValue) {
    let isPass = false;
    const corner = compositeState.get("iceCorner").stringValue;
    if (
      compositeState.get("iceCorner").stringValue.length !== 0 &&
      iceTileCornerBlockedMoves.has(corner)
    ) {
      const blockedMoves = iceTileCornerBlockedMoves.get(corner);
      if (blockedMoves.has(entryDirection)) {
        isPass = blockedMoves.get(entryDirection);
      }
    }

    // 記錄是否被角落阻擋
    const action = isPass ? `進入角落${corner}` : `被角落${corner}阻擋`;

    // console.log(
    //   `Hero  在 [${nx - dx},${
    //     ny - dy
    //   }] 往 ${entryDirection} ${action} [${nx},${ny}]`
    // );

    movingTrace.push([nx - dx, ny - dy]); // 推送回退位置
  }

  return movingTrace;
}
