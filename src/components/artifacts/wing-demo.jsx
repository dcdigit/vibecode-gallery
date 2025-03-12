import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Wing({ pivotPosition, wingOffset, rotationDirection, tiltAngle }) {
  const wingGroupRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = 0.7 * Math.sin(9 * t);
    if (wingGroupRef.current) {
      wingGroupRef.current.rotation.z = angle * rotationDirection;
    }
  });

  return (
    // Outer group positions the wing at its pivot and applies a static tilt
    <group position={pivotPosition} rotation={[0, tiltAngle, 0]}>
      {/* Inner group handles the animated flapping */}
      <group ref={wingGroupRef}>
        <mesh position={wingOffset}>
          {/* Thinner wing geometry */}
          <boxGeometry args={[1, 0.02, 0.8]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </group>
    </group>
  );
}

function Body() {
  return (
    // Using a sphere geometry scaled along the Z axis creates an elongated ellipse.
    <mesh position={[0, 0, 0]} scale={[0.5, 0.6, 1.8]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas 
      camera={{ position: [-1, 1, 3] }}
      style={{ width: '800px', height: '400px' }} // Set viewport dimensions here
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <Body />

      {/* Left wing: pivot at [-0.5, 0, 0], with a slight tilt (angled back) */}
      <Wing 
        pivotPosition={[-0.2, 0, 0]} 
        wingOffset={[-0.5, -0.05, 0.2]} 
        rotationDirection={1}
        tiltAngle={0.2}
      />

      {/* Right wing: pivot at [0.5, 0, 0], with the mirrored tilt */}
      <Wing 
        pivotPosition={[0.2, 0, 0]} 
        wingOffset={[0.5, 0.05, 0.2]} 
        rotationDirection={-1}
        tiltAngle={-0.2}
      />

      <OrbitControls />
    </Canvas>
  );
}