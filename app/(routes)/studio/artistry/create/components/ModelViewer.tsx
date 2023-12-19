import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect } from 'react';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type ModelViewerProps = {
  modelPath: string; // Path to the 3D model file
};

const ModelViewer: React.FC<ModelViewerProps> = ({ modelPath }) => {
  const [model, setModel] = useState<THREE.Object3D | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const extension = modelPath.split('.').pop() || '';

    let loader: THREE.Loader | null = null;
    switch (extension.toLowerCase()) {
      case 'gltf':
      case 'glb':
        loader = new THREE.GLTFLoader();
        break;
      case 'fbx':
        loader = new THREE.FBXLoader();
        break;
      case 'obj':
        loader = new THREE.OBJLoader();
        break;
      case 'stl':
        loader = new THREE.STLLoader();
        break;
      case 'dae':
        loader = new THREE.ColladaLoader();
        break;
      default:
        setError('Unsupported file format');
        return;
    }

    loader.load(
      modelPath,
      (loadedModel) => {
        // Handle different model types accordingly
        if (extension === 'gltf' || extension === 'glb') {
          setModel(loadedModel.scene);
        } else {
          setModel(loadedModel);
        }
      },
      undefined,
      (error) => {
        setError(`Failed to load the model: ${error.message}`);
      }
    );
  }, [modelPath]);

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <Canvas>
        <Suspense fallback={<div>Loading...</div>}>
          {model && <primitive object={model} dispose={null} />}
          {error && <div>Error: {error}</div>}
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default ModelViewer;
