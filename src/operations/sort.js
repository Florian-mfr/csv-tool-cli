import { readCSV, writeCSV } from "../utils/csv.js";
import { validateKey } from "../utils/validation.js";

export async function sort(file, column, order = "asc", dataType = "auto", output) {
  try {
    const rows = await readCSV(file);
    
    if (!validateKey(rows, column)) {
      return false;
    }

    if (dataType === "auto") {
      const sampleValues = rows.slice(0, 10).map(row => row[column]).filter(val => val && val.trim());
      
      if (sampleValues.every(val => !isNaN(Date.parse(val)))) {
        dataType = "date";
      } else if (sampleValues.every(val => !isNaN(parseFloat(val)))) {
        dataType = "number";
      } else {
        dataType = "string";
      }
      
      console.log(`📊 Auto-detected data type: ${dataType}`);
    }
    
    const sortedRows = [...rows].sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];
      
      let compareResult;
      
      switch (dataType) {
        case "number":
          compareResult = parseFloat(valueA || 0) - parseFloat(valueB || 0);
          break;
        case "date":
          compareResult = new Date(valueA || 0) - new Date(valueB || 0);
          break;
        case "string":
        default:
          compareResult = (valueA || "").localeCompare(valueB || "");
          break;
      }
      
      return order === "desc" ? -compareResult : compareResult;
    });
    
    console.log(`📊 Sorted ${sortedRows.length} rows by '${column}' (${order}ending, ${dataType})`);
    
    return writeCSV(output, sortedRows);
  } catch (error) {
    console.error(`❌ Error in sort operation: ${error.message}`);
    return false;
  }
}