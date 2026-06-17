'use client';

import { useRef, useState, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ArtistNode, PeriodConstellation } from '@/lib/data/types';
import { useAppStore } from '@/lib/store';

interface ArtistStarProps {
  artist: ArtistNode;
  period: PeriodConstellation;
  constellationPosition: { x: number; y: number; z: number };
}

export default function ArtistStar({ artist, period, constellationPosition }: ArtistStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const selectArtist = useAppStore((s) => s.selectArtist);

  const worldPosition = useMemo(
    () => new THREE.Vector3(
      constellationPosition.x + artist.localPosition.x * 3,
      constellationPosition.y + artist.localPosition.y * 3,
      constellationPosition.z + artist.localPosition.z * 3
    ),
    [constellationPosition.x, constellationPosition.y, constellationPosition.z, artist.localPosition]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2 + parseFloat(artist.id.slice(1)) % 10) * 0.1;
    meshRef.current.scale.setScalar(hovered ? 1.5 : pulse);
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectArtist(period, artist);
  };

  return (
    <group position={worldPosition}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ffd700' : '#c9a84c'}
          emissive={hovered ? '#ffd700' : '#c9a84c'}
          emissiveIntensity={hovered ? 1.5 : 0.6}
          roughness={0.3}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial
          color="#c9a84c"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {hovered && (
        <Html distanceFactor={30} center>
          <div className="pointer-events-none whitespace-nowrap rounded-lg border border-glass-border bg-glass-panel px-3 py-1.5 text-center backdrop-blur-md">
            <p className="font-cinzel text-xs text-star-white">{artist.name}</p>
            {artist.portraitThumbnailUrl && (
              <img
                src={artist.portraitThumbnailUrl}
                alt={artist.name}
                className="mt-1 h-10 w-10 rounded-full object-cover"
              />
            )}
            <p className="mt-0.5 font-inter text-[10px] text-star-white/60">
              {artist.birthYear}–{artist.deathYear}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}