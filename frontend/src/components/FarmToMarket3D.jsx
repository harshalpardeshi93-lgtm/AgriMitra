import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function FarmToMarket3D() {
  const containerRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // WebGL support check
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 14); // Adjusted for full-width hero background
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const emeraldLight = new THREE.PointLight(0x059669, 1.5, 10);
    emeraldLight.position.set(-3.8, 2, 0);
    scene.add(emeraldLight);

    const amberLight = new THREE.PointLight(0xd97706, 1.5, 10);
    amberLight.position.set(0, 2, 0);
    scene.add(amberLight);

    const blueLight = new THREE.PointLight(0x0284c7, 1.5, 10);
    blueLight.position.set(3.8, 2, 0);
    scene.add(blueLight);

    // Main Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Floating Ground Disc
    const groundGeo = new THREE.CylinderGeometry(6, 6.2, 0.4, 32);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5f4, 
      roughness: 0.8, 
      metalness: 0.1 
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    mainGroup.add(ground);

    // Sub-platform circles (Farm, Market, Buyer)
    const createPlatform = (x, z, colorHex) => {
      const geo = new THREE.CylinderGeometry(1.6, 1.7, 0.2, 24);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.2 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0.05, z);
      mesh.receiveShadow = true;
      mainGroup.add(mesh);
      return mesh;
    };

    createPlatform(-3.8, 0, 0xdcfce7); // Farm platform (Light Green)
    createPlatform(0, 0, 0xfef3c7);    // Market platform (Light Gold)
    createPlatform(3.8, 0, 0xe0f2fe);   // Buyer platform (Light Blue)

    // 1. FARM NODE (Left: -3.8, 0)
    const farmGroup = new THREE.Group();
    farmGroup.position.set(-3.8, 0.15, 0);

    // Small Farm Barn/House
    const barnGeo = new THREE.BoxGeometry(1.0, 0.8, 0.9);
    const barnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    const barn = new THREE.Mesh(barnGeo, barnMat);
    barn.position.y = 0.4;
    barn.castShadow = true;
    farmGroup.add(barn);

    // Roof
    const roofGeo = new THREE.ConeGeometry(0.85, 0.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.05;
    roof.castShadow = true;
    farmGroup.add(roof);

    // Low-poly crops
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const cropRadius = 1.0;
      const cx = Math.cos(angle) * cropRadius;
      const cz = Math.sin(angle) * cropRadius;

      const stemGeo = new THREE.ConeGeometry(0.12, 0.45, 5);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(cx, 0.22, cz);
      stem.castShadow = true;
      farmGroup.add(stem);
    }
    mainGroup.add(farmGroup);

    // 2. MARKET NODE (Center: 0, 0)
    const marketGroup = new THREE.Group();
    marketGroup.position.set(0, 0.15, 0);

    // Mandi Hub Building
    const hubGeo = new THREE.CylinderGeometry(0.9, 1.1, 0.9, 8);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.3 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.y = 0.45;
    hub.castShadow = true;
    marketGroup.add(hub);

    // Dome Roof
    const domeGeo = new THREE.SphereGeometry(0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.5 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.9;
    marketGroup.add(dome);

    // Market Node Beacon Pillar
    const beaconGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 1.5;
    marketGroup.add(beacon);

    const beaconOrbGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const beaconOrbMat = new THREE.MeshStandardMaterial({ 
      color: 0xf59e0b, 
      emissive: 0xd97706, 
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    const beaconOrb = new THREE.Mesh(beaconOrbGeo, beaconOrbMat);
    beaconOrb.position.y = 2.4;
    marketGroup.add(beaconOrb);

    mainGroup.add(marketGroup);

    // 3. BUYER NODE (Right: 3.8, 0)
    const buyerGroup = new THREE.Group();
    buyerGroup.position.set(3.8, 0.15, 0);

    // Corporate / Warehouse Building
    const bldg1Geo = new THREE.BoxGeometry(0.9, 1.4, 0.9);
    const bldg1Mat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3, metalness: 0.4 });
    const bldg1 = new THREE.Mesh(bldg1Geo, bldg1Mat);
    bldg1.position.y = 0.7;
    bldg1.castShadow = true;
    buyerGroup.add(bldg1);

    const bldg2Geo = new THREE.BoxGeometry(0.7, 0.9, 0.7);
    const bldg2Mat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.5 });
    const bldg2 = new THREE.Mesh(bldg2Geo, bldg2Mat);
    bldg2.position.set(0.5, 0.45, 0.4);
    bldg2.castShadow = true;
    buyerGroup.add(bldg2);

    mainGroup.add(buyerGroup);

    // CONNECTING PIPELINES / FLOW CURVES
    // Curve 1: Farm (-3.8, 0.8, 0) -> Market (0, 1.2, 0)
    const curve1 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-3.8, 0.8, 0),
      new THREE.Vector3(-2.2, 2.5, 0.8),
      new THREE.Vector3(-1.0, 2.2, 0.4),
      new THREE.Vector3(0, 1.2, 0)
    );

    const tubeGeo1 = new THREE.TubeGeometry(curve1, 32, 0.04, 8, false);
    const tubeMat1 = new THREE.MeshBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.6 });
    const tube1 = new THREE.Mesh(tubeGeo1, tubeMat1);
    mainGroup.add(tube1);

    // Curve 2: Market (0, 1.2, 0) -> Buyer (3.8, 1.0, 0)
    const curve2 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(1.0, 2.2, -0.4),
      new THREE.Vector3(2.2, 2.5, -0.8),
      new THREE.Vector3(3.8, 1.0, 0)
    );

    const tubeGeo2 = new THREE.TubeGeometry(curve2, 32, 0.04, 8, false);
    const tubeMat2 = new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.6 });
    const tube2 = new THREE.Mesh(tubeGeo2, tubeMat2);
    mainGroup.add(tube2);

    // Flowing Data Particles
    const particleGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const particleMat1 = new THREE.MeshStandardMaterial({ 
      color: 0x22c55e, 
      emissive: 0x16a34a, 
      emissiveIntensity: 1 
    });
    const particleMat2 = new THREE.MeshStandardMaterial({ 
      color: 0x38bdf8, 
      emissive: 0x0284c7, 
      emissiveIntensity: 1 
    });

    const flowMesh1 = new THREE.Mesh(particleGeo, particleMat1);
    const flowMesh2 = new THREE.Mesh(particleGeo, particleMat2);
    mainGroup.add(flowMesh1);
    mainGroup.add(flowMesh2);

    // Floating Background Dust Particles
    const dustCount = 40;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 14;
      dustPos[i + 1] = Math.random() * 6 + 0.5;
      dustPos[i + 2] = (Math.random() - 0.5) * 10;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x059669,
      size: 0.08,
      transparent: true,
      opacity: 0.4
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    mainGroup.add(dustPoints);

    // Mouse Parallax Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseX = (x / rect.width - 0.5) * 2;
      mouseY = (y / rect.height - 0.5) * 2;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 500;
      const newHeight = container.clientHeight || 400;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera / group rotation based on mouse
      targetRotationY = mouseX * 0.25;
      targetRotationX = mouseY * 0.15;

      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.05;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.05;

      // Gentle floating animation for nodes
      farmGroup.position.y = 0.15 + Math.sin(elapsedTime * 1.5) * 0.05;
      marketGroup.position.y = 0.15 + Math.sin(elapsedTime * 1.5 + 1) * 0.05;
      buyerGroup.position.y = 0.15 + Math.sin(elapsedTime * 1.5 + 2) * 0.05;

      // Beacon orb float and pulse
      beaconOrb.position.y = 2.4 + Math.sin(elapsedTime * 3) * 0.08;
      beaconOrbMat.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 4) * 0.3;

      // Crop slight movement
      cropRadiusPulse(farmGroup, elapsedTime);

      // Data Flow along Bezier Curves
      const t1 = (elapsedTime * 0.35) % 1;
      const point1 = curve1.getPoint(t1);
      flowMesh1.position.copy(point1);

      const t2 = (elapsedTime * 0.35 + 0.5) % 1;
      const point2 = curve2.getPoint(t2);
      flowMesh2.position.copy(point2);

      // Rotate background dust
      dustPoints.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    function cropRadiusPulse(group, time) {
      group.children.forEach((child, idx) => {
        if (idx > 1) {
          child.rotation.z = Math.sin(time * 2 + idx) * 0.05;
        }
      });
    }

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      
      {/* Three.js Canvas Container */}
      {webglSupported ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        /* Mobile / No-WebGL 2D Fallback Visual */
        <div className="w-full h-full p-6 flex flex-col justify-end items-center text-center pb-20">
          <div className="text-xs font-semibold uppercase tracking-wider text-agrigreen-500 mb-6">
            AgriMitra Value Chain
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
            <div className="bg-surface-card/80 backdrop-blur-md p-4 rounded-xl border border-agrigreen-500/20 flex flex-col items-center shadow-sm">
              <div className="w-10 h-10 rounded-full bg-agrigreen-500/20 text-agrigreen-500 flex items-center justify-center font-bold text-sm mb-2">
                🌱
              </div>
              <span className="text-xs font-bold text-agrigreen-700">Farmer</span>
              <span className="text-[10px] text-text-secondary mt-1">Grow with insights</span>
            </div>
            <div className="bg-surface-card/80 backdrop-blur-md p-4 rounded-xl border border-amber-100 flex flex-col items-center shadow-sm">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm mb-2">
                🏛️
              </div>
              <span className="text-xs font-bold text-amber-800">APMC Market</span>
              <span className="text-[10px] text-text-secondary mt-1">Live price data</span>
            </div>
            <div className="bg-surface-card/80 backdrop-blur-md p-4 rounded-xl border border-sky-100 flex flex-col items-center shadow-sm">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm mb-2">
                🏢
              </div>
              <span className="text-xs font-bold text-sky-800">Buyer</span>
              <span className="text-[10px] text-text-secondary mt-1">Direct connections</span>
            </div>
          </div>
        </div>
      )}

      {/* HTML Overlaid Labels for 3D Scene */}
      {webglSupported && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 sm:px-[10%] md:px-[20%] mt-32 md:mt-24 lg:mt-32 opacity-80 mix-blend-multiply">
          
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-agrigreen-500/20/90 text-agrigreen-700 border border-agrigreen-500/30">Farmer</span>
            <span className="text-[11px] text-text-secondary font-medium mt-1 whitespace-nowrap hidden sm:block">Grow with insights</span>
          </div>
          
          <div className="flex flex-col items-center transform translate-y-8 sm:translate-y-12">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-amber-100/90 text-amber-800 border border-amber-200">APMC Market</span>
            <span className="text-[11px] text-text-secondary font-medium mt-1 whitespace-nowrap hidden sm:block">Live price data</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-sky-100/90 text-sky-800 border border-sky-200">Buyer</span>
            <span className="text-[11px] text-text-secondary font-medium mt-1 whitespace-nowrap hidden sm:block">Direct connections</span>
          </div>

        </div>
      )}
    </div>
  );
}
