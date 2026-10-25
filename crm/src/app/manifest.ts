import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

// Makes the app installable: on your phone, open it in the browser and choose
// "Add to Home Screen". It then opens full-screen like a normal app.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("app");
  return {
    name: t("name"),
    short_name: t("name"),
    description: t("description"),
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#3550b4",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
