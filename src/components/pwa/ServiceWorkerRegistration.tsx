"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("SW registered:", registration.scope);

                    // Proactively check for notification permission
                    if ("Notification" in window && Notification.permission === "default") {
                        console.log("[SW] Prompting for notification permission...");
                        Notification.requestPermission().then(permission => {
                            console.log(`[SW] Notification permission: ${permission}`);
                        });
                    }
                })
                .catch((error) => {
                    console.log("SW registration failed:", error);
                });
        }
    }, []);

    return null;
}
