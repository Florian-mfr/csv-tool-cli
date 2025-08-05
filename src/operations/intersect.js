import { readCSV, writeCSV } from "../utils/csv.js";
import { validateKey, normalize } from "../utils/validation.js";

export async function intersect(file1, file2, key, output) {
  try {
    const [rows1, rows2] = await Promise.all([readCSV(file1), readCSV(file2)]);
    
    if (!validateKey(rows1, key) || !validateKey(rows2, key)) {
      return false;
    }
    
    const keySet2 = new Set(rows2.map((row) => normalize(row[key])));
    const result = rows1.filter((row) => keySet2.has(normalize(row[key])));
    return writeCSV(output, result);
  } catch (error) {
    console.error(`❌ Error in intersect operation: ${error.message}`);
    return false;
  }
}