"use client";

import { useEffect } from "react";

const SERVICE_WORKER_VERSION = "v8-local-audio";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let reloading = false;

    const handleControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    const activateWaitingWorker = (registration: ServiceWorkerRegistration) => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `/sw.js?v=${SERVICE_WORKER_VERSION}`,
          { scope: "/", updateViaCache: "none" }
        );

        activateWaitingWorker(registration);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") {
              activateWaitingWorker(registration);
            }
          });
        });

        await registration.update();
      } catch {
        // Service Worker 失败不应影响朗读和学习功能。
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
