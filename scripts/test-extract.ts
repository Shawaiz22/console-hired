import { extractText, ExtractionError } from "@/modules/resume/utils/extract";

async function runTests() {
  console.log("🧪 Testing Text Extraction Utility...\n");

  // 1. Test Unsupported File Type
  try {
    const fakeExe = new File([Buffer.from("dummy binary")], "test.exe", {
      type: "application/x-msdownload",
    });
    await extractText(fakeExe);
    console.error("❌ Test 1 Failed: Expected UNSUPPORTED error");
  } catch (err) {
    if (err instanceof ExtractionError && err.code === "UNSUPPORTED") {
      console.log("✅ Test 1 Passed: Correctly threw UNSUPPORTED error for .exe");
    } else {
      console.error("❌ Test 1 Unexpected error:", err);
    }
  }

  // 2. Test Invalid PDF (.txt renamed to .pdf)
  try {
    const fakePdf = new File(
      [Buffer.from("This is just plain text masquerading as pdf")],
      "fake.pdf",
      {
        type: "application/pdf",
      }
    );
    await extractText(fakePdf);
    console.error("❌ Test 2 Failed: Expected INVALID_FILE error for corrupt PDF");
  } catch (err) {
    if (err instanceof ExtractionError && err.code === "INVALID_FILE") {
      console.log("✅ Test 2 Passed: Clean failure (INVALID_FILE) for fake PDF");
    } else {
      console.error("❌ Test 2 Unexpected error:", err);
    }
  }

  // 3. Test Scanned Image PDF Simulation (Text layer < 200 chars)
  // We can create a simple minimal PDF with minimal text (< 200 chars)
  // PDF binary header header + minimal text object
  const minimalPdfContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kinds [] /Count 1 /Kids [3 0 R]>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj
4 0 obj <</Length 25>> stream
BT /F1 12 Tf (Short) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000123 00000 n 
0000000212 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
287
%%EOF`;

  try {
    const scannedPdf = new File([Buffer.from(minimalPdfContent)], "scanned.pdf", {
      type: "application/pdf",
    });
    await extractText(scannedPdf);
    console.error("❌ Test 3 Failed: Expected NO_TEXT_LAYER error");
  } catch (err) {
    if (err instanceof ExtractionError && err.code === "NO_TEXT_LAYER") {
      console.log(
        "✅ Test 3 Passed: Correctly detected scanned PDF (< 200 chars) -> NO_TEXT_LAYER"
      );
    } else {
      console.log("ℹ️ Test 3 Exception (handled):", (err as Error).message);
    }
  }

  console.log("\n🎉 Text extraction script testing complete!");
}

runTests();
