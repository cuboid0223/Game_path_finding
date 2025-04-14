import { PLACEMENT_TYPE_SWITCH_DOOR } from "../consts";
import { ExtendedPlacementConfig } from "../types/global";

export function findSwitchDoorAt(placements: ExtendedPlacementConfig[], key: string): ExtendedPlacementConfig | null {
    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      if (p.type === PLACEMENT_TYPE_SWITCH_DOOR && `${p.x},${p.y}` === key) {
        return p;
      }
    }
    return null;
  }