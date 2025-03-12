import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

const NUM_BIRDS = 100;
const BOUNDS = 50;

function Bird({ boid }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      // Update position
      meshRef.current.position.copy(boid.position);
      // Point the cone in the direction of travel. Note:
      // Three.js cones by default point along the Y axis.
      if (boid.velocity.lengthSq() > 0.001) {
        meshRef.current.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          boid.velocity.clone().normalize()
        );
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.5, 1.5, 6]} />
      <meshStandardMaterial color={boid.color} />
    </mesh>
  );
}

function Flock() {
  // Flocking parameters
  const neighborDist = 10;
  const separationDist = 2;
  const alignmentFactor = 0.05;
  const cohesionFactor = 0.01;
  const separationFactor = 0.1;
  const maxSpeed = 1.0;

  // Initialize boids with random positions, velocities, and blue color variations.
  const boids = useMemo(() => {
    return Array.from({ length: NUM_BIRDS }, () => {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * BOUNDS,
        (Math.random() - 0.5) * BOUNDS,
        (Math.random() - 0.5) * BOUNDS
      );
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      );
      // Generate a blue color variation. Hue between 200° and 240°.
      const h = 200 / 360 + Math.random() * (40 / 360);
      const s = 0.8;
      const l = 0.5;
      const color = new THREE.Color().setHSL(h, s, l).getStyle();
      return { position, velocity, color };
    });
  }, []);

  useFrame(() => {
    boids.forEach((boid) => {
      let alignment = new THREE.Vector3();
      let cohesion = new THREE.Vector3();
      let separation = new THREE.Vector3();
      let count = 0;

      boids.forEach((other) => {
        if (boid === other) return;
        const distance = boid.position.distanceTo(other.position);
        if (distance < neighborDist) {
          alignment.add(other.velocity); // For alignment
          cohesion.add(other.position);  // For cohesion
          count++;
        }
        if (distance < separationDist) {
          let diff = boid.position.clone().sub(other.position);
          diff.normalize();
          diff.divideScalar(distance); // Weight by closeness
          separation.add(diff);
        }
      });

      if (count > 0) {
        alignment.divideScalar(count);
        alignment.sub(boid.velocity);
        alignment.multiplyScalar(alignmentFactor);

        cohesion.divideScalar(count);
        cohesion.sub(boid.position);
        cohesion.multiplyScalar(cohesionFactor);
      }

      separation.multiplyScalar(separationFactor);

      // Apply the flocking forces
      boid.velocity.add(alignment);
      boid.velocity.add(cohesion);
      boid.velocity.add(separation);

      // Limit speed
      if (boid.velocity.length() > maxSpeed) {
        boid.velocity.setLength(maxSpeed);
      }

      // Update position
      boid.position.add(boid.velocity);

      // Bounce off boundaries
      if (Math.abs(boid.position.x) > BOUNDS) boid.velocity.x *= -1;
      if (Math.abs(boid.position.y) > BOUNDS) boid.velocity.y *= -1;
      if (Math.abs(boid.position.z) > BOUNDS) boid.velocity.z *= -1;
    });
  });

  return (
    <>
      {boids.map((boid, index) => (
        <Bird key={index} boid={boid} />
      ))}
    </>
  );
}

export default function FlockSimulation() {
  return (
    <Canvas
      camera={{ position: [0, 0, 80], fov: 75 }}
      style={{ width: '600px', height: '400px', background: '#e0f7ff' }} // Smaller viewport with a brighter background
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[100, 100, 100]} />
      <Flock />
      <OrbitControls />
    </Canvas>
  );
}