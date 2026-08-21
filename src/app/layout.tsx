import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ProgressProvider } from "@/providers/progress-provider";

export const metadata: Metadata = {
  title: "宝宝学数字",
  description: "适合 3 岁儿童的 1～100 数字启蒙网站",
  applicationName: "宝宝学数字",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "宝宝学数字"
  },
  formatDetection: { telephone: false },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#75d8ff"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <ProgressProvider>
          <div className="site-frame">{children}</div>
          <ServiceWorkerRegister />
        </ProgressProvider>
      </body>
    </html>
  );
}
