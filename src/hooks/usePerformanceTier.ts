"use client";

import { useState, useEffect } from "react";

export type PerformanceTier = "high" | "low";

export function usePerformanceTier() {
    const [tier, setTier] = useState<PerformanceTier>("high");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detect Mobile
        const checkMobile = () => {
            const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
            const mobile = Boolean(
                userAgent.match(
                    /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
                )
            );
            setIsMobile(mobile);
            return mobile;
        };

        const mobile = checkMobile();

        // Detect Low Power / Hardware Concurrency
        const concurrency = navigator.hardwareConcurrency || 4;
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Simple heuristic: Mobile or low core count or high pixel ratio (often throttles) = low tier
        if (mobile || concurrency < 4 || (mobile && devicePixelRatio > 2)) {
            setTier("low");
        } else {
            setTier("high");
        }

    }, []);

    return { tier, isMobile };
}
