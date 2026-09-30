import { downloadFile } from "https://esm.sh/@huggingface/hub@0.20.1";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = "./TranslatePsy-AfriNano";
const FILES = [
  "en-xx/Base/intgemm/model.intgemm.alphas.bin",
  "en-xx/Base/intgemm/vocab.spm",
  "xx-en/Base/intgemm/model.intgemm.alphas.bin",
  "xx-en/Base/intgemm/vocab.spm",
];

async function download() {
  for (const file of FILES) {
    const dest = path.join(ROOT, file);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    try {
      await fs.access(dest);
      console.log(`Already exists: ${file}`);
      continue;
    } catch {}
    console.log(`Downloading: ${file}`);
    const url = `https://huggingface.co/qvac/TranslatePsy-AfriNano/resolve/main/${file}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${file} (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(dest, buf);
    console.log(`Saved: ${dest} (${buf.length} bytes)`);
  }
  console.log("All models downloaded.");
}

download().catch((err) => {
  console.error("Download failed:", err);
  process.exit(1);
});
