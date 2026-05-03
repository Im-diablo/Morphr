import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sparkles } from "@react-three/drei";

export default function LoadingOrb({ visible = false, mobile = false }) {
  const meshRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.3;
      meshRef.current.rotation.y = t * 0.5;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(t * 2) * 0.5;
    }
  });

  if (!visible) return null;

  return (
    <group position={[0, 0, 2]}>
      <mesh ref={meshRef} scale={0.6}>
        <torusKnotGeometry
          args={[1, 0.3, mobile ? 48 : 128, mobile ? 16 : 32]}
        />
        <MeshDistortMaterial
          color="#FFD700"
          emissive="#D97706"
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
          distort={0.3}
          speed={3}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      <Sparkles
        count={mobile ? 16 : 60}
        scale={3}
        size={2}
        speed={0.4}
        color="#FFD700"
      />
      <pointLight
        ref={lightRef}
        color="#FFD700"
        intensity={1.5}
        distance={6}
        position={[0, 0, 1]}
      />
    </group>
  );
}
