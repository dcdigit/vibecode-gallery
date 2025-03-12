import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Wing({ pivotPosition, wingOffset, rotationDirection, tiltAngle, pausedRef, velocityRef, turningFactorRef }) {
  const wingGroupRef = useRef();

  useFrame(({ clock }) => {
    if (pausedRef && pausedRef.current) return;

    const t = clock.getElapsedTime();
    // Calculate current flight speed.
    const flightSpeed = velocityRef.current.length();
    // Base flapping frequency is low; the turning multiplier increases it when turning.
    const baseFrequency = 3;
    const speedFactor = 1 + flightSpeed * 0.3;
    const turningMultiplier = turningFactorRef.current || 1;
    const angle = 0.7 * Math.sin(baseFrequency * t * speedFactor * turningMultiplier);
    if (wingGroupRef.current) {
      wingGroupRef.current.rotation.z = angle * rotationDirection;
    }
  });

  return (
    <group position={pivotPosition} rotation={[0, tiltAngle, 0]}>
      <group ref={wingGroupRef}>
        <mesh position={wingOffset}>
          <boxGeometry args={[1, 0.02, 0.8]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </group>
    </group>
  );
}

function Body() {
  return (
    <mesh position={[0, 0, 0]} scale={[0.5, 0.6, 1.8]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
}

function FlyingObject() {
  const objectRef = useRef();
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const flightStateRef = useRef({
    target: new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      Math.random() * 5,
      (Math.random() - 0.5) * 10
    ),
    isPaused: false,
    pauseTimer: 0,
  });
  const pausedRef = useRef(false);
  // Store the velocity from the previous frame.
  const lastVelocityRef = useRef(new THREE.Vector3(0, 0, 0));
  // A multiplier for wing flap speed when turning.
  const turningFactorRef = useRef(1);

  useFrame((state, delta) => {
    const flightState = flightStateRef.current;
    const velocity = velocityRef.current;
    const pos = objectRef.current.position;

    pausedRef.current = flightState.isPaused;

    // Pause logic.
    if (flightState.isPaused) {
      flightState.pauseTimer -= delta;
      if (flightState.pauseTimer <= 0) {
        flightState.isPaused = false;
        flightState.target.set(
          (Math.random() - 0.5) * 10,
          Math.random() * 5,
          (Math.random() - 0.5) * 10
        );
      }
    } else {
      const direction = new THREE.Vector3().subVectors(flightState.target, pos);
      const distance = direction.length();
      if (distance < 0.2) {
        flightState.isPaused = true;
        flightState.pauseTimer = Math.random() * 0.2 + 0.1;
      }
    }

    // Set a higher maximum speed.
    const maxSpeed = 6;
    let targetVelocity;
    if (flightState.isPaused) {
      targetVelocity = new THREE.Vector3(0, 0, 0);
    } else {
      const direction = new THREE.Vector3().subVectors(flightState.target, pos);
      const distance = direction.length();
      if (distance > 0) direction.normalize();
      const desiredSpeed = Math.min(distance, maxSpeed);
      targetVelocity = direction.multiplyScalar(desiredSpeed);
    }

    // Faster acceleration.
    const lerpFactor = 0.5 * delta;
    velocity.lerp(targetVelocity, lerpFactor);
    
    // Update the bird's position.
    pos.add(velocity.clone().multiplyScalar(delta));

    // Determine turning: compare the current velocity with the previous frame.
    if (velocity.length() > 0.001 && lastVelocityRef.current.length() > 0.001) {
      const angleDiff = lastVelocityRef.current.angleTo(velocity);
      // Set turning multiplier: 3x for strong turns, 2x for moderate turns.
      let turningMultiplier = 1;
      if (angleDiff > 0.3) turningMultiplier = 3;
      else if (angleDiff > 0.1) turningMultiplier = 2;
      turningFactorRef.current = turningMultiplier;
    } else {
      turningFactorRef.current = 1;
    }
    // Update last velocity for the next frame.
    lastVelocityRef.current.copy(velocity);

    // Adjust orientation based on velocity.
    if (velocity.length() > 0.001) {
      const lookTarget = new THREE.Vector3().addVectors(pos, velocity);
      objectRef.current.lookAt(lookTarget);
      objectRef.current.rotateY(Math.PI);
    }
  });

  return (
    <group ref={objectRef}>
      <Body />
      <Wing 
        pivotPosition={[-0.2, 0, 0]} 
        wingOffset={[-0.5, -0.05, 0.2]} 
        rotationDirection={1}
        tiltAngle={0.2}
        pausedRef={pausedRef}
        velocityRef={velocityRef}
        turningFactorRef={turningFactorRef}
      />
      <Wing 
        pivotPosition={[0.2, 0, 0]} 
        wingOffset={[0.5, 0.05, 0.2]} 
        rotationDirection={-1}
        tiltAngle={-0.2}
        pausedRef={pausedRef}
        velocityRef={velocityRef}
        turningFactorRef={turningFactorRef}
      />
    </group>
  );
}

export default function App() {
  return (
    <Canvas 
      camera={{ position: [-1, 1, 5] }}
      style={{ width: '800px', height: '400px' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <FlyingObject />
      <OrbitControls />
    </Canvas>
  );
}