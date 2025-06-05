# React + Tailwind Revit Viewer Front-End

A Vite-powered React application styled with Tailwind CSS.  
Allows users to upload and view Revit (`.rvt`) and IFC (`.ifc`) files via your APS backend, plus chat, scratch-pad and theme switching.

## Prerequisites

- Node.js (>= 14) and npm or Yarn  
- APS backend running (e.g. `http://localhost:8000`)

## Environment

Create a `.env` or `.env.local` in this folder:

```bash
# React-Tailwind-Template/.env
VITE_API_URL=http://localhost:8000
```

`VITE_API_URL` must point at your FastAPI server.

## Install & Run

```bash
cd React-Tailwind-Template

# install deps
npm install
# or
yarn install

# start dev server (with HMR)
npm run dev
# or
yarn dev

# open http://localhost:5173
```

## Build & Preview

```bash
# build for production
npm run build
# or
yarn build

# preview the production build
npm run preview
# or
yarn preview
```

## Project Structure

- `index.html` — injects Forge Viewer CSS/JS and mounts React  
- `src/main.tsx` — React entry point  
- `src/App.tsx` — layout, theme toggle, grid of panels  
- `src/components/pages/`  
  • `Revitviewer.tsx` — upload/view/download UI & Forge viewer  
  • `Chatbot.tsx`, `History.tsx`, `Scratchpad.tsx` — side panels  
- `src/components/ui/styles/RevitViewer.css` — custom CSS for the viewer layout  
- `src/lib/utils.ts` — helper (`cn`) for Tailwind class merging  

## Scripts

- `npm run dev` / `yarn dev` — start development server  
- `npm run build` / `yarn build` — build production assets  
- `npm run preview` / `yarn preview` — preview production build  
- `npm run lint` / `yarn lint` — run ESLint  

## Tips

- Press **Ctrl+Shift+V** in VS Code to preview this Markdown.  
- Inspect network requests in the browser to verify `VITE_API_URL` calls.  
- If the Forge Viewer fails, ensure scripts are loaded in `index.html` and that your backend’s `/token` endpoint is reachable.

## Customization

- Tailwind config in `tailwind.config.js`  
- Vite aliases (`@` → `src/`) in `vite.config.ts`  
- Modify UI in `src/components/pages/Revitviewer.tsx`  

Enjoy building!
