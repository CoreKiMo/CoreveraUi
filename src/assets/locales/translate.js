import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Translate text using Google Translate free API
 * @param {string} text - Text to translate
 * @param {string} fromLang - Source language (default: 'ar')
 * @param {string} toLang - Target language (default: 'en')
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, fromLang = "ar", toLang = "en") {
  try {
    // Skip if text is empty or not a string
    if (!text || typeof text !== "string") {
      return text;
    }

    // Skip if text doesn't contain Arabic characters
    const arabicRegex = /[\u0600-\u06FF]/;
    if (!arabicRegex.test(text)) {
      return text;
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }

    return text; // Return original if translation fails
  } catch (error) {
    console.warn(`Translation failed for "${text}":`, error.message);
    return text;
  }
}

/**
 * Add delay between API calls to avoid rate limiting
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Recursively translate all string values in an object
 * @param {any} obj - Object to translate
 * @param {string} fromLang - Source language
 * @param {string} toLang - Target language
 * @returns {Promise<any>} - Translated object
 */
async function translateObject(obj, fromLang = "ar", toLang = "en") {
  if (obj === null || typeof obj !== "object") {
    // If it's a string, translate it
    if (typeof obj === "string") {
      await delay(100); // Small delay to avoid rate limiting
      return await translateText(obj, fromLang, toLang);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    const translatedArray = [];
    for (let i = 0; i < obj.length; i++) {
      console.log(`Translating array item ${i + 1}/${obj.length}`);
      translatedArray.push(await translateObject(obj[i], fromLang, toLang));
    }
    return translatedArray;
  }

  const translatedObj = {};
  const keys = Object.keys(obj);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`Translating key: ${key} (${i + 1}/${keys.length})`);
    translatedObj[key] = await translateObject(obj[key], fromLang, toLang);
  }

  return translatedObj;
}

/**
 * Main function to translate JSON file
 * @param {string} inputFile - Path to input JSON file
 * @param {string} outputFile - Path to output JSON file (optional)
 * @param {string} fromLang - Source language (default: 'ar')
 * @param {string} toLang - Target language (default: 'en')
 */
async function translateJsonFile(
  inputFile,
  outputFile = null,
  fromLang = "ar",
  toLang = "en"
) {
  try {
    console.log(`🔍 Reading file: ${inputFile}`);

    // Read the JSON file
    const fileContent = fs.readFileSync(inputFile, "utf8");

    // Parse JSON
    let jsonData;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      console.error("❌ Error parsing JSON:", parseError.message);
      return;
    }

    console.log("🌐 Starting translation process...");
    console.log(`📝 Translating from ${fromLang} to ${toLang}`);

    // Translate all values
    const translatedData = await translateObject(jsonData, fromLang, toLang);

    // Generate output file name if not provided
    if (!outputFile) {
      const dir = path.dirname(inputFile);
      const name = path.basename(inputFile, path.extname(inputFile));
      const ext = path.extname(inputFile);

      // If input is resourceAr.json, output should be resourceEn.json
      if (name.toLowerCase().includes("ar")) {
        outputFile = path.join(dir, name.replace(/ar/gi, "En") + ext);
      } else {
        outputFile = path.join(dir, `${name}_${toLang}${ext}`);
      }
    }

    // Write translated data to output file
    fs.writeFileSync(
      outputFile,
      JSON.stringify(translatedData, null, 2),
      "utf8"
    );

    console.log(`\n✅ Translation completed successfully!`);
    console.log(`📁 Input file: ${inputFile}`);
    console.log(`📁 Output file: ${outputFile}`);
    console.log(`🌍 Translated from ${fromLang} to ${toLang}`);
  } catch (error) {
    console.error("❌ Error processing file:", error.message);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(
    "Usage: node translate.js <input-file> [output-file] [from-lang] [to-lang]"
  );
  console.log("Examples:");
  console.log("  node translate.js resourceAr.json");
  console.log("  node translate.js resourceAr.json resourceEn.json");
  console.log("  node translate.js resourceAr.json resourceEn.json ar en");
  console.log("  node translate.js data.json translated.json ar en");
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const fromLang = args[2] || "ar";
const toLang = args[3] || "en";

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Error: File "${inputFile}" does not exist.`);
  process.exit(1);
}

// Start translation
console.log(`🚀 Starting translation of ${inputFile}...`);
translateJsonFile(inputFile, outputFile, fromLang, toLang);

// Export functions for use as module
export { translateText, translateObject, translateJsonFile };
