# Custom Agent Guidelines

These rules ensure any future development, bug fixes, or enhancements remain streamlined and prevent the recurrence of issues solved during previous deployment and debugging cycles.

---

## 📱 Mobile UI & Viewport Layout
- **Strict Height Constraints**: The main viewport container must use `h-[100dvh]` combined with `overflow-hidden` as its wrapper to prevent screen scrolling on landscape viewports.
- **Dynamic Canvas Sizing**: Keep the primary outer game canvas bounds dynamically restricted using height subtractions (e.g., `max-h-[calc(100dvh-108px)]`) and proper aspect ratios (e.g., `aspect-[850/480]`) to ensure HUD panels and control triggers (such as the virtual `BLAST` action button) remain visible on all screen formats and high-ratio smartphones.
- **Micro UI Scaling**: Prioritize compact layout density settings on smaller screens. Use responsive classes like padding adjustments (`p-1.5` scaling up to `sm:p-4`), small typography (`text-[8px]` scaling to `sm:text-xs`), and smaller control target sizes for mobile screens.

---

## 🛜 Relative Routing & PWA Compatibility (GitHub Pages)
- **Relative Asset Paths**: Keep all path references in `/index.html` strictly relative (e.g., `./manifest.json` and `./src/main.tsx` instead of `/manifest.json` or `/src/main.tsx`).
- **Start URL Configurations**: The `/public/manifest.json` start URL entry must be set to `"start_url": "./"` to ensure relative resolving underneath subdirectory routing schemas typical of sandbox environments and static hosting.

---

## 🚀 GitHub Actions Deployment Constraints
- **Workflow Setup**: Ensure the build action runtime specified in `.github/workflows/deploy.yml` runs on modern LTS node environments (Node v22).
- **Dependency Installation**: Use `npm install` rather than `npm ci` for automation scripts, as the lock file environment might fluctuate inside standard drag-and-drop commits.
