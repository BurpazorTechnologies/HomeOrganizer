/**
 * LocalStorage Service
 *
 * Handles saving and loading data from browser's localStorage.
 * Uses JSON format for easy export to persistent datastore in the future.
 */

const STORAGE_KEY = 'home_organizer_data';

export interface SavedData {
  version: string;
  lastUpdated: string;
  homeArea?: {
    stepId: string;
    layerId: string;
    shapes: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
      stroke: string;
      label: string;
    }>;
    primaryShapeId: string | null;
  };
  areas?: any[]; // Future: nested areas
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
   * Clear all data
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
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
