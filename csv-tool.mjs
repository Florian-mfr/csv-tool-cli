#!/usr/bin/env node
import inquirer from "inquirer";
import path from "path";

// Import operations
import { merge } from "./src/operations/merge.js";
import { diff } from "./src/operations/diff.js";
import { intersect } from "./src/operations/intersect.js";
import { duplicates } from "./src/operations/duplicates.js";
import { splitCSV } from "./src/operations/split.js";
import { filter } from "./src/operations/filter.js";
import { sort } from "./src/operations/sort.js";

// Import UI helpers
import { 
  selectFile, 
  selectOperation, 
  promptForMergeFiles, 
  promptForOutput, 
  promptForKey,
  promptForColumn
} from "./src/ui/prompts.js";

import { readCSV } from "./src/utils/csv.js";

async function handleMerge() {
  const fileList = await promptForMergeFiles();
  const outputPath = await promptForOutput("merged.csv");
  await merge(fileList, outputPath);
}

async function handleDiffOrIntersect(command) {
  const file1 = await selectFile("📂 File 1 (source):");
  const file2 = await selectFile("📂 File 2 (comparison):");
  
  const csvData = await readCSV(file1);
  const key = await promptForKey("🔑 Key to use:", csvData);
  const outputPath = await promptForOutput(`${command}.csv`);
  
  if (command === "diff") {
    await diff(file1, file2, key, outputPath);
  } else {
    await intersect(file1, file2, key, outputPath);
  }
}

async function handleDuplicates() {
  const file = await selectFile("📂 File to analyze:");
  
  const csvData = await readCSV(file);
  const key = await promptForKey("🔑 Key to detect duplicates:", csvData);
  const outputPath = await promptForOutput("duplicates.csv");
  await duplicates(file, key, outputPath);
}

async function handleSplit() {
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

async function handleFilter() {
  const file = await selectFile("📂 Select the CSV file to filter:");
  
  const csvData = await readCSV(file);
  const column = await promptForColumn("📊 Column to filter by:", csvData);

  const { operator } = await inquirer.prompt([
    {
      type: "list",
      name: "operator",
      message: "🔍 Choose filter condition:",
      choices: [
        { name: "equals (exact match)", value: "equals" },
        { name: "not equals", value: "not_equals" },
        { name: "contains (substring)", value: "contains" },
        { name: "not contains", value: "not_contains" },
        { name: "starts with", value: "starts_with" },
        { name: "ends with", value: "ends_with" },
        { name: "greater than (numbers)", value: "greater_than" },
        { name: "less than (numbers)", value: "less_than" },
        { name: "is empty", value: "empty" },
        { name: "is not empty", value: "not_empty" },
      ],
    },
  ]);

  let value = "";
  if (!["empty", "not_empty"].includes(operator)) {
    const response = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message: "💭 Value to compare against:",
      },
    ]);
    value = response.value;
  }

  const outputPath = await promptForOutput("filtered.csv");
  await filter(file, column, operator, value, outputPath);
}

async function handleSort() {
  const file = await selectFile("📂 Select the CSV file to sort:");
  
  const csvData = await readCSV(file);
  const column = await promptForColumn("📊 Column to sort by:", csvData);

  const { order } = await inquirer.prompt([
    {
      type: "list",
      name: "order",
      message: "📈 Sort order:",
      choices: [
        { name: "Ascending (A→Z, 1→9, oldest→newest)", value: "asc" },
        { name: "Descending (Z→A, 9→1, newest→oldest)", value: "desc" },
      ],
    },
  ]);

  const { dataType } = await inquirer.prompt([
    {
      type: "list",
      name: "dataType",
      message: "🔢 Data type (auto-detect recommended):",
      choices: [
        { name: "Auto-detect", value: "auto" },
        { name: "Text/String", value: "string" },
        { name: "Number", value: "number" },
        { name: "Date", value: "date" },
      ],
    },
  ]);

  const outputPath = await promptForOutput("sorted.csv");
  await sort(file, column, order, dataType, outputPath);
}

async function main() {
  console.log("Welcome to CSV Tool CLI!");
  
  const command = await selectOperation();

  switch (command) {
    case "merge":
      await handleMerge();
      break;
    case "diff":
    case "intersect":
      await handleDiffOrIntersect(command);
      break;
    case "duplicates":
      await handleDuplicates();
      break;
    case "split":
      await handleSplit();
      break;
    case "filter":
      await handleFilter();
      break;
    case "sort":
      await handleSort();
      break;
    default:
      console.error("❌ Unknown command");
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error.message);
  process.exit(1);
});