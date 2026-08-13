/**
 * @jest-environment node
 */

import { extractText, ExtractionError } from "@/modules/resume/utils/extract";

describe("Text Extraction Utility Suite", () => {
  it("throws UNSUPPORTED for unsupported file extensions", async () => {
    const file = new File([Buffer.from("hello")], "test.png", { type: "image/png" });
    await expect(extractText(file)).rejects.toThrow(ExtractionError);
    await expect(extractText(file)).rejects.toHaveProperty("code", "UNSUPPORTED");
  });

  it("throws INVALID_FILE for corrupted PDF files without crashing", async () => {
    const file = new File([Buffer.from("not a pdf")], "test.pdf", { type: "application/pdf" });
    await expect(extractText(file)).rejects.toThrow(ExtractionError);
    await expect(extractText(file)).rejects.toHaveProperty("code", "INVALID_FILE");
  });
});
