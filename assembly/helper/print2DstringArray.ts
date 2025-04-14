export function print2DStringArray(arr: Array<Array<string>>): void {
    for (let i = 0; i < arr.length; i++) {
      let row = arr[i];
      let line = "";
      for (let j = 0; j < row.length; j++) {
        line += row[j] + " ";
      }
      console.log(line.trim());
    }
  }