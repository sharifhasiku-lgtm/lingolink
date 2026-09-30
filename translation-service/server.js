import express from "express";
import path from "node:path";
import { loadModel, translate, unloadModel } from "@qvac/sdk";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SHARED_SECRET = process.env.TRANSLATION_SHARED_SECRET || "change-me";
const MODEL_ROOT = process.env.MODEL_ROOT || "./TranslatePsy-AfriNano";

// Cache loaded models by direction+language
const loadedModels = new Map();

// NLLB language codes to QVAC tags
const TARGET_TAGS = {
  "swh_Latn": "##SW", "som_Latn": "##SO", "yor_Latn": "##YO",
  "hau_Latn": "##HA", "ibo_Latn": "##IG", "zul_Latn": "##ZU",
  "amh_Ethi": "##AM", "lin_Latn": "##LN"
};

const SOURCE_CODES = {
  "swh_Latn": "sw", "som_Latn": "so", "yor_Latn": "yo",
  "hau_Latn": "ha", "ibo_Latn": "ig", "zul_Latn": "zu",
  "amh_Ethi": "am", "lin_Latn": "ln", "eng_Latn": "en"
};

async function getModel(direction, from, to) {
  const key = `${direction}:${from}:${to}`;
  if (loadedModels.has(key)) {
    return loadedModels.get(key);
  }

  const modelDir = path.join(MODEL_ROOT, direction, "Base", "intgemm");
  console.log(`Loading model: ${modelDir} (from=${from}, to=${to})`);

  const modelId = await loadModel({
    modelSrc: path.join(modelDir, "model.intgemm.alphas.bin"),
    modelType: "nmt",
    modelConfig: {
      engine: "Bergamot",
      from,
      to,
      srcVocabSrc: path.join(modelDir, "vocab.spm"),
      dstVocabSrc: path.join(modelDir, "vocab.spm"),
    },
  });

  loadedModels.set(key, modelId);
  console.log(`Model loaded: ${modelId}`);
  return modelId;
}

app.post("/translate", async (req, res) => {
  try {
    const authHeader = req.headers["x-shared-secret"];
    if (authHeader !== SHARED_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { text, source_lang, target_lang } = req.body;
    if (!text || !source_lang || !target_lang) {
      return res.status(400).json({ error: "Missing text, source_lang, or target_lang" });
    }

    const srcCode = SOURCE_CODES[source_lang] || "en";
    const targetTag = TARGET_TAGS[target_lang];

    let direction, from, to, modelId, inputText;

    if (srcCode === "en" && targetTag) {
      direction = "en-xx";
      from = "en";
      to = targetTag.replace("##", "").toLowerCase();
      inputText = `${targetTag} ${text}`;
    } else if (srcCode !== "en" && target_lang === "eng_Latn") {
      direction = "xx-en";
      from = srcCode;
      to = "en";
      inputText = text;
    } else {
      return res.status(400).json({
        error: `Unsupported pair: ${source_lang} -> ${target_lang}. Only English <-> African languages supported.`
      });
    }

    modelId = await getModel(direction, from, to);

    const { text: out } = translate({
      modelId,
      text: inputText,
      modelType: "nmt",
      stream: false,
    });

    const translated = (await out).trim();

    res.json({
      translated_text: translated,
      source_text: text,
      source_lang,
      target_lang,
    });

  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", models_loaded: loadedModels.size });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Translation service listening on port ${PORT}`);
});
