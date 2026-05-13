# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server at localhost:5173
npm run build      # tsc type-check then Vite production build → dist/
npm run preview    # serve dist/ at localhost:4173
npx tsc --noEmit   # type-check only, no output
```

After every build open `dist/index.html` **or** `KreatorFolderow.html` directly in Chrome/Edge — no server needed (hash routing + relative asset paths via `base: './'`).

> **Node 18 constraint**: Tailwind CSS 4 and react-router 7 require Node 20+. This project deliberately uses **Tailwind 3** and **Vite 5** to stay compatible with Node 18.

## Architecture

There are **two deliverables** maintained in parallel:

| File | Stack | Purpose |
|------|-------|---------|
| `KreatorFolderow.html` | Vanilla React (UMD CDN) + inline CSS | Single self-contained file, opens from `file://` in any Chromium browser |
| `src/` → `dist/` | React 18 + TypeScript + Tailwind 3 + Vite | Proper source tree, built via `npm run build` |

Both implement identical features and must be kept in sync when logic changes.

### Source tree (`src/`)

```
src/
  main.tsx                  ReactDOM.createRoot entry
  styles/index.css          @tailwind base/components/utilities
  types/index.ts            FolderNode, Template interfaces
  app/
    App.tsx                 RouterProvider wrapper
    routes.tsx              createHashRouter — hash routing for file:// support
    pages/
      LoginPage.tsx         hardcoded Admin/admin123, stores isAuthenticated in localStorage
      TemplatePage.tsx      all app logic (see below)
```

### TemplatePage — key design decisions

- **All state lives in one component** (`TemplatePage.tsx`). No context, no separate stores.
- `FolderNode` tree is immutable — mutations go through `findAndUpdate` / `findAndDelete` recursive helpers that return new arrays.
- **Persistence**: templates saved to `localStorage` as JSON under the key `"templates"`. Auth flag under `"isAuthenticated"`.
- **Import to disk**: uses `window.showDirectoryPicker()` (File System Access API, Chrome/Edge 86+ only). `runImport(name, folders)` is the shared helper called by both the creator tab and the templates tab. Falls back to an alert on unsupported browsers.
- **No ZIP export** — was removed; `jszip` is not a dependency.

### Design tokens (Figma Make source)

| Token | Value |
|-------|-------|
| Page background | `#f8fafc` |
| Card / panel | white, border `#e2e8f0`, radius 16px |
| Panel header bg | `#f1f5f9` |
| Active tab bg | `#e2e8f0` |
| Button dark | `#1d293d` |
| Button white | white, border `#e2e8f0` |
| Text primary | `#314158` |
| Folder icon | `#E8AC3E` (amber) |
| Template icon | `#3878D4` (blue) |
| Connector lines | `#E2E8F0` |

### KreatorFolderow.html

Single-file version uses `React.createElement` (no JSX, no build). All logic mirrors `TemplatePage.tsx`. When editing this file keep the function names and data shapes identical to the TypeScript source (`runImport`, `createFoldersRecursive`, `FolderNode` shape).

## Auto-commit script

`auto-commit.ps1` — PowerShell FileSystemWatcher that auto-commits and pushes on every file change. Run with `.\auto-commit.ps1` in the project folder. Ignores `.git/` and itself.
