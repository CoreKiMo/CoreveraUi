import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Translate text using Google Translate free API
 * @param {string} text - Text to translate
 * @param {string} fromLang - Source language
 * @param {string} toLang - Target language
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, fromLang, toLang) {
  try {
    if (!text || typeof text !== "string") {
      return text;
    }

    // If source and target languages are the same, return original text
    if (fromLang === toLang) {
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

    return text;
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
async function translateObject(obj, fromLang, toLang) {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string") {
      await delay(100);
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
 * Compare two objects and extract keys present in source but missing in target
 * @param {object} source - Source JSON object
 * @param {object} target - Target JSON object
 * @returns {object} - Object containing missing keys and their values from source
 */
function extractMissingKeys(source, target) {
  const missing = {};

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return missing;
  }

  for (const key of Object.keys(source)) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      missing[key] = source[key];
    } else if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === "object" &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      const nestedMissing = extractMissingKeys(source[key], target[key]);
      if (Object.keys(nestedMissing).length > 0) {
        missing[key] = nestedMissing;
      }
    }
  }

  return missing;
}

/**
 * Main function to compare two JSON files, extract missing keys, and translate them
 * @param {string} sourceFile - Path to source JSON file
 * @param {string} targetFile - Path to target JSON file
 * @param {string} outputFile - Path to output JSON file (optional)
 * @param {string} sourceLang - Source file language (optional, e.g., 'ar' or 'en')
 * @param {string} targetLang - Target file language (optional, e.g., 'ar' or 'en')
 */
async function compareAndTranslateJsonFiles(
  sourceFile,
  targetFile,
  outputFile = null,
  sourceLang = null,
  targetLang = null
) {
  try {
    console.log(`🔍 Reading source file: ${sourceFile}`);
    console.log(`🔍 Reading target file: ${targetFile}`);

    // Read and parse source JSON file
    const sourceContent = fs.readFileSync(sourceFile, "utf8");
    let sourceData;
    try {
      sourceData = JSON.parse(sourceContent);
    } catch (parseError) {
      console.error(
        `❌ Error parsing source JSON (${sourceFile}):`,
        parseError.message
      );
      return;
    }

    // Read and parse target JSON file
    const targetContent = fs.readFileSync(targetFile, "utf8");
    let targetData;
    try {
      targetData = JSON.parse(targetContent);
    } catch (parseError) {
      console.error(
        `❌ Error parsing target JSON (${targetFile}):`,
        parseError.message
      );
      return;
    }

    console.log("🌐 Comparing JSON files...");

    // Determine languages: use command-line arguments if provided, else infer from filenames
    let fromLang, toLang;
    if (sourceLang && targetLang) {
      fromLang = sourceLang; // Missing keys are in source language
      toLang = targetLang; // Translate to target language
    } else {
      const sourceFileName = path.basename(sourceFile).toLowerCase();
      const targetFileName = path.basename(targetFile).toLowerCase();

      if (sourceFileName.includes("ar")) {
        // Source is Arabic, missing keys are in Arabic, need to translate to target language
        fromLang = "ar";
        if (targetFileName.includes("en")) {
          toLang = "en";
        } else {
          // If target language can't be determined, assume English
          toLang = "en";
        }
      } else if (sourceFileName.includes("en")) {
        // Source is English, missing keys are in English, need to translate to target language
        fromLang = "en";
        if (targetFileName.includes("ar")) {
          toLang = "ar";
        } else {
          // If target language can't be determined, assume Arabic
          toLang = "ar";
        }
      } else {
        console.error(
          "❌ Cannot determine language from filenames. Use 'ar' or 'en' in filenames or provide sourceLang and targetLang."
        );
        return;
      }
    }

    console.log(`🌍 Will translate missing keys from ${fromLang} to ${toLang}`);

    // Extract missing keys
    const missingKeys = extractMissingKeys(sourceData, targetData);

    if (Object.keys(missingKeys).length === 0) {
      console.log("✅ No missing keys found.");
      return;
    }

    console.log(
      `🌍 Translating ${
        Object.keys(missingKeys).length
      } missing key(s) from ${fromLang} to ${toLang}...`
    );

    // Translate missing keys' values
    const translatedMissingKeys = await translateObject(
      missingKeys,
      fromLang,
      toLang
    );

    // Generate output file name if not provided
    if (!outputFile) {
      const dir = path.dirname(sourceFile);
      const sourceName = path.basename(sourceFile, path.extname(sourceFile));
      const targetName = path.basename(targetFile, path.extname(targetFile));
      outputFile = path.join(
        dir,
        `${sourceName}_missing_in_${targetName}_translated.json`
      );
    }

    // Write translated missing keys to output file
    fs.writeFileSync(
      outputFile,
      JSON.stringify(translatedMissingKeys, null, 2),
      "utf8"
    );

    console.log(`\n✅ Process completed successfully!`);
    console.log(`📁 Source file: ${sourceFile}`);
    console.log(`📁 Target file: ${targetFile}`);
    console.log(`📁 Output file: ${outputFile}`);
    console.log(
      `🔑 Found ${
        Object.keys(missingKeys).length
      } missing key(s), translated from ${fromLang} to ${toLang}.`
    );
  } catch (error) {
    console.error("❌ Error processing files:", error.message);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(
    "Usage: node compareAndTranslateMissingKeys.js <source-file> <target-file> [output-file] [source-lang] [target-lang]"
  );
  console.log("Examples:");
  console.log(
    "  node compareAndTranslateMissingKeys.js resourceAr.json resourceEn.json"
  );
  console.log(
    "  node compareAndTranslateMissingKeys.js resourceEn.json resourceAr.json missing_translated.json"
  );
  console.log(
    "  node compareAndTranslateMissingKeys.js resourceAr.json resourceEn.json missing_translated.json ar en"
  );
  console.log(
    "  node compareAndTranslateMissingKeys.js resourceAr.json resourceEn.json missing_translated.json ar ar"
  );
  process.exit(1);
}

const sourceFile = args[0];
const targetFile = args[1];
const outputFile = args[2];
const sourceLang = args[3];
const targetLang = args[4];

// Check if input files exist
if (!fs.existsSync(sourceFile)) {
  console.error(`❌ Error: Source file "${sourceFile}" does not exist.`);
  process.exit(1);
}
if (!fs.existsSync(targetFile)) {
  console.error(`❌ Error: Target file "${targetFile}" does not exist.`);
  process.exit(1);
}

// Start comparison and translation
console.log(
  `🚀 Starting comparison and translation for ${sourceFile} and ${targetFile}...`
);
compareAndTranslateJsonFiles(
  sourceFile,
  targetFile,
  outputFile,
  sourceLang,
  targetLang
);

// Export functions for use as module
export {
  extractMissingKeys,
  translateText,
  translateObject,
  compareAndTranslateJsonFiles,
};
