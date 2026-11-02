/**
 * LIPASON — publicación temporal únicamente informativa.
 * Se conserva el sitio original en el historial de GitHub.
 * El catálogo, la administración y los contenidos de proyectos
 * NO se copian a la carpeta pública de Cloudflare Pages.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dest = path.join(root, 'dist');
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.join(dest, 'assets'), { recursive: true });

const files = [
  'index.html',
  'assets/brand.svg',
  'assets/favicon.svg',
  'assets/hero-scene.webp'
];
for (const relative of files) {
  const source = path.join(root, relative);
  if (!fs.existsSync(source)) {
    throw new Error('Falta recurso esencial de portada: ' + relative);
  }
  fs.copyFileSync(source, path.join(dest, relative));
}

fs.writeFileSync(path.join(dest,'robots.txt'),
  'User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /autorizacion.html\nDisallow: /assets/site.js\nSitemap: https://lipason.mx/sitemap.xml\n');
fs.writeFileSync(path.join(dest,'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://lipason.mx/</loc></url></urlset>\n');

// Previene reutilizar archivos de la versión completa por despliegues previos.
fs.writeFileSync(path.join(dest,'_headers'),
  '/\n  X-Robots-Tag: index, follow\n/admin.html\n  X-Robots-Tag: noindex, nofollow\n/autorizacion.html\n  X-Robots-Tag: noindex, nofollow\n');
console.log('LIPASON: portada de presentación generada, sin catálogo ni contenidos privados.');
