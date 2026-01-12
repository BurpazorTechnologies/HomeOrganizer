/**
 * Flows Module - Event-driven orchestration
 *
 * Flows replace direct manager calls with event-based coordination.
 * Each flow subscribes to specific events and dispatches commands/queries.
 *
 * Usage:
 * ```typescript
 * import { createCreateHomeAreaFlow, createStepTransitionFlow, createShapeCreationFlow } from './flows';
 *
 * const homeAreaFlow = createCreateHomeAreaFlow({ eventBus, store });
 * const stepFlow = createStepTransitionFlow({ eventBus, store });
 * const shapeFlow = createShapeCreationFlow({ eventBus, store });
 *
 * // Start flows
 * homeAreaFlow.start();
 * stepFlow.start();
 * shapeFlow.start();
 *
 * // Emit events to trigger flows
 * eventBus.emit({
 *   type: 'CREATE_HOME_AREA_REQUESTED',
 *   payload: { position: { x: 100, y: 100 }, layerId: 'layer_1' }
 * });
 * ```
 */

// Base flow
export { BaseFlow } from './BaseFlow';
export type { FlowDependencies, FlowState, FlowFactory } from './BaseFlow';

// Specific flows
export { CreateHomeAreaFlow, createCreateHomeAreaFlow } from './CreateHomeAreaFlow';
export { StepTransitionFlow, createStepTransitionFlow } from './StepTransitionFlow';
export { ShapeCreationFlow, createShapeCreationFlow } from './ShapeCreationFlow';

/**
 * FlowRegistry - manages all flows in the system
 *
 * Provides a central point for starting, stopping, and managing flows.
 */
export interface FlowRegistry {
  homeAreaFlow: import('./CreateHomeAreaFlow').CreateHomeAreaFlow;
  stepTransitionFlow: import('./StepTransitionFlow').StepTransitionFlow;
  shapeCreationFlow: import('./ShapeCreationFlow').ShapeCreationFlow;
}

/**
 * Create all flows and return a registry
 */
export function createFlowRegistry(deps: import('./BaseFlow').FlowDependencies): FlowRegistry {
  const { createCreateHomeAreaFlow } = require('./CreateHomeAreaFlow');
  const { createStepTransitionFlow } = require('./StepTransitionFlow');
  const { createShapeCreationFlow } = require('./ShapeCreationFlow');

  return {
    homeAreaFlow: createCreateHomeAreaFlow(deps),
    stepTransitionFlow: createStepTransitionFlow(deps),
    shapeCreationFlow: createShapeCreationFlow(deps),
  };
}

/**
 * Start all flows in a registry
 */
export function startAllFlows(registry: FlowRegistry): void {
  registry.homeAreaFlow.start();
  registry.stepTransitionFlow.start();
  registry.shapeCreationFlow.start();
}

/**
 * Stop all flows in a registry
 */
export function stopAllFlows(registry: FlowRegistry): void {
  registry.homeAreaFlow.stop();
  registry.stepTransitionFlow.stop();
  registry.shapeCreationFlow.stop();
}

/**
 * Destroy all flows in a registry
 */
export function destroyAllFlows(registry: FlowRegistry): void {
  registry.homeAreaFlow.destroy();
  registry.stepTransitionFlow.destroy();
  registry.shapeCreationFlow.destroy();
}
