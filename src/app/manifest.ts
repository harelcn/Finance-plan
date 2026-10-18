import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "תכנון פיננסי",
    short_name: "תכנון פיננסי",
    start_url: "/",
    display: "standalone",
    dir: "rtl",
    lang: "he",
    background_color: "#62b04f",
    theme_color: "#62b04f",
    icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
  };
}
