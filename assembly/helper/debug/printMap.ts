import { CellState } from "../../types/global";

export function printMap(
  map: Map<string, CellState>,
  keys: Array<string>
): void {
  let output = "{ ";
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let boolValue: bool = false;
    let stringValue = "";
    if (map.has(key)) {
      boolValue = map.get(key).booleanValue;
      stringValue = map.get(key).stringValue;
    }

    output += key + ": " + (boolValue ? "true" : "false") + stringValue + ", ";
  }
  output += "}";
  console.log(output);
}
