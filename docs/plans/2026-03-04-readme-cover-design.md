# README Cover Design

## Goal

Add a project-specific cover image to `README.md` that visually communicates OpenCode Cowork's core value: autonomous planning, execution, and verification.

## Constraints

- Place cover in top section (below badges), as requested.
- Keep GitHub markdown rendering stable (relative asset path).
- Keep visual tone technical and aligned with existing branding.
- Preserve existing README structure and compatibility.

## Chosen Direction

- Approach: static hero cover image
- File path: `assets/cover.png`
- Aspect ratio: `16:9`
- Cover style parameters:
  - type: `hero`
  - palette: `cool`
  - rendering: `digital`
  - text: `title-only`
  - mood: `balanced`
  - language: `en`

## Composition

- Main motif: terminal-like workspace with flow nodes (Plan / Execute / Verify)
- Visual personality: modern, clean, technical, trustworthy
- Title text: `OpenCode Cowork`

## README Integration

Insert centered cover block after badge section:

```html
<p align="center">
  <img src="./assets/cover.png" alt="OpenCode Cowork Cover" width="100%" />
</p>
```

## Verification

- `test -f assets/cover.png`
- `rg "assets/cover.png" README.md`
- Check README top section visually in GitHub preview
