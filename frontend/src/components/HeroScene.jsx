import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import useIsMobile from "../hooks/useIsMobile";

/**
 * Mouse-tracking parallax orb — follows cursor position for interactivity.
 */
function GoldOrb() {
  const meshRef = useRef();
  const { pointer } = useThree();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Smooth follow mouse
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      pointer.x * 0.5 + t * 0.1,
      0.05,
    );
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      pointer.y * 0.3 + Math.sin(t * 0.15) * 0.1,
      0.05,
    );
    // Subtle scale pulse
    const s = 1.8 + Math.sin(t * 0.5) * 0.05;
    meshRef.current.scale.setScalar(s);
  });

  return (
    <Float floatIntensity={0.4} rotationIntensity={0.05} speed={0.8}>
      <mesh ref={meshRef} scale={1.8}>
        <icosahedronGeometry args={[1, 6]} />
        <MeshDistortMaterial
          color="#FFD700"
          emissive="#B45309"
          emissiveIntensity={0.2}
          transparent
          opacity={0.2}
          distort={0.3}
          speed={1.2}
          roughness={0.2}
          metalness={0.95}
          wireframe
        />
      </mesh>
      {/* Solid inner core */}
      <mesh scale={1.2}>
        <icosahedronGeometry args={[1, 3]} />
        <MeshDistortMaterial
          color="#FFD700"
          emissive="#D97706"
          emissiveIntensity={0.15}
          transparent
          opacity={0.08}
          distort={0.4}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

function OrbitRings() {
  const group = useRef();
  const { pointer } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.z = t * 0.08;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        pointer.y * 0.15,
        0.03,
      );
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        pointer.x * 0.15,
        0.03,
      );
    }
  });

  return (
    <group ref={group}>
      {[2.2, 2.8, 3.5].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / (3 + i), Math.PI / (4 + i), 0]}>
          <torusGeometry args={[radius, 0.008, 16, 128]} />
          <meshStandardMaterial
            color="#FFD700"
            transparent
            opacity={0.15 - i * 0.03}
            metalness={1}
            roughness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingParticles() {
  const points = useRef();
  const count = 80;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#FFD700"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function AmbientBlobs() {
  const blob1 = useRef();
  const blob2 = useRef();
  const { pointer } = useThree();

  useFrame(() => {
    if (blob1.current) {
      blob1.current.position.x = THREE.MathUtils.lerp(
        blob1.current.position.x,
        -3.5 + pointer.x * 0.3,
        0.02,
      );
      blob1.current.position.y = THREE.MathUtils.lerp(
        blob1.current.position.y,
        1.5 + pointer.y * 0.2,
        0.02,
      );
    }
    if (blob2.current) {
      blob2.current.position.x = THREE.MathUtils.lerp(
        blob2.current.position.x,
        3.5 - pointer.x * 0.2,
        0.02,
      );
      blob2.current.position.y = THREE.MathUtils.lerp(
        blob2.current.position.y,
        -1.5 - pointer.y * 0.15,
        0.02,
      );
    }
  });

  return (
    <>
      <mesh ref={blob1} position={[-3.5, 1.5, -5]} scale={2.8}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color="#FFD700"
          transparent
          opacity={0.04}
          distort={0.5}
          speed={1}
        />
      </mesh>
      <mesh ref={blob2} position={[3.5, -1.5, -6]} scale={2.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color="#F59E0B"
          transparent
          opacity={0.03}
          distort={0.6}
          speed={1.5}
        />
      </mesh>
    </>
  );
}

export default function HeroScene() {
  const isMobile = useIsMobile();

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: true, alpha: true }}
      dpr={isMobile ? [1, 1] : [1, 1.5]}
    >
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 6, 22]} />

      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} color="#FFD700" intensity={1.5} />
      <pointLight position={[-5, -3, 3]} color="#F59E0B" intensity={0.6} />
      <pointLight position={[0, 3, 2]} color="#FEF3C7" intensity={0.3} />

      <Stars
        radius={isMobile ? 28 : 60}
        depth={isMobile ? 24 : 50}
        count={isMobile ? 500 : 2500}
        factor={isMobile ? 1 : 2}
        saturation={0.1}
        fade
      />
      <Sparkles
        count={isMobile ? 8 : 30}
        scale={10}
        size={1.2}
        speed={0.2}
        color="#FFD700"
      />

      <GoldOrb />
      {!isMobile && <OrbitRings />}
      <AmbientBlobs />
      {!isMobile && <FloatingParticles />}
    </Canvas>
  );
}
