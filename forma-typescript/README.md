# FORMA — TypeScript Product Storefront

A responsive product storefront built with HTML, CSS, TypeScript, and Vite. It uses the public DummyJSON Products API for demo product data.

## Requirements
- Node.js 20 or newer recommended
- npm

## Run locally
1. Extract the ZIP and open the project folder in VS Code or your terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build
```bash
npm run build
npm run preview
```

The production-ready files are generated in `dist/`.

## Features
- Responsive product grid: 4 columns on desktop, 2 on tablet, 1 on mobile.
- Products loaded from the DummyJSON API, with loading and retry/error states.
- Live search, category filtering, sorting, and load-more pagination.
- Demo bag counter, favourites, and toast notifications.
- TypeScript interfaces for product/API data and strict type checking.
- No UI framework; Vite is used for development and bundling.

Product data: https://dummyjson.com/docs/products

Note: this is a front-end demo. Bag and favourites are not persisted, and prices/stock are sample data.
