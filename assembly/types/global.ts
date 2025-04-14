

export interface LevelState {
  theme: string;
  tilesWidth: i32;
  tilesHeight: i32;
  placements: Array<ExtendedPlacementConfig>;
}

// 使用 interface 替代 type
export interface PlacementConfig {
  x: i32;
  y: i32;
  type: string;
  id: i32 | null;
  frameCoord: string | null;
}

// 使用 interface 替代 type
export class ExtendedPlacementConfig {
    x: i32 = 0;
    y: i32 = 0;
    type: string = "";
    direction: string | null = null;
    isRaised: bool = false;
    color: string | null = null;
    corner: string | null = null;
    initialDirection: string | null = null;
    id: string | null = null;
    frameCoord: string | null = null;
  }

// 使用 class 定義 Position

export class Position {
  x: i32;
  y: i32;

  constructor(x: i32, y: i32) {
    this.x = x;
    this.y = y;
  }
}

export function createPosition(x: i32, y: i32): Position {
  return new Position(x, y);
}

// 使用 interface 替代 type
export interface CompositeCellState {
  wall: bool;
  water: bool;
  fire: bool;
  ice: bool;
  iceCorner: string;
  conveyor: bool;
  conveyorDir: string;
  teleport: bool;
  thief: bool;
  switch: bool;
  switchDoor: bool;
  blueLock: bool;
  greenLock: bool;
  waterPickup: bool;
  firePickup: bool;
  icePickup: bool;
  flour: bool;
  blueKey: bool;
  greenKey: bool;
  types: string[];
}

export class GameMapResult {
  gameMap: string[][];
  placements: ExtendedPlacementConfig[];
  constructor(gameMap: string[][], placements: ExtendedPlacementConfig[]) {
    this.gameMap = gameMap;
    this.placements = placements;
  }
}

export function createGameMapResult(
  gameMap: string[][],
  placements: ExtendedPlacementConfig[]
): GameMapResult {
  return new GameMapResult(gameMap, placements);
}

// Define a Position type for use in arrays
export type PositionArray = StaticArray<i32>;
export type SolutionPathType = Array<PositionArray>;
export class QueueItem {
  f: i32; // f = g + heuristic
  g: i32; // g = cost so far
  x: i32; // x coordinate
  y: i32; // y coordinate
  flourMask: i32; // flourMask
  itemMask: i32; // itemMask
  doorMask: i32; // doorMask
  path: SolutionPathType; // path array

  constructor(
    f: i32,
    g: i32,
    x: i32,
    y: i32,
    flourMask: i32,
    itemMask: i32,
    doorMask: i32,
    path: SolutionPathType
  ) {
    this.f = f;
    this.g = g;
    this.x = x;
    this.y = y;
    this.flourMask = flourMask;
    this.itemMask = itemMask;
    this.doorMask = doorMask;
    this.path = path;
  }
}

export class DirectionUpdate {
  x: i32;
  y: i32;

  constructor(x: i32, y: i32) {
    this.x = x;
    this.y = y;
  }
}

export class DirectionUpdateMap {
  LEFT: DirectionUpdate;
  RIGHT: DirectionUpdate;
  UP: DirectionUpdate;
  DOWN: DirectionUpdate;

  constructor() {
    this.LEFT = new DirectionUpdate(-1, 0);
    this.RIGHT = new DirectionUpdate(1, 0);
    this.UP = new DirectionUpdate(0, -1);
    this.DOWN = new DirectionUpdate(0, 1);
  }
}

export const directionUpdateMap = new DirectionUpdateMap();

export class CornerRedirectionMap {
  UP: string;
  LEFT: string;
  RIGHT: string;
  DOWN: string;

  constructor(
    up: string = "",
    left: string = "",
    right: string = "",
    down: string = ""
  ) {
    this.UP = up;
    this.LEFT = left;
    this.RIGHT = right;
    this.DOWN = down;
  }
}

