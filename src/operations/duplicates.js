import { readCSV, writeCSV } from "../utils/csv.js";
import { validateKey, normalize } from "../utils/validation.js";

export async function duplicates(file, key, output) {
  try {
    const rows = await readCSV(file);
    
    if (!validateKey(rows, key)) {
      return false;
    }
    
    const seen = new Map();
    const dups = [];

    for (const row of rows) {
      const val = normalize(row[key]);
      if (seen.has(val)) {
        dups.push(row);
      } else {
        seen.set(val, true);
      }
    }

    return writeCSV(output, dups);
  } catch (error) {
    console.error(`❌ Error in duplicates operation: ${error.message}`);
    return false;
  }
}