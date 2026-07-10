import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Project Aesthetic",
    short_name: "Aesthetic",
    description: "Your personal fitness coach — training, nutrition, progress.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a09",
    theme_color: "#0a0a09",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    // long-press the app icon → jump straight into the action
    shortcuts: [
      { name: "Start Workout", url: "/workout", icons: [{ src: "/icon", sizes: "512x512" }] },
      { name: "Log Food", url: "/nutrition", icons: [{ src: "/icon", sizes: "512x512" }] },
      { name: "Progress Photos", url: "/photos", icons: [{ src: "/icon", sizes: "512x512" }] },
    ],
  };
}
