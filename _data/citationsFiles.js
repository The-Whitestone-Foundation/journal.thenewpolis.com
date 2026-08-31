import fs from "fs";
import path from "path";

// Returns citation paths below public/citations.
export default function() {
  const citationsDir = path.join(process.cwd(), "public", "citations");
  try {
    const files = fs.readdirSync(citationsDir, { recursive: true })
      .map(String)
      .filter(f => f.endsWith('.ris') || f.endsWith('.csl.json'))
      .map(f => f.replaceAll(path.sep, "/"))
      .sort();
    return files;
  } catch(e) {
    return [];
  }
}
