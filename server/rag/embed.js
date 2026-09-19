const fs = require("fs");
const path = require("path");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

async function createChunks() {
  const filePath = path.join(
    __dirname,
    "knowledge",
    "payment-failures.txt"
  );

  const text = fs.readFileSync(filePath, "utf-8");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
  });

  const chunks = await splitter.createDocuments([text]);

  console.log("Total chunks:", chunks.length);

  chunks.forEach((chunk, index) => {
    console.log(`\n--- Chunk ${index + 1} ---`);
    console.log(chunk.pageContent);
  });
}

createChunks();