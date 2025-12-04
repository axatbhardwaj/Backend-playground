const fs = require("fs");
const path = require("path");
const https = require("https");

const CSV_FILE = path.join(__dirname, "ABCD - Sheet1.csv");
const OUTPUT_DIR = path.join(__dirname, "downloads");
const CONCURRENCY = 5;

function parseCSV(content) {
  return content
    .trim()
    .split("\n")
    .map((line) => {
      const [index, url] = line.split(",");
      return { index: index.trim(), url: url.trim() };
    });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", reject);
  });
}

async function downloadBatch(items) {
  for (const { index, url } of items) {
    const filename = `${index.padStart(3, "0")}.webp`;
    const filepath = path.join(OUTPUT_DIR, filename);

    try {
      await downloadFile(url, filepath);
      console.log(`✓ Downloaded: ${filename}`);
    } catch (err) {
      console.error(`✗ Failed ${filename}: ${err.message}`);
    }
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const content = fs.readFileSync(CSV_FILE, "utf-8");
  const items = parseCSV(content);

  console.log(`Found ${items.length} files to download\n`);

  // Split into batches for concurrent downloads
  const batches = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    batches.push(items.slice(i, i + CONCURRENCY));
  }

  for (const batch of batches) {
    await Promise.all(batch.map((item) => downloadBatch([item])));
  }

  console.log("\nDownload complete!");
}

main();

