export interface Shape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  label?: string;
  zIndex: number;
}

export interface GridState {
  shapes: Shape[];
  selectedShapeId: string | null;
  scale: number;
  position: { x: number; y: number };
  gridSize: number;
  snapToGrid: boolean;
}

export interface Point {
  x: number;
  y: number;
}
