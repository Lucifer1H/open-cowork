# README Cover Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate a project-specific cover image and place it in README top section for immediate GitHub visual impact.

**Architecture:** Use `baoyu-cover-image` generation workflow to create a static `16:9` cover image, then commit the image under `assets/` and reference it in `README.md` via a stable relative path.

**Tech Stack:** Markdown, static asset (`png`), existing repo docs workflow.

---

### Task 1: Prepare cover generation inputs

**Files:**
- Create: `tmp/readme-cover-brief.md`

**Step 1: Write the input brief**

```md
Title: OpenCode Cowork
Theme: autonomous plan-execute-verify workflow in terminal environment
Tone: modern, technical, trustworthy
```

**Step 2: Verify brief exists**

Run: `test -f tmp/readme-cover-brief.md`
Expected: PASS.

### Task 2: Generate cover image

**Files:**
- Create: `assets/cover.png`

**Step 1: Run cover generation workflow**

Use style:
- type: hero
- palette: cool
- rendering: digital
- text: title-only
- mood: balanced
- aspect: 16:9

**Step 2: Verify output file**

Run: `test -f assets/cover.png`
Expected: PASS.

### Task 3: Integrate cover into README

**Files:**
- Modify: `README.md`

**Step 1: Add centered image block below badge section**

```html
<p align="center">
  <img src="./assets/cover.png" alt="OpenCode Cowork Cover" width="100%" />
</p>
```

**Step 2: Verify reference exists**

Run: `rg "assets/cover.png" README.md`
Expected: Match found.

### Task 4: Verify and commit

**Files:**
- Modify: `README.md`
- Create: `assets/cover.png`

**Step 1: Final checks**

Run:
- `test -f assets/cover.png`
- `rg "assets/cover.png" README.md`

Expected: PASS.

**Step 2: Commit**

```bash
git add assets/cover.png README.md
git commit -m "docs: add generated project cover to readme"
```
