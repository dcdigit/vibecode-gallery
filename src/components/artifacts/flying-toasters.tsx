import React, { useRef, useEffect, useState } from 'react';

const FlyingToasters = () => {
  const mountRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Dynamically import Three.js to avoid SSR issues
    let renderer, scene, camera, animationFrameId;
    let cleanup = () => {};

    const init = async () => {
      try {
        const THREE = await import('three');
        
        if (!mountRef.current) {
          console.error("Mount ref is not available");
          return;
        }
        
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        // Get container dimensions
        const containerWidth = mountRef.current.clientWidth;
        const containerHeight = mountRef.current.clientHeight;

        // Camera setup with smaller viewport
        camera = new THREE.PerspectiveCamera(60, containerWidth / containerHeight, 0.1, 1000);
        camera.position.z = 10; // Closer to make viewport smaller

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerWidth, containerHeight);
        
        if (mountRef.current) {
          mountRef.current.appendChild(renderer.domElement);
        }

        // Add stars to the background
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
          color: 0xFFFFFF,
          size: 0.1
        });

        const starVertices = [];
        for (let i = 0; i < 1000; i++) {
          const x = (Math.random() - 0.5) * 100;
          const y = (Math.random() - 0.5) * 100;
          const z = (Math.random() - 0.5) * 100;
          starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // Create toasters
        const toasters = [];
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x808080); // Brighter ambient light
        scene.add(ambientLight);
        
        const directionalLight1 = new THREE.DirectionalLight(0xFFFFFF, 1.0); // Brighter directional light
        directionalLight1.position.set(1, 1, 1);
        scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 0.5); // Additional light
        directionalLight2.position.set(-1, 0.5, 0.5);
        scene.add(directionalLight2);
        
        // Simplified toaster model - FIXED ORIENTATION
        const createToaster = () => {
          const toasterGroup = new THREE.Group();
          
          // Main body - 3 units long in X direction (direction of travel)
          const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 2);
          const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x888888,
            specular: 0xFFFFFF,
            shininess: 100
          });
          const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
          toasterGroup.add(body);
          
          // Slot on top of toaster
          const slotGeometry = new THREE.BoxGeometry(2, 0.1, 1);
          const slotMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
          const slot = new THREE.Mesh(slotGeometry, slotMaterial);
          slot.position.y = 0.75;
          toasterGroup.add(slot);
          
          // Properly positioned flat wings with correct pivot points
          const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFAE6 });
          
          // Left wing
          // Create geometry with origin at the attachment edge for proper rotation
          const leftWingGeometry = new THREE.BoxGeometry(1.5, 0.1, 1);
          // Shift the geometry so that one edge aligns with the origin (pivot point)
          leftWingGeometry.translate(0.75, 0, 0);
          
          const leftWing = new THREE.Mesh(leftWingGeometry, wingMaterial);
          // Position the wing so its pivot edge aligns perfectly with toaster side
          leftWing.position.set(-1.5, 0, -1);
          toasterGroup.add(leftWing);
          
          // Right wing (mirrored)
          // Create geometry with origin at the attachment edge for proper rotation
          const rightWingGeometry = new THREE.BoxGeometry(1.5, 0.1, 1);
          // Shift the geometry so that one edge aligns with the origin (pivot point)
          rightWingGeometry.translate(0.75, 0, 0);
          
          const rightWing = new THREE.Mesh(rightWingGeometry, wingMaterial);
          // Position the wing so its pivot edge aligns perfectly with toaster side
          rightWing.position.set(-1.5, 0, 1);
          toasterGroup.add(rightWing);
          
          // Toast - vertical in the toaster slot
          const toastGeometry = new THREE.BoxGeometry(1, 0.8, 0.2);
          const toastMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xDEB887,
            specular: 0x333333,
            shininess: 5
          });
          const toast = new THREE.Mesh(toastGeometry, toastMaterial);
          toast.position.set(0, 0.85, 0); // Position aligned with slot
          // Rotate toast to be vertical
          toast.rotation.set(0, 0, Math.PI/2);
          toast.visible = Math.random() > 0.5; // 50% chance to have toast
          toasterGroup.add(toast);
          
          // Add userData for animation
          toasterGroup.userData = {
            leftWing,
            rightWing,
            toast,
            hasToast: toast.visible,
            toastEjectionTimer: Math.random() * 5 + 3,
            wingFlapOffset: Math.random() * Math.PI,
            ejectedToast: []
          };
          
          return toasterGroup;
        };
        
        // Create toast model - FIXED ORIENTATION
        const createEjectedToast = () => {
          const toastGroup = new THREE.Group();
          
          // Toast body - vertical orientation
          const toastGeometry = new THREE.BoxGeometry(1, 0.8, 0.2);
          const toastMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xDEB887,
            specular: 0x333333,
            shininess: 5
          });
          const toast = new THREE.Mesh(toastGeometry, toastMaterial);
          // Make ejected toast vertical too
          toast.rotation.set(0, 0, Math.PI/2);
          toastGroup.add(toast);
          
          // Add userData for animation
          toastGroup.userData = {
            speed: 0.06 + Math.random() * 0.03,
            upwardSpeed: 0, // For when toast is ejected upward
            spinX: (Math.random() - 0.5) * 0.03,
            spinY: (Math.random() - 0.5) * 0.03,
          };
          
          return toastGroup;
        };

        // Create multiple toasters - start off-screen
        for (let i = 0; i < 6; i++) {
          const toaster = createToaster();
          toaster.position.set(
            18 + Math.random() * 10, // Start off-screen to the right
            Math.random() * 20 - 10,
            Math.random() * 5 - 10
          );
          
          // Keep toasters completely upright
          toaster.rotation.set(0, 0, 0);
          
          scene.add(toaster);
          toasters.push({
            mesh: toaster,
            speed: 0.04 + Math.random() * 0.03,
          });
        }
        
        // Create some free-flying toast
        const freeToastSlices = [];
        for (let i = 0; i < 4; i++) {
          const toast = createEjectedToast();
          toast.position.set(
            Math.random() * 30 - 10,
            Math.random() * 20 - 10,
            Math.random() * 5 - 10
          );
          
          scene.add(toast);
          freeToastSlices.push({
            mesh: toast,
          });
        }

        // Animation clock
        const clock = new THREE.Clock();
        
        // Animation loop
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          
          const delta = clock.getDelta();
          const elapsedTime = clock.getElapsedTime();
          
          // Animate toasters
          toasters.forEach(toaster => {
            const toasterMesh = toaster.mesh;
            
            // Move toaster
            toasterMesh.position.x -= toaster.speed;
            toasterMesh.position.y -= toaster.speed * 0.2;
            
            // Animate wings - TRUE FLAPPING MOTION around the attached edge
            const wingOffset = toasterMesh.userData.wingFlapOffset;
            const wingAngle = (Math.sin(elapsedTime * 5 + wingOffset) * 0.4) + 0.2; // Wing pulse
            
            // Proper flapping motion for flat wings
            // Left wing flaps up and down (rotates around X axis)
            toasterMesh.userData.leftWing.rotation.x = wingAngle;
            // Right wing flaps up and down (rotates around X axis) - mirrored
            toasterMesh.userData.rightWing.rotation.x = -wingAngle;
            
            // Handle toast in toaster
            if (toasterMesh.userData.hasToast) {
              // Decrease ejection timer
              toasterMesh.userData.toastEjectionTimer -= delta;
              
              if (toasterMesh.userData.toastEjectionTimer <= 0) {
                // Eject toast!
                toasterMesh.userData.toast.visible = false;
                toasterMesh.userData.hasToast = false;
                
                // Create ejected toast that shoots upward
                const ejectedToast = createEjectedToast();
                ejectedToast.position.copy(toasterMesh.position);
                ejectedToast.position.y += 0.5;
                
                // Give ejected toast an upward velocity
                ejectedToast.userData.upwardSpeed = 0.12 + Math.random() * 0.05;
                
                scene.add(ejectedToast);
                freeToastSlices.push({
                  mesh: ejectedToast,
                });
                
                // Reset timer for next toast
                toasterMesh.userData.toastEjectionTimer = Math.random() * 5 + 8;
              }
            }
            
            // Reset position when completely off-screen
            if (toasterMesh.position.x < -18) { // Ensure fully off-screen
              toasterMesh.position.x = 18 + Math.random() * 5; // Start off-screen to the right
              toasterMesh.position.y = Math.random() * 10 - 5;
              
              // Add new toast with 70% probability
              if (Math.random() > 0.3) {
                toasterMesh.userData.toast.visible = true;
                toasterMesh.userData.hasToast = true;
              }
            }
          });
          
          // Animate free toast slices
          for (let i = freeToastSlices.length - 1; i >= 0; i--) {
            const toast = freeToastSlices[i];
            
            // Move toast - handle upward ejection
            toast.mesh.position.x -= toast.mesh.userData.speed;
            
            // Apply upward movement if toast has upward speed
            if (toast.mesh.userData.upwardSpeed > 0) {
              toast.mesh.position.y += toast.mesh.userData.upwardSpeed;
              // Gradually reduce upward speed (gravity effect)
              toast.mesh.userData.upwardSpeed -= 0.003;
              if (toast.mesh.userData.upwardSpeed < 0) {
                toast.mesh.userData.upwardSpeed = 0;
              }
            } else {
              // Normal downward drift for regular toast
              toast.mesh.position.y -= toast.mesh.userData.speed * 0.1;
            }
            
            // Toast slowly spins
            toast.mesh.rotation.x += toast.mesh.userData.spinX;
            toast.mesh.rotation.y += toast.mesh.userData.spinY;
            
            // Reset position when completely off-screen
            if (toast.mesh.position.x < -18 || toast.mesh.position.y > 18 || toast.mesh.position.y < -18) {
              scene.remove(toast.mesh);
              freeToastSlices.splice(i, 1);
            }
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        // Handle window resize
        const handleResize = () => {
          const containerWidth = mountRef.current ? mountRef.current.clientWidth : window.innerWidth * 0.66;
          const containerHeight = mountRef.current ? mountRef.current.clientHeight : window.innerHeight * 0.66;
          
          camera.aspect = containerWidth / containerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(containerWidth, containerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup function
        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(animationFrameId);
          if (mountRef.current && renderer?.domElement) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer?.dispose();
        };
      } catch (err) {
        console.error("Three.js initialization error:", err);
        setError("Failed to initialize 3D scene. Please try again or check if your browser supports WebGL.");
      }
    };

    init();
    
    // Cleanup on unmount
    return cleanup;
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      {error ? (
        <div className="bg-black text-white p-4">
          <p>{error}</p>
        </div>
      ) : (
        <div 
          ref={mountRef} 
          className="w-4/5 h-4/5 border-2 border-gray-600 overflow-hidden"
          style={{ minHeight: "400px", minWidth: "600px" }}
        />
      )}
    </div>
  );
};

export default FlyingToasters;