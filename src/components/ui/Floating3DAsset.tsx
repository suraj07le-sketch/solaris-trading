"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Cylinder, MeshDistortMaterial, Environment } from "@react-three/drei";
import { useRef } from "react";
import { useTheme } from "next-themes";
import { useInView } from "framer-motion";

function TokenMesh() {
    const meshRef = useRef<any>(null);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Cylinder ref={meshRef} args={[1, 1, 0.2, 32]} rotation={[Math.PI / 2, 0, 0]}>
                <MeshDistortMaterial
                    color={isDark ? "#fbbf24" : "#fbbf24"} // Amber-400 (Gold)
                    roughness={0.2}
                    metalness={0.8}
                    distort={0.1}
                    speed={1}
                />
            </Cylinder>
        </Float>
    );
}

export default function Floating3DAsset({ className }: { className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });

    return (
        <div ref={ref} className={`${className} aspect-square min-h-[150px] flex items-center justify-center`}>
            {isInView && (
                <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 1.5]}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <TokenMesh />
                    <Environment preset="city" />
                </Canvas>
            )}
        </div>
    );
}
