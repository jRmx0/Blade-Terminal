---
name: konva-canvas-performance
description: "Konva + react-konva canvas performance patterns for blade-terminal. Use when working on the canvas editor, Konva layers, panning, zooming, shape rendering, or diagnosing canvas lag. Covers: React.memo on layers, eliminating Zustand position subscriptions, CSS background grid, Konva draggable stage for panning, offscreen canvas for text labels, listening(false), perfectDrawEnabled(false)."
---

# Konva Canvas Performance

## Golden Rules

1. **Never subscribe to `position` in components that contain Konva layers.** A Zustand selector returning `position` re-renders the entire subtree on every pan frame.
2. **Panning = `stage.startDrag()`**, not manual mouse tracking. Konva's DD engine is native and free.
3. **The grid is a CSS `<div>`, not a Konva layer.** CSS `background-position` updates cost nothing; a Konva grid layer redraws every frame.
4. **Wrap every layer component in `React.memo`.** Stabilize all prop references (`useCallback`, `useMemo`) so memo actually works.
5. **Non-interactive shapes**: always set `listening={false}` and `perfectDrawEnabled={false}`.

---

## Panning

Use Konva's built-in drag engine (option 2 from [Konva scrolling docs](https://konvajs.org/docs/sandbox/Canvas_Scrolling.html)):

```ts
// On middle-mouse down
stage.startDrag();

// Stage onDragMove — sync to Zustand for grid
setPosition({ x: stage.x(), y: stage.y() });

// Stage onDragEnd — final sync
setPosition({ x: stage.x(), y: stage.y() });
```

- Set `draggable={false}` on `<Stage>` — only `startDrag()` on middle-mouse should initiate panning.
- Wire `onDragMove` and `onDragEnd` directly on `<Stage>`.

---

## React Re-renders During Pan

**Problem:** Any component subscribed to `position` re-renders every pan frame.

**Fix:**
- Read `position` non-reactively for initial Stage x/y: `useCanvasViewStore.getState().position`
- Only `CanvasGridLayer` (a plain `<div>`) should subscribe to `position`
- Apply `React.memo` + `useCallback`/`useMemo` to all layer components

```tsx
// CanvasEditor — do NOT subscribe to position
const scale = useCanvasViewStore((s) => s.scale);           // ✅
const setPosition = useCanvasViewStore((s) => s.setPosition); // ✅
// const position = useCanvasViewStore((s) => s.position);   // ❌ re-renders every frame

// Stage initial position — read once, non-reactive
<Stage
  x={useCanvasViewStore.getState().position.x}
  y={useCanvasViewStore.getState().position.y}
  ...
/>
```

**Zustand selector pitfall:** Never return a new object from a selector — it always triggers a re-render:
```ts
// ❌ Always triggers re-render (new object each call)
const { position, scale } = useCanvasViewStore((s) => ({ position: s.position, scale: s.scale }));

// ✅ Two stable primitive selectors
const position = useCanvasViewStore((s) => s.position);
const scale = useCanvasViewStore((s) => s.scale);
```

---

## CSS Background Grid

Move the grid entirely out of Konva into a CSS `<div>`. Place it **outside `<Stage>`** as a sibling in the DOM.

```tsx
// CanvasGridLayer.tsx — no Konva Layer, just a div
export function CanvasGridLayer() {
    const position = useCanvasViewStore((s) => s.position); // subscribes here, not in CanvasEditor
    const scale = useCanvasViewStore((s) => s.scale);
    const gridVisible = useCanvasViewStore((s) => s.gridVisible);
    if (!gridVisible) return null;

    const cellPx = GRID_SPACING * scale;
    const bgX = ((position.x % cellPx) + cellPx) % cellPx;
    const bgY = ((position.y % cellPx) + cellPx) % cellPx;

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(${color} 1px, transparent 1px),
                                  linear-gradient(90deg, ${color} 1px, transparent 1px)`,
                backgroundSize: `${cellPx}px ${cellPx}px`,
                backgroundPosition: `${bgX}px ${bgY}px`,
            }}
        />
    );
}
```

```tsx
// CanvasEditor JSX — grid is a sibling, not inside Stage
<div ref={containerRef} className="w-full h-full overflow-hidden ...">
    <CanvasGridLayer />   {/* CSS div, always covers full viewport */}
    <Stage ...>
        {/* no grid layer here */}
    </Stage>
</div>
```

---

## Text Labels on Shapes (Offscreen Canvas)

Avoid `<Text>` nodes for labels that don't change often. Pre-render to an offscreen `HTMLCanvasElement` and blit as `<Image>`:

```tsx
const [offscreen] = useState<HTMLCanvasElement>(() => {
    const c = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    c.width = LABEL_W * dpr;
    c.height = LABEL_H * dpr;
    return c;
});

useLayoutEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const ctx = offscreen.getContext("2d")!;
    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    // ... draw text ...
    ctx.restore();
    imageRef.current?.getLayer()?.batchDraw();
}, [id, color, offscreen]); // only re-runs when content changes

return (
    <Image
        ref={imageRef}
        image={offscreen}
        listening={false}
        perfectDrawEnabled={false}
        // scale inversely with stage scale to keep pixel size constant:
        width={LABEL_W / scale}
        height={LABEL_H / scale}
        offsetX={LABEL_W / (2 * scale)}
        offsetY={LABEL_H / (2 * scale)}
    />
);
```

---

## Layer / Shape Flags

| Flag | Default | Set to | When |
|---|---|---|---|
| `listening` | `true` | `false` | Layer or shape never receives events |
| `perfectDrawEnabled` | `true` | `false` | Shape has fill + stroke + opacity but no shadow — eliminates extra compositing pass |
| `layer.listening(false)` | `true` | `false` | Entire layer is non-interactive (e.g. a background layer) |

---

## Drag Optimization (Shape Drag)

Per the [Konva performance docs](https://konvajs.org/docs/performance/All_Performance_Tips.html): move a shape to a dedicated drag layer while dragging, back to the original layer on drag end. This avoids redrawing the entire main layer on every move frame.

```ts
shape.on('dragstart', () => shape.moveTo(dragLayer));
shape.on('dragend', () => shape.moveTo(mainLayer));
```

---

## Checklist: Adding a New Layer

- [ ] Wrap component in `React.memo`
- [ ] All callback props wrapped in `useCallback` at the call site
- [ ] All array/object props wrapped in `useMemo` at the call site
- [ ] Does NOT subscribe to `position` (unless it's a CSS component like CanvasGridLayer)
- [ ] Non-interactive shapes have `listening={false}` and `perfectDrawEnabled={false}`
- [ ] No inline arrow functions as event handlers inside the render loop (use `useCallback`)
