import React from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Float, Environment, OrbitControls } from "@react-three/drei";
import BlobBackground from "./BlobBackground";
import LoadingOrb from "./LoadingOrb";
import useIsMobile from "../hooks/useIsMobile";

export default function Scene({ step }) {
  const isMobile = useIsMobile();

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 70 }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
      gl={{ antialias: true, alpha: true }}
      dpr={isMobile ? [1, 1] : [1, 1.5]}
    >
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 8, 25]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} color="#FFD700" intensity={1.5} />
      <pointLight position={[-5, -5, 3]} color="#F59E0B" intensity={0.8} />

      <Stars
        radius={isMobile ? 35 : 80}
        depth={isMobile ? 30 : 60}
        count={isMobile ? 700 : 4000}
        factor={isMobile ? 1.2 : 3}
        saturation={0.2}
        fade
      />
      {!isMobile && <Environment preset="city" />}

      <Float
        floatIntensity={isMobile ? 0.12 : 0.3}
        rotationIntensity={0.05}
        speed={1}
      >
        <BlobBackground />
      </Float>

      <LoadingOrb visible={step === 3} mobile={isMobile} />

      {!isMobile && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.15}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 2.5}
        />
      )}
    </Canvas>
  );
}
