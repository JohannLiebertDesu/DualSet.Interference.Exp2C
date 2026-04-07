/**
 * Compute equally-spaced positions on an invisible circle.
 *
 * All positions use origin_center: true coordinates (0, 0 = canvas centre).
 *
 * @param {number} n            Number of items to place.
 * @param {number} radius       Circle radius in pixels.
 * @param {number|null} offsetDeg  Rotational offset in degrees applied to the
 *                                 whole array.  null → uniform random [0, 360).
 * @returns {{ positions: {x: number, y: number}[], offsetDeg: number }}
 */
export function getRingPositions(n, radius, offsetDeg = null) {
  const offset = offsetDeg ?? Math.random() * 360;
  const offsetRad = (offset * Math.PI) / 180;
  const step = (2 * Math.PI) / n;

  const positions = [];
  for (let i = 0; i < n; i++) {
    const angle = offsetRad + i * step;
    positions.push({
      x: Math.round(radius * Math.cos(angle)),
      y: Math.round(radius * Math.sin(angle)),
    });
  }

  return { positions, offsetDeg: offset };
}
