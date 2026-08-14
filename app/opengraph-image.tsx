import { ImageResponse } from "next/og";

export const alt = "console.hired() — See what recruiters see before they do.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        backgroundColor: "#09090b",
        backgroundImage:
          "radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.18), transparent 40%), radial-gradient(circle at 85% 80%, rgba(59, 130, 246, 0.18), transparent 40%), radial-gradient(circle at 50% 50%, rgba(24, 24, 27, 0.6), transparent 70%)",
        padding: "64px 72px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#fafafa",
      }}
    >
      {/* Top bar: Brand + Live status badge */}
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: "#18181b",
              border: "1.5px solid #27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              fontFamily: "monospace",
              fontWeight: 800,
              fontSize: "24px",
            }}
          >
            {">_"}
          </div>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            console.hired()
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 18px",
            borderRadius: "9999px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            color: "#34d399",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
            }}
          />
          AI Recruitment Intelligence & Mock Prep
        </div>
      </div>

      {/* Center: Main Headline + Subheadline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "960px",
        }}
      >
        <h1
          style={{
            fontSize: "56px",
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: "-0.035em",
            margin: 0,
            backgroundImage: "linear-gradient(180deg, #ffffff 30%, #a1a1aa 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          See what recruiters see — before they do.
        </h1>
        <p
          style={{
            fontSize: "24px",
            lineHeight: 1.45,
            color: "#a1a1aa",
            margin: 0,
            fontWeight: 400,
          }}
        >
          Deterministic semantic evidence scoring, ATS layout diagnostics, and real-time AI mock
          interviews grounded in your exact resume.
        </p>
      </div>

      {/* Bottom Metrics/Features Pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            borderRadius: "12px",
            backgroundColor: "rgba(24, 24, 27, 0.8)",
            border: "1px solid #27272a",
            fontSize: "17px",
            fontWeight: 500,
            color: "#e4e4e7",
          }}
        >
          <span style={{ color: "#10b981", fontWeight: 800 }}>#</span>
          Vector Evidence Mapping
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            borderRadius: "12px",
            backgroundColor: "rgba(24, 24, 27, 0.8)",
            border: "1px solid #27272a",
            fontSize: "17px",
            fontWeight: 500,
            color: "#e4e4e7",
          }}
        >
          <span style={{ color: "#3b82f6", fontWeight: 800 }}>{"//"}</span>
          Sub-3s Live STAR Grading
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            borderRadius: "12px",
            backgroundColor: "rgba(24, 24, 27, 0.8)",
            border: "1px solid #27272a",
            fontSize: "17px",
            fontWeight: 500,
            color: "#e4e4e7",
          }}
        >
          <span style={{ color: "#10b981", fontWeight: 800 }}>&gt;</span>
          Explainable Match Scores
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
