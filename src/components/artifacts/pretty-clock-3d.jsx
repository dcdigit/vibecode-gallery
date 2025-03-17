import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeDToggleClock = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const secondTogglesRef = useRef([]);
  const minuteTogglesRef = useRef([]);
  const hourTogglesRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Digital time state
  const [digitalTime, setDigitalTime] = useState({ hour: 0, minute: 0, second: 0 });
  // Roaming camera mode state.
  const [roaming, setRoaming] = useState(false);
  // Ref to hold roaming parameters.
  const roamingParams = useRef({
    target: new THREE.Vector3(),
    position: new THREE.Vector3(),
    fov: 50,
    lastChangeTime: Date.now(),
    currentTarget: new THREE.Vector3(),
  });

  // ================= CONFIGURATION =================
  const config = {
    toggle: {
      scale: 1.0,
    },
    slider: {
      trackMultiplier: 1.0,
      offsetPadding: 2,
      sliderZOffset: 1,
    },
    label: {
      canvasWidth: 168,
      canvasHeight: 168,
      fontSize: 128,
      planeMultiplier: 4,
      zOffset: 5, // This pushes the label forward.
    },
  };
  // =================================================

  // Helper: Darken a hex color by multiplying each component by a factor.
  const darkenColor = (hex, factor = 0.8) => {
    const color = new THREE.Color(hex);
    color.multiplyScalar(factor);
    return color.getHex();
  };

  // Helper: Create a label plane (using a canvas texture).  
  // 'type' determines formatting: "hour" displays as-is; "minute"/"second" prepend a colon and zero-pad.
  const createLabelPlane = (labelData, isActive, baseDepth, sliderSize, type) => {
    const canvas = document.createElement('canvas');
    canvas.width = config.label.canvasWidth;
    canvas.height = config.label.canvasHeight;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    let textLabel;
    if (type === 'hour') {
      textLabel = String(labelData);
    } else {
      textLabel = ":" + String(labelData).padStart(2, '0');
    }
    
    context.fillStyle = isActive ? '#ffffff' : '#333333';
    context.font = `${config.label.fontSize}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(textLabel, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    // For minute/second labels, widen the plane by 20%.
    const multiplier = (type === 'minute' || type === 'second')
      ? config.label.planeMultiplier * 1.2
      : config.label.planeMultiplier;
    const planeWidth = sliderSize * multiplier;
    const labelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, planeWidth),
      material
    );
    // Push the label forward so it doesn't mix with other geometries.
    labelPlane.position.z = config.label.zOffset;
    labelPlane.isLabel = true;
    return labelPlane;
  };

  // Helper: Compute the average world position of the active toggles.
  const computeAverageActiveToggleWorldPosition = () => {
    const pos = new THREE.Vector3();
    let count = 0;
    if (secondTogglesRef.current.length > 0) {
      const secToggle = secondTogglesRef.current[digitalTime.second];
      if (secToggle) {
        const p = new THREE.Vector3();
        secToggle.getWorldPosition(p);
        pos.add(p);
        count++;
      }
    }
    if (minuteTogglesRef.current.length > 0) {
      const minToggle = minuteTogglesRef.current[digitalTime.minute];
      if (minToggle) {
        const p = new THREE.Vector3();
        minToggle.getWorldPosition(p);
        pos.add(p);
        count++;
      }
    }
    if (hourTogglesRef.current.length > 0) {
      const hourIndex = digitalTime.hour === 12 ? 0 : digitalTime.hour;
      const hrToggle = hourTogglesRef.current[hourIndex];
      if (hrToggle) {
        const p = new THREE.Vector3();
        hrToggle.getWorldPosition(p);
        pos.add(p);
        count++;
      }
    }
    if (count > 0) {
      pos.divideScalar(count);
    }
    return pos;
  };

  // Initialize the scene, camera, renderer, lights, and toggles (run once).
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 250, 500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 200;
    controls.maxDistance = 1000;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(200, 500, 300);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const centerLight = new THREE.PointLight(0xffffcc, 1.0, 200);
    centerLight.position.set(0, 0, 0);
    scene.add(centerLight);

    // Additional theatrical lights.
    const spotLight = new THREE.SpotLight(0xffffff, 2.0);
    spotLight.position.set(-300, 300, 300);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.2;
    spotLight.castShadow = true;
    scene.add(spotLight);

    const backLight = new THREE.PointLight(0xfff5e1, 1.0, 500);
    backLight.position.set(0, -200, 300);
    scene.add(backLight);

    // Clock base.
    const clockBase = new THREE.Mesh(
      new THREE.CylinderGeometry(220, 220, 10, 64),
      new THREE.MeshPhongMaterial({
        color: 0xeeeeee,
        specular: 0x333333,
        shininess: 50,
      })
    );
    clockBase.rotation.x = Math.PI / 2;
    clockBase.position.z = -5;
    clockBase.receiveShadow = true;
    scene.add(clockBase);

    // Center point.
    const centerPoint = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    centerPoint.position.z = 5;
    scene.add(centerPoint);

    // Helper: Create a toggle.
    const createToggle = (radius, angle, size, height, isActive, color, inactiveColor, labelData) => {
      const toggleGroup = new THREE.Group();
      const radians = THREE.MathUtils.degToRad(90 - angle);
      const x = radius * Math.cos(radians);
      const y = radius * Math.sin(radians);

      const scaledSize = size * config.toggle.scale;
      const scaledHeight = height * config.toggle.scale;

      const trackWidth = scaledSize * config.slider.trackMultiplier;
      const baseDepth = 5 * config.slider.trackMultiplier;

      const toggleBase = new THREE.Mesh(
        new THREE.BoxGeometry(trackWidth, scaledHeight, baseDepth),
        new THREE.MeshPhongMaterial({
          color: isActive ? color : inactiveColor,
          specular: 0x222222,
          shininess: 30,
        })
      );
      toggleBase.position.z = baseDepth / 2;
      toggleBase.castShadow = true;
      toggleBase.receiveShadow = true;

      const sliderSize = scaledHeight - 4 * config.toggle.scale;
      const sliderMesh = new THREE.Mesh(
        new THREE.BoxGeometry(sliderSize, sliderSize, baseDepth + 2),
        new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x999999,
          shininess: 50,
        })
      );
      sliderMesh.castShadow = true;

      const sliderOffset = isActive
        ? (trackWidth / 2 - sliderSize / 2 - config.slider.offsetPadding)
        : (-trackWidth / 2 + sliderSize / 2 + config.slider.offsetPadding);
      sliderMesh.position.set(sliderOffset, 0, baseDepth / 2 + config.slider.sliderZOffset);

      if (labelData !== undefined) {
        const labelPlane = createLabelPlane(labelData.value, isActive, baseDepth, sliderSize, labelData.type);
        if (isActive) {
          sliderMesh.add(labelPlane);
        }
      }

      toggleBase.add(sliderMesh);
      toggleGroup.add(toggleBase);
      toggleGroup.position.set(x, y, 0);
      toggleGroup.rotation.z = radians;
      toggleGroup.userData = { trackWidth, sliderSize, baseDepth, activeColor: color, inactiveColor: inactiveColor };
      return toggleGroup;
    };

    // Create second (outer) toggles.
    secondTogglesRef.current = Array(60).fill().map((_, i) => {
      const labelData = { value: i, type: 'second' };
      const toggle = createToggle(
        180,
        i * 6,
        40,
        8,
        false,
        0x3b82f6,
        0x93c5fd,
        labelData
      );
      scene.add(toggle);
      return toggle;
    });

    // Create minute (middle) toggles.
    minuteTogglesRef.current = Array(60).fill().map((_, i) => {
      const labelData = { value: i, type: 'minute' };
      const toggle = createToggle(
        140,
        i * 6,
        25,
        8,
        false,
        0xc2410c,
        0xfed7aa,
        labelData
      );
      scene.add(toggle);
      return toggle;
    });

    // Create hour (inner) toggles.
    hourTogglesRef.current = Array(12).fill().map((_, i) => {
      const hourNumber = i === 0 ? 12 : i;
      const labelData = { value: hourNumber, type: 'hour' };
      const toggle = createToggle(
        100,
        i * 30,
        50,
        12,
        false,
        0x9333ea,
        0xe9d5ff,
        labelData
      );
      scene.add(toggle);
      return toggle;
    });

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update label orientation so that labels always face the camera.
  const updateLabels = () => {
    const updateLabelOrientation = (label) => {
      const parentWorldQuat = new THREE.Quaternion();
      label.parent.getWorldQuaternion(parentWorldQuat);
      const invParentQuat = parentWorldQuat.clone().invert();
      label.quaternion.copy(cameraRef.current.quaternion).premultiply(invParentQuat);
    };

    const updateLabelsInToggle = (toggleArray) => {
      toggleArray.forEach(toggle => {
        const slider = toggle.children[0].children[0];
        slider.children.forEach(child => {
          if (child.isLabel) {
            updateLabelOrientation(child);
          }
        });
      });
    };

    updateLabelsInToggle(secondTogglesRef.current);
    updateLabelsInToggle(minuteTogglesRef.current);
    updateLabelsInToggle(hourTogglesRef.current);
  };

  // Roaming camera update: smoothly fly the camera to dramatic positions, always in front of the clock.
  const updateRoamingCamera = () => {
    // Compute new target as the average world position of active toggles.
    const computeTarget = () => computeAverageActiveToggleWorldPosition();

    if (!roamingParams.current.currentTarget) {
      roamingParams.current.currentTarget.copy(computeTarget());
    }

    const now = Date.now();
    // Change view every 3 seconds.
    if (now - roamingParams.current.lastChangeTime > 3000) {
      const newTarget = computeTarget();
      // Use spherical coordinates:
      // - radius between 300 and 700,
      // - phi between 30° and 150°,
      // - theta between 0° and 180° so the camera stays in front (z positive).
      const spherical = new THREE.Spherical(
        THREE.MathUtils.randFloat(300, 700),
        THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(30, 150)),
        THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(0, 180))
      );
      const newPosition = new THREE.Vector3().setFromSpherical(spherical).add(newTarget);
      // Ensure the camera's z position remains well in front of the clock plane.
      newPosition.z = Math.max(newPosition.z, 50);
      const newFov = THREE.MathUtils.randFloat(30, 90);
      roamingParams.current.target.copy(newTarget);
      roamingParams.current.position.copy(newPosition);
      roamingParams.current.fov = newFov;
      roamingParams.current.lastChangeTime = now;
    }
    // Smoothly LERP the camera's position, FOV, and target.
    cameraRef.current.position.lerp(roamingParams.current.position, 0.02);
    roamingParams.current.currentTarget.lerp(roamingParams.current.target, 0.02);
    cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, roamingParams.current.fov, 0.02);
    cameraRef.current.updateProjectionMatrix();
    cameraRef.current.lookAt(roamingParams.current.currentTarget);
  };

  // Animation loop: update toggles, labels, and camera.
  useEffect(() => {
    const updateToggles = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours = now.getHours() % 12;

      setDigitalTime({
        hour: hours === 0 ? 12 : hours,
        minute: minutes,
        second: seconds,
      });

      const updateToggleArray = (toggleArray, currentValue, type) => {
        toggleArray.forEach((toggle, i) => {
          const isActive = i === currentValue;
          const { trackWidth, sliderSize, baseDepth, activeColor, inactiveColor } = toggle.userData;
          const slider = toggle.children[0].children[0];
          const sliderOffset = isActive
            ? (trackWidth / 2 - sliderSize / 2 - config.slider.offsetPadding)
            : (-trackWidth / 2 + sliderSize / 2 + config.slider.offsetPadding);
          slider.position.x = THREE.MathUtils.lerp(slider.position.x, sliderOffset, 0.2);

          // Update slider track (toggle base) color.
          const newColor = isActive
            ? darkenColor(activeColor, 0.8)
            : inactiveColor;
          toggle.children[0].material.color.setHex(newColor);

          // Manage label: remove if inactive; add if active.
          if (slider.children.length > 0) {
            if (!isActive && slider.children[0].isLabel) {
              slider.remove(slider.children[0]);
            }
          } else if (isActive) {
            const labelPlane = createLabelPlane(currentValue, true, baseDepth, sliderSize, type);
            slider.add(labelPlane);
          }
        });
      };

      updateToggleArray(secondTogglesRef.current, seconds, 'second');
      updateToggleArray(minuteTogglesRef.current, minutes, 'minute');
      updateToggleArray(hourTogglesRef.current, hours, 'hour');
    };

    const animate = () => {
      updateToggles();
      updateLabels();
      if (roaming) {
        controlsRef.current.enabled = false;
        updateRoamingCamera();
      } else {
        controlsRef.current.enabled = true;
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [roaming]);

  return (
    <div className="w-full h-full">
      {/* Digital time display and roaming toggle */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center bg-black bg-opacity-50 px-4 py-2 rounded-lg">
        <div className="font-mono text-2xl font-bold text-white">
          {String(digitalTime.hour).padStart(2, '0')}:
          {String(digitalTime.minute).padStart(2, '0')}:
          {String(digitalTime.second).padStart(2, '0')}
        </div>
        <button
          onClick={() => setRoaming(prev => !prev)}
          className="ml-4 px-3 py-1 bg-blue-600 text-white rounded"
        >
          {roaming ? 'Stop Roaming' : 'Start Roaming'}
        </button>
      </div>
      <div ref={mountRef} className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }} />
    </div>
  );
};

export default function ThreeDToggleClockVisualization() {
  return (
    <div className="w-full h-screen bg-gray-100">
      <ThreeDToggleClock />
    </div>
  );
}