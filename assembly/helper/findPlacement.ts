import { ExtendedPlacementConfig, PlacementConfig } from "../types/global";

// 添加在文件顶部或辅助函数文件中
export function findPlacement<T extends ExtendedPlacementConfig>(
    arr: T[],
    predicate: (item: T) => boolean
  ): T | null {
    for (let i = 0; i < arr.length; i++) {
      if (predicate(arr[i])) {
        return arr[i];
      }
    }
    return null;
  }