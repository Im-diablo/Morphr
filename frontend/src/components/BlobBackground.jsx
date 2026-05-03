import React from "react";
import { MeshDistortMaterial } from "@react-three/drei";
import useIsMobile from "../hooks/useIsMobile";

export default function BlobBackground() {
  const isMobile = useIsMobile();

  return (
    <>
      <mesh position={[-3, 1, -4]} scale={3}>
        <sphereGeometry args={[1, isMobile ? 24 : 64, isMobile ? 24 : 64]} />
        <MeshDistortMaterial
          color="#FFD700"
          transparent
          opacity={0.08}
          distort={0.4}
          speed={1.5}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[3, -1, -5]} scale={2.5}>
        <sphereGeometry args={[1, isMobile ? 24 : 64, isMobile ? 24 : 64]} />
        <MeshDistortMaterial
          color="#F59E0B"
          transparent
          opacity={0.05}
          distort={0.6}
          speed={2}
          roughness={0.3}
        />
      </mesh>
    </>
  );
}