export class IceTileCornerRedirection {
  TOP_LEFT: CornerRedirectionMap;
  TOP_RIGHT: CornerRedirectionMap;
  BOTTOM_LEFT: CornerRedirectionMap;
  BOTTOM_RIGHT: CornerRedirectionMap;

  constructor() {
    this.TOP_LEFT = new CornerRedirectionMap("RIGHT", "DOWN");
    this.TOP_RIGHT = new CornerRedirectionMap("LEFT", "", "DOWN");
    this.BOTTOM_LEFT = new CornerRedirectionMap("", "UP", "", "RIGHT");
    this.BOTTOM_RIGHT = new CornerRedirectionMap("", "", "UP", "LEFT");
  }
}

export const iceTileCornerRedirection = new IceTileCornerRedirection();

// For the blocked moves
export class CornerBlockedMap {
  UP: boolean;
  LEFT: boolean;
  RIGHT: boolean;
  DOWN: boolean;

  constructor(
    up: boolean = false,
    left: boolean = false,
    right: boolean = false,
    down: boolean = false
  ) {
    this.UP = up;
    this.LEFT = left;
    this.RIGHT = right;
    this.DOWN = down;
  }
}

export class IceTileCornerBlockedMoves {
  TOP_LEFT: CornerBlockedMap;
  TOP_RIGHT: CornerBlockedMap;
  BOTTOM_LEFT: CornerBlockedMap;
  BOTTOM_RIGHT: CornerBlockedMap;

  constructor() {
    this.TOP_LEFT = new CornerBlockedMap(true, true);
    this.TOP_RIGHT = new CornerBlockedMap(true, false, true);
    this.BOTTOM_LEFT = new CornerBlockedMap(false, true, false, true);
    this.BOTTOM_RIGHT = new CornerBlockedMap(false, false, true, true);
  }
}

export const iceTileCornerBlockedMoves = new IceTileCornerBlockedMoves();

export class IceSlidingResult {
  valid: bool;
  path: SolutionPathType;
  itemMask: i32;
  flourMask: i32;

  constructor() {
    this.valid = false; // Default value
    this.path = []; // Or whatever default value makes sense
    this.itemMask = 0;
    this.flourMask = 0;
  }
}

export function createIceSlidingResult(
  valid: bool,
  path: SolutionPathType,
  itemMask: i32,
  flourMask: i32
): IceSlidingResult {
  // Create a new instance of the class
  const result = new IceSlidingResult();
  result.valid = valid;
  result.path = path;
  result.itemMask = itemMask;
  result.flourMask = flourMask;
  return result;
}

export class FlourMapResult {
  flourMap: Map<string, i32>;
  totalFlours: i32;

  constructor() {
    this.flourMap = new Map();
    this.totalFlours = 0;
  }
}

export function createFlourMapResult(
  flourMap: Map<string, i32>,
  totalFlours: i32
): FlourMapResult {
  const result = new FlourMapResult();
  result.flourMap = flourMap;
  result.totalFlours = totalFlours;

  return result;
}

export class DoorMapResult {
  doorMap: Map<string, i32>;
  totalDoors: i32;

  constructor() {
    this.doorMap = new Map();
    this.totalDoors = 0;
  }
}

export function createDoorMapResult(
  doorMap: Map<string, i32>,
  totalDoors: i32
): DoorMapResult {
  const result = new DoorMapResult();
  result.doorMap = doorMap;
  result.totalDoors = totalDoors;

  return result;
}

export class CellState {
  booleanValue: bool;
  stringValue: string;

  // 構造函數初始化屬性
  constructor() {
    this.booleanValue = false;
    this.stringValue = "";
  }
}

export function createCellState(
  booleanValue: bool,
  stringValue: string
): CellState {
  const cellState = new CellState();
  cellState.booleanValue = booleanValue;
  cellState.stringValue = stringValue;

  return cellState;
}
