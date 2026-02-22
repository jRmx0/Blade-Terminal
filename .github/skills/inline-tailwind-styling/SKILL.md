---
name: inline-tailwind-styling
description: Enforces inline Tailwind CSS styling as the default approach. Use when creating or modifying component styling, UI layouts, or visual design. Always apply styles directly to elements using className with Tailwind utility classes. Avoid base styles, design systems, and global CSS unless explicitly impossible with Tailwind.
---

# Inline Tailwind Styling

This skill defines the default styling approach for this project: **all styling must be inline Tailwind CSS applied directly to elements**.

## Core Rule

**Default behavior: Apply all styling using inline Tailwind utility classes on the `className` attribute.**

```tsx
// ✅ CORRECT - Inline Tailwind
<div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md">
  <span className="text-lg font-semibold text-gray-800">Title</span>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Click
  </button>
</div>

// ❌ WRONG - External CSS
<div className="container">
  <span className="title">Title</span>
  <button className="btn-primary">Click</button>
</div>
```

## Prohibited Approaches

Do NOT create or use:
- Base styles
- Design systems
- Global CSS files
- CSS modules
- Styled components
- Theme configuration files

## When CSS Files Are Required

CSS files are ONLY used when styling cannot be achieved with inline Tailwind. Before creating or modifying any `.css` file, **ask the user for explicit confirmation**.

### Cases requiring CSS files:

1. **Custom animations with `@keyframes`**
   - Tailwind's built-in `animate-*` utilities may not cover complex custom animations
   - Example: Multi-step animations, custom timing functions

2. **Complex pseudo-selectors**
   - When targeting specific child indices beyond `:first-child` / `:last-child`
   - Example: `:nth-child(3n+2)`, `::before` with generated `content`, complex `:has()` selectors

3. **Global resets or normalizations**
   - Browser-specific overrides not addressable per-element
   - Example: `* { box-sizing: border-box; }`, print media queries

4. **CSS variables for dynamic theming**
   - When runtime CSS variable calculation is required
   - Example: `--dynamic-height: calc(100vh - var(--header-height));`

5. **Vendor-specific prefixes**
   - Browser-specific properties not supported by Tailwind
   - Example: `-webkit-appearance`, `-moz-osx-font-smoothing`

### Workflow when CSS is needed:

1. Identify that the styling cannot be achieved with inline Tailwind
2. **Stop and ask the user**: "This styling requires a CSS file because [reason]. Should I create/modify a CSS file for this?"
3. Wait for user confirmation
4. If approved, create a minimal CSS file with only the required rules

## Guidelines

- **Do not suggest improvements** unless the user explicitly asks for styling advice
- **Do not extract** or refactor inline styles into external files unless the user requests it
- **Keep everything inline** by default, no matter how long the className becomes
- If a component has no styling needs that require CSS, do not create a CSS file for it

## Summary

- ✅ Inline Tailwind on className: Always
- ❌ External CSS files: Only with user permission, and only for cases Tailwind cannot handle
- ❌ Design systems, base styles, global styles: Never
