/**
 * Point-in-polygon utility using the Ray-casting algorithm.
 * Used for checking if a customer address (lat, lng) falls within a delivery zone.
 * 
 * @param point [latitude, longitude]
 * @param polygon Array of [latitude, longitude] points forming a closed loop
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}
