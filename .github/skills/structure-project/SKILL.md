---
name: structure-project
description: Guides proper file organization for the Blade Terminal single-page PWA (client-only) with local IndexedDB (Dexie) storage. Use when creating new files, moving/refactoring code, reviewing structure, or ensuring conventions for features, components, hooks, stores, utilities, and the local data layer.
compatibility: Designed for blade-terminal - Client-only PWA using Bun/React and IndexedDB (Dexie). The server/ folder is a local data-access layer (not a network server).
metadata:
  author: jRmx0
  version: "1.3"
---

# Project Structure Guide

Use this skill when organizing files and folders in the Blade Terminal project to ensure consistency, scalability, and maintainability.
This app is a single-page PWA that runs locally, with data stored in IndexedDB via Dexie.

## Project Organization Overview

The Blade Terminal project is organized into three main directories at the root level:

- **`public/`** - Static web assets (HTML entry point)
- **`server/`** - Local data-access layer for IndexedDB (Dexie) operations
- **`src/`** - Frontend React application code

## Core Frontend Structure (`src/` folder)

The primary frontend code lives in the `src` folder:

```
src/
├── app/                    # Application layer
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application provider wrapping app with global providers
├── assets/                # Static files (images, fonts, etc.)
├── components/            # Shared components used across the entire application
├── config/                # Global configurations and exported env variables
├── features/              # Feature-based modules (see feature structure below)
├── hooks/                 # Shared hooks used across the entire application
├── layouts/               # Structural shell components defining spatial UI regions
├── lib/                   # Reusable libraries preconfigured for the application
├── stores/                # Global state stores (Zustand, Redux, etc.)
├── testing/               # Test utilities and mocks
├── types/                 # Shared TypeScript types
└── utils/                 # Shared utility functions
```

## Local Data Layer (`server/` folder)

The `server/` directory is a local data-access layer (not a network server). It encapsulates IndexedDB (Dexie) setup and operations used by the client.

```
server/
├── index.ts         # Entry point exporting data-access APIs (no HTTP)
└── db/              # IndexedDB (Dexie) setup, schema, and queries
    ├── schema/
    └── queries/
```

**Key Points:**

- Define Dexie database setup and table schemas in `server/db/`
- Expose data-access functions from `server/index.ts`
- Features call these functions directly (import), not via fetch/HTTP

## Public Assets (`public/` folder)

Static files served by the web server:

```
public/
└── index.html       # Main HTML entry point (mounts React app)
```

**Key Points:**

- `index.html` is the HTML template that serves the React application
- It typically contains a root div where React mounts (e.g., `<div id="root"></div>`)
- Static assets should be referenced from here or placed in `src/assets/`

## Layouts (`src/layouts/`)

Layouts are **structural shell components** that define the spatial arrangement of UI regions. They are the **composition layer** — they answer **"where does each region go?"** while features answer **"what goes there?"**

Layouts are not features (no business logic, no data access) and not shared components (not generic reusable widgets). They compose feature components into spatial regions of the app shell.

```
src/layouts/
├── workbench/              # Root shell composing all regions
│   └── Workbench.tsx
├── title-bar/
│   └── TitleBar.tsx
├── menu-bar/
│   └── MenuBar.tsx
├── activity-bar/
│   └── ActivityBar.tsx
├── canvas-editor/
│   └── CanvasEditorLayout.tsx
├── controls-side-bar/
│   └── ControlsSideBar.tsx
├── inspector-side-bar/
│   └── InspectorSideBar.tsx
└── status-bar/
    └── StatusBar.tsx
```

Each layout module can optionally include:

```
src/layouts/{region}/
├── {Region}.tsx           # Main layout component
├── hooks/                 # Layout-specific hooks (resize, collapse, drag)
└── types.ts               # Slot definitions, region config types
```

**Rules:**

- Layouts import from **shared** and **features** — they compose feature components into regions
- Layouts never contain business logic or data access
- Keep layouts thin: structure, positioning, panel visibility
- Features remain independent — they export components, layouts arrange them

