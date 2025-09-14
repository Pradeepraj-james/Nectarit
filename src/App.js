import React, { useState, useEffect } from 'react';
import { IfcViewer, ComponentsPanel } from './components';
import './App.css';

function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [componentList, setComponentList] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showComponents, setShowComponents] = useState(true);
  const [isComponentsPanelMinimized, setIsComponentsPanelMinimized] = useState(true);

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const isMobileDevice = width <= 767;
      const isTabletDevice = width >= 768 && width <= 991;
      
      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
      
      if (isMobileDevice && componentList.length === 0) {
        setShowComponents(false);
      } else if (!isMobileDevice) {
        setShowComponents(true);
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    
    return () => window.removeEventListener('resize', checkDeviceType);
  }, [componentList.length]);

  const handleToggle = (id, visible) => {
    setComponentList(prev => {
      return prev.map(component => {
        if (component.userData.expressID === id) {
          component.userData.visible = visible;
          component.visible = visible;
        }
        return component;
      });
    });
    console.log('Toggle component:', id, 'visible:', visible);
  };

  const handleMobilePanelToggle = () => {
  if (isMobile) {
    setIsComponentsPanelMinimized(!isComponentsPanelMinimized);
  }
};

  const handleHighlight = (id) => {
    const component = componentList.find(comp => comp.userData.expressID === id);
    if (!component) return;

    const originalMaterial = component.userData.originalMaterial;
    
    const highlightMaterial = originalMaterial.clone();
    highlightMaterial.color.setHex(0xff0000);
    highlightMaterial.emissive.setHex(0x330000);
    
    let blinkCount = 0;
    const maxBlinks = 8;
    
    const blink = () => {
      if (blinkCount % 2 === 0) {
        component.material = highlightMaterial;
      } else {
        component.material = originalMaterial;
      }
      blinkCount++;
      
      if (blinkCount < maxBlinks) {
        setTimeout(blink, 250);
      } else {
        component.material = originalMaterial;
        setSelectedId(null);
      }
    };
    
    setSelectedId(id);
    blink();
    console.log('Highlight component:', id);
  };

  const handleComponentSelect = (id) => {
    setSelectedId(id);
  };

  const handleComponentListUpdate = (list) => {
    setComponentList(list);
    if (list.length > 0 && (isMobile || isTablet)) {
      setShowComponents(true);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="mb-0 fw-bold d-flex align-items-center">
                <span className=" app-subtitle d-none d-sm-inline">IFC BIM File Viewer</span>
                <span className="d-inline d-sm-none">IFC Viewer</span>
              </h2>
            </div>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <section className="viewer-section">
          <IfcViewer
            onSelect={handleComponentSelect}
            onComponentList={handleComponentListUpdate}
          />
        </section>
        
        {isMobile && showComponents && (
          <>
            <button 
              className="btn btn-dark mobile-toggle-btn"
              onClick={handleMobilePanelToggle}
              title="Toggle Components Panel"
            >
              <i className={`bi ${isComponentsPanelMinimized ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </button>
            
            <aside className={`components-section ${isComponentsPanelMinimized ? 'mobile-hidden' : ''}`} style={{ backgroundColor: 'white' }}>
              <div className="mobile-handle" onClick={handleMobilePanelToggle}></div>
              
              <div className="h-100 p-2">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-list-ul me-2"></i>
                    Components
                    {componentList.length > 0 && (
                      <span className="badge components-count-badge ms-2">{componentList.length}</span>
                    )}
                  </h5>
                  
                </div>
                <ComponentsPanel
                  selectedId={selectedId}
                  components={componentList}
                  onToggle={handleToggle}
                  onHighlight={handleHighlight}
                />
              </div>
            </aside>
          </>
        )}
        
        {!isMobile && showComponents && (
          <aside className={`components-section ${isTablet ? 'col-12' : 'col-md-3'}`} style={{ backgroundColor: 'white' }}>
            <div className="h-100 p-2 p-md-3">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-list-ul me-2"></i>
                  Components
                  {componentList.length > 0 && (
                    <span className="badge bg-dark ms-2">{componentList.length}</span>
                  )}
                </h5>
              
              </div>
              <ComponentsPanel
                selectedId={selectedId}
                components={componentList}
                onToggle={handleToggle}
                onHighlight={handleHighlight}
              />
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

export default App;
