import { GridDimensions } from "./layout-calculator";

export interface GridSolverStrategy {
  solve(params: {
    maxRows: number;
    maxCols: number;
    minDim: number;
    maxDim: number;
    totalItemCount: number;
  }): GridDimensions;
}

export class DivisibleGridSolver implements GridSolverStrategy {
  public solve(params: {
    maxRows: number;
    maxCols: number;
    minDim: number;
    maxDim: number;
    totalItemCount: number;
  }): GridDimensions {
    const { maxRows, maxCols, minDim, maxDim, totalItemCount } = params;

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
  }
}
