# Sub-layer resize handles: what they edit

When **Map → Sub** mode is active, each draggable overlay corresponds to a rendered element with a `data-proj-id` attribute.

## What moving a sub overlay changes

Dragging a sub overlay (not the corner handle) updates:

- `layout.authored.subOffsets[projId].dx`
- `layout.authored.subOffsets[projId].dy`

These are applied as inline transform on the target element:

- `style.transform = translate(dx, dy)`

## What resizing a sub overlay changes

Dragging the bottom-right corner resize handle updates:

- `layout.authored.subSizes[projId].width`
- `layout.authored.subSizes[projId].height`

These are applied as inline size on the target element:

- `style.width = width + "px"`
- `style.height = height + "px"`

## Why actor/reactor handles can look offset in layered mode

`claim-avatar-actor` and `claim-avatar-reactor` are independent `projId`s, so each can have different stored `subOffsets`/`subSizes`.

Also, in layered mode, the layer manager may reparent promoted nodes into layer portals. Overlay boxes are drawn from current `getBoundingClientRect()` values of rendered nodes, so differences between original vs layered preview can appear if portal promotion changes geometry context.

In short:

1. Sub handle position follows **live screen rect** of the current DOM node.
2. Dragging updates `subOffsets` or `subSizes` for that node's `projId`.
3. Original vs layered can differ because promotion changes how a node is positioned/measured.

## How to keep sub handles exactly matching Original mode

The projection editor now defaults to forcing **Original** preview while Sub mode is active. This keeps Sub overlays tied to unlayered geometry.

Config switch:

- `layout.projectionMapping.editor.subModeForcesOriginalPreview` (default `true`)

Set it to `false` only if you explicitly want to edit Sub overlays against layered geometry.
