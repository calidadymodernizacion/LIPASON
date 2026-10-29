/**
 * LIPASON — versión independiente para Cloudflare Pages.
 * Construye el sitio existente SIN editar el repositorio fuente:
 * - conserva catálogo / panel Supabase y su CSS;
 * - cambia la narrativa institucional de LIPA a LIPASON;
 * - incorpora colaboraciones académicas, privadas y sociales;
 * - no declara convenios no celebrados ni inventa medios de contacto.
 *
 * Cloudflare Pages: Build command = node scripts/build-pages.mjs
 *                  Build output directory = dist
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dest = path.join(root, 'dist');
const email = (process.env.LIPASON_EMAIL || '').trim();
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const escapeHtml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const sourceIndex = path.join(root, 'index.html');
if (!fs.existsSync(sourceIndex)) throw new Error('No se encontró index.html en la raíz del repositorio.');

// Distribuir únicamente los archivos estáticos necesarios. Sin secretos ni carpetas técnicas.
fs.rmSync(dest, {recursive:true, force:true});
fs.mkdirSync(dest, {recursive:true});
for (const entry of ['index.html','admin.html','config.js','assets','favicon.ico','robots.txt']) {
  const src = path.join(root, entry);
  if(fs.existsSync(src)) fs.cpSync(src, path.join(dest, entry), {recursive:true});
}

function read(rel) {return fs.readFileSync(path.join(dest,rel),'utf8')}
function write(rel, value) {fs.writeFileSync(path.join(dest,rel),value,'utf8')}
function change(source, oldText, newText, label) {
  if(source.includes(oldText)) return source.replace(oldText,newText);
  if(source.includes(newText)) return source;
  throw new Error(`No se encontró la sección original «${label}». Comprueba cambios en index.html.`);
}
function replaceByRegex(source, re, replacement, label) {
  if(!re.test(source)) throw new Error(`No se encontró «${label}» en el código actual.`);
  return source.replace(re,replacement);
}

let html=read('index.html');
html=change(html,'<title>LIPA — Ideas públicas que cobran vida</title>','<title>LIPASON — Ideas públicas que cobran vida</title>','título');
html=replaceByRegex(html,/<meta name="description" content="[^"]*">/,'<meta name="description" content="LIPASON es una iniciativa independiente de innovación pública aplicada en Sonora. Del conocimiento a soluciones explorables, con oportunidades de colaboración académica, privada y social.">','descripción SEO');
html=html.replace('</head>','<link rel="canonical" href="https://lipason.mx/">\n<meta property="og:type" content="website">\n<meta property="og:title" content="LIPASON — Ideas públicas que cobran vida">\n<meta property="og:description" content="Innovación pública aplicada, prototipos funcionales y colaboración académica, privada y social.">\n<meta property="og:url" content="https://lipason.mx/">\n</head>');
html=change(html,'aria-label="LIPA, ir al inicio"','aria-label="LIPASON, ir al inicio"','accesibilidad de marca');
html=change(html,'<strong class="brand-name">LIPA</strong>','<strong class="brand-name">LIPASON</strong>','marca principal');
html=change(html,'<p class="eyebrow">DEL PAPEL AL PROTOTIPO</p>','<p class="eyebrow">INICIATIVA INDEPENDIENTE · SONORA</p>','encabezado editorial');
html=change(html,
  'Un laboratorio académico donde los proyectos de nuestros estudiantes dejan de ser documentos y se convierten en prototipos que pueden verse, explorarse y mejorarse.',
  'Nacimos del aula para transformar conocimiento en soluciones que se pueden ver, explorar y mejorar. Hoy abrimos nuestro trabajo a la colaboración académica, privada y social.',
  'presentación principal');
html=change(html,'Cada idea tiene una historia detrás.','Del conocimiento a propuestas que se pueden explorar.','texto de catálogo');
html=change(html,'<span class="section-tag">Acerca de LIPA</span>','<span class="section-tag">Quiénes somos</span>','subtítulo de identidad');
html=change(html,'Un laboratorio<br>académico en constante evolución','Una iniciativa<br>independiente y abierta a colaborar','título de identidad');
html=change(html,
 'LIPA nace en el aula como un espacio de aprendizaje, experimentación y colaboración para imaginar y materializar mejores servicios públicos.',
 'LIPASON surge de la experiencia académica y evoluciona como una iniciativa independiente para investigar, diseñar y probar soluciones útiles para la sociedad.',
 'reseña de identidad');
html=change(html,
 'Partimos de problemas públicos identificados por estudiantes de posgrado. A través del acompañamiento docente, la reflexión académica y el prototipado digital, exploramos cómo podrían funcionar las soluciones propuestas. Los prototipos son demostraciones académicas, no sistemas institucionales en producción.',
 'Partimos de problemas reales identificados en entornos académicos, organizacionales y sociales. Analizamos el contexto, diseñamos alternativas y desarrollamos prototipos para explorar su funcionamiento. Cada prueba permite aprender y realizar ajustes antes de considerar una implementación.',
 'metodología larga');
html=change(html,
 'Un laboratorio que nace del aula y transforma conocimiento en posibilidades.',
 'Nuestro origen está en el aula. Nuestro horizonte es la colaboración.',
 'título de historia');
html=change(html,
 'LIPA es una iniciativa académica en desarrollo, originada en la experiencia docente de la asignatura Calidad y Modernización en el Servicio Público, con estudiantes de posgrado en Sonora. Busca visibilizar la autoría estudiantil y fortalecer el aprendizaje aplicado. La exposición pública de nombres y trabajos queda sujeta a la autorización de sus autores.',
 'LIPASON nació a partir de la experiencia docente de la asignatura Calidad y Modernización en el Servicio Público, en la Maestría en Administración Pública del Instituto Sonorense de Administración Pública (ISAP). Su evolución es independiente: buscamos abrir oportunidades de colaboración con instituciones académicas, organizaciones privadas y sector social. Reconocemos la autoría de las propuestas originales, y su difusión y aprovechamiento requieren los permisos correspondientes. Esta mención de origen no implica afiliación ni respaldo institucional del ISAP.',
 'origen independiente');
html=change(html,'<span>Sonora, México</span></div></section>','<span>Iniciativa independiente</span><span>Sonora, México</span></div></section>','etiquetas de identidad');
html=change(html,'<a href="#acerca">Acerca</a></nav>','<a href="#acerca">Acerca</a><a href="#colaborar">Colaboración</a></nav>','nav principal');
html=change(html,'<a href="#acerca">Acerca de LIPA</a></nav>','<a href="#acerca">Acerca</a><a href="#colaborar">Colaboración</a></nav>','nav móvil');
html=change(html,'class="footer-brand">LIPA<span','class="footer-brand">LIPASON<span','marca del pie');
html=change(html,'Iniciativa académica en desarrollo · Sonora, México','Iniciativa independiente · Sonora, México','pie independiente');
html=change(html,'Las imágenes utilizadas son composiciones conceptuales del diseño aprobado; podrán sustituirse por capturas reales de cada aplicación.',
 'Las portadas ilustrativas representan cada proyecto. Las capturas de sus interfaces, cuando estén disponibles, muestran el prototipo real. Los sistemas publicados son demostraciones y no necesariamente servicios en operación.',
 'nota de ficha');

const contact = validEmail ? `<a class="independent-contact" href="mailto:${escapeHtml(email)}?subject=Colaboraci%C3%B3n%20con%20LIPASON">Escríbenos para colaborar <span aria-hidden="true">↗</span></a>` : '';
const sections = `
<div class="shell independent-sections">
  <section class="independent-block" id="capacidades" aria-labelledby="capabilitiesTitle">
    <p class="independent-overline">LO QUE HACEMOS</p>
    <h2 id="capabilitiesTitle">Ideas con método.<br><em>Soluciones que se exploran.</em></h2>
    <p class="independent-lead">Combinamos conocimiento aplicado, diseño y capacidades técnicas para que una propuesta no se quede en el papel. Cada colaboración se define según su alcance, viabilidad y propósito.</p>
    <div class="independent-cards">
      <article class="independent-card"><span>01 / CONOCIMIENTO</span><h3>Investigación y diagnóstico</h3><p>Analizamos problemas, procesos y necesidades para formular rutas de mejora comprensibles y útiles.</p></article>
      <article class="independent-card"><span>02 / TECNOLOGÍA</span><h3>Prototipos funcionales</h3><p>Diseñamos herramientas y experiencias digitales que permiten visualizar, probar y perfeccionar soluciones.</p></article>
      <article class="independent-card"><span>03 / APRENDIZAJE</span><h3>Formación y asesoría</h3><p>Desarrollamos talleres, acompañamiento y experiencias de aprendizaje basadas en problemas reales.</p></article>
    </div>
  </section>
  <section class="independent-collab" id="colaborar" aria-labelledby="collabTitle">
    <div class="independent-collab-intro"><p class="independent-overline">VINCULACIÓN</p><h2 id="collabTitle">La innovación ocurre cuando las ideas se encuentran.</h2><p>Como iniciativa independiente, LIPASON está abierta a explorar proyectos y colaboraciones con organizaciones que deseen transformar conocimiento en soluciones de valor público y social.</p>${contact}</div>
    <div class="independent-collab-grid">
      <article><b>01</b><h3>Ámbito académico</h3><p>Universidades, posgrados, centros de investigación y comunidades de aprendizaje.</p></article>
      <article><b>02</b><h3>Ámbito privado</h3><p>Empresas, centros de formación y organizaciones interesadas en mejorar procesos y experimentar soluciones.</p></article>
      <article><b>03</b><h3>Ámbito social</h3><p>Asociaciones civiles, colectivos y proyectos comunitarios con necesidades concretas.</p></article>
    </div>
  </section>
  <p class="independent-disclosure">LIPASON es una iniciativa independiente, no una dependencia gubernamental. Los proyectos de origen académico conservan sus respectivas autorías; las colaboraciones y servicios se sujetan a acuerdos y autorizaciones expresas.</p>
</div>`;
if(!html.includes('id="capacidades"')) html=html.replace('</main>',sections+'\n</main>');
if(!html.includes('id="colaborar"')) throw new Error('La sección de colaboración no fue insertada.');

const styles = `
/* LIPASON independiente — se conserva la identidad editorial y la galería original */
.brand-name{font-size:clamp(23px,2vw,29px);letter-spacing:-.075em}.brand-desc{font-size:9px}.header-content{grid-template-columns:minmax(245px,1fr) 1.35fr 1fr}
.desktop-nav{gap:clamp(14px,1.6vw,29px)}
.independent-sections{padding-top:28px;padding-bottom:105px}
.independent-block{padding:66px 0 76px;border-top:1px solid #e6e9f0}
.independent-overline{font-size:11px;color:#6155c9;font-weight:750;letter-spacing:.14em;margin:0 0 24px}
.independent-block h2,.independent-collab h2{font-size:clamp(31px,4.4vw,60px);letter-spacing:-.065em;line-height:1.1;font-weight:730;margin:0 0 22px;max-width:880px}
.independent-block h2 em{font-style:normal;color:#6861ce}
.independent-lead{font-size:15px;line-height:1.8;color:#586172;max-width:770px;margin:0 0 40px}
.independent-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.independent-card{background:white;border:1px solid #e5e8ef;border-radius:17px;padding:27px 25px 29px;min-height:240px}
.independent-card span{font-size:10px;font-weight:750;color:#6a62c6;letter-spacing:.12em}
.independent-card h3{font-size:21px;letter-spacing:-.045em;line-height:1.2;margin:22px 0 13px}
.independent-card p,.independent-collab p{font-size:13px;line-height:1.85;color:#687283;margin:0}
.independent-collab{background:#131b31;color:white;border-radius:21px;padding:clamp(30px,5vw,65px)}
.independent-collab .independent-overline{color:#adadff}
.independent-collab h2{font-size:clamp(29px,3.6vw,51px);max-width:760px}
.independent-collab-intro>p:not(.independent-overline){color:#c4cad8;max-width:740px;font-size:14px}
.independent-collab-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-top:43px;padding-top:29px;border-top:1px solid #364158}
.independent-collab-grid b{font-size:11px;color:#a8a3ff}.independent-collab-grid h3{font-size:18px;letter-spacing:-.04em;margin:11px 0 9px}
.independent-collab-grid p{font-size:12px;color:#b4bdd0}
.independent-contact{display:inline-flex;margin-top:22px;padding:12px 18px;background:#fff;color:#182138;border-radius:10px;font-size:12px;font-weight:700;gap:14px}
.independent-contact:hover{background:#e6e4ff}
.independent-disclosure{max-width:920px;margin:22px auto 0;color:#7c8696;font-size:11px;line-height:1.7;text-align:center}
@media(max-width:1070px){.header-content{grid-template-columns:minmax(240px,1fr) 1.2fr auto}.desktop-nav{gap:13px}.desktop-nav a{font-size:11px}.brand-desc{display:none}}
@media(max-width:830px){.independent-cards,.independent-collab-grid{grid-template-columns:1fr}.independent-card{min-height:0}.independent-collab-grid{gap:22px}.independent-sections{padding-bottom:60px}.brand-desc{display:none}}
@media(max-width:600px){.independent-block{padding:45px 0 48px}.independent-card{padding:25px}.independent-collab{padding:28px 23px}}
`;
html=html.replace('</style>',styles+'\n</style>');
write('index.html',html);

// site.js contiene dos textos dinámicos que sobreescriben las descripciones del HTML.
// Actualizarlos en la versión de distribución para que la narrativa permanezca consistente.
const siteFile=path.join(dest,'assets','site.js');
if(fs.existsSync(siteFile)){
 let js=read('assets/site.js');
 const story='LIPASON nació de la experiencia docente en la asignatura Calidad y Modernización en el Servicio Público de la Maestría en Administración Pública del ISAP. Hoy es una iniciativa independiente que explora colaboraciones académicas, privadas y sociales. Su origen no implica representación ni respaldo institucional del Instituto. Las publicaciones respetan la autoría y los permisos correspondientes.';
 const method='Partimos de problemas reales en entornos académicos, privados y sociales. A partir del análisis, el diseño y el prototipado, buscamos que las propuestas puedan explorarse, recibir retroalimentación y mejorarse. Los prototipos publicados son demostraciones; no representan necesariamente sistemas institucionales en operación.';
 js=replaceByRegex(js,/if\(how\)how\.textContent='[^']*';/,`if(how)how.textContent=${JSON.stringify(method)};`,'texto dinámico de metodología');
 js=replaceByRegex(js,/if\(about\)about\.textContent='[^']*';/,`if(about)about.textContent=${JSON.stringify(story)};`,'texto dinámico de origen');
 write('assets/site.js',js);
}

const adminFile=path.join(dest,'admin.html');
if(fs.existsSync(adminFile)){
 let admin=read('admin.html');
 admin=admin.replace('<title>LIPA — Estudio editorial</title>','<title>LIPASON — Panel de administración</title>');
 admin=admin.replace('LIPA <small>Estudio editorial</small>','LIPASON <small>Panel de administración</small>');
 write('admin.html',admin);
}

// Una dirección canónica no sustituye la configuración de DNS y redirecciones en Cloudflare.
fs.writeFileSync(path.join(dest,'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://lipason.mx/sitemap.xml\n');
fs.writeFileSync(path.join(dest,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://lipason.mx/</loc></url></urlset>');
console.log('LIPASON generado correctamente en dist/. Catálogo y administración conservados.');
console.log(validEmail ? `Contacto activo: ${email}` : 'Sin correo de contacto: se omite el botón hasta configurar LIPASON_EMAIL.');
