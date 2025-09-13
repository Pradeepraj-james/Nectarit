import * as THREE from 'three';

export class MockIFCLoader {
  constructor() {
    this.ifcManager = {
      setWasmPath: (path) => console.log('WASM path set to:', path),
      getAllItemsOfType: async (modelID, type, recursive) => {
        return [
          { expressID: 'wall_001', name: 'Wall 001', type: 'Wall' },
          { expressID: 'wall_002', name: 'Wall 002', type: 'Wall' },
          { expressID: 'column_001', name: 'Column 001', type: 'Column' },
          { expressID: 'beam_001', name: 'Beam 001', type: 'Beam' },
          { expressID: 'slab_001', name: 'Slab 001', type: 'Slab' }
        ];
      }
    };
  }

  async parse(arrayBuffer) {
    const group = new THREE.Group();
    const components = {};
    
    const wallGeometry = new THREE.BoxGeometry(8, 3, 0.5);
    const columnGeometry = new THREE.BoxGeometry(0.5, 3, 0.5);
    const beamGeometry = new THREE.BoxGeometry(8, 0.3, 0.5);
    const slabGeometry = new THREE.BoxGeometry(8, 0.2, 8);
    
    const materials = {
      wall: new THREE.MeshLambertMaterial({ color: 0x8B4513 }), // Brown
      column: new THREE.MeshLambertMaterial({ color: 0x696969 }), // Gray
      beam: new THREE.MeshLambertMaterial({ color: 0x4682B4 }), // Steel Blue
      slab: new THREE.MeshLambertMaterial({ color: 0xDC143C }) // Crimson
    };
    
    const componentData = [
      { id: 'wall_001', geometry: wallGeometry, material: materials.wall, position: [0, 1.5, 4], name: 'Wall 001', type: 'Wall' },
      { id: 'wall_002', geometry: wallGeometry, material: materials.wall, position: [0, 1.5, -4], name: 'Wall 002', type: 'Wall' },
      { id: 'column_001', geometry: columnGeometry, material: materials.column, position: [-3.5, 1.5, 0], name: 'Column 001', type: 'Column' },
      { id: 'beam_001', geometry: beamGeometry, material: materials.beam, position: [0, 3, 0], name: 'Beam 001', type: 'Beam' },
      { id: 'slab_001', geometry: slabGeometry, material: materials.slab, position: [0, 0.1, 0], name: 'Slab 001', type: 'Slab' }
    ];
    
    componentData.forEach(comp => {
      const mesh = new THREE.Mesh(comp.geometry, comp.material.clone());
      mesh.position.set(...comp.position);
      mesh.userData = { 
        expressID: comp.id,
        name: comp.name,
        type: comp.type,
        visible: true,
        originalMaterial: mesh.material.clone()
      };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      components[comp.id] = mesh;
    });
    
    group.userData = { components, modelID: Date.now() };
    group.ifcModel = { modelID: group.userData.modelID };
    return group;
  }
}