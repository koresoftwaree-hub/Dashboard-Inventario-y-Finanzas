import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le dice a Next.js que construya archivos estáticos puros
  output: 'export',
  
  // IMPORTANTE: Cambia esto por el nombre EXACTO de tu repositorio en GitHub.
  // Por ejemplo, si tu link es https://tu-usuario.github.io/Dashboard-Inventario-y-Finanzas
  // el basePath debe ser '/Dashboard-Inventario-y-Finanzas'
  basePath: '/Dashboard-Inventario-y-Finanzas',
  
  // GitHub Pages no soporta la optimización de imágenes nativa de Next.js
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
