# Grid System - Modular Architecture

A highly modular, extensible, and maintainable grid canvas system for the HomeOrganizer application.

## Philosophy

This grid system is built with the following principles:

- **Clarity over Brevity**: Code is optimized for human readability and understanding
- **Separation of Concerns**: Each manager handles one specific responsibility
- **Single Source of Truth**: Constants and configurations are centralized
- **Easy Debugging**: Clear function names and well-organized code structure
- **Extensibility**: Easy to add new shape types and features

## Architecture Overview

```
Components/Grid/
├── core/                    # Core managers (business logic)
│   ├── GridManager.ts       # Grid rendering and snapping
│   ├── ZoomManager.ts       # Zoom operations
│   ├── ShapeManager.ts      # Shape CRUD and selection
│   └── TransformManager.ts  # Resize/transform handles
├── factories/               # Object creation
│   └── ShapeFactory.ts      # Creates validated shapes
├── utils/                   # Utility functions
│   ├── coordinates.ts       # Coordinate transformations
│   ├── validation.ts        # Input validation
│   └── idGenerator.ts       # Unique ID generation
├── types/                   # TypeScript definitions
│   ├── constants.ts         # System-wide constants
│   ├── shapes.ts            # Shape interfaces
│   └── grid.ts              # Grid state interfaces
├── GridCanvas.vue           # Main canvas component
├── Toolbar.vue              # Control toolbar
├── index.ts                 # Public API exports
└── README.md                # This file
```

## Core Managers

### GridManager

Manages the infinite grid overlay.

**Key Methods:**
```typescript
grid.drawVerticalLines(bounds)    // Draw vertical grid lines
grid.drawHorizontalLines(bounds)  // Draw horizontal grid lines
grid.redrawGrid()                 // Redraw entire grid
grid.clearGrid()                  // Remove all grid lines
grid.snapValue(value)             // Snap a value to grid
grid.snapPoint(x, y)              // Snap a point to grid
grid.toggleVisibility()           // Show/hide grid
grid.toggleSnap()                 // Enable/disable snapping
```

**Example:**
```typescript
const gridManager = new GridManager(stage, gridLayer, {
  size: 20,
  snapEnabled: true,
  visible: true
});

gridManager.redrawGrid();
const snapped = gridManager.snapPoint(123, 456);
```

### ZoomManager

Handles all zoom operations.

**Key Methods:**
```typescript
zoom.zoomIn()                     // Zoom in by step
zoom.zoomOut()                    // Zoom out by step
zoom.zoomToPoint(point, delta)    // Zoom towards mouse
zoom.setZoomLevel(scale)          // Set specific zoom level
zoom.resetZoom()                  // Reset to 100%
zoom.resetView()                  // Reset zoom and position
zoom.getZoomLevel()               // Get current zoom
zoom.getZoomPercentage()          // Get zoom as percentage
```

**Example:**
```typescript
const zoomManager = new ZoomManager(stage);

// Register callback
zoomManager.onZoom((newScale) => {
  console.log(`Zoom: ${newScale * 100}%`);
});

zoomManager.zoomIn();
```

### ShapeManager

Manages all shapes on the canvas.

**Key Methods:**
```typescript
shapes.createRectangle(config)             // Create and add rectangle
shapes.createRectangleAtNextPosition()     // Create at auto position
shapes.addShape(shape)                     // Add existing shape
shapes.removeShape(id)                     // Remove by ID
shapes.removeSelectedShape()               // Remove selected
shapes.updateShape(id, updates)            // Update shape properties
shapes.getShape(id)                        // Get shape by ID
shapes.getAllShapes()                      // Get all shapes
shapes.selectShape(id)                     // Select a shape
shapes.deselectAll()                       // Deselect all
shapes.getSelectedShape()                  // Get selected shape
shapes.bringToFront(id)                    // Move to top layer
shapes.sendToBack(id)                      // Move to bottom layer
```

**Example:**
```typescript
const shapeManager = new ShapeManager();

// Register callbacks
shapeManager.onShapesUpdate((shapes) => {
  console.log('Shapes changed:', shapes);
});

shapeManager.onSelectionUpdate((id) => {
  console.log('Selected:', id);
});

// Create a shape
const shape = shapeManager.createRectangle({
  x: 100,
  y: 100,
  width: 200,
  height: 150
});
```

### TransformManager

Manages resize handles and transformations.

**Key Methods:**
```typescript
transform.attach(node)            // Attach to Konva node
transform.detach()                // Detach from all nodes
transform.update()                // Refresh transformer
transform.isActive()              // Check if attached
```

**Example:**
```typescript
const transformManager = new TransformManager(layer);

transformManager.onTransform((nodeId, attrs) => {
  console.log(`Shape ${nodeId} transformed:`, attrs);
});

transformManager.attach(konvaRect);
```

## Factories

### ShapeFactory

The ONLY way to create shapes in the system.

**Methods:**
```typescript
ShapeFactory.createRectangle(config)        // Create rectangle
ShapeFactory.createRectangleAtIndex(index)  // Create at indexed position
ShapeFactory.cloneShape(shape, offset)      // Clone existing shape
ShapeFactory.validate(shape)                // Validate shape
```

