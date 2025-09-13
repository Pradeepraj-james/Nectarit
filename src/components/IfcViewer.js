import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MockIFCLoader } from '../utils/MockIFCLoader';

function IfcViewer({ onSelect, onComponentList }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const threeRef = useRef({ 
    scene: null, 
    camera: null, 
    renderer: null, 
    model: null, 
    ifcLoader: null,
    components: {},
    controls: {
      isMouseDown: false,
      isTouchActive: false,
      mouseX: 0,
      mouseY: 0,
      targetX: 0,
      targetY: 0,
      radius: 20,
      touchStartDistance: 0,
      lastTouchTime: 0
    }
  });

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      
      setIsMobile(width <= 767);
      setIsTablet(width >= 768 && width <= 991);
      
      if (width <= 575) {
        const timer = setTimeout(() => setShowControls(false), 5000);
        return () => clearTimeout(timer);
      } else {
        setShowControls(true);
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  const handleResize = useCallback(() => {
    const mount = mountRef.current;
    const renderer = threeRef.current.renderer;
    const camera = threeRef.current.camera;
    
    if (!mount || !renderer || !camera) return;
    
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    const fov = isMobile ? 85 : 75; 
    const camera = new THREE.PerspectiveCamera(
      fov, 
      mount.clientWidth / mount.clientHeight, 
      0.1, 
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, 
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    });
    
    const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 3);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = !isMobile; 
    if (!isMobile) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, isMobile ? 0.8 : 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, isMobile ? 0.8 : 1);
    directionalLight.position.set(50, 50, 50);
    
    if (!isMobile) {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 500;
    }
    scene.add(directionalLight);

    const gridSize = isMobile ? 10 : 20;
    const gridDivisions = isMobile ? 10 : 20;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0x888888);
    gridHelper.material.opacity = isMobile ? 0.2 : 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(isMobile ? 3 : 5);
    scene.add(axesHelper);

    const initialRadius = isMobile ? 25 : 15;
    camera.position.set(initialRadius, initialRadius * 0.6, initialRadius);
    camera.lookAt(0, 0, 0);

    threeRef.current.scene = scene;
    threeRef.current.camera = camera;
    threeRef.current.renderer = renderer;
    threeRef.current.controls.radius = initialRadius;

    const controls = threeRef.current.controls;
    
    const handleMouseDown = (e) => {
      if (e.button === 0) {
        controls.isMouseDown = true;
        controls.mouseX = e.clientX;
        controls.mouseY = e.clientY;
        renderer.domElement.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (!controls.isMouseDown) return;
      
      const sensitivity = isMobile ? 0.015 : 0.01;
      const deltaX = e.clientX - controls.mouseX;
      const deltaY = e.clientY - controls.mouseY;
      
      controls.targetX += deltaX * sensitivity;
      controls.targetY = Math.max(
        -Math.PI/2 + 0.1, 
        Math.min(Math.PI/2 - 0.1, controls.targetY + deltaY * sensitivity)
      );
      
      controls.mouseX = e.clientX;
      controls.mouseY = e.clientY;
      
      setShowControls(true);
    };

    const handleMouseUp = () => {
      controls.isMouseDown = false;
      renderer.domElement.style.cursor = 'grab';
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const scale = e.deltaY > 0 ? 1.1 : 0.9;
      const minRadius = isMobile ? 8 : 5;
      const maxRadius = isMobile ? 150 : 100;
      controls.radius = Math.max(minRadius, Math.min(maxRadius, controls.radius * scale));
      
      setShowControls(true);
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touches = e.touches;
      
      if (touches.length === 1) {
        controls.isTouchActive = true;
        controls.mouseX = touches[0].clientX;
        controls.mouseY = touches[0].clientY;
        controls.lastTouchTime = Date.now();
      } else if (touches.length === 2) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        controls.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
      }
      
      setShowControls(true);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touches = e.touches;
      
      if (touches.length === 1 && controls.isTouchActive) {
        const sensitivity = 0.02;
        const deltaX = touches[0].clientX - controls.mouseX;
        const deltaY = touches[0].clientY - controls.mouseY;
        
        controls.targetX += deltaX * sensitivity;
        controls.targetY = Math.max(
          -Math.PI/2 + 0.1, 
          Math.min(Math.PI/2 - 0.1, controls.targetY + deltaY * sensitivity)
        );
        
        controls.mouseX = touches[0].clientX;
        controls.mouseY = touches[0].clientY;
      } else if (touches.length === 2 && controls.touchStartDistance > 0) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const scale = controls.touchStartDistance / distance;
        controls.radius = Math.max(8, Math.min(150, controls.radius * scale * 0.1 + controls.radius * 0.9));
        controls.touchStartDistance = distance;
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      controls.isTouchActive = false;
      controls.touchStartDistance = 0;
      
      if (e.touches.length === 0 && Date.now() - controls.lastTouchTime < 300) {
        setTimeout(() => {
          if (Date.now() - controls.lastTouchTime < 500) {
            controls.targetX = 0.5;
            controls.targetY = 0.3;
            controls.radius = isMobile ? 25 : 15;
          }
        }, 300);
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.touchAction = 'none'; 

    if (isMobile) {
      renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      renderer.domElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    } else {
      renderer.domElement.addEventListener('mousedown', handleMouseDown);
      renderer.domElement.addEventListener('mousemove', handleMouseMove);
      renderer.domElement.addEventListener('mouseup', handleMouseUp);
      renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    }
    
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    let rafId;
    let lastFrameTime = 0;
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime) => {
      rafId = requestAnimationFrame(animate);
      
      if (currentTime - lastFrameTime < frameInterval) return;
      lastFrameTime = currentTime;
      
      const { targetX, targetY, radius } = controls;
      const lerpFactor = isMobile ? 0.08 : 0.1;
      
      const targetCameraX = radius * Math.sin(targetX) * Math.cos(targetY);
      const targetCameraY = radius * Math.sin(targetY);
      const targetCameraZ = radius * Math.cos(targetX) * Math.cos(targetY);
      
      camera.position.x += (targetCameraX - camera.position.x) * lerpFactor;
      camera.position.y += (targetCameraY - camera.position.y) * lerpFactor;
      camera.position.z += (targetCameraZ - camera.position.z) * lerpFactor;
      
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
      
      if (isMobile) {
        renderer.domElement.removeEventListener('touchstart', handleTouchStart);
        renderer.domElement.removeEventListener('touchmove', handleTouchMove);
        renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      } else {
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        renderer.domElement.removeEventListener('mouseup', handleMouseUp);
        renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      }
      renderer.domElement.removeEventListener('wheel', handleWheel);
      
      try {
        renderer.dispose();
        if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
    };
  }, [isMobile, isTablet, handleResize]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.ifc')) {
      setError('Please select a valid IFC file (.ifc extension required)');
      setFileName('');
      return;
    }

    setLoading(true);
    setError('');
    setFileName(file.name);

    try {
      const loader = new MockIFCLoader();
      loader.ifcManager.setWasmPath('/wasm/');
      threeRef.current.ifcLoader = loader;

      const arrayBuffer = await file.arrayBuffer();
      const scene = threeRef.current.scene;
      
      if (threeRef.current.model) {
        scene.remove(threeRef.current.model);
      }
      
      const model = await loader.parse(arrayBuffer);
      scene.add(model);
      threeRef.current.model = model;
      threeRef.current.components = model.userData.components;

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      
      const multiplier = isMobile ? 2.0 : isTablet ? 1.7 : 1.5;
      const distance = maxSize * multiplier;
      
      threeRef.current.controls.radius = distance;
      threeRef.current.controls.targetX = 0.5;
      threeRef.current.controls.targetY = 0.3;

      try {
        const manager = loader.ifcManager;
        const modelID = model.ifcModel.modelID;
        await manager.getAllItemsOfType(modelID, 0, true);
        
        const componentList = Object.values(model.userData.components);
        if (typeof onComponentList === 'function') {
          onComponentList(componentList);
        }
      } catch (errExtract) {
        console.warn('Failed to extract component list:', errExtract);
        const componentList = Object.values(model.userData.components);
        if (typeof onComponentList === 'function') {
          onComponentList(componentList);
        }
      }
    } catch (err) {
      console.error('Failed to load IFC:', err);
      setError(`Failed to load IFC file: ${err.message || err}`);
      setFileName('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="p-2 p-md-3 bg-light border-bottom">
        <div className="row align-items-center g-2">
          <div className="col">
            <div className="input-group">
              <input 
                type="file" 
                accept=".ifc" 
                onChange={handleFile} 
                className="form-control file-input"
                id="ifcFileInput"
              />
              <label className="input-group-text" htmlFor="ifcFileInput">
                <i className="bi bi-upload"></i>
              </label>
            </div>
            {fileName && !error && (
              <small className="text-success mt-1 d-block">
                <i className="bi bi-check-circle me-1"></i>
                <span className="d-inline d-md-none">Loaded</span>
                <span className="d-none d-md-inline">Loaded: {fileName}</span>
              </small>
            )}
          </div>
          {loading && (
            <div className="col-auto">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2 text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="text-muted d-none d-md-inline">Loading IFC...</span>
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="alert alert-danger mt-2 mb-0 py-2" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <span className="small">{error}</span>
          </div>
        )}
      </div>

      <div className="position-relative flex-fill">
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        
        {loading && (
          <div className="loading-overlay">
            <div className="text-center">
              <div className="loading-spinner spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Processing IFC file...</p>
            </div>
          </div>
        )}
        
        {!loading && threeRef.current.model && showControls && (
          <div className="controls-hint">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-bold">Controls</span>
              {(isMobile || isTablet) && (
                <button 
                  className="btn btn-sm btn-link text-white p-0"
                  onClick={() => setShowControls(false)}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
            {isMobile ? (
              <small>
                <i className="bi bi-hand-index me-1"></i>Touch & drag to rotate<br/>
                <i className="bi bi-arrows-angle-expand me-1"></i>Pinch to zoom<br/>
                <i className="bi bi-arrow-clockwise me-1"></i>Double tap to reset
              </small>
            ) : (
              <small>
                <i className="bi bi-mouse me-1"></i>Click & drag to rotate<br/>
                <i className="bi bi-arrow-up-circle me-1"></i>Scroll to zoom
              </small>
            )}
          </div>
        )}

        {!loading && threeRef.current.model && !showControls && (isMobile || isTablet) && (
          <button 
            className="btn btn-dark btn-sm position-absolute top-0 end-0 m-2"
            onClick={() => setShowControls(true)}
            style={{ opacity: 0.7 }}
          >
            <i className="bi bi-question-circle"></i>
          </button>
        )}
      </div>
    </div>
  );
}

export default IfcViewer;