import path from "path";
import { readCSV, writeCSV } from "../utils/csv.js";

export async function splitCSV(inputFile, options) {
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
        return false;
      }
      const groupSize = Math.ceil(rows.length / fileCount);
      for (let i = 0; i < fileCount; i++) {
        groups.push(rows.slice(i * groupSize, (i + 1) * groupSize));
      }
    } else if (mode === "maxLines") {
      const maxLines = parseInt(value, 10);
      if (maxLines <= 0) {
        console.warn("⚠️ The maximum number of lines must be greater than 0.");
        return false;
      }
      for (let i = 0; i < rows.length; i += maxLines) {
        groups.push(rows.slice(i, i + maxLines));
      }
    } else {
      console.warn("⚠️ Unknown split mode.");
      return false;
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