import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DEWORLD — Minecraft-сообщество и форум",
    short_name: "DEWORLD",
    description: "Всё ещё Minecraft, просто лучше. Форум и сообщество DEWORLD.",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#f97316",
    lang: "ru",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
