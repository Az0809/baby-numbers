import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "宝宝学数字",
    short_name: "学数字",
    description: "适合 3 岁儿童的 1～100 数字启蒙网站",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#effaff",
    theme_color: "#75d8ff",
    lang: "zh-CN",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
