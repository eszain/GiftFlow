'use client';

import { useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, Mesh } from 'three';
import * as THREE from 'three';

interface ShibaModelProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}

export default function ShibaModel({ 
  position = [0, 0, 0], 
  scale = [1, 1, 1], 
  rotation = [0, 0, 0] 
}: ShibaModelProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Load the GLB model
  const { scene, animations } = useGLTF('/shiba.glb');
  
  // Get animations if available
  const { actions } = useAnimations(animations, groupRef);
  
  // Add some floating animation
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating motion
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      // Keep rotation fixed (no animation)
      groupRef.current.rotation.y = rotation[1];
      
      // Scale animation on hover
      const targetScale = hovered ? 1.1 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(scale[0] * targetScale, scale[1] * targetScale, scale[2] * targetScale),
        0.1
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={scene} />
    </group>
  );
}

// Preload the model for better performance
useGLTF.preload('/shiba.glb');
