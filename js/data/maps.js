// ============================================================
// Map / tile data
// Tiles are authored with .repeat() + coordinate overrides so
// every row is guaranteed to match the map width (no hand-counted
// ASCII-art typos).
// ============================================================
(function () {
  const TILE_SIZE = 32;

  // tile legend -> rendering + collision + encounter info
  const TILES = {
    '.': { walkable: true, encounter: false, color: '#5fae4a', color2: '#4f9a3d' }, // grass
    ',': { walkable: true, encounter: true, color: '#3f8a3a', color2: '#357530', tall: true }, // tallgrass
    'T': { walkable: false, encounter: false, color: '#3f8a3a', deco: 'tree' }, // tree
    'P': { walkable: true, encounter: false, color: '#c9a86b', color2: '#bb9758' }, // path
    'W': { walkable: false, encounter: false, color: '#3b7fd1', deco: 'water' }, // water
    'S': { walkable: true, encounter: false, color: '#e8d9a0', color2: '#ddc98c' }, // sand
    'R': { walkable: false, encounter: false, color: '#8a8a8a', deco: 'rock' }, // rock
    'H': { walkable: false, encounter: false, color: '#a9784f', deco: 'house' }, // house
    'C': { walkable: true, encounter: true, color: '#4a4560', color2: '#3e3a52', cave: true }, // cave floor
    'D': { walkable: false, encounter: false, color: '#242032', deco: 'caveWall' }, // cave wall
  };

  function row(width, fills) {
    // fills: array of [char, count] pairs that must sum to width
    let s = '';
    for (const [ch, n] of fills) s += ch.repeat(n);
    if (s.length !== width) throw new Error('row width mismatch: got ' + s.length + ' want ' + width);
    return s;
  }

  function setTile(grid, x, y, ch) {
    const r = grid[y];
    grid[y] = r.substring(0, x) + ch + r.substring(x + 1);
  }

  // ---------------- VILLAGE ----------------
  function buildVillage() {
    const w = 20, h = 15;
    const g = [];
    g.push(row(w, [['T', 20]]));
    g.push(row(w, [['T', 1], ['.', 18], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 2], ['H', 2], ['.', 7], ['H', 2], ['.', 5], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 2], ['H', 2], ['.', 7], ['H', 2], ['.', 5], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 18], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 18], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 9], ['P', 1], ['.', 8], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 9], ['P', 1], ['.', 8], ['P', 1]])); // east exit -> forest
    g.push(row(w, [['T', 1], ['.', 9], ['P', 1], ['.', 8], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 9], ['P', 1], ['.', 8], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 9], ['P', 1], ['.', 8], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 18], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 18], ['T', 1]]));
    g.push(row(w, [['T', 1], ['.', 9], ['P', 1], ['.', 8], ['T', 1]]));
    g.push(row(w, [['T', 10], ['P', 1], ['T', 9]])); // south exit -> beach

    return {
      name: 'village', title: '보노보노 마을', width: w, height: h, grid: g,
      encounterRate: 0, encounterTable: [],
      warps: [
        { x: 19, y: 7, toMap: 'forest', toX: 1, toY: 7 },
        { x: 10, y: 14, toMap: 'beach', toX: 10, toY: 1 },
      ],
    };
  }

  // ---------------- FOREST ----------------
  function buildForest() {
    const w = 20, h = 15;
    const g = [];
    g.push(row(w, [['T', 10], ['P', 1], ['T', 9]])); // north exit -> cave
    for (let i = 1; i <= 13; i++) {
      if (i === 7) g.push(row(w, [['P', 1], [',', 18], ['T', 1]])); // west exit -> village
      else g.push(row(w, [['T', 1], [',', 18], ['T', 1]]));
    }
    g.push(row(w, [['T', 20]]));

    // scattered decorative trees (kept away from the two entrances / path)
    const deco = [[4,2],[6,3],[15,2],[16,4],[3,9],[5,11],[14,10],[17,9],[9,4],[12,12],[6,6],[15,6]];
    for (const [x, y] of deco) setTile(g, x, y, 'T');

    return {
      name: 'forest', title: '향기 나무 숲', width: w, height: h, grid: g,
      encounterRate: 0.12,
      encounterTable: [
        { id: 'acornbug', weight: 5 },
        { id: 'boar', weight: 3 },
      ],
      warps: [
        { x: 0, y: 7, toMap: 'village', toX: 18, toY: 7 },
        { x: 10, y: 0, toMap: 'cave', toX: 10, toY: 13 },
      ],
    };
  }

  // ---------------- BEACH ----------------
  function buildBeach() {
    const w = 20, h = 15;
    const g = [];
    g.push(row(w, [['T', 10], ['P', 1], ['T', 9]])); // north exit -> village
    for (let i = 1; i <= 12; i++) {
      g.push(row(w, [['T', 1], ['S', 17], ['W', 1], ['T', 1]]));
    }
    g.push(row(w, [['T', 1], ['W', 18], ['T', 1]]));
    g.push(row(w, [['T', 20]]));

    const decoRocks = [[3,3],[5,7],[15,4],[16,8],[8,10],[4,11]];
    for (const [x, y] of decoRocks) setTile(g, x, y, 'R');
    // small tidepool patch = encounter tallgrass equivalent
    const tide = [[9,5],[10,5],[9,6],[10,6],[6,9],[7,9]];
    for (const [x, y] of tide) setTile(g, x, y, ',');

    return {
      name: 'beach', title: '모래사장', width: w, height: h, grid: g,
      encounterRate: 0.1,
      encounterTable: [
        { id: 'crab', weight: 5 },
        { id: 'gull', weight: 4 },
      ],
      warps: [
        { x: 10, y: 0, toMap: 'village', toX: 10, toY: 13 },
      ],
      objects: [
        { id: 'beach_chest', type: 'chest', x: 15, y: 11, itemId: 'starfish', opened: false },
      ],
    };
  }

  // ---------------- CAVE ----------------
  function buildCave() {
    const w = 20, h = 15;
    const g = [];
    g.push(row(w, [['D', 20]])); // row0 - boss chamber back wall
    g.push(row(w, [['D', 1], ['C', 18], ['D', 1]]));
    g.push(row(w, [['D', 1], ['C', 18], ['D', 1]]));
    g.push(row(w, [['D', 1], ['C', 18], ['D', 1]]));
    g.push(row(w, [['D', 8], ['C', 4], ['D', 8]]));
    for (let i = 5; i <= 12; i++) {
      g.push(row(w, [['D', 1], ['C', 18], ['D', 1]]));
    }
    g.push(row(w, [['D', 10], ['C', 1], ['D', 9]])); // south exit -> forest
    g.push(row(w, [['D', 20]]));

    const walls = [[4,2],[15,2],[6,6],[13,6],[9,8],[10,8],[5,10],[14,10],[7,3],[12,3]];
    for (const [x, y] of walls) setTile(g, x, y, 'D');

    return {
      name: 'cave', title: '동굴', width: w, height: h, grid: g,
      encounterRate: 0.15,
      encounterTable: [
        { id: 'bat', weight: 5 },
        { id: 'golem', weight: 3 },
      ],
      warps: [
        { x: 10, y: 13, toMap: 'forest', toX: 10, toY: 1 },
      ],
      objects: [
        { id: 'crabking', type: 'boss', x: 10, y: 2, monsterId: 'crabking', defeated: false, itemId: 'shiny_shell' },
      ],
    };
  }

  window.BONO_TILES = TILES;
  window.BONO_TILE_SIZE = TILE_SIZE;
  window.BONO_MAPS = {
    village: buildVillage(),
    forest: buildForest(),
    beach: buildBeach(),
    cave: buildCave(),
  };
})();
