/**
 * Layer Types
 *
 * Type definitions for the layer system.
 * Each step corresponds to a layer that contains shapes.
 */

import type { Step } from './steps';

/**
 * Layer definition
 */
export interface Layer {
  id: string;
  step: Step;
  order: number;
  label: string;
  shapeIds: string[];
  primaryShapeId: string | null; // The main/first shape created in this layer
}

/**
 * Layer manager state
 */
export interface LayerState {
  layers: Map<string, Layer>;
  currentLayerId: string | null;
}
