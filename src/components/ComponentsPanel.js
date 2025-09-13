import React, { useState, useEffect } from 'react';


function CustomDropdown({ options, value, onChange, placeholder = "Select option", isMobile = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);

  if (!isMobile) {
    return (
      <select
        className="form-select form-select-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="position-relative">
      <button
        type="button"
        className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minHeight: '44px',
          fontSize: '16px'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ zIndex: 1050 }}
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className="position-absolute bottom-100 start-0 end-0 bg-white border rounded shadow-lg"
            style={{ 
              zIndex: 1051,
              maxHeight: '200px',
              overflowY: 'auto',
              marginBottom: '4px'
            }}
          >
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                className={`btn w-100 text-start border-0 rounded-0 ${
                  option.value === value ? 'bg-dark text-white' : 'hover-bg-light'
                }`}
                onClick={() => handleSelect(option.value)}
                style={{
                  padding: '0.75rem',
                  fontSize: '16px',
                  lineHeight: '1.4',
                  minHeight: '44px'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


function ComponentsPanel({ components = [], selectedId, onToggle, onHighlight }) {
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
   
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  const filteredComponents = components.filter(component => {
    const matchesSearch = component.userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.userData.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.userData.expressID.toLowerCase().includes(searchTerm.toLowerCase());
   
    const matchesType = filterType === 'all' || component.userData.type.toLowerCase() === filterType.toLowerCase();
   
    return matchesSearch && matchesType;
  });


  const componentTypes = [...new Set(components.map(comp => comp.userData.type))].sort();
  const dropdownOptions = [
    { value: 'all', label: 'All Types' },
    ...componentTypes.map(type => ({ value: type, label: type }))
  ];


  const handleBulkToggle = (visible) => {
    filteredComponents.forEach(component => {
      if (component.userData.visible !== visible) {
        onToggle(component.userData.expressID, visible);
      }
    });
  };


  if (components.length === 0) {
    return (
      <div className="components-panel">
        <div className="p-3 text-muted bg-light rounded border text-center">
          <i className="bi bi-info-circle fs-4 mb-2 d-block"></i>
          <p className="mb-2">No components extracted yet</p>
          <small>Load an IFC file to see building components</small>
        </div>
      </div>
    );
  }


  return (
    <div className="d-flex flex-column h-100">
      <div className="mb-3">
        <div className="input-group mb-2">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={isMobile ? { fontSize: '16px' } : {}}
          />
          {searchTerm && (
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => setSearchTerm('')}
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        {isMobile && (
          <button
            className="btn btn-sm btn-outline-primary mb-2 w-100"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-funnel me-1"></i>
            Filters {showFilters ? '−' : '+'}
          </button>
        )}

        <div className={`${isMobile && !showFilters ? 'd-none' : ''}`}>
          <div className="row g-2 mb-2">
            <div className="col-12 col-md-6">
              <CustomDropdown
                options={dropdownOptions}
                value={filterType}
                onChange={setFilterType}
                placeholder="All Types"
                isMobile={isMobile}
              />
            </div>
            <div className="col-12 col-md-6">
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={() => handleBulkToggle(true)}
                  title="Show all filtered components"
                >
                  <i className="bi bi-eye"></i>
                  <span className={`${isMobile ? 'd-none' : 'd-none d-sm-inline'} ms-1`}>All</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleBulkToggle(false)}
                  title="Hide all filtered components"
                >
                  <i className="bi bi-eye-slash"></i>
                  <span className={`${isMobile ? 'd-none' : 'd-none d-sm-inline'} ms-1`}>None</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-muted small d-flex justify-content-between align-items-center">
          <span>
            {filteredComponents.length} of {components.length} components
          </span>
          {(searchTerm || filterType !== 'all') && (
            <button
              className="btn btn-sm btn-link p-0 text-decoration-none"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>


      <div className="components-panel flex-fill">
        {filteredComponents.length === 0 ? (
          <div className="p-3 text-muted bg-light rounded border text-center">
            <i className="bi bi-search fs-4 mb-2 d-block"></i>
            <p className="mb-0">No components match your filters</p>
          </div>
        ) : (
          filteredComponents.map((component) => (
            <div
              key={component.userData.expressID}
              className={`card mb-2 component-card ${
                selectedId === component.userData.expressID ? 'border-dark shadow-sm' : 'border-light'
              }`}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="component-info flex-grow-1">
                    <h6 className="component-title text-truncate" title={component.userData.name}>
                      {component.userData.name}
                    </h6>
                    <div className="component-meta">
                      <small className="d-flex align-items-center mb-1">
                        <i className="bi bi-tag me-1"></i>
                        <span className="text-truncate">{component.userData.type}</span>
                      </small>
                      <small className="d-block text-truncate">
                        ID: {component.userData.expressID}
                      </small>
                    </div>
                  </div>
                  <div className="form-check ms-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={component.userData.visible}
                      onChange={() => onToggle(component.userData.expressID, !component.userData.visible)}
                      id={`toggle-${component.userData.expressID}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`toggle-${component.userData.expressID}`}
                      title="Toggle visibility"
                    >
                      <i className={`bi ${component.userData.visible ? 'bi-eye text-success' : 'bi-eye-slash text-muted'}`}></i>
                    </label>
                  </div>
                </div>

                <div className={`${isMobile ? 'd-grid gap-2' : ''}`}>
                  <button
                    className={`btn btn-outline-danger btn-sm ${isMobile ? '' : 'w-100'} highlight-button`}
                    onClick={() => onHighlight(component.userData.expressID)}
                    title="Highlight component in 3D view"
                  >
                    <i className="bi bi-lightbulb me-1"></i>
                    Highlight
                    {selectedId === component.userData.expressID && (
                      <span className="spinner-border spinner-border-sm ms-2" role="status">
                        <span className="visually-hidden">Highlighting...</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


export default ComponentsPanel;