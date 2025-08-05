import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { parse } from "json2csv";
import { validateFile, checkWritePermission } from "./validation.js";

export function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    if (!validateFile(filePath)) {
      reject(new Error(`Invalid file: ${filePath}`));
      return;
    }

    const rows = [];
    const stream = fs.createReadStream(filePath, { encoding: "utf8" });
    
    stream
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => {
        if (rows.length === 0) {
          console.warn("⚠️ Warning: CSV file is empty or contains no valid data");
        }
        resolve(rows);
      })
      .on("error", (error) => {
        console.error(`❌ Error reading CSV file ${filePath}: ${error.message}`);
        reject(error);
      });
      
    stream.on("error", (error) => {
      console.error(`❌ Error opening file ${filePath}: ${error.message}`);
      reject(error);
    });
  });
}

export function writeCSV(filePath, data) {
  if (data.length === 0) {
    console.warn("⚠️ No results to write.");
    return false;
  }
  
  if (!checkWritePermission(filePath)) {
    return false;
  }
  
  try {
    const fields = Object.keys(data[0]);
    const csvData = parse(data, { fields });
    fs.writeFileSync(filePath, csvData);
    console.log(`✅ File written: ${filePath} (${data.length} row(s))`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing file ${filePath}: ${error.message}`);
    return false;
  }
}