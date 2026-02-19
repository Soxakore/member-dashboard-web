import path from "path";
import fs from "fs";

const MODEL_DIR = path.join(process.cwd(), "models");
const MODEL_PATH = path.join(MODEL_DIR, "captcha_model.onnx");
const METADATA_PATH = path.join(MODEL_DIR, "captcha_model_metadata.json");

interface CaptchaMetadata {
  input_shape: number[];
  output_positions: number;
  num_classes: number;
  chars: string;
  idx_to_char: Record<string, string>;
  normalization: { mean: number[]; std: number[] };
}

let metadata: CaptchaMetadata | null = null;
let onnxSession: any = null;

function loadMetadata(): CaptchaMetadata {
  if (!metadata) {
    metadata = JSON.parse(fs.readFileSync(METADATA_PATH, "utf-8"));
  }
  return metadata!;
}

async function getSession() {
  if (!onnxSession) {
    const ort = await import("onnxruntime-node");
    onnxSession = await ort.InferenceSession.create(MODEL_PATH);
  }
  return onnxSession;
}

/**
 * Solve a captcha image using the ONNX neural network model
 * @param imageBase64 - Base64 encoded captcha image (PNG/JPEG)
 * @returns 4-character captcha text + confidence, or null on failure
 */
export async function solveCaptcha(
  imageBase64: string
): Promise<{ text: string; confidence: number } | null> {
  try {
    const meta = loadMetadata();
    const ort = await import("onnxruntime-node");
    const sharp = (await import("sharp")).default;

    const imgBuffer = Buffer.from(imageBase64, "base64");

    // Resize to expected dimensions (150w x 40h), convert to grayscale
    const height = meta.input_shape[1]; // 40
    const width = meta.input_shape[2]; // 150

    const rawPixels = await sharp(imgBuffer)
      .greyscale()
      .resize(width, height, { fit: "fill" })
      .raw()
      .toBuffer();

    // Normalize: (pixel/255 - mean) / std = (pixel/255 - 0.5) / 0.5
    const floatData = new Float32Array(height * width);
    for (let i = 0; i < rawPixels.length; i++) {
      floatData[i] = (rawPixels[i] / 255.0 - meta.normalization.mean[0]) / meta.normalization.std[0];
    }

    // Shape: [1, 1, 40, 150] (batch, channels, height, width)
    const inputTensor = new ort.Tensor("float32", floatData, [1, 1, height, width]);
    const session = await getSession();
    const inputName = session.inputNames[0];
    const results = await session.run({ [inputName]: inputTensor });

    // Decode 4 character positions
    const outputNames = session.outputNames;
    let text = "";
    let totalConfidence = 0;

    for (let pos = 0; pos < meta.output_positions; pos++) {
      const probs = results[outputNames[pos]].data as Float32Array;
      let maxIdx = 0;
      let maxVal = probs[0];
      for (let j = 1; j < probs.length; j++) {
        if (probs[j] > maxVal) {
          maxVal = probs[j];
          maxIdx = j;
        }
      }
      const char = meta.idx_to_char[String(maxIdx)];
      if (!char) return null;
      text += char;
      totalConfidence += maxVal;
    }

    const avgConfidence = totalConfidence / meta.output_positions;

    if (text.length !== 4) return null;

    return { text, confidence: avgConfidence };
  } catch (error) {
    console.error("Captcha solver error:", error);
    return null;
  }
}
