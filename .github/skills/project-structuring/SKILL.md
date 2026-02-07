---
name: project-structure
description: Guides proper file organization and architecture for the Blade Terminal project. Use when creating new files, moving/refactoring existing code, reviewing code structure, or ensuring code follows the established directory conventions for components, features, hooks, stores, and utilities.
compatibility: Designed for blade-terminal codebase - React/TypeScript project using Bun
metadata:
  author: jRmx0
  version: "1.0"
---

# Project Structure Guide

Use this skill when organizing files and folders in the Blade Terminal project to ensure consistency, scalability, and maintainability.

## Core Directory Structure

The primary code lives in the `src` folder:

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
├── lib/                   # Reusable libraries preconfigured for the application
├── stores/                # Global state stores (Zustand, Redux, etc.)
├── testing/               # Test utilities and mocks
├── types/                 # Shared TypeScript types
└── utils/                 # Shared utility functions
```

## Feature-Based Organization

Most code should be organized within the `src/features/` folder. Each feature is self-contained:

```
src/features/awesome-feature/
├── api/           # Exported API request declarations and hooks for this feature
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

### 3. **API Organization**
Two approaches depending on your use case:

**Approach A - Centralized (recommended for shared APIs):**
```
src/
├── api/              # All API calls defined here
│   ├── hooks.ts
│   └── requests.ts
└── features/
```

**Approach B - Feature-Scoped (for feature-specific APIs):**
```
src/features/awesome-feature/
└── api/
    ├── hooks.ts
    └── requests.ts
```

### 4. **Unidirectional Architecture**
Code flows in one direction only: `shared → features → app`

```
┌─────────────────┐
│  app/           │  (imports from features & shared)
├─────────────────┤
│  features/      │  (imports from shared only)
├─────────────────┤
│  shared/*       │  (never imports from features or app)
│ (components,    │
│  hooks, utils,  │
│  stores, types) │
└─────────────────┘
```

**Rules:**
- Shared code can be used by anything
- Features can only import from shared
- App can import from features and shared
- Features should NOT import from other features

### 5. **Feature Composition**
- Compose features at the app level, not within features
- This ensures feature independence and prevents coupled code
- Example: Combine multiple features in `App.tsx` or a layout component

## Common Tasks

### Creating a New Feature
1. Create directory: `src/features/{feature-name}/`
2. Add subdirectories as needed (api, components, hooks, stores, types, utils)
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
- [ ] New files are in correct location (feature-specific vs shared)
- [ ] Unidirectional architecture is maintained
- [ ] No barrel files used; imports are direct
- [ ] Features don't import from other features
- [ ] No unnecessary code duplication between features
- [ ] Shared code is truly shared (not feature-specific)

## Edge Cases

### Should this go in shared or in a feature?
**Use shared if:**
- Code is used by 2+ features
- Code is used by the app directly
- Code is a generic component, hook, or utility

**Use feature if:**
- Code is only used within one feature
- Code is feature-specific logic

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
├── api/
│   ├── hooks.ts              # useCanvasData(), etc.
│   └── requests.ts           # API calls for canvas
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

Then use in `App.tsx`:
```typescript
import { CanvasEditor } from '@/features/canvas-editor/components/Canvas'
```