**Example — ActivityBar composing multiple features:**

```tsx
// src/layouts/activity-bar/ActivityBar.tsx
import { CanvasTools } from "@/features/canvas-editing/components/CanvasTools";
import { CoverageLayers } from "@/features/coverage-planning/components/CoverageLayers";
import { MapSelector } from "@/features/map-manager/components/MapSelector";
import { TaskQueue } from "@/features/task-runner/components/TaskQueue";

export function ActivityBar() {
  return (
    <aside className="flex flex-col gap-2 w-12 border-r ...">
      <CanvasTools />
      <CoverageLayers />
      <MapSelector />
      <TaskQueue />
    </aside>
  );
}
```

**When to use layouts vs. components vs. features:**

| Put it in…    | When…                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| `layouts/`    | It defines a **spatial region** of the app shell (title bar, sidebar, canvas area) |
| `components/` | It's a **generic, reusable widget** (Button, Modal, Tooltip)                       |
| `features/`   | It owns **business logic or domain behavior** (coverage planning, task runner)     |

## Feature-Based Organization

Most code should be organized within the `src/features/` folder. Each feature is self-contained:

```
src/features/awesome-feature/
├── data/          # Data-access hooks/services (calls server/ layer)
├── assets/        # Feature-specific static files
├── components/    # Components scoped to this feature only
├── hooks/         # Hooks scoped to this feature
├── stores/        # State stores for this feature
├── types/         # TypeScript types used within the feature
└── utils/         # Utility functions for this feature
```

**Note:** Not all folders are required for every feature—include only what's necessary.

## Key Principles

### 1. **Feature Isolation**

- Keep feature code together in `src/features/{feature-name}/`
- Avoid mixing feature-specific code with shared components
- Each feature should be independently deployable

### 2. **Direct Imports (No Barrel Files)**

- Import files directly: `import { Component } from '@/features/awesome-feature/components/Component'`
- Avoid barrel files (`index.ts` re-exports) as they prevent Vite tree-shaking and hurt performance
- Explicitly import what you need

### 3. **Client Data-Access Organization**

The app is local-only. Features call the local data-access layer in `server/` (Dexie/IndexedDB) directly via imports.

**Approach A - Centralized (recommended for shared data access):**

```
src/
├── data/
│   ├── hooks.ts               # React hooks wrapping data-access functions
│   ├── queries.ts             # Client-side data queries/commands
│   └── types.ts               # Types matching Dexie tables/models
└── features/
```

**Approach B - Feature-Scoped (for feature-specific data access):**

```
src/features/awesome-feature/
└── data/
    ├── hooks.ts               # Feature-specific data hooks
    ├── queries.ts             # Feature-specific data operations
    └── types.ts               # Feature-specific models
```

**Keep in sync:**

- Types should match Dexie table schemas
- Document data contracts: table name, fields, indexes, and expected shapes

### 4. **Unidirectional Architecture**

Code flows in one direction only: `shared → features → layouts → app`

```
┌──────────────────┐
│  app/            │  (composes layouts)
├──────────────────┤
│  layouts/        │  (composes features into regions; imports from shared + features)
├──────────────────┤
│  features/       │  (imports from shared only; never from other features)
├──────────────────┤
│  shared/*        │  (never imports from features, layouts, or app)
│ (components,     │
│  hooks, utils,   │
│  stores, types)  │
└──────────────────┘
```

**Rules:**

- Shared code can be used by anything
- Features import from shared only
- Layouts import from shared and features — they are the composition layer
- App composes layouts (and shared)
- Features should NOT import from other features
- Features should NOT import from layouts

### 5. **Feature Composition**

- Compose features inside **layouts**, not within other features
- Layouts are the designated composition layer that arranges feature components into spatial regions
- `App.tsx` composes layouts; layouts compose features
- This ensures feature independence and prevents coupled code

## Common Tasks

### Frontend Feature with Local Data Support

When adding a feature that requires local data storage:

**Local data layer (server/):**

1. Define Dexie table schema and indexes in `server/db/`
2. Add data-access functions (CRUD) in `server/db/`

