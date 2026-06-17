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