const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");

const DOWNLOADS_DIR = path.join(__dirname, "downloads");
const OUTPUT_PDF = path.join(__dirname, "output.pdf");

function getImageFiles() {
  return fs
    .readdirSync(DOWNLOADS_DIR)
    .filter((f) => f.endsWith(".webp"))
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((f) => path.join(DOWNLOADS_DIR, f));
}

async function convertToPng(imagePath) {
  return sharp(imagePath).png().toBuffer();
}

async function main() {
  const images = getImageFiles();
  console.log(`Found ${images.length} images\n`);

  const pdfDoc = await PDFDocument.create();

  for (const imagePath of images) {
    const pngBuffer = await convertToPng(imagePath);
    const pngImage = await pdfDoc.embedPng(pngBuffer);

    const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pngImage.width,
      height: pngImage.height,
    });

    console.log(`✓ Added: ${path.basename(imagePath)}`);
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(OUTPUT_PDF, pdfBytes);

  console.log(`\nPDF created: ${OUTPUT_PDF}`);
}

main();

