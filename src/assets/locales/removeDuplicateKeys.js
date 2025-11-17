import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Removes duplicate keys from an object, keeping only the first occurrence
 * @param {any} obj - The object to process
 * @returns {any} - Object with duplicate keys removed
 */
function removeDuplicateKeys(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeDuplicateKeys(item));
  }

  const seen = new Set();
  const result = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (!seen.has(key)) {
        seen.add(key);
        result[key] = removeDuplicateKeys(obj[key]);
      }
    }
  }

  return result;
}

/**
 * Process JSON file to remove duplicate keys
 * @param {string} inputFile - Path to input JSON file
 * @param {string} outputFile - Path to output JSON file (optional)
 */
function processJsonFile(inputFile, outputFile = null) {
  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(inputFile, "utf8");

    // Parse JSON
    let jsonData;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError.message);
      return;
    }

    // Remove duplicate keys
    const cleanedData = removeDuplicateKeys(jsonData);

    // Generate output file name if not provided
    if (!outputFile) {
      const dir = path.dirname(inputFile);
      const name = path.basename(inputFile, path.extname(inputFile));
      const ext = path.extname(inputFile);
      outputFile = path.join(dir, `${name}_cleaned${ext}`);
    }

    // Write cleaned data to output file
    fs.writeFileSync(outputFile, JSON.stringify(cleanedData, null, 2), "utf8");

    console.log(`✅ Successfully processed JSON file!`);
    console.log(`📁 Input file: ${inputFile}`);
    console.log(`📁 Output file: ${outputFile}`);
    console.log(`🧹 Duplicate keys have been removed.`);
  } catch (error) {
    console.error("Error processing file:", error.message);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node translate.js <input-file> [output-file]");
  console.log("Examples:");
  console.log("  node translate.js data.json");
  console.log("  node translate.js data.json cleaned_data.json");
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: File "${inputFile}" does not exist.`);
  process.exit(1);
}

console.log(`🔍 Processing file: ${inputFile}`);
processJsonFile(inputFile, outputFile);

// Export functions for use as module
export { removeDuplicateKeys, processJsonFile };
