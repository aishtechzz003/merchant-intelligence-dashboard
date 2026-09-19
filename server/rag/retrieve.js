const fs = require("fs");
const path = require("path");

function retrieveKnowledge(question) {
  const filePath = path.join(
    __dirname,
    "knowledge",
    "payment-failures.txt"
  );

  const knowledge = fs.readFileSync(filePath, "utf-8");

  const sections = knowledge.split("\n\n");

  const words = question.toLowerCase().split(/\s+/);

  const matches = sections.filter((section) => {
    const text = section.toLowerCase();

    return words.some((word) => {
      return word.length > 3 && text.includes(word);
    });
  });

  return matches.join("\n\n");
}

module.exports = retrieveKnowledge;