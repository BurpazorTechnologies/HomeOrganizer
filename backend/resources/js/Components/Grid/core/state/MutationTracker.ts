/**
 * MutationTracker
 *
 * Tracks all state mutations for debugging purposes.
 * Every state change is logged with:
 * - Action name (e.g., 'SHAPE/UPDATE', 'SELECTION/SELECT')
 * - Path to the changed value (e.g., ['shapes', 'shape_123', 'x'])
 * - Previous value
 * - New value
 * - Source location (stack trace snippet)
 *
 * This enables DevTools-like debugging where you can see
 * what changed, when, and from where.
 */

export interface MutationRecord {
  id: string;
  timestamp: number;
  action: string;
  path: string[];
  prevValue: any;
  nextValue: any;
  source: string;
}

export interface MutationTracker {
  record(action: string, path: string[], prev: any, next: any): void;
  getHistory(limit?: number): MutationRecord[];
  clear(): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
}

/**
 * Create a mutation tracker instance
 *
 * @param maxHistory - Maximum number of mutations to keep (default: 100)
 */
export function createMutationTracker(maxHistory: number = 100): MutationTracker {
  const history: MutationRecord[] = [];
  let enabled = true;

  return {
    /**
     * Record a mutation
     *
     * @param action - Action name (e.g., 'SHAPE/UPDATE')
     * @param path - Path to the mutated value (e.g., ['shapes', 'shape_123'])
     * @param prev - Previous value
     * @param next - New value
     */
    record(action: string, path: string[], prev: any, next: any): void {
      if (!enabled) return;

      // Create a safe clone of values to avoid reference issues
      let prevValue: any;
      let nextValue: any;

      try {
        prevValue = structuredClone(prev);
      } catch {
        prevValue = JSON.parse(JSON.stringify(prev ?? null));
      }

      try {
        nextValue = structuredClone(next);
      } catch {
        nextValue = JSON.parse(JSON.stringify(next ?? null));
      }

      const record: MutationRecord = {
        id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        action,
        path,
        prevValue,
        nextValue,
        source: extractSource(),
      };

      history.push(record);

      // Trim history if it exceeds max
      if (history.length > maxHistory) {
        history.shift();
      }

      // Console logging in development mode
      if (import.meta.env.DEV) {
        logMutation(record);
      }
    },

    /**
     * Get mutation history
     *
     * @param limit - Maximum number of mutations to return (most recent first)
     */
    getHistory(limit?: number): MutationRecord[] {
      const result = [...history].reverse(); // Most recent first
      return limit ? result.slice(0, limit) : result;
    },

    /**
     * Clear all mutation history
     */
    clear(): void {
      history.length = 0;
    },

    /**
     * Enable mutation tracking
     */
    enable(): void {
      enabled = true;
    },

    /**
     * Disable mutation tracking
     */
    disable(): void {
      enabled = false;
    },

    /**
     * Check if tracking is enabled
     */
    isEnabled(): boolean {
      return enabled;
    },
  };
}

/**
 * Extract source location from stack trace
 */
function extractSource(): string {
  const stack = new Error().stack;
  if (!stack) return 'unknown';

  const lines = stack.split('\n');

  // Find the first line that's not from MutationTracker or GridStateStore
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line &&
      !line.includes('MutationTracker') &&
      !line.includes('createMutationTracker') &&
      !line.includes('GridStateStore') &&
      !line.includes('Error')
    ) {
      // Clean up the line to show just the relevant part
      const match = line.match(/at\s+(.+)/);
      if (match) {
        return match[1];
      }
      return line;
    }
  }

  return 'unknown';
}

/**
 * Log mutation to console in a formatted way
 */
function logMutation(record: MutationRecord): void {
  const pathStr = record.path.join('.');
  const timestamp = new Date(record.timestamp).toLocaleTimeString();

  // Use different colors for different action types
  let color = '#888';
  if (record.action.includes('SHAPE')) color = '#2196F3';
  if (record.action.includes('SELECTION')) color = '#9C27B0';
  if (record.action.includes('VIEWPORT')) color = '#4CAF50';
  if (record.action.includes('LAYER')) color = '#FF9800';
  if (record.action.includes('STEP')) color = '#E91E63';
  if (record.action.includes('AREA')) color = '#00BCD4';

  console.groupCollapsed(
    `%c[GridState] ${record.action}%c @ ${timestamp}`,
    `color: ${color}; font-weight: bold`,
    'color: #888'
  );
  console.log('%cPath:%c', 'color: #888', 'color: inherit', pathStr);
  console.log('%cPrev:%c', 'color: #888', 'color: inherit', record.prevValue);
  console.log('%cNext:%c', 'color: #888', 'color: inherit', record.nextValue);
  console.log('%cSource:%c', 'color: #888', 'color: #666; font-size: 10px', record.source);
  console.groupEnd();
}

/**
 * Type guard to check if an object is a MutationRecord
 */
export function isMutationRecord(obj: unknown): obj is MutationRecord {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'timestamp' in obj &&
    'action' in obj &&
    'path' in obj
  );
}
