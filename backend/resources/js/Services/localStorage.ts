/**
 * LocalStorage Service
 *
 * Handles saving and loading data from browser's localStorage.
 * Uses JSON format for easy export to persistent datastore in the future.
 */

const STORAGE_KEY = 'home_organizer_data';

export interface ShapeData {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  label: string;
}

export interface ChildAreaData {
  parentAreaId: string;
  parentShapeId: string;
  stepId: string;
  layerId: string;
  shapes: ShapeData[];
}

export interface SavedData {
  version: string;
  lastUpdated: string;
  currentStep?: number; // Track which step we're on
  homeArea?: {
    stepId: string;
    layerId: string;
    shapes: ShapeData[];
    primaryShapeId: string | null;
  };
  childAreas?: {
    [parentAreaId: string]: ChildAreaData;
  };
  areas?: {
    areas: Array<{
      id: string;
      type: string;
      label: string;
      shapeId: string;
      layerId: string;
      parentId: string | null;
      childIds: string[];
      depth: number;
      metadata: Record<string, any>;
    }>;
    rootAreaId: string;
  };
  metadata?: {
    [key: string]: any;
  };
}

class LocalStorageService {
  /**
   * Get all saved data from localStorage
   */
  getData(): SavedData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Save data to localStorage
   */
  saveData(data: Partial<SavedData>): void {
    try {
      const existingData = this.getData() || {};
      const newData: SavedData = {
        ...existingData,
        ...data,
        version: '1.0',
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('homeOrganizerDataChanged', { detail: newData }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  }

  /**
   * Save home area data
   */
  saveHomeArea(homeAreaData: SavedData['homeArea']): void {
    this.saveData({ homeArea: homeAreaData });
  }

  /**
   * Get home area data
   */
  getHomeArea(): SavedData['homeArea'] | null {
    const data = this.getData();
    return data?.homeArea || null;
  }

  /**
   * Save area hierarchy data
   */
  saveAreas(areasData: SavedData['areas']): void {
    this.saveData({ areas: areasData });
  }

  /**
   * Get area hierarchy data
   */
  getAreas(): SavedData['areas'] | null {
    const data = this.getData();
    return data?.areas || null;
  }

  /**
   * Save child areas for a parent
   */
  saveChildAreas(parentAreaId: string, childAreaData: ChildAreaData): void {
    const existingData = this.getData() || {} as SavedData;
    const childAreas = existingData.childAreas || {};
    childAreas[parentAreaId] = childAreaData;
    this.saveData({ childAreas });
  }

  /**
   * Get child areas for a parent
   */
  getChildAreas(parentAreaId: string): ChildAreaData | null {
    const data = this.getData();
    return data?.childAreas?.[parentAreaId] || null;
  }

  /**
   * Get all child areas
   */
  getAllChildAreas(): SavedData['childAreas'] | null {
    const data = this.getData();
    return data?.childAreas || null;
  }

  /**
   * Save current step
   */
  saveCurrentStep(stepNumber: number): void {
    this.saveData({ currentStep: stepNumber });
  }

  /**
   * Get current step
   */
  getCurrentStep(): number {
    const data = this.getData();
    return data?.currentStep || 1;
  }

  /**
   * Clear all data
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Dispatch event to notify listeners
      window.dispatchEvent(new CustomEvent('homeOrganizerDataChanged', { detail: null }));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Export data as JSON string (for download/backup)
   */
  exportAsJSON(): string {
    const data = this.getData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON string
   */
  importFromJSON(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid JSON format');
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();
