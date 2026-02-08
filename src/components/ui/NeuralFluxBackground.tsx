"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useTheme } from "next-themes";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useRef, useMemo } from "react";
import * as random from "maath/random";

function Particles(props: any) {
    const ref = useRef<any>(null);
    const { theme } = useTheme();
    const { tier } = usePerformanceTier();
    const isDark = theme === "dark";

    const particleCount = tier === "low" ? 1000 : 5000;

    // Generate random points in a sphere
    const sphere = useMemo(() => random.inSphere(new Float32Array(particleCount * 3), { radius: 1.5 }), [particleCount]);

    useFrame((state, delta) => {
        if (ref.current) {
            // Throttle rotation on low tier
            const speed = tier === "low" ? 0.5 : 1;
            ref.current.rotation.x -= (delta / 10) * speed;
            ref.current.rotation.y -= (delta / 15) * speed;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color={isDark ? "#ffffff" : "#000000"}
                    size={0.005}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.4}
                />
            </Points>
        </group>
    );
}

export default function NeuralFluxBackground() {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-60">
            <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
                <Particles />
            </Canvas>
        </div>
    );
}
