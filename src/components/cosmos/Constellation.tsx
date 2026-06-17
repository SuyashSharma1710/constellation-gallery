'use client';

import { useMemo } from 'react';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { PeriodConstellation } from '@/lib/data/types';
import ArtistStar from './ArtistStar';

interface ConstellationProps {
  period: PeriodConstellation;
}

export default function Constellation({ period }: ConstellationProps) {
  const center = useMemo(
    () => new THREE.Vector3(period.cosmosPosition.x, period.cosmosPosition.y, period.cosmosPosition.z),
    [period.cosmosPosition]
  );

  const lines = useMemo(() => {
    const pairs: Array<[THREE.Vector3, THREE.Vector3]> = [];
    const artists = period.artists;

    for (let i = 0; i < artists.length; i++) {
      for (let j = i + 1; j < artists.length; j++) {
        pairs.push([
          new THREE.Vector3(
            center.x + artists[i].localPosition.x * 3,
            center.y + artists[i].localPosition.y * 3,
            center.z + artists[i].localPosition.z * 3
          ),
          new THREE.Vector3(
            center.x + artists[j].localPosition.x * 3,
            center.y + artists[j].localPosition.y * 3,
            center.z + artists[j].localPosition.z * 3
          ),
        ]);
      }
    }
    return pairs;
  }, [period.artists, center]);

  return (
    <group>
      <Text
        position={[center.x, center.y + 3.5, center.z]}
        fontSize={0.8}
        color="#c9a84c"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Cinzel-Regular.ttf"
        outlineWidth={0.02}
        outlineColor="#0a0a0f"
      >
        {period.name}
      </Text>

      {lines.map(([start, end], i) => (
        <Line
          key={i}
          points={[start, end]}
          color="#c9a84c"
          lineWidth={0.3}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      ))}

      {period.artists.map((artist) => (
        <ArtistStar
          key={artist.id}
          artist={artist}
          period={period}
          constellationPosition={period.cosmosPosition}
        />
      ))}
    </group>
  );
}