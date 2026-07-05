import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Project Aesthetic",
    short_name: "Aesthetic",
    description: "Your personal fitness coach — training, nutrition, progress.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08080c",
    theme_color: "#08080c",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
