import { ExtendedPlacementConfig } from "../../types/global";

export function printPlacements(
  placements: Array<ExtendedPlacementConfig>
): void {
  console.log("Placements:");
  for (let i = 0; i < placements.length; i++) {
    let p = placements[i];

    let logStr = `#${i} - x: ${p.x}, y: ${p.y}, type: ${p.type}`;
    logStr += ", iceCorner: " + (p.corner != null ? p.corner! : "null");
    logStr += ", direction: " + (p.direction != null ? p.direction! : "null");
    logStr += ", color: " + (p.color != null ? p.color! : "null");
    logStr += ", isRaised: " + (p.isRaised ? "true" : "false");

    console.log(logStr);
  }
}
