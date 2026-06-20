interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function sphericalFibonacci(n: number, radius: number): Vec3[] {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 0, y: radius, z: 0 }];

  const points: Vec3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;

    points.push({
      x: Math.cos(theta) * r * radius,
      y: y * radius,
      z: Math.sin(theta) * r * radius,
    });
  }

  return points;
}

export function collisionAvoidance(
  positions: Vec3[],
  minDistance: number
): Vec3[] {
  const result = positions.map((p) => ({ ...p }));
  const maxIter = 5;
  const factor = 0.5;

  for (let iter = 0; iter < maxIter; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[i].x - result[j].x;
        const dy = result[i].y - result[j].y;
        const dz = result[i].z - result[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < minDistance && dist > 0.001) {
          const overlap = (minDistance - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          result[i].x += nx * overlap * factor;
          result[i].y += ny * overlap * factor;
          result[i].z += nz * overlap * factor;
          result[j].x -= nx * overlap * factor;
          result[j].y -= ny * overlap * factor;
          result[j].z -= nz * overlap * factor;
        }
      }
    }
  }

  return result;
}

export function constellationLayout(count: number, radius: number): Vec3[] {
  return sphericalFibonacci(count, radius);
}