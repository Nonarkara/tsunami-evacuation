/** Deterministic FIFO point-queue exercise. Not calibrated evacuation ABMS. */
export type Coord = [number, number];
export type ExerciseRoute = { name: string; nodeIds: string[]; coordinates: Coord[]; osmWays: string[] };
export type RouteData = { source: string; accessed: string; destination: Coord; routes: ExerciseRoute[] };
export type Leg = { from: Coord; to: Coord; arrival: number; enter: number; exit: number; edge: string };
export type Person = { id: number; route: number; legs: Leg[]; finish: number };
export type Rehearsal = { people: Person[]; duration: number; bottleneck: string; distance: number[]; maxQueueWait: number };
export function distance(a: Coord, b: Coord) {
  const rad = Math.PI / 180, dy = (b[1] - a[1]) * rad, dx = (b[0] - a[0]) * rad;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.sin(dy / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dx / 2) ** 2));
}
export function simulate(data: RouteData, count: number, speed: number, width: number): Rehearsal {
  if (!Number.isInteger(count) || count < 1 || count > 10000 || !Number.isFinite(speed) || !Number.isFinite(width) || speed <= 0 || width <= 0) throw new Error('Invalid exercise inputs');
  // The route snapshot is a shortest-path tree: each shared node has one downstream link.
  const nodes = new Map<string, { from: Coord; to: Coord; next: string; remaining: number; arrivals: { id: number; time: number }[] }>();
  const lengths = data.routes.map(r => r.coordinates.slice(1).reduce((v, p, i) => v + distance(r.coordinates[i], p), 0));
  data.routes.forEach(r => {
    let remaining = 0;
    for (let j = r.nodeIds.length - 2; j >= 0; j--) {
      remaining += distance(r.coordinates[j], r.coordinates[j + 1]);
      const id = r.nodeIds[j], next = r.nodeIds[j + 1];
      if (nodes.has(id) && nodes.get(id)!.next !== next) throw new Error('Routes must share a downstream tree');
      if (!nodes.has(id)) nodes.set(id, { from: r.coordinates[j], to: r.coordinates[j + 1], next, remaining, arrivals: [] });
    }
  });
  // A shared link near the endpoint is an experimental pinch point, not a surveyed obstruction.
  const shared = [...nodes].filter(([id]) => data.routes.every(r => r.nodeIds.includes(id))).sort((a, b) => b[1].remaining - a[1].remaining);
  const bottleneck = shared[Math.min(2, shared.length - 1)]?.[0] ?? data.routes[0].nodeIds[0];
  const people: Person[] = Array.from({ length: count }, (_, id) => ({ id, route: id % data.routes.length, legs: [], finish: 0 }));
  people.forEach(p => nodes.get(data.routes[p.route].nodeIds[0])!.arrivals.push({ id: p.id, time: Math.floor(p.id / data.routes.length) * 0.15 }));
  let maxQueueWait = 0;
  [...nodes].sort((a, b) => b[1].remaining - a[1].remaining).forEach(([id, n]) => {
    n.arrivals.sort((a, b) => a.time - b.time || a.id - b.id);
    let nextEntry = 0;
    const headway = 1 / (1.2 * (id === bottleneck ? width : 6));
    n.arrivals.forEach(a => {
      const enter = Math.max(a.time, nextEntry), exit = enter + distance(n.from, n.to) / speed;
      nextEntry = enter + headway;
      maxQueueWait = Math.max(maxQueueWait, enter - a.time);
      people[a.id].legs.push({ from: n.from, to: n.to, arrival: a.time, enter, exit, edge: id });
      people[a.id].finish = exit;
      nodes.get(n.next)?.arrivals.push({ id: a.id, time: exit });
    });
  });
  return { people, duration: Math.ceil(Math.max(...people.map(p => p.finish))), bottleneck, distance: lengths, maxQueueWait };
}
export function frame(model: Rehearsal, seconds: number) {
  let arrived = 0, queued = 0, walking = 0, pending = 0;
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  const groups = new Map<string, GeoJSON.Feature<GeoJSON.Point>>();
  model.people.forEach(p => {
    if (seconds >= p.finish) { arrived++; return; }
    let lo = 0, hi = p.legs.length - 1;
    while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (p.legs[mid].exit <= seconds) lo = mid + 1; else hi = mid; }
    const leg = p.legs[lo];
    if (seconds < leg.arrival) pending++;
    else if (seconds < leg.enter) queued++;
    else walking++;
    const moving = seconds >= leg.enter;
    const t = moving ? Math.min(1, (seconds - leg.enter) / (leg.exit - leg.enter)) : 0;
    // Point queues have no modeled physical footprint. Aggregate at the exact node.
    const status = seconds < leg.arrival ? 'pending' : seconds < leg.enter ? 'queued' : 'walking';
    const coordinates: Coord = [leg.from[0] + (leg.to[0] - leg.from[0]) * t, leg.from[1] + (leg.to[1] - leg.from[1]) * t];
    if (moving) {
      features.push({ type: 'Feature', properties: { status, count: 1, person: p.id, route: p.route, edge: leg.edge }, geometry: { type: 'Point', coordinates } });
    } else {
      const key = `${status}:${leg.edge}`;
      const existing = groups.get(key);
      if (existing) existing.properties!.count++;
      else groups.set(key, { type: 'Feature', properties: { status, count: 1, edge: leg.edge }, geometry: { type: 'Point', coordinates: [...leg.from] } });
    }
  });
  features.push(...groups.values());
  return { arrived, queued, walking, pending, type: 'FeatureCollection' as const, features };
}
export type TerrainGrid = { w: number; h: number; west: number; east: number; north: number; south: number; heights: number[]; source: string; accessed: string };
export function elevation(grid: TerrainGrid, p: Coord) {
  if (p[0] < grid.west || p[0] > grid.east || p[1] < grid.south || p[1] > grid.north) return null;
  const x = Math.round((p[0] - grid.west) / (grid.east - grid.west) * (grid.w - 1));
  const y = Math.round((grid.north - p[1]) / (grid.north - grid.south) * (grid.h - 1));
  return grid.heights[y * grid.w + x];
}
/** Static ocean-connected terrain screening, NEVER a tsunami footprint. */
export function waterScreen(grid: TerrainGrid, level: number): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const seen = new Uint8Array(grid.w * grid.h), queue: number[] = [];
  for (let y = 0; y < grid.h; y++) { const i = y * grid.w; if (grid.heights[i] <= level) { seen[i] = 1; queue.push(i); } }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q], x = i % grid.w;
    [x > 0 ? i - 1 : -1, x < grid.w - 1 ? i + 1 : -1, i - grid.w, i + grid.w].forEach(j => {
      if (j >= 0 && j < seen.length && !seen[j] && grid.heights[j] <= level) { seen[j] = 1; queue.push(j); }
    });
  }
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  const dx = (grid.east - grid.west) / (grid.w - 1), dy = (grid.north - grid.south) / (grid.h - 1);
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w;) {
    if (!seen[y * grid.w + x]) { x++; continue; }
    const start = x; while (x < grid.w && seen[y * grid.w + x]) x++;
    const w = grid.west + (start - .5) * dx, e = grid.west + (x - .5) * dx, n = grid.north - (y - .5) * dy, s = n - dy;
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } });
  }
  return { type: 'FeatureCollection', features };
}
