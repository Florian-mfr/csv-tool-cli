import path from "path";
import { readCSV, writeCSV } from "../utils/csv.js";

export async function merge(files, output) {
  try {
    const allRows = [];
    const allColumns = new Set();
    const fileHeaders = [];
    
    for (const file of files) {
      const rows = await readCSV(file);
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        fileHeaders.push({ file: path.basename(file), headers });
        headers.forEach(col => allColumns.add(col));
        allRows.push(...rows);
      }
    }
    
    if (fileHeaders.length > 1) {
      const firstHeaders = fileHeaders[0].headers.sort();
      let hasMismatch = false;
      
      for (let i = 1; i < fileHeaders.length; i++) {
        const currentHeaders = fileHeaders[i].headers.sort();
        if (JSON.stringify(firstHeaders) !== JSON.stringify(currentHeaders)) {
          hasMismatch = true;
          break;
        }
      }
      
      if (hasMismatch) {
        console.warn("⚠️ Warning: Files have different column structures:");
        fileHeaders.forEach(({file, headers}) => {
          console.warn(`  ${file}: ${headers.join(', ')}`);
        });
        console.warn(`  Merged file will have all columns: ${Array.from(allColumns).sort().join(', ')}`);
        console.warn(`  Missing values will be empty.`);
      }
    }
    
    const normalizedRows = allRows.map(row => {
      const normalizedRow = {};
      Array.from(allColumns).forEach(col => {
        normalizedRow[col] = row[col] || '';
      });
      return normalizedRow;
    });
    
    return writeCSV(output, normalizedRows);
  } catch (error) {
    console.error(`❌ Error in merge operation: ${error.message}`);
    return false;
  }
}