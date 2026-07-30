import type { MetadataRoute } from "next";

// Next bu rotayi /manifest.webmanifest olarak sunar ve <link rel="manifest">
// etiketini otomatik ekler. Ikon SVG'dir (app/icon.svg -> /icon.svg).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tare — Coffee equipment",
    short_name: "Tare",
    description:
      "Grinders, brewers, kettles and scales. The equipment a repeatable cup needs.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FBFAF8",
    theme_color: "#14201B",
    categories: ["shopping", "food"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
