import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "console.hired() — AI Resume Matcher & Interview Coach",
    short_name: "console.hired()",
    description:
      "See what recruiters see before they do. Deterministic semantic evidence scoring, ATS diagnostics, and real-time AI mock interviews.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
