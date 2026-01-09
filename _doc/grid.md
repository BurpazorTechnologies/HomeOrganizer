# Grid Utility - Technical Specification

## Overview
A semi-infinite grid canvas utility for the HomeOrganizer app, similar to diagrams.net (draw.io), enabling visual organization of nested containers and inventory tracking.

## Purpose
- Prototype and test the core canvas interaction system
- Validate Konva.js integration with Vue 3 + Inertia.js
- Establish foundation for the full home organizer editor

## Technology Stack
- **Frontend Framework**: Vue 3 with TypeScript
- **Canvas Library**: Konva.js v10.0.12
- **State Management**: Vue Composition API (reactive/ref)
- **Backend**: Laravel 11 + Inertia.js
- **UI**: TailwindCSS v4

## Phase 1: Grid Canvas (Current Focus)

### Core Features
1. **Semi-Infinite Grid**
   - Visible grid lines with configurable spacing (default: 20px)
   - Pan/zoom functionality
   - Grid snapping (toggleable)
   - Coordinate system: world space vs screen space

2. **Basic Shape Creation**
   - Create rectangular sections via toolbar button or drag-on-canvas
   - Minimum size constraint (e.g., 40x40px)
   - Visual feedback during creation
   - Auto-snap to grid (when enabled)

3. **Shape Interaction**
   - Click to select
   - Drag to move
   - Resize handles (8-point: corners + edges)
   - Delete selected shape (keyboard: Delete/Backspace)
   - Visual selection indicator (border + handles)

4. **Canvas Controls**
   - Zoom in/out buttons
   - Reset view button
   - Grid snap toggle
   - Pan mode (space + drag, or always-on with middle mouse)

### Technical Architecture

#### Component Structure
```
Pages/Utility/Grid/
└── Index.vue                 # Main page container

Components/Grid/
├── GridCanvas.vue            # Konva Stage wrapper with grid rendering
├── Toolbar.vue               # Canvas controls
└── PropertiesPanel.vue       # Selected shape properties (future)
```

#### Data Models
```typescript
interface Shape {
  id: string;              // UUID
  type: 'rectangle';       // Future: 'circle', 'polygon', etc.
  x: number;              // World coordinates
  y: number;
  width: number;
  height: number;
  fill: string;           // Color
  stroke: string;
  strokeWidth: number;
  label?: string;         // Future: text label
  rotation?: number;      // Future: rotation support
  zIndex: number;         // Layering
}

interface GridState {
  shapes: Shape[];
  selectedShapeId: string | null;
  scale: number;          // Zoom level (1 = 100%)
  position: { x: number; y: number }; // Pan offset
  gridSize: number;       // Grid spacing in pixels
  snapToGrid: boolean;
}
```

## Current Status
- [x] Route configured: `/utility/grid`
- [x] Controller created: `GridUtilityController`
- [x] Page skeleton exists: `Index.vue`
- [ ] Grid canvas implementation
- [ ] Shape creation and manipulation
- [ ] Toolbar controls

## Next Steps
1. Implement `GridCanvas.vue` with Konva Stage setup
2. Create grid rendering with pan/zoom
3. Build shape creation/manipulation
4. Add toolbar controls
5. Test basic interactions
