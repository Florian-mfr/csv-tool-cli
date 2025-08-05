#!/usr/bin/env node
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { parse } from "json2csv";
import inquirer from "inquirer";
import inquirerFileTreeSelection from "inquirer-file-tree-selection-prompt";

inquirer.registerPrompt("file-tree-selection", inquirerFileTreeSelection);

function normalize(val) {
  return (val || "").trim().toLowerCase();
}

function validateFile(filePath) {
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

function validateKey(rows, key) {
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

function readCSV(filePath) {
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

function writeCSV(filePath, data) {
  try {
    if (data.length === 0) {
      console.warn("⚠️ No results to write.");
      return false;
    }
    
    const dir = path.dirname(filePath);
    try {
      fs.accessSync(dir, fs.constants.W_OK);
    } catch (error) {
      console.error(`❌ No write permission for directory: ${dir}`);
      return false;
    }
    
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

async function selectFile(message = "📁 Select a .csv file:") {
  const root = process.cwd();

  const { selectedFile } = await inquirer.prompt([
    {
      type: "file-tree-selection",
      name: "selectedFile",
      message,
      root,
      enableGoUpperDirectory: true,
      hideHidden: true,
      onlyShowValid: true,
      transformer: (input) => path.relative(root, input),
      validate: (entry) => {
        const fullPath = path.resolve(root, entry);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) return true;
          if (stats.isFile() && entry.endsWith(".csv")) return true;
        } catch (_) {}
        return false;
      },
    },
  ]);

  return path.resolve(root, selectedFile);
}

async function merge(files, output) {
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

async function diff(file1, file2, key, output) {
  try {
    const [rows1, rows2] = await Promise.all([readCSV(file1), readCSV(file2)]);
    
    if (!validateKey(rows1, key) || !validateKey(rows2, key)) {
      return false;
    }
    
    const keySet2 = new Set(rows2.map((row) => normalize(row[key])));
    const result = rows1.filter((row) => !keySet2.has(normalize(row[key])));
    return writeCSV(output, result);
  } catch (error) {
    console.error(`❌ Error in diff operation: ${error.message}`);
    return false;
  }
}

async function intersect(file1, file2, key, output) {
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

async function duplicates(file, key, output) {
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

async function splitCSV(inputFile, options) {
  try {
    const { mode, value, outputPattern } = options;
    const rows = await readCSV(inputFile);
    if (rows.length === 0) {
      console.warn("⚠️ The CSV file is empty.");
      return false;
    }
  let groups = [];

  if (mode === "fileCount") {
    const fileCount = parseInt(value, 10);
    if (fileCount <= 0) {
      console.warn("⚠️ The number of sub-files must be greater than 0.");
      return;
    }
    const groupSize = Math.ceil(rows.length / fileCount);
    for (let i = 0; i < fileCount; i++) {
      groups.push(rows.slice(i * groupSize, (i + 1) * groupSize));
    }
  } else if (mode === "maxLines") {
    const maxLines = parseInt(value, 10);
    if (maxLines <= 0) {
      console.warn("⚠️ The maximum number of lines must be greater than 0.");
      return;
    }
    for (let i = 0; i < rows.length; i += maxLines) {
      groups.push(rows.slice(i, i + maxLines));
    }
  } else {
    console.warn("⚠️ Unknown split mode.");
    return;
  }

    groups.forEach((group, index) => {
      if (group.length > 0) {
        const outputPath = path.resolve(
          process.cwd(),
          `${outputPattern}_${index + 1}.csv`
        );
        writeCSV(outputPath, group);
      }
    });
    console.log(`✅ Successfully generated ${groups.length} file(s).`);
    return true;
  } catch (error) {
    console.error(`❌ Error in split operation: ${error.message}`);
    return false;
  }
}

async function main() {
  const { command } = await inquirer.prompt([
    {
      type: "list",
      name: "command",
      message: "Choose an operation:",
      choices: [
        {
          name: "merge       (merge multiple CSV files)",
          value: "merge",
        },
        {
          name: "diff        (lines of csv1 absent of csv2)",
          value: "diff",
        },
        {
          name: "intersect   (lines common between csv1 and csv2)",
          value: "intersect",
        },
        {
          name: "duplicates  (duplicates in a single file)",
          value: "duplicates",
        },
        {
          name: "split       (split a CSV into multiple files)",
          value: "split",
        },
      ],
    },
  ]);

  if (command === "merge") {
    const fileList = [];
    let keepGoing = true;

    while (keepGoing) {
      const { method } = await inquirer.prompt([
        {
          type: "list",
          name: "method",
          message: `📦 Add files to merge (${fileList.length} current):`,
          choices: [
            {
              name: "Select a file via explorer",
              value: "explorer",
            },
            { name: "Enter a path manually", value: "manual" },
            {
              name: `Start merge with ${fileList.length} file(s)`,
              value: "done",
              disabled:
                fileList.length === 0 ? "Add at least one file" : false,
            },
          ],
        },
      ]);

      if (method === "explorer") {
        const file = await selectFile("📁 Select a file to add:");
        fileList.push(file);
      }

      if (method === "manual") {
        const { filePath } = await inquirer.prompt([
          {
            type: "input",
            name: "filePath",
            message: "📄 Relative path of the file to add:",
          },
        ]);
        const resolved = path.resolve(process.cwd(), filePath);
        fileList.push(resolved);
      }

      if (method === "done") {
        keepGoing = false;
      }
    }

    const { output } = await inquirer.prompt([
      {
        type: "input",
        name: "output",
        message: "📁 Output file name:",
        default: "merged.csv",
      },
    ]);

    const outputPath = path.resolve(process.cwd(), output);
    await merge(fileList, outputPath);
  }

  if (command === "diff" || command === "intersect") {
    const file1 = await selectFile("📂 File 1 (source):");
    const file2 = await selectFile("📂 File 2 (comparison):");

    const { key, output } = await inquirer.prompt([
      {
        type: "input",
        name: "key",
        message: "🔑 Key to use (e.g.: email):",
      },
      {
        type: "input",
        name: "output",
        message: "📁 Output file name:",
        default: `${command}.csv`,
      },
    ]);

    const outputPath = path.resolve(process.cwd(), output);
    if (command === "diff") await diff(file1, file2, key, outputPath);
    else await intersect(file1, file2, key, outputPath);
  }

  if (command === "duplicates") {
    const file = await selectFile("📂 File to analyze:");

    const { key, output } = await inquirer.prompt([
      {
        type: "input",
        name: "key",
        message: "🔑 Key to detect duplicates (e.g.: email):",
      },
      {
        type: "input",
        name: "output",
        message: "📁 Output file name:",
        default: "duplicates.csv",
      },
    ]);

    const outputPath = path.resolve(process.cwd(), output);
    await duplicates(file, key, outputPath);
  }

  if (command === "split") {
    const file = await selectFile("📂 Select the CSV file to split:");
    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "Choose the split mode:",
        choices: [
          { name: "Number of sub-files", value: "fileCount" },
          { name: "Maximum number of lines per file", value: "maxLines" },
        ],
      },
    ]);

    const { value } = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message:
          mode === "fileCount"
            ? "Enter the number of files to generate:"
            : "Enter the maximum number of lines per file:",
        validate: (input) =>
          !isNaN(parseInt(input, 10)) && parseInt(input, 10) > 0
            ? true
            : "Enter a valid number greater than 0.",
      },
    ]);

    const { outputPattern } = await inquirer.prompt([
      {
        type: "input",
        name: "outputPattern",
        message: "Base name for output files:",
        default: "split_part",
      },
    ]);

    await splitCSV(file, { mode, value, outputPattern });
  }
}

main();
