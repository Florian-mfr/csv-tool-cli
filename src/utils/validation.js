import fs from "fs";
import path from "path";

export function normalize(val) {
  return (val || "").trim().toLowerCase();
}

export function validateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }
    
    if (!filePath.toLowerCase().endsWith('.csv')) {
      console.warn(`⚠️ Warning: File doesn't have .csv extension: ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ File validation error: ${error.message}`);
    return false;
  }
}

export function validateKey(rows, key) {
  if (!rows || rows.length === 0) {
    console.error("❌ No data to validate key against");
    return false;
  }
  
  const firstRow = rows[0];
  if (!firstRow.hasOwnProperty(key)) {
    const availableKeys = Object.keys(firstRow);
    console.error(`❌ Key '${key}' not found in CSV. Available columns: ${availableKeys.join(', ')}`);
    return false;
  }
  
  return true;
}

export function checkWritePermission(filePath) {
  const dir = path.dirname(filePath);
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch (error) {
    console.error(`❌ No write permission for directory: ${dir}`);
    return false;
  }
}