**Frontend (src/features/{feature}/):**

1. Create a `data/` folder with:
   - `queries.ts` - calls to the `server/` data-access functions
   - `hooks.ts` - React hooks wrapping data queries (loading, error, data)
   - `types.ts` - TypeScript types matching Dexie schema
2. Create `components/`, `stores/`, `utils/` as needed
3. Import data hooks in components to read/write local data

**Coordination:**

- Keep types aligned with Dexie schema
- Document table names, fields, and indexes
- Handle errors consistently in the data layer and UI

### Creating a New Frontend Feature

1. Create directory: `src/features/{feature-name}/`
2. Add subdirectories as needed (data, components, hooks, stores, types, utils)
3. Keep feature imports internal
4. Compose it at the app level

### Adding New Shared Code

1. Determine if it's truly shared (used by 2+ features or by app)
2. Place in appropriate `src/{folder}`: components/, hooks/, utils/, stores/, types/
3. Import directly in features where needed

### Refactoring/Moving Files

1. Check import direction—ensure you're not breaking the unidirectional flow
2. Update all import statements in files that reference the moved code
3. If moving a feature, keep it contained within `src/features/`
4. Consider if code should be extracted to shared

### Code Review Checklist

**For frontend changes:**

- [ ] New files are in correct location (feature-specific vs shared)
- [ ] Unidirectional architecture is maintained (shared → features → layouts → app)
- [ ] No barrel files used; imports are direct
- [ ] Features don't import from other features or layouts
- [ ] No unnecessary code duplication between features
- [ ] Shared code is truly shared (not feature-specific)

**For local data layer changes (server/):**

- [ ] Dexie schema and indexes updated in `server/db/`
- [ ] Data-access functions are exported from `server/index.ts`
- [ ] Data operations are organized and reusable
- [ ] Error handling is consistent and surfaced to the UI

**For data-driven features:**

- [ ] Frontend types match Dexie schema
- [ ] Table/field contracts are documented
- [ ] Features import the local data layer directly (no network calls)

## Edge Cases

### Should this go in shared, a feature, or a layout?

**Use shared if:**

- Code is used by 2+ features
- Code is used by the app directly
- Code is a generic component, hook, or utility

**Use feature if:**

- Code is only used within one feature
- Code is feature-specific logic or domain behavior

**Use layout if:**

- Code defines a spatial region of the app shell (sidebar, title bar, canvas area)
- Code composes feature components into a region without owning business logic
- Code handles structural concerns like panel resizing, collapse, or slot arrangement

### Circular Dependencies

If you detect circular imports:

1. Review if code should be in a different level (move to shared)
2. Check if features are importing each other (refactor)
3. Extract the shared dependency to `src/shared/*`

### Large Features

If a feature grows very large:

1. Keep the main feature structure intact
2. Create subdirectories within feature for organization
3. Avoid creating "sub-features" that import from each other
4. Example:
   ```
   src/features/large-feature/
   ├── components/
   │   ├── Editor/
   │   └── Preview/
   └── stores/
   ```

## Example: Adding a "Canvas Editor" Feature

```
src/features/canvas-editor/
├── data/
│   ├── hooks.ts              # useCanvasData(), etc.
│   └── queries.ts            # IndexedDB (Dexie) operations for canvas
├── components/
│   ├── Canvas/
│   │   └── Canvas.tsx
│   ├── ToolPanel/
│   │   └── ToolPanel.tsx
│   └── Properties/
│       └── Properties.tsx
├── hooks/
│   ├── useCanvasState.ts
│   └── useToolSelection.ts
├── stores/
│   ├── canvasStore.ts        # Zustand/Redux store
│   └── toolStore.ts
├── types/
│   ├── canvas.ts
│   └── tools.ts
└── utils/
    ├── canvasHelpers.ts
    └── validation.ts
```

Then compose in a layout:

```typescript
// src/layouts/canvas-editor/CanvasEditorLayout.tsx
import { CanvasEditor } from "@/features/canvas-editor/components/Canvas";
```
