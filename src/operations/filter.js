import { readCSV, writeCSV } from "../utils/csv.js";
import { validateKey, normalize } from "../utils/validation.js";

export async function filter(file, column, operator, value, output) {
  try {
    const rows = await readCSV(file);
    
    if (!validateKey(rows, column)) {
      return false;
    }
    
    const result = rows.filter(row => {
      const cellValue = row[column];
      const normalizedCell = normalize(cellValue);
      const normalizedValue = normalize(value);
      
      switch (operator) {
        case "equals":
          return normalizedCell === normalizedValue;
        case "not_equals":
          return normalizedCell !== normalizedValue;
        case "contains":
          return normalizedCell.includes(normalizedValue);
        case "not_contains":
          return !normalizedCell.includes(normalizedValue);
        case "starts_with":
          return normalizedCell.startsWith(normalizedValue);
        case "ends_with":
          return normalizedCell.endsWith(normalizedValue);
        case "greater_than":
          return parseFloat(cellValue) > parseFloat(value);
        case "less_than":
          return parseFloat(cellValue) < parseFloat(value);
        case "empty":
          return !cellValue || cellValue.trim() === "";
        case "not_empty":
          return cellValue && cellValue.trim() !== "";
        default:
          console.error(`❌ Unknown operator: ${operator}`);
          return false;
      }
    });
    
    if (result.length === 0) {
      console.warn("⚠️ No rows match the filter criteria.");
    } else {
      console.log(`📊 Found ${result.length} rows matching the criteria.`);
    }
    
    return writeCSV(output, result);
  } catch (error) {
    console.error(`❌ Error in filter operation: ${error.message}`);
    return false;
  }
}