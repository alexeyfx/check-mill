import type { GridDimensions } from "./layout-calculator";

export interface GridConstraints {
  readonly maxRows: number;
  readonly maxCols: number;
  readonly minDim: number;
  readonly maxDim: number;
  readonly totalItemCount: number;
}

export type GridSolver = (constraints: GridConstraints) => GridDimensions;

export const solveDivisibleGrid: GridSolver = ({
  maxRows,
  maxCols,
  minDim,
  maxDim,
  totalItemCount,
}) => {
  const limitColumns = Math.min(maxDim, Math.max(minDim, maxCols));
  const limitRows = Math.min(maxDim, Math.max(minDim, maxRows));
  const evenStartingDimension = minDim % 2 === 0 ? minDim : minDim + 1;

  let optimizedColumns = evenStartingDimension;
  let optimizedRows = evenStartingDimension;
  let maxValidCellsCount = 0;

  for (let col = evenStartingDimension; col <= limitColumns; col++) {
    for (let row = evenStartingDimension; row <= limitRows; row++) {
      const structuralCellCount = col * row;

      const isDivisorMatch = totalItemCount % structuralCellCount === 0;
      const isMoreOptimal = structuralCellCount > maxValidCellsCount;

      if (isDivisorMatch && isMoreOptimal) {
        maxValidCellsCount = structuralCellCount;
        optimizedColumns = col;
        optimizedRows = row;
      }
    }
  }

  return { rows: optimizedRows, columns: optimizedColumns };
};
