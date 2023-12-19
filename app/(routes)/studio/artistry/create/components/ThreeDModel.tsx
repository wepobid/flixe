"use client";

import React, {
  Suspense,
  useState,
  useEffect,
  useLayoutEffect,
  Fragment,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThreeDModelProps = {
  modelUrl: string;
  modelScale: number;
  animate?: boolean;
  enableDamping?: boolean;
  enablePan?: boolean;
  enableZoom?: boolean;
  loader?: JSX.Element;
};

type CameraSetupProps = {
  position: [number, number, number];
};

const CameraSetup = ({ position }: CameraSetupProps) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(0, 0, 0);
  }, [camera, position]);

  return null;
};

const ThreeDModel = ({
  modelUrl,
  modelScale,
  animate = true,
  enableDamping = false,
  enablePan = false,
  enableZoom = false,
  loader,
}: ThreeDModelProps) => {
  const [modelAnimation, setmodelAnimation] = useState<
    { id: string; name: string }[]
  >([]);

  const [selectedAnimation, setSelectedAnimation] = useState<number>(0);

  function Model({ url }: { url: string }) {
    const { scene, animations } = useGLTF(url, true);

    useLayoutEffect(() => {
      if (animate && animations.length > 0 && modelAnimation.length === 0) {
        setmodelAnimation(
          animations.map((animation: any, index: any) => {
            // Check if the animation name is 'mixamo.com' and replace it with 'default'
            const name = animation.name === 'mixamo.com' ? 'default' : animation.name;
            return { id: index.toString(), name: name };
          })
        );
      }
    }, [animations]);    

    // initialize mixer in useMemo to avoid re-creating it on every frame
    const mixer = React.useMemo(() => new THREE.AnimationMixer(scene), [scene]);

    useEffect(() => {
      if (animate && mixer && animations[selectedAnimation]) {
        mixer.clipAction(animations[selectedAnimation]).play();
      }
    }, [animations, mixer, selectedAnimation]); // eslint-disable-line react-hooks/exhaustive-deps

    useFrame((state, delta) => {
      if (animate && mixer) {
        mixer.update(delta);
      }
    });

    scene.position.y = -100;

    return <primitive object={scene} dispose={null} />;
  }

  console.log(modelUrl);

  return (
    <Fragment>
      <div className="absolute m-6 z-40 w-36">
        {animate && selectedAnimation !== null && modelAnimation.length > 0 && (
          <Select
            value={selectedAnimation.toString()}
            onValueChange={(value) => setSelectedAnimation(parseInt(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Animation" />
            </SelectTrigger>
            <SelectContent>
              {modelAnimation.map((animation, index) => (
                <SelectItem key={animation.id} value={index.toString()}>
                  {animation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Canvas>
        <CameraSetup position={[0, 0, 200]} />
        <ambientLight intensity={3} />
        <spotLight position={[10, 15, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -15, -10]} />
        <Suspense fallback={<Html center>{loader ? loader : null}</Html>}>
          <Bounds fit clip observe margin={modelScale}>
            <Model url={modelUrl} />
          </Bounds>
        </Suspense>
        <OrbitControls
          autoRotate={!animate}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
          enableDamping={enableDamping}
          enablePan={enablePan}
          enableZoom={enableZoom}
          minDistance={5}
          maxDistance={10}
        />
      </Canvas>
    </Fragment>
  );
};

export default ThreeDModel;
