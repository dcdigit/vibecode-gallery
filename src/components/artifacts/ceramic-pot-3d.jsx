/* 
 * @description Interactive 3D ceramic pot
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const CeramicPot3D = () => {
  // Set CSS variable for control panel height based on viewport
  useEffect(() => {
    // Function to set the control panel height CSS variable
    const setControlPanelHeight = () => {
      const isMobile = window.innerWidth < 768; // Same breakpoint as Tailwind's md
      const controlHeight = isMobile ? 
        Math.min(window.innerHeight * 0.4, 200) : // 40% of height on mobile, max 200px
        window.innerHeight; // Full height on desktop
      
      document.documentElement.style.setProperty(
        '--control-panel-height', 
        `${isMobile ? controlHeight : 0}px`
      );
    };
    
    // Set initial value
    setControlPanelHeight();
    
    // Update on resize
    window.addEventListener('resize', setControlPanelHeight);
    
    return () => window.removeEventListener('resize', setControlPanelHeight);
  }, []);
  // Refs for THREE.js objects and interaction state
  const mountRef = useRef(null);
  const refs = useRef({
    scene: null,
    renderer: null,
    camera: null,
    potMesh: null,
    scenePivot: null,
    isRotating: false,
    previousMousePosition: { x: 0, y: 0 },
    rotation: { x: 0, y: 0 },
    zoomLevel: 400,
    autoRotate: false
  });

  // Pot configuration state
  const [potProfile, setPotProfile] = useState({
    height: 200, baseWidth: 80, maxWidth: 120, neckWidth: 60, mouthWidth: 70,
    clay: '#a67c52', texture: 'smooth', segments: 32
  });

  // Constants
  const potColors = ['#a67c52', '#d7b49e', '#efd9c7', '#6d4c3d', '#c1a296', '#8d7358', '#a08679', '#5c4033'];
  const textures = ['smooth', 'rough', 'crackled'];
  const potStyles = [
    { name: 'Wide Belly', config: { maxWidthMult: [1.5, 2.2], neckWidthMult: [0.6, 0.9], neckHeight: [0.1, 0.25], bellyPosition: [0.4, 0.6], divotChance: 0.3 } },
    { name: 'Bowl', config: { maxWidthMult: [0.9, 1.2], neckWidthMult: [0.9, 0.9], neckHeight: [0.05, 0.15], bellyPosition: [0.3, 0.5], divotChance: 0 } },
    { name: 'Cylinder', config: { maxWidthMult: [0.9, 1.1], neckWidthMult: [0.7, 0.9], neckHeight: [0.3, 0.7], bellyPosition: [0.4, 0.6], divotChance: 0.5 } },
    { name: 'Amphora', config: { maxWidthMult: [1.3, 1.8], neckWidthMult: [0.5, 0.8], neckHeight: [0.2, 0.3], bellyPosition: [0.3, 0.4], divotChance: 1 } },
    { name: 'Bottle', config: { maxWidthMult: [1.4, 2.0], neckWidthFixed: [20, 40], neckHeight: [0.15, 0.3], bellyPosition: [0.5, 0.7], divotChance: 0.4 } },
    { name: 'Flared Top', config: { maxWidthMult: [0.8, 1.3], neckWidthMult: [0.6, 0.8], neckHeight: [0.1, 0.2], bellyPosition: [0.4, 0.6], divotChance: 0.3 } }
  ];

  // Helper functions
  const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const generateRandomPot = () => {
    const height = randomRange(120, 300);
    const baseWidth = randomRange(40, 120);
    const mouthWidth = randomRange(30, 140);
    const segments = randomRange(24, 36);
    const potStyle = randomRange(0, potStyles.length - 1);
    const style = potStyles[potStyle];
    
    // Calculate dimensions based on selected style
    const maxBase = Math.max(baseWidth, mouthWidth);
    const minBase = Math.min(baseWidth, mouthWidth);
    const cfg = style.config;
    
    const maxWidth = cfg.maxWidthMult ? 
      randomRange(maxBase * cfg.maxWidthMult[0], maxBase * cfg.maxWidthMult[1]) : 
      randomRange(maxBase * 1.2, maxBase * 1.5);
    
    const neckWidth = cfg.neckWidthFixed ? 
      randomRange(cfg.neckWidthFixed[0], cfg.neckWidthFixed[1]) : 
      randomRange(minBase * cfg.neckWidthMult[0], minBase * cfg.neckWidthMult[1]);
    
    const neckHeight = randomRange(cfg.neckHeight[0], cfg.neckHeight[1]);
    const bellyPosition = randomRange(cfg.bellyPosition[0], cfg.bellyPosition[1]);
    const hasDivot = randomRange(0, 10) > (10 - cfg.divotChance * 10);

    const newPotProfile = {
      height, baseWidth, maxWidth, neckWidth, neckHeight, mouthWidth, bellyPosition, hasDivot, potStyle,
      clay: potColors[randomRange(0, potColors.length - 1)],
      texture: textures[randomRange(0, textures.length - 1)],
      segments
    };

    setPotProfile(newPotProfile);
    if (refs.current.scene) updatePot(newPotProfile);
  };

  // Geometry generation based on pot styles
  const createPotGeometry = (profile) => {
    const { height, baseWidth, maxWidth, neckWidth, neckHeight, mouthWidth, bellyPosition, hasDivot, potStyle, segments } = profile;
    const numPoints = 20;
    const points = [];
    
    const getRadius = (t, i) => {
      if (i === 0) return baseWidth / 2;
      if (i === numPoints - 1) return mouthWidth / 2;
      
      const radiusCalculators = {
        // Wide belly, narrow neck vase
        0: () => {
          if (t > 1 - neckHeight) {
            const neckPosition = (t - (1 - neckHeight)) / neckHeight;
            const neckCurve = Math.sin(neckPosition * Math.PI / 2);
            return neckWidth / 2 * (1 - neckCurve) + mouthWidth / 2 * neckCurve;
          } else if (t > 1 - bellyPosition) {
            const factor = (t - (1 - bellyPosition)) / (bellyPosition - neckHeight);
            const bellyCurve = Math.sin(factor * Math.PI / 2);
            return maxWidth / 2 - bellyCurve * (maxWidth / 2 - neckWidth / 2);
          } else {
            const factor = t / (1 - bellyPosition);
            const easedFactor = Math.pow(factor, 2);
            return baseWidth / 2 * (1 - easedFactor) + maxWidth / 2 * easedFactor;
          }
        },
        // Bowl shape
        1: () => {
          if (t > 0.9) return mouthWidth / 2;
          const factor = (1 - t) / 0.9;
          const bowlCurve = 1 - Math.pow(factor, 1.5);
          return baseWidth / 2 + bowlCurve * (maxWidth / 2 - baseWidth / 2);
        },
        // Straight-sided cylinder with possible waist
        2: () => {
          if (hasDivot && t > 0.3 && t < 0.7) {
            const centerFactor = 2 * Math.abs(t - 0.5);
            const waistDepth = randomRange(10, 30) / 100;
            const waistCurve = Math.sin(centerFactor * Math.PI);
            const straightSide = baseWidth / 2 + (mouthWidth / 2 - baseWidth / 2) * t;
            return straightSide * (1 - waistDepth * waistCurve);
          } else {
            const straightFactor = t;
            const curveFactor = Math.sin(t * Math.PI) * 0.1;
            return baseWidth / 2 + (mouthWidth / 2 - baseWidth / 2) * straightFactor + curveFactor * maxWidth / 2;
          }
        },
        // Double-belly amphora
        3: () => {
          if (t > 1 - neckHeight) {
            const neckPosition = (t - (1 - neckHeight)) / neckHeight;
            const neckCurve = Math.sin(neckPosition * Math.PI / 2);
            return neckWidth / 2 * (1 - neckCurve) + mouthWidth / 2 * neckCurve;
          } else if (t > 1 - bellyPosition) {
            const factor = (t - (1 - bellyPosition)) / (bellyPosition - neckHeight);
            const bellyCurve = Math.sin(factor * Math.PI);
            return maxWidth / 2 - bellyCurve * (maxWidth / 2 - neckWidth / 2);
          } else if (t > 1 - bellyPosition - 0.2) {
            const factor = (t - (1 - bellyPosition - 0.2)) / 0.2;
            const waistCurve = Math.sin(factor * Math.PI);
            const waistWidth = neckWidth * 1.2;
            return waistWidth / 2 + waistCurve * (maxWidth / 2 - waistWidth / 2);
          } else {
            const factor = t / (1 - bellyPosition - 0.2);
            const bellyCurve = Math.sin(factor * Math.PI);
            const secondBellyMax = maxWidth * 0.9;
            
            if (factor < 0.5) {
              return baseWidth / 2 + bellyCurve * (secondBellyMax / 2 - baseWidth / 2);
            } else {
              const tapeFactor = (factor - 0.5) / 0.5;
              const easedFactor = Math.pow(tapeFactor, 2);
              return secondBellyMax / 2 * (1 - easedFactor) + waistWidth / 2 * easedFactor;
            }
          }
        },
        // Bottle shape
        4: () => {
          if (t > 1 - neckHeight) {
            const neckPosition = (t - (1 - neckHeight)) / neckHeight;
            const neckCurve = Math.pow(neckPosition, 0.5);
            return neckWidth / 2 * (1 - neckCurve) + mouthWidth / 2 * neckCurve;
          } else if (t > 1 - neckHeight - 0.1) {
            const factor = (t - (1 - neckHeight - 0.1)) / 0.1;
            const shoulderCurve = Math.sin(factor * Math.PI / 2);
            return maxWidth / 2 - shoulderCurve * (maxWidth / 2 - neckWidth / 2);
          } else {
            const factor = t / (1 - neckHeight - 0.1);
            const eggFactor = Math.pow(factor, 1.2);
            return baseWidth / 2 * (1 - eggFactor) + maxWidth / 2 * eggFactor;
          }
        },
        // Flared top vase
        5: () => {
          if (t > 0.95) {
            const flareFactor = (t - 0.95) / 0.05;
            return mouthWidth / 2 * (1 + flareFactor * 0.1);
          } else if (t > 1 - neckHeight - 0.05) {
            const neckFactor = (t - (1 - neckHeight - 0.05)) / neckHeight;
            const neckCurve = Math.sin(neckFactor * Math.PI / 2);
            return neckWidth / 2 * (1 - neckCurve) + mouthWidth / 2 * neckCurve;
          } else if (t > 1 - bellyPosition) {
            const factor = (t - (1 - bellyPosition)) / (bellyPosition - (neckHeight + 0.05));
            const bellyCurve = Math.sin(factor * Math.PI / 2);
            return maxWidth / 2 - bellyCurve * (maxWidth / 2 - neckWidth / 2);
          } else {
            const factor = t / (1 - bellyPosition);
            const easedFactor = Math.pow(factor, 2.5);
            return baseWidth / 2 * (1 - easedFactor) + maxWidth / 2 * easedFactor;
          }
        }
      };
      
      // Default generic vase shape if no specific style handler
      return (radiusCalculators[potStyle] || (() => {
        if (t > 1 - neckHeight) {
          const neckPosition = (t - (1 - neckHeight)) / neckHeight;
          const neckCurve = Math.sin(neckPosition * Math.PI / 2);
          return neckWidth / 2 * (1 - neckCurve) + mouthWidth / 2 * neckCurve;
        } else if (t > 1 - bellyPosition) {
          const factor = (t - (1 - bellyPosition)) / (bellyPosition - neckHeight);
          
          if (hasDivot && factor > 0.3 && factor < 0.7) {
            const divotFactor = (factor - 0.3) / 0.4;
            const divotDepth = randomRange(10, 25) / 100;
            const divotCurve = Math.sin(divotFactor * Math.PI);
            const normalRadius = maxWidth / 2 - factor * (maxWidth / 2 - neckWidth / 2);
            return normalRadius * (1 - divotDepth * divotCurve);
          } else {
            const bellyCurve = Math.sin(factor * Math.PI / 2);
            return maxWidth / 2 - bellyCurve * (maxWidth / 2 - neckWidth / 2);
          }
        } else {
          const factor = t / (1 - bellyPosition);
          const easedFactor = Math.pow(factor, 2);
          return baseWidth / 2 * (1 - easedFactor) + maxWidth / 2 * easedFactor;
        }
      }))();
    };

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const y = t * height;
      const radius = getRadius(t, i);
      points.push(new THREE.Vector2(radius, y));
    }
    
    return new THREE.LatheGeometry(points, segments);
  };

  // Create texture canvas and data URL
  const createTextureCanvas = (width, height, callback) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    callback(context, width, height);
    return canvas.toDataURL();
  };

  // Restored original noise texture
  const createNoiseTexture = (width, height) => 
    createTextureCanvas(width, height, (ctx, w, h) => {
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.floor(Math.random() * 128) + 64;
        data[i] = data[i + 1] = data[i + 2] = value;
        data[i + 3] = 255;
      }
      
      ctx.putImageData(imageData, 0, 0);
    });

  // Restored original crackle texture
  const createCrackleTexture = (width, height) => 
    createTextureCanvas(width, height, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#00000050';
      ctx.lineWidth = 1;
      
      const numCracks = 20;
      for (let i = 0; i < numCracks; i++) {
        const startX = Math.random() * w;
        const startY = Math.random() * h;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        let x = startX, y = startY;
        const segments = 5 + Math.floor(Math.random() * 10);
        
        for (let j = 0; j < segments; j++) {
          x += (Math.random() - 0.5) * 100;
          y += (Math.random() - 0.5) * 100;
          ctx.lineTo(x, y);
        }
        
        ctx.stroke();
      }
    });

  // Restored original material creation with textures
  const createPotMaterial = ({ clay, texture }) => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(clay),
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    
    if (texture === 'rough') {
      material.roughness = 0.9;
      material.bumpMap = new THREE.TextureLoader().load(createNoiseTexture(256, 256));
      material.bumpScale = 0.5;
    } else if (texture === 'crackled') {
      const crackleTexture = new THREE.TextureLoader().load(createCrackleTexture(512, 512));
      material.map = material.roughnessMap = crackleTexture;
      material.roughness = 0.8;
    }
    
    return material;
  };

  // Update the pot mesh
  const updatePot = (profile) => {
    if (!refs.current.scenePivot) return;
    
    // Remove existing pot if it exists
    if (refs.current.potMesh) {
      refs.current.scenePivot.remove(refs.current.potMesh);
      refs.current.potMesh.geometry.dispose();
      refs.current.potMesh.material.dispose();
    }
    
    // Create new pot geometry and material
    const geometry = createPotGeometry(profile);
    const material = createPotMaterial(profile);
    
    // Create mesh and add to scene
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    
    refs.current.scenePivot.add(mesh);
    refs.current.potMesh = mesh;
  };

  // Event handlers
  const eventHandlers = {
    mouseDown: e => {
      if (!mountRef.current) return;
      refs.current.isRotating = true;
      refs.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    },
    
    mouseMove: e => {
      if (!refs.current.isRotating || !refs.current.scene || !refs.current.potMesh) return;
      
      const { x: prevX, y: prevY } = refs.current.previousMousePosition;
      const deltaMove = { x: e.clientX - prevX, y: e.clientY - prevY };
      
      if (e.shiftKey && refs.current.camera) {
        // Pan camera
        refs.current.camera.position.x -= deltaMove.x * 0.5;
        refs.current.camera.position.y += deltaMove.y * 0.5;
      } else if (refs.current.scenePivot) {
        // Rotate pot - adjust rotation speed based on viewport size
        const container = mountRef.current.parentElement;
        const containerSize = Math.min(container.clientWidth, container.clientHeight);
        const rotationScale = 0.01 * (400 / containerSize); // Normalize rotation for different screen sizes
        
        refs.current.rotation.y += deltaMove.x * rotationScale;
        refs.current.rotation.x += deltaMove.y * rotationScale;
        
        // Limit rotation on X axis
        refs.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, refs.current.rotation.x));
        
        refs.current.scenePivot.rotation.x = refs.current.rotation.x;
        refs.current.scenePivot.rotation.y = refs.current.rotation.y;
      }
      
      refs.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    },
    
    mouseUp: () => refs.current.isRotating = false,
    mouseLeave: () => refs.current.isRotating = false,
    
    mouseWheel: e => {
      if (!refs.current.camera) return;
      e.preventDefault();
      
      // Get container dimensions
      const container = mountRef.current.parentElement;
      const containerSize = Math.min(container.clientWidth, container.clientHeight);
      
      // Adjust zoom speed based on viewport size
      const zoomScale = 0.1 * (400 / containerSize);
      
      // Zoom in/out with adaptive limits based on viewport size
      refs.current.zoomLevel += e.deltaY * zoomScale;
      
      // Adjust zoom limits based on viewport size
      const minZoom = Math.max(50, containerSize * 0.25);
      const maxZoom = Math.min(1200, containerSize * 2);
      
      refs.current.zoomLevel = Math.max(minZoom, Math.min(maxZoom, refs.current.zoomLevel));
      refs.current.camera.position.z = refs.current.zoomLevel;
    },
    
    touchStart: e => {
      if (e.touches.length === 1) {
        refs.current.isRotating = true;
        refs.current.previousMousePosition = { 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        };
      }
    },
    
    touchMove: e => {
      if (!refs.current.isRotating || !refs.current.potMesh || e.touches.length !== 1) return;
      
      const { x: prevX, y: prevY } = refs.current.previousMousePosition;
      const deltaMove = { 
        x: e.touches[0].clientX - prevX, 
        y: e.touches[0].clientY - prevY 
      };
      
      // Adjust rotation speed based on viewport size for touch
      const container = mountRef.current.parentElement;
      const containerSize = Math.min(container.clientWidth, container.clientHeight);
      const rotationScale = 0.01 * (400 / containerSize);
      
      refs.current.rotation.y += deltaMove.x * rotationScale;
      refs.current.rotation.x += deltaMove.y * rotationScale;
      
      // Limit rotation on X axis
      refs.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, refs.current.rotation.x));
      
      if (refs.current.scenePivot) {
        refs.current.scenePivot.rotation.y = refs.current.rotation.y;
        refs.current.scenePivot.rotation.x = refs.current.rotation.x;
      }
      
      refs.current.previousMousePosition = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
    },
    
    touchEnd: () => refs.current.isRotating = false
  };

  // Generate a pot on first load - handled in scene setup
  useEffect(() => {
    // Generation is now handled in the scene setup to avoid duplicates
  }, []);

  // Set up the 3D scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Create scene and camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f5f5f5');
    refs.current.scene = scene;
    
    const scenePivot = new THREE.Group();
    scene.add(scenePivot);
    refs.current.scenePivot = scenePivot;
    
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 2000);
    camera.position.set(0, 140, 90);
    refs.current.camera = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    refs.current.renderer = renderer;
    
    // Add lights with increased intensity for better visibility
    scene.add(new THREE.AmbientLight(0xffffff, 0.6)); // Increased ambient light
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add additional lights for better all-around illumination
    scene.add(new THREE.DirectionalLight(0xffffff, 0.7).position.set(-100, 100, -100));
    scene.add(new THREE.DirectionalLight(0xffffcc, 0.5).position.set(0, -100, 50));
    scene.add(new THREE.DirectionalLight(0xffffff, 0.5).position.set(0, 100, -100));
    
    // Add grid for reference
    const gridHelper = new THREE.GridHelper(400, 40, 0x888888, 0xdddddd);
    scenePivot.add(gridHelper);
    gridHelper.position.y = -1;
    
    // Set initial rotation and zoom
    refs.current.rotation = { x: 0, y: 0 };
    refs.current.zoomLevel = 400;
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (refs.current.autoRotate && refs.current.scenePivot) {
        refs.current.scenePivot.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();
    
    // Single pot generation after scene setup
    setTimeout(() => {
      generateRandomPot();
    }, 100);
    
    // Initialize viewport
    setTimeout(eventHandlers.resize, 0);
    
    // Add event listeners
    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', eventHandlers.mouseDown);
    window.addEventListener('mousemove', eventHandlers.mouseMove);
    window.addEventListener('mouseup', eventHandlers.mouseUp);
    canvas.addEventListener('mouseleave', eventHandlers.mouseLeave);
    canvas.addEventListener('wheel', eventHandlers.mouseWheel, { passive: false });
    
    canvas.addEventListener('touchstart', eventHandlers.touchStart);
    window.addEventListener('touchmove', eventHandlers.touchMove, { passive: false });
    window.addEventListener('touchend', eventHandlers.touchEnd);
    
    // Clean up
    return () => {
      if (refs.current.renderer) refs.current.renderer.dispose();
      if (refs.current.potMesh) {
        refs.current.potMesh.geometry.dispose();
        refs.current.potMesh.material.dispose();
      }
      
      canvas.removeEventListener('mousedown', eventHandlers.mouseDown);
      window.removeEventListener('mousemove', eventHandlers.mouseMove);
      window.removeEventListener('mouseup', eventHandlers.mouseUp);
      canvas.removeEventListener('mouseleave', eventHandlers.mouseLeave);
      canvas.removeEventListener('wheel', eventHandlers.mouseWheel);
      
      canvas.removeEventListener('touchstart', eventHandlers.touchStart);
      window.removeEventListener('touchmove', eventHandlers.touchMove);
      window.removeEventListener('touchend', eventHandlers.touchEnd);
      
      if (mountRef.current && refs.current.renderer) {
        mountRef.current.removeChild(refs.current.renderer.domElement);
      }
    };
  }, []);

  // Enhanced window resize handler
  useEffect(() => {
    // Improved resize handler
    const responsiveResize = () => {
      if (!mountRef.current || !refs.current.renderer || !refs.current.camera) return;
      
      const container = mountRef.current.parentElement.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Update renderer size
      refs.current.renderer.setSize(containerWidth, containerHeight);
      
      // Update camera aspect ratio
      refs.current.camera.aspect = containerWidth / containerHeight;
      refs.current.camera.updateProjectionMatrix();
      
      // Adjust camera position based on container size to keep pot in view
      const minDimension = Math.min(containerWidth, containerHeight);
      const zoomFactor = 400 * (800 / minDimension);
      refs.current.camera.position.z = Math.min(800, Math.max(200, zoomFactor));
      refs.current.zoomLevel = refs.current.camera.position.z;
    };
    
    // Initial resize
    setTimeout(responsiveResize, 0);
    
    // Add event listeners
    window.addEventListener('resize', responsiveResize);
    
    // Use ResizeObserver for container size changes
    if (typeof ResizeObserver !== 'undefined' && mountRef.current) {
      const resizeObserver = new ResizeObserver(responsiveResize);
      
      // Observe both the mount element and its parent container
      resizeObserver.observe(mountRef.current);
      if (mountRef.current.parentElement) {
        resizeObserver.observe(mountRef.current.parentElement);
        if (mountRef.current.parentElement.parentElement) {
          resizeObserver.observe(mountRef.current.parentElement.parentElement);
        }
      }
      
      return () => {
        window.removeEventListener('resize', responsiveResize);
        resizeObserver.disconnect();
      };
    }
    
    return () => window.removeEventListener('resize', responsiveResize);
  }, []);

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-gray-100 max-h-screen overflow-hidden">
      {/* Controls panel - responsive layout (top on mobile, left on desktop) */}
      <div className="w-full md:w-1/5 md:min-w-32 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 p-1 overflow-y-auto" style={{ maxHeight: "40vh", height: "auto", minHeight: "120px" }}>
        <h1 className="text-md font-bold mb-1">Pot Generator</h1>
        
        {/* Control buttons */}
        <div className="flex flex-row md:flex-col space-x-1 md:space-x-0 md:space-y-1 mb-1">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-1 rounded text-xs"
            onClick={generateRandomPot}
          >
            Generate New Pot
          </button>
          
          <button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-1 rounded text-xs"
            onClick={() => refs.current.autoRotate = !refs.current.autoRotate}
          >
            Toggle Tumble
          </button>
        </div>
        
        <div className="text-center text-xs text-gray-600 mb-1">
          Drag: rotate | Scroll: zoom
        </div>
        
        {/* Pot specifications - horizontal scrolling on mobile */}
        <div className="bg-white p-1 rounded-lg shadow-sm mb-1 text-xs overflow-x-auto">
          <h2 className="font-bold text-xs">Specifications:</h2>
          <ul className="text-xs space-y-0 mt-1 flex flex-row md:flex-col flex-wrap">
            <li className="mr-3 md:mr-0">Height: {potProfile.height}mm</li>
            <li className="mr-3 md:mr-0">Base Width: {potProfile.baseWidth}mm</li>
            <li className="mr-3 md:mr-0">Max Width: {potProfile.maxWidth}mm</li>
            <li className="mr-3 md:mr-0">Neck Width: {potProfile.neckWidth}mm</li>
            <li className="mr-3 md:mr-0">Mouth Width: {potProfile.mouthWidth}mm</li>
            <li className="mr-3 md:mr-0">Clay: {potProfile.clay}</li>
            <li className="mr-3 md:mr-0">Texture: {potProfile.texture}</li>
            <li className="mr-3 md:mr-0">Style: {potStyles[potProfile.potStyle]?.name || 'Standard'}</li>
            {potProfile.hasDivot && <li className="mr-3 md:mr-0">Features: Divot/Waist</li>}
          </ul>
        </div>
      </div>
      
      {/* 3D Visualization - takes remaining space */}
      <div className="flex-1 bg-white flex items-center justify-center overflow-hidden">
        <div 
          className="relative w-full h-full"
          style={{ 
            height: "calc(100vh - var(--control-panel-height, 120px))",
            maxHeight: "calc(100vh - var(--control-panel-height, 120px))"
          }}
        >
          <div
            ref={mountRef}
            className="absolute inset-0"
            style={{ touchAction: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CeramicPot3D;