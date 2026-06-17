'use client';

import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/lib/store';
import Starfield from './Starfield';
import Constellation from './Constellation';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function CosmosScene() {
  const periods = useAppStore((s) => s.periods);
  const viewState = useAppStore((s) => s.viewState);
  const activeArtist = useAppStore((s) => s.activeArtist);
  const activePeriod = useAppStore((s) => s.activePeriod);

  const controlsRef = useRef<OrbitControlsImpl>(null);

  const animatingRef = useRef(false);
  const animStartRef = useRef<number>(0);
  const animDuration = 1.2;
  const startPosRef = useRef(new THREE.Vector3());
  const endPosRef = useRef(new THREE.Vector3());
  const startTargetRef = useRef(new THREE.Vector3());
  const endTargetRef = useRef(new THREE.Vector3());

  const isLocked = viewState === 'TRANSITIONING' || viewState === 'GALLERY';

  useEffect(() => {
    if (!activeArtist || !activePeriod || !controlsRef.current) return;
    if (viewState !== 'ARTIST_OVERLAY') return;

    const worldPos = new THREE.Vector3(
      activePeriod.cosmosPosition.x + activeArtist.localPosition.x * 3,
      activePeriod.cosmosPosition.y + activeArtist.localPosition.y * 3,
      activePeriod.cosmosPosition.z + activeArtist.localPosition.z * 3
    );

    const dir = worldPos.clone().normalize();
    const targetPos = worldPos.clone().add(dir.multiplyScalar(4));

    startPosRef.current.copy(controlsRef.current.object.position);
    endPosRef.current.copy(targetPos);
    startTargetRef.current.copy(controlsRef.current.target);
    endTargetRef.current.copy(worldPos);

    animStartRef.current = performance.now() / 1000;
    animatingRef.current = true;
    controlsRef.current.enabled = false;
  }, [activeArtist, activePeriod, viewState]);

  useFrame(() => {
    if (!animatingRef.current || !controlsRef.current) return;

    const elapsed = (performance.now() / 1000) - animStartRef.current;
    const t = Math.min(elapsed / animDuration, 1);
    const eased = easeInOutCubic(t);

    const controls = controlsRef.current;
    controls.object.position.lerpVectors(startPosRef.current, endPosRef.current, eased);

    const target = new THREE.Vector3();
    target.lerpVectors(startTargetRef.current, endTargetRef.current, eased);
    controls.target.copy(target);
    controls.update();

    if (t >= 1) {
      animatingRef.current = false;
      if (!isLocked) {
        controls.enabled = true;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={1} color="#c9a84c" />

      <Starfield />

      {periods.map((period) => (
        <Constellation key={period.id} period={period} />
      ))}

      <OrbitControls
        ref={controlsRef}
        enabled={!isLocked}
        enableDamping={true}
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={60}
        maxPolarAngle={Math.PI * 0.8}
        zoomSpeed={1.2}
      />
    </>
  );
}