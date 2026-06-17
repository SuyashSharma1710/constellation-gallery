export function sphericalFibonacci(samples: number, radius: number = 1): Array<{ x: number; y: number; z: number }> {
  const points: Array<{ x: number; y: number; z: number }> = [];

  if (samples <= 1) {
    return [{ x: 0, y: radius, z: 0 }];
  }

  const phi = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;

    points.push({
      x: Math.cos(theta) * radiusAtY * radius,
      y: y * radius,
      z: Math.sin(theta) * radiusAtY * radius,
    });
  }

  return points;
}

export function spiralLayout(count: number, radius: number): Array<{ x: number; y: number; z: number }> {
  const points: Array<{ x: number; y: number; z: number }> = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 * 3;
    const r = (i / count) * radius;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = (Math.random() - 0.5) * 2;

    points.push({ x, y, z });
  }

  return points;
}

export function constellationLayout(count: number, spacing: number = 18): Array<{ x: number; y: number; z: number }> {
  const points: Array<{ x: number; y: number; z: number }> = [];
  const angleStep = (Math.PI * 2 * 3) / count;

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i;
    const r = Math.sqrt(i + 1) * spacing;
    points.push({
      x: Math.cos(angle) * r,
      y: (Math.sin(i * 1.7) * 3),
      z: Math.sin(angle) * r,
    });
  }

  return points;
}

export function collisionAvoidance(
  points: Array<{ x: number; y: number; z: number }>,
  minDistance: number = 0.5
): Array<{ x: number; y: number; z: number }> {
  const result = points.map((p) => ({ ...p }));
  const maxIterations = 10;

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[j].x - result[i].x;
        const dy = result[j].y - result[i].y;
        const dz = result[j].z - result[i].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < minDistance && dist > 0.001) {
          const push = (minDistance - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          result[i].x -= nx * push;
          result[i].y -= ny * push;
          result[i].z -= nz * push;
          result[j].x += nx * push;
          result[j].y += ny * push;
          result[j].z += nz * push;
          moved = true;
        }
      }
    }

    if (!moved) break;
  }

  return result;
}