/**
 * Step Configuration
 *
 * Centralized configuration for grid editor steps.
 * Defines the workflow and step labels used throughout the application.
 *
 * Future features will dynamically create steps (e.g., "Creating Area 2", "Creating Room 3")
 * based on user actions, rather than hardcoding them here.
 */

/**
 * Step type definition
 */
export interface Step {
  id: string;           // Unique identifier for the step
  order: number;        // Step order/sequence (1 = home, 2 = areas, 3 = rooms, etc.)
  label: string;        // Display label for the step (e.g., "Creating Home Area", "Creating Area")
  description?: string; // Optional description of what this step does
  color?: {            // Optional color configuration for this step
    fill: string;
    stroke: string;
  };
}

/**
 * Step type categories - aligned with Area types
 * Used to create new steps dynamically in the future
 */
export const STEP_TYPES = {
  HOME_AREA: {
    order: 1,
    labelPrefix: 'Creating Home Area',
    defaultColor: {
      fill: '#d1fae5',  // light green
      stroke: '#059669', // green
    },
  },
  AREA: {
    order: 2,
    labelPrefix: 'Creating Area',
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
  HOME_AREA: {
    id: 'home_area',
    order: STEP_TYPES.HOME_AREA.order,
    label: STEP_TYPES.HOME_AREA.labelPrefix,
    description: 'Define the home boundary',
    color: STEP_TYPES.HOME_AREA.defaultColor,
  },
} as const;

/**
 * Helper function to create a dynamic step (for future use)
 * Example: createStep('AREA', 2) -> "Creating Area 2"
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
export const DEFAULT_STEP = STEPS.HOME_AREA;
