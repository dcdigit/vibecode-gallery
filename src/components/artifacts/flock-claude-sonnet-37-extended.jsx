import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Boid class for individual bird behavior
class Boid {
  constructor(scene, bounds) {
    // Create a simple bird geometry
    const geometry = new THREE.ConeGeometry(1, 4, 8);
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(
        0.4 + Math.random() * 0.2,
        0.4 + Math.random() * 0.2,
        0.7 + Math.random() * 0.3
      )
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.scale.set(0.5, 0.5, 0.5);
    scene.add(this.mesh);
    
    // Initialize position within bounds
    this.position = new THREE.Vector3(
      (Math.random() - 0.5) * bounds.x,
      (Math.random() - 0.5) * bounds.y,
      (Math.random() - 0.5) * bounds.z
    );
    
    // Random initial velocity
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    
    this.acceleration = new THREE.Vector3();
    this.maxSpeed = 2;
    this.maxForce = 0.03;
    this.bounds = bounds;
    
    // Update mesh position
    this.mesh.position.copy(this.position);
  }
  
  // Calculate steering force to align with neighbors
  align(boids, perceptionRadius) {
    const steering = new THREE.Vector3();
    let total = 0;
    
    for (const other of boids) {
      if (other !== this) {
        const d = this.position.distanceTo(other.position);
        if (d < perceptionRadius) {
          steering.add(other.velocity);
          total++;
        }
      }
    }
    
    if (total > 0) {
      steering.divideScalar(total);
      steering.normalize();
      steering.multiplyScalar(this.maxSpeed);
      steering.sub(this.velocity);
      steering.clampLength(0, this.maxForce);
    }
    
    return steering;
  }
  
  // Calculate steering force towards center of mass of neighbors
  cohesion(boids, perceptionRadius) {
    const steering = new THREE.Vector3();
    let total = 0;
    
    for (const other of boids) {
      if (other !== this) {
        const d = this.position.distanceTo(other.position);
        if (d < perceptionRadius) {
          steering.add(other.position);
          total++;
        }
      }
    }
    
    if (total > 0) {
      steering.divideScalar(total);
      steering.sub(this.position);
      steering.normalize();
      steering.multiplyScalar(this.maxSpeed);
      steering.sub(this.velocity);
      steering.clampLength(0, this.maxForce);
    }
    
    return steering;
  }
  
  // Calculate steering force to avoid collisions
  separation(boids, perceptionRadius) {
    const steering = new THREE.Vector3();
    let total = 0;
    
    for (const other of boids) {
      if (other !== this) {
        const d = this.position.distanceTo(other.position);
        if (d < perceptionRadius && d > 0) {
          const diff = new THREE.Vector3().subVectors(this.position, other.position);
          diff.divideScalar(d * d); // Weight by distance
          steering.add(diff);
          total++;
        }
      }
    }
    
    if (total > 0) {
      steering.divideScalar(total);
      steering.normalize();
      steering.multiplyScalar(this.maxSpeed);
      steering.sub(this.velocity);
      steering.clampLength(0, this.maxForce);
    }
    
    return steering;
  }
  
  // Stay within bounds
  boundaries() {
    const steering = new THREE.Vector3();
    const margin = 2;
    const halfBounds = {
      x: this.bounds.x / 2,
      y: this.bounds.y / 2,
      z: this.bounds.z / 2
    };
    
    if (this.position.x < -halfBounds.x + margin) {
      steering.x = 1;
    } else if (this.position.x > halfBounds.x - margin) {
      steering.x = -1;
    }
    
    if (this.position.y < -halfBounds.y + margin) {
      steering.y = 1;
    } else if (this.position.y > halfBounds.y - margin) {
      steering.y = -1;
    }
    
    if (this.position.z < -halfBounds.z + margin) {
      steering.z = 1;
    } else if (this.position.z > halfBounds.z - margin) {
      steering.z = -1;
    }
    
    if (steering.length() > 0) {
      steering.normalize();
      steering.multiplyScalar(this.maxSpeed);
      steering.sub(this.velocity);
      steering.clampLength(0, this.maxForce * 1.5);
    }
    
    return steering;
  }
  
  flock(boids) {
    const alignment = this.align(boids, 6);
    const cohesion = this.cohesion(boids, 10);
    const separation = this.separation(boids, 4);
    const boundaries = this.boundaries();
    
    // Apply weights to the forces
    alignment.multiplyScalar(1.0);
    cohesion.multiplyScalar(1.0);
    separation.multiplyScalar(1.5);
    boundaries.multiplyScalar(1.0);
    
    // Accumulate forces
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
    this.acceleration.add(boundaries);
  }
  
  update() {
    // Update velocity and position
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(this.velocity);
    
    // Reset acceleration
    this.acceleration.set(0, 0, 0);
    
    // Update mesh position and rotation
    this.mesh.position.copy(this.position);
    
    // Make the bird look in the direction it's flying
    if (this.velocity.length() > 0) {
      this.mesh.lookAt(this.mesh.position.clone().add(this.velocity));
    }
  }
}

const BirdFlockSimulation = () => {
  const containerRef = useRef(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [boidCount, setBoidCount] = useState(100);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 30;
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Bounds for the flock
    const bounds = { x: 40, y: 30, z: 30 };
    
    // Add a wireframe box to show bounds
    const boxGeometry = new THREE.BoxGeometry(bounds.x, bounds.y, bounds.z);
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(box);
    
    // Create boids
    const boids = [];
    for (let i = 0; i < boidCount; i++) {
      boids.push(new Boid(scene, bounds));
    }
    
    // Rotate camera around scene
    let angle = 0;
    const radius = 40;
    
    // Animation loop
    let animationFrameId;
    const animate = () => {
      if (isSimulationRunning) {
        // Orbit camera slowly
        angle += 0.002;
        camera.position.x = radius * Math.sin(angle);
        camera.position.z = radius * Math.cos(angle);
        camera.lookAt(0, 0, 0);
        
        // Update boids
        for (const boid of boids) {
          boid.flock(boids);
        }
        
        for (const boid of boids) {
          boid.update();
        }
      }
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of geometries and materials
      for (const boid of boids) {
        scene.remove(boid.mesh);
        boid.mesh.geometry.dispose();
        boid.mesh.material.dispose();
      }
      
      boxGeometry.dispose();
      boxMaterial.dispose();
    };
  }, [boidCount, isSimulationRunning]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-4 mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setIsSimulationRunning(!isSimulationRunning)}
        >
          {isSimulationRunning ? 'Pause' : 'Resume'}
        </button>
        
        <div className="flex items-center gap-2">
          <label htmlFor="boidCount">Birds:</label>
          <select 
            id="boidCount" 
            value={boidCount} 
            onChange={(e) => setBoidCount(Number(e.target.value))}
            className="p-2 border rounded"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="150">150</option>
            <option value="200">200</option>
          </select>
        </div>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-96 bg-gray-100 rounded shadow"
      />
      
      <div className="mt-4 text-sm text-gray-600">
        A 3D simulation of bird flocking behavior based on Craig Reynolds' Boids algorithm
      </div>
    </div>
  );
};

export default BirdFlockSimulation;