/**
 * Step Configuration
 *
 * Centralized configuration for grid editor steps.
 * Defines the workflow and step labels used throughout the application.
 *
 * Future features will dynamically create steps (e.g., "Creating Floor 2 Area", "Creating Room 3")
 * based on user actions, rather than hardcoding them here.
 */

/**
 * Step type definition
 */
export interface Step {
  id: string;           // Unique identifier for the step
  order: number;        // Step order/sequence (1 = lot, 2 = floors, 3 = rooms, etc.)
  label: string;        // Display label for the step (e.g., "Creating Lot Area", "Creating Floor 2 Area")
  description?: string; // Optional description of what this step does
  color?: {            // Optional color configuration for this step
    fill: string;
    stroke: string;
  };
}

/**
 * Step type categories
 * Used to create new steps dynamically in the future
 */
export const STEP_TYPES = {
  LOT: {
    order: 1,
    labelPrefix: 'Creating Lot Area',
    defaultColor: {
      fill: '#d1fae5',  // light green
      stroke: '#059669', // green
    },
  },
  FLOOR: {
    order: 2,
    labelPrefix: 'Creating Floor',
    labelSuffix: 'Area',
    defaultColor: {
      fill: '#dbeafe',  // light blue
      stroke: '#2563eb', // blue
    },
  },
  ROOM: {
    order: 3,
    labelPrefix: 'Creating Room',
    defaultColor: {
      fill: '#fef3c7',  // light yellow
      stroke: '#f59e0b', // orange
    },
  },
} as const;

/**
 * Currently active steps
 */
export const STEPS: Record<string, Step> = {
  LOT_AREA: {
    id: 'lot_area',
    order: STEP_TYPES.LOT.order,
    label: STEP_TYPES.LOT.labelPrefix,
    description: 'Define the overall lot/property boundary',
    color: STEP_TYPES.LOT.defaultColor,
  },
} as const;

/**
 * Helper function to create a dynamic step (for future use)
 * Example: createStep('FLOOR', 2) -> "Creating Floor 2 Area"
 * Example: createStep('ROOM', 3) -> "Creating Room 3"
 */
export function createStep(
  type: keyof typeof STEP_TYPES,
  index?: number,
  customLabel?: string
): Step {
  const stepType = STEP_TYPES[type];
  const id = index ? `${type.toLowerCase()}_${index}` : type.toLowerCase();

  let label: string;
  if (customLabel) {
    label = customLabel;
  } else if (index && 'labelSuffix' in stepType && stepType.labelSuffix) {
    label = `${stepType.labelPrefix} ${index} ${stepType.labelSuffix}`;
  } else if (index) {
    label = `${stepType.labelPrefix} ${index}`;
  } else {
    label = stepType.labelPrefix;
  }

  return {
    id,
    order: stepType.order,
    label,
    color: stepType.defaultColor,
  };
}

/**
 * Helper function to get a step by ID
 */
export function getStepById(stepId: string): Step | null {
  return STEPS[stepId] || null;
}

/**
 * Helper function to get all steps sorted by order
 */
export function getAllStepsSorted(): Step[] {
  return Object.values(STEPS).sort((a, b) => a.order - b.order);
}

/**
 * Helper function to get steps by order number
 */
export function getStepsByOrder(order: number): Step[] {
  return Object.values(STEPS).filter(step => step.order === order);
}

/**
 * Default step (used when starting a new project)
 */
export const DEFAULT_STEP = STEPS.LOT_AREA;
