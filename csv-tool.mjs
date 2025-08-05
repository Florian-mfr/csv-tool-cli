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

function readCSV(filePath) {
  return new Promise((resolve) => {
    const rows = [];
    fs.createReadStream(filePath, { encoding: "utf8" })
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}

function writeCSV(filePath, data) {
  if (data.length === 0) {
    console.warn("⚠️ No results to write.");
    return;
  }
  const fields = Object.keys(data[0]);
  const csvData = parse(data, { fields });
  fs.writeFileSync(filePath, csvData);
  console.log(`✅ File written: ${filePath} (${data.length} row(s))`);
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
  const allRows = [];
  for (const file of files) {
    const rows = await readCSV(file);
    allRows.push(...rows);
  }
  writeCSV(output, allRows);
}

async function diff(file1, file2, key, output) {
  const [rows1, rows2] = await Promise.all([readCSV(file1), readCSV(file2)]);
  const keySet2 = new Set(rows2.map((row) => normalize(row[key])));
  const result = rows1.filter((row) => !keySet2.has(normalize(row[key])));
  writeCSV(output, result);
}

async function intersect(file1, file2, key, output) {
  const [rows1, rows2] = await Promise.all([readCSV(file1), readCSV(file2)]);
  const keySet2 = new Set(rows2.map((row) => normalize(row[key])));
  const result = rows1.filter((row) => keySet2.has(normalize(row[key])));
  writeCSV(output, result);
}

async function duplicates(file, key, output) {
  const rows = await readCSV(file);
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

  writeCSV(output, dups);
}

async function splitCSV(inputFile, options) {
  const { mode, value, outputPattern } = options;
  const rows = await readCSV(inputFile);
  if (rows.length === 0) {
    console.warn("⚠️ The CSV file is empty.");
    return;
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
    const file1 = await selectFile("📂 Fichier 1 (source) :");
    const file2 = await selectFile("📂 Fichier 2 (comparaison) :");

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
