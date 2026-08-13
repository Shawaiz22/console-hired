import { extractText as unpdfExtract, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export class ExtractionError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

export async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  let text: string;
  try {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      text = (await unpdfExtract(pdf, { mergePages: true })).text;
    } else if (file.name.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer: Buffer.from(buffer) })).value;
    } else {
      throw new ExtractionError("UNSUPPORTED", "Only PDF and DOCX files are supported.");
    }
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError(
      "INVALID_FILE",
      "Failed to read file content. Please ensure the file is a valid, uncorrupted PDF or DOCX document."
    );
  }

  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length < 200) {
    throw new ExtractionError(
      "NO_TEXT_LAYER",
      "This PDF appears to be a scanned image. Please upload a text-based PDF exported from Word or Google Docs."
    );
  }

  return clean;
}
