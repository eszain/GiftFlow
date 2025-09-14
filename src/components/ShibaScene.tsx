'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import ShibaModel from './ShibaModel';

interface ShibaSceneProps {
  className?: string;
  mousePosition?: { x: number; y: number };
}

export default function ShibaScene({ className = '', mousePosition = { x: 0, y: 0 } }: ShibaSceneProps) {
  return (
    <div className={`w-full h-full ${className}`}>
        <Canvas
          camera={{ 
            position: [ 2, 1, 5], 
            fov: 50 
          }}
          style={{ background: 'transparent' }}
        >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 5, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Environment */}
        <Environment preset="sunset" />
        
        {/* Shiba Model */}
        <ShibaModel 
          position={[0, 1, 0]} 
          scale={[1.33, 1.33, 1.33]}
          rotation={[0, Math.PI * 0.1 + mousePosition.x * 0.5, mousePosition.y * 0.3]}
        />
        
        {/* Contact Shadows */}
        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.3} 
          scale={10} 
          blur={2} 
          far={4.5} 
        />
        
        {/* Controls */}
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
