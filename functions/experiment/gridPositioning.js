/**
 * Grid-based stimulus positioning — ported from Exp2B's createGrid.ts +
 * placeStimuli.ts.
 *
 * The canvas is divided into a numColumns × numRows grid. Border cells and
 * the middle column are pre-occupied — this keeps stimuli away from the
 * edges and leaves a clear vertical gap down the centre so items are
 * unambiguously grouped into left- and right-hemifield clusters. A
 * stimulus claims a random free cell on its requested side (left / right);
 * its neighbours are then marked occupied to prevent overlap.
 *
 * Coordinates returned are ABSOLUTE pixels with origin at canvas top-left —
 * matching the jspsych-psychophysics default when `origin_center: false`.
 * Trial stimuli in this experiment therefore use `origin_center: false`
 * (unlike Exp2C's original ring-positioned design).
 */

import { Settings } from "../../ExperimentSettings.js";

// ── Canvas dimensions ────────────────────────────────────────────────────
//
// jspsych-psychophysics defaults the canvas to window.innerWidth ×
// window.innerHeight (we never override these). To place items in the same
// coordinate frame the plugin will draw in, we read the same values.

export function getCanvasSize() {
  return { width: window.innerWidth, height: window.innerHeight };
}

// ── Cell sizing ──────────────────────────────────────────────────────────

export function getCellSize() {
  const { width, height } = getCanvasSize();
  const { numColumns, numRows } = Settings.grid;
  return {
    cellWidth: width / numColumns,
    cellHeight: height / numRows,
  };
}

/**
 * Stimulus half-extent in pixels (Exp2B called this "radius" for circles;
 * we reuse the same heuristic to size the triangle so that spacing matches
 * the 2B experiment's apparent item scale).
 */
export function getStimulusRadius() {
  const { cellWidth, cellHeight } = getCellSize();
  return Math.min(cellWidth, cellHeight) / Settings.grid.cellRadiusDivisor;
}

/**
 * Triangle dimensions derived from an Exp2B-style radius, preserving the
 * template aspect ratio. Target area is Settings.stimuli.triangleAreaFraction
 * of π·r² — setting it to 1.0 reproduces the Exp2B circle's area exactly,
 * but a value below 1.0 keeps the triangle's apex out of the response wheel.
 *
 *   target_area     = f · π · r²
 *   area_triangle   = (1/2) · base · height,  with height = aspect · base
 *   ⇒ base² · aspect / 2 = f · π · r²
 *   ⇒ base = r · √(2π·f / aspect)
 */
export function getTriangleDimensions() {
  const r = getStimulusRadius();
  const aspect = Settings.stimuli.triangleAspectRatio;
  const f = Settings.stimuli.triangleAreaFraction;
  const base = r * Math.sqrt((2 * Math.PI * f) / aspect);
  const height = base * aspect;
  return { base, height };
}

// ── Grid construction ───────────────────────────────────────────────────

/**
 * Build a fresh grid with border/middle-column cells pre-occupied.
 * @returns {{id:string, occupied:boolean, x:number, y:number}[]}
 */
export function createGrid() {
  const { numColumns, numRows } = Settings.grid;
  const middleCol = Math.floor(numColumns / 2);
  const grid = [];

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numColumns; col++) {
      const isBorder =
        row === 0 ||
        row === numRows - 1 ||
        col < 2 ||
        col >= numColumns - 2;
      const isMiddle = col === middleCol;
      grid.push({
        id: `${col + 1}${String.fromCharCode(65 + row)}`,
        occupied: isBorder || isMiddle,
        x: col,
        y: row,
      });
    }
  }

  return grid;
}

/**
 * Mark a cell and its neighbours occupied so no nearby cell can be picked next.
 */
function markNeighboursOccupied(grid, cell) {
  const { adjacencyLimit, diagonalAdjacency } = Settings.grid;
  for (const c of grid) {
    const dx = Math.abs(c.x - cell.x);
    const dy = Math.abs(c.y - cell.y);
    const sameRowClose = dx <= adjacencyLimit && c.y === cell.y;
    const sameColClose = dy <= adjacencyLimit && c.x === cell.x;
    const diagClose = dx === diagonalAdjacency && dy === diagonalAdjacency;
    if (sameRowClose || sameColClose || diagClose) c.occupied = true;
  }
  cell.occupied = true;
}

/**
 * Pick and claim a random free cell on the requested side.
 *
 * @param {object[]} grid      Grid from createGrid().
 * @param {"left"|"right"|"both"} side  Hemifield restriction.
 * @returns {{x:number, y:number}|null}  Chosen cell (col, row indices), or
 *                                        null if no free cell exists on side.
 */
export function selectAndOccupyCell(grid, side) {
  const { numColumns } = Settings.grid;
  const available = grid.filter((c) => {
    if (c.occupied) return false;
    if (side === "both") return true;
    if (side === "left") return c.x < numColumns / 2;
    if (side === "right") return c.x >= numColumns / 2;
    return false;
  });
  if (available.length === 0) return null;

  const picked = available[Math.floor(Math.random() * available.length)];
  markNeighboursOccupied(grid, picked);
  return picked;
}

// ── Item position assignment ─────────────────────────────────────────────

/**
 * Generate absolute-pixel (x, y) positions for a batch of items.
 *
 * @param {("left"|"right")[]} sides  Per-item side assignment.
 * @returns {{x:number, y:number, side:string}[]}  Screen-space centres.
 */
export function assignPositions(sides) {
  const grid = createGrid();
  const { cellWidth, cellHeight } = getCellSize();

  return sides.map((side) => {
    const cell = selectAndOccupyCell(grid, side);
    if (!cell) {
      throw new Error(
        `assignPositions: no free cell available on side "${side}". ` +
          `Grid may be over-subscribed — check numColumns/numRows and adjacency settings.`
      );
    }
    return {
      x: cell.x * cellWidth + cellWidth / 2,
      y: cell.y * cellHeight + cellHeight / 2,
      side,
    };
  });
}