**Example:**
```typescript
// Create a basic rectangle
const shape1 = ShapeFactory.createRectangle({
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  fill: '#e0f2fe'
});

// Create at auto position
const shape2 = ShapeFactory.createRectangleAtIndex(1);

// Clone with offset
const clone = ShapeFactory.cloneShape(shape1, { x: 50, y: 50 });
```

## Utilities

### Coordinate Utilities

```typescript
screenToWorld(screenPoint, stage)    // Screen → World coords
worldToScreen(worldPoint, stage)     // World → Screen coords
snapToGrid(value, gridSize)          // Snap value to grid
snapPointToGrid(point, gridSize)     // Snap point to grid
clampValue(value, min, max)          // Clamp with optional snap
distance(p1, p2)                     // Calculate distance
isPointInBounds(point, bounds)       // Check if point in rectangle
```

### Validation Utilities

```typescript
validateDimensions(w, h, minSize)    // Validate width/height
validatePosition(x, y)               // Validate coordinates
validateRectangle(shape)             // Validate complete shape
validateShapeConfig(config)          // Validate shape config
validateZoom(scale)                  // Validate zoom level
```

### ID Generation

```typescript
generateUniqueId(prefix)             // Generate unique ID
generateShapeId()                    // Generate shape ID
isValidId(id)                        // Validate ID format
getIdTimestamp(id)                   // Extract timestamp from ID
```

## Constants

All system constants are centralized in `types/constants.ts`:

```typescript
GRID_CONSTANTS.DEFAULT_GRID_SIZE      // 20px
GRID_CONSTANTS.MIN_ZOOM               // 0.1 (10%)
GRID_CONSTANTS.MAX_ZOOM               // 5.0 (500%)
GRID_CONSTANTS.MIN_SHAPE_SIZE         // 40px
GRID_CONSTANTS.MAX_NESTING_DEPTH      // 50 levels

SHAPE_TYPES.RECTANGLE                 // 'rectangle'

SHAPE_COLORS.DEFAULT_FILL             // '#e0f2fe'
SHAPE_COLORS.DEFAULT_STROKE           // '#0284c7'
```

## Usage Examples

### Basic Setup

```typescript
import {
  GridManager,
  ZoomManager,
  ShapeManager,
  ShapeFactory,
  GRID_CONSTANTS
} from '@/Components/Grid';

// Initialize managers
const gridManager = new GridManager(stage, gridLayer);
const zoomManager = new ZoomManager(stage);
const shapeManager = new ShapeManager();

// Create a shape
const shape = ShapeFactory.createRectangle({
  x: 100,
  y: 100
});

shapeManager.addShape(shape);
```

### Adding Event Handlers

```typescript
// Listen for zoom changes
zoomManager.onZoom((scale) => {
  console.log(`Zoomed to ${scale * 100}%`);
  gridManager.redrawGrid();
});

// Listen for shape changes
shapeManager.onShapesUpdate((shapes) => {
  saveToBackend(shapes);
});

// Listen for selection changes
shapeManager.onSelectionUpdate((id) => {
  if (id) {
    console.log(`Selected: ${id}`);
  }
});
```

### Creating Custom Shapes

```typescript
// Use the factory for consistent shapes
const customShape = ShapeFactory.createRectangle({
  x: 200,
  y: 200,
  width: 300,
  height: 200,
  fill: '#bfdbfe',
  stroke: '#3b82f6',
  label: 'Custom Rectangle'
});

shapeManager.addShape(customShape);
```

## Extending the System

### Adding a New Shape Type

1. Add shape type to `types/constants.ts`:
```typescript
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',     // New!
} as const;
```

2. Add interface to `types/shapes.ts`:
```typescript
export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
  fill: string;
  stroke: string;
}

export type Shape = RectangleShape | CircleShape;
```

3. Add factory method to `factories/ShapeFactory.ts`:
```typescript
static createCircle(config: CircleConfig): CircleShape {
  // Implementation
}
```

4. Update validation in `utils/validation.ts`
5. Update rendering in `GridCanvas.vue`

## Debugging

All managers expose helpful debugging methods:

```typescript
// Access managers from GridCanvas
const managers = canvasRef.value?.getManagers();

console.log('Current zoom:', managers.zoomManager?.getZoomLevel());
console.log('All shapes:', managers.shapeManager?.getAllShapes());
console.log('Grid config:', managers.gridManager?.getConfig());
```

## Best Practices

1. **Always use ShapeFactory** to create shapes - never create shape objects manually
2. **Use constants** from `GRID_CONSTANTS` instead of magic numbers
3. **Register callbacks** on managers to stay in sync with state changes
4. **Validate inputs** using utilities before processing
5. **Use TypeScript types** to catch errors at compile time
6. **Keep managers separate** - don't mix responsibilities
7. **Read the code** - it's written to be understandable!

## Performance Considerations

- Grid lines are culled to visible area only
- Maximum grid line limit prevents performance issues
- Batch drawing is used for Konva operations
- Transformers are attached/detached efficiently
- Shape updates use partial updates, not full replacement

## Future Extensions

- Multi-select support
- Undo/Redo system
- Copy/paste functionality
- Shape groups/containers
- Custom shape types (circles, polygons)
- Alignment tools
- Keyboard-based shape manipulation
- Export to SVG/PNG
- Collaborative editing

## Questions?

The code is the documentation! Every function is commented and organized for clarity. Read through the managers to understand how they work.
