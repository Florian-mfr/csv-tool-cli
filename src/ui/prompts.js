import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import inquirerFileTreeSelection from "inquirer-file-tree-selection-prompt";

inquirer.registerPrompt("file-tree-selection", inquirerFileTreeSelection);

export async function selectFile(message = "📁 Select a .csv file:") {
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

export async function selectOperation() {
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
          name: "diff        (rows from csv1 not in csv2)",
          value: "diff",
        },
        {
          name: "intersect   (common rows between csv1 and csv2)",
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
        {
          name: "filter      (filter rows by criteria)",
          value: "filter",
        },
        {
          name: "sort        (sort rows by column)",
          value: "sort",
        },
      ],
    },
  ]);

  return command;
}

export async function promptForMergeFiles() {
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

  return fileList;
}

export async function promptForOutput(defaultName = "output.csv") {
  const { output } = await inquirer.prompt([
    {
      type: "input",
      name: "output",
      message: "📁 Output file name:",
      default: defaultName,
    },
  ]);

  return path.resolve(process.cwd(), output);
}

export async function promptForKey(message = "🔑 Key to use (e.g.: email):", csvData = null) {
  if (csvData && csvData.length > 0) {
    const columns = Object.keys(csvData[0]);
    
    const { key } = await inquirer.prompt([
      {
        type: "list",
        name: "key",
        message: message.replace("(e.g.: email):", ""),
        choices: columns.map(col => ({
          name: `${col}`,
          value: col
        }))
      },
    ]);
    
    return key;
  }
  
  const { key } = await inquirer.prompt([
    {
      type: "input",
      name: "key",
      message,
    },
  ]);

  return key;
}

export async function promptForColumn(message, csvData) {
  if (!csvData || csvData.length === 0) {
    throw new Error("No CSV data provided for column selection");
  }
  
  const columns = Object.keys(csvData[0]);
  
  const { column } = await inquirer.prompt([
    {
      type: "list",
      name: "column",
      message,
      choices: columns.map(col => ({
        name: `${col}`,
        value: col
      }))
    },
  ]);
  
  return column;
}