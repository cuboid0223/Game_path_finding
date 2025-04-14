import { CellState, createCellState } from "../types/global";
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
} from "../consts";

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
        state.get("iceCorner").booleanValue = true;
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
        state.get("conveyorDir").booleanValue = true;
        state.get("conveyorDir").stringValue = parts[1]; // 例如 "RIGHT", "DOWN" 等
      }
    } else if (t === PLACEMENT_TYPE_CONVEYOR) {
      // 預設往右
      state.get("conveyorDir").stringValue = "RIGHT";
    }
  }

  for (let i = 0; i < filteredTypes.length; i++) {
    const t: string = filteredTypes[i];
    // 若 t 以 "SWITCH_DOOR_" 開頭，則拆分出升起資訊 "1" 或 "0"
    if (t.startsWith(PLACEMENT_TYPE_SWITCH_DOOR + "_")) {
      state.get(PLACEMENT_TYPE_SWITCH_DOOR).booleanValue = true;
    }
  }

  return state;
}
