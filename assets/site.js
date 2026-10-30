'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const grid = $('#projectGrid');
  const notice = $('#catalogNotice');
  const dialog = $('#projectDialog');
  const legacyBase = 'https://calidadymodernizacion.github.io/LIPA/';
  const fallbackImage = 'assets/project-fallback.svg';
  // La colección fundacional procede de trabajos académicos del ISAP.
  // Proyectos futuros de otras colaboraciones no reciben esa atribución automáticamente.
  const foundationalSlugs = new Set(['siivec','salud-oportuna','siref-festividades','vera-c3','protocoloclaria','brujulaues','sigesalud','mgcip','mitse','quiriegocercadeti','soeci','sigeslegislativo','sigessonora','controlpje','hermosilloconecta']);
  let projects = [];
  let lastFocus = null;
  let activeSlug = null;
  let timer;

  const isHttps = (value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
  function safeImage(src) {
    const value = (src || '').trim();
    if (isHttps(value)) return value;
    // Compatibilidad con las portadas locales del LIPA original.
    if (/^assets\/[a-z0-9._/-]+$/i.test(value) && !value.includes('..')) {
      if (/^assets\/project-(siivec|salud|siref)\.webp$/.test(value)) return legacyBase + value;
      return value;
    }
    return fallbackImage;
  }
  function imageFallback(img) { img.onerror = () => { img.onerror = null; img.src = fallbackImage; }; }
  function node(tag, cls, content) { const el = document.createElement(tag); if (cls) el.className = cls; if (content !== undefined) el.textContent = content; return el; }
  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(timer); timer = setTimeout(() => el.classList.remove('show'), 3000); }
  function field(label, value) { if (!value || !String(value).trim()) return null; const div = node('div', 'field'); div.append(node('strong', '', label), node('p', '', value)); return div; }
  function urlWithSlug(slug) { const url = new URL(location.href); if (slug) url.searchParams.set('proyecto', slug); else url.searchParams.delete('proyecto'); return url; }

  function render() {
    const query = $('#searchProjects').value.trim().toLocaleLowerCase('es');
    const filtered = projects.filter(p => [p.title,p.card_title,p.card_label,p.category,p.summary,p.card_tag_1,p.card_tag_2].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(query));
    grid.replaceChildren();
    const count = projects.length;
    $('#catalogCount').textContent = count === 1 ? '1 ficha publicada' : `${count} fichas publicadas`;
    if (!filtered.length) {
      grid.append(node('p', 'empty-results', count ? 'No hay prototipos que coincidan con esta búsqueda.' : 'Todavía no hay fichas publicadas en el catálogo.'));
      return;
    }
    for (const p of filtered) {
      const card = node('button', 'project-card'); card.type = 'button'; card.setAttribute('aria-label', 'Ver ficha y enlace del prototipo ' + (p.card_label || p.title));
      const img = node('img'); img.src = safeImage(p.image_url); img.alt = ''; img.loading = 'lazy'; imageFallback(img);
      const body = node('span', 'project-card-body');
      body.append(node('span', 'project-card-label', p.card_label || p.title), node('strong', 'project-card-title', p.card_title || p.title));
      const tags = node('span', 'project-card-tags');
      if (p.card_tag_1) tags.append(node('span', '', p.card_tag_1));
      if (p.card_tag_2) tags.append(node('span', '', p.card_tag_2));
      body.append(tags); card.append(img, body, node('span', 'project-card-arrow', '↗'));
      card.addEventListener('click', () => openProject(p.slug)); grid.append(card);
    }
  }
  function openProject(slug, updateHistory = true) {
    const p = projects.find(item => item.slug === slug); if (!p) return;
    lastFocus = document.activeElement;
    activeSlug = p.slug;
    $('#dialogTitle').textContent = p.title;
    $('#dialogSummary').textContent = p.summary || '';
    const img = $('#dialogImage'); img.src = safeImage(p.image_url); imageFallback(img); img.alt = 'Imagen de presentación del prototipo ' + p.title;
    const fields = $('#dialogFields'); fields.replaceChildren();
    const isFoundational = foundationalSlugs.has(p.slug);
    const rows = [
      ['Área temática',p.category],
      ...(p.show_author && p.author_name ? [[isFoundational ? 'Propuesta académica · autoría estudiantil' : 'Autoría de la propuesta',p.author_name]] : []),
      ...(isFoundational ? [['Origen académico','Este proyecto forma parte de la colección fundacional: los estudiantes investigaron el problema público y elaboraron la propuesta como trabajo final.']] : []),
      ['Problema público',p.problem],['Solución propuesta',p.solution],['Qué puedes explorar',p.features],
      ...(isFoundational ? [['Desarrollo del prototipo digital','LIPASON materializó tecnológicamente la propuesta estudiantil como prototipo explorable.']] : []),
      ['Estado',isFoundational ? 'Prototipo académico demostrativo · No es un servicio gubernamental en operación' : 'Demostración funcional · Su eventual adopción requiere evaluación y autorizaciones correspondientes']
    ];
    for (const [label,value] of rows) { const el = field(label,value); if (el) fields.append(el); }
    const valid = isHttps(p.prototype_url);
    const link = $('#prototypeLink'); link.hidden = !valid; $('#missingLink').hidden = valid;
    if (valid) { link.href = p.prototype_url; link.target = window.matchMedia('(max-width: 767px)').matches ? '_self' : '_blank'; }
    else link.removeAttribute('href');
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
    // En móvil priorizar el acceso a la experiencia, sin esperar a leer la ficha completa.
    dialog.scrollTop = 0;
    if (updateHistory) history.replaceState(null,'',urlWithSlug(slug));
    $('#dialogClose').focus({preventScroll:true});
  }
  function closeProject() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (activeSlug && new URL(location.href).searchParams.get('proyecto') === activeSlug) history.replaceState(null,'',urlWithSlug(null));
    activeSlug = null;
    lastFocus?.focus?.({preventScroll:true});
  });
  $('#dialogClose').addEventListener('click', closeProject);
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) closeProject(); });
  $('#copyProject').addEventListener('click', async () => {
    if (!activeSlug) return;
    const link = urlWithSlug(activeSlug).toString();
    try { await navigator.clipboard.writeText(link); toast('Enlace de la ficha copiado.'); }
    catch { toast('Enlace: ' + link); }
  });
  $('#searchProjects').addEventListener('input', render);
  const menu = $('#menuToggle'), mobileNav = $('#mobileNav');
  menu.addEventListener('click', () => { const open = mobileNav.hidden; mobileNav.hidden = !open; menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú'); });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { mobileNav.hidden = true; menu.setAttribute('aria-expanded','false'); }));

  function loadSDK() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase);
    return new Promise((resolve,reject) => {
      const script = document.createElement('script'); script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.min.js';
      script.onload=() => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error('SDK no disponible'));
      script.onerror=() => reject(new Error('No se pudo cargar la biblioteca de Supabase'));
      document.head.append(script);
    });
  }
  async function load() {
    const cfg=window.LIPA_CONFIG || {};
    if (!isHttps(cfg.supabaseUrl) || !cfg.supabasePublishableKey) {
      notice.hidden=false; notice.textContent='El catálogo necesita configurar su conexión pública a Supabase en config.js. Las fichas originales siguen conservadas en la base de datos.';
      projects=[];render();return;
    }
    try {
      const supabase=await loadSDK();
      const client=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      const {data,error}=await client.from('lipa_projects')
        .select('id,slug,title,card_label,card_title,card_tag_1,card_tag_2,category,summary,image_url,author_name,show_author,problem,solution,features,prototype_url,is_published,sort_order,created_at')
        .eq('is_published',true).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
      if(error) throw error;
      projects=Array.isArray(data)?data:[]; notice.hidden=true; render();
      const slug=new URL(location.href).searchParams.get('proyecto'); if(slug) openProject(slug,false);
    } catch(e) {
      console.warn('LIPASON no pudo obtener el catálogo:',e);
      projects=[];render();notice.hidden=false;
      notice.textContent='No fue posible cargar el catálogo en este momento. Verifica la conexión a internet y la configuración de Supabase. No se han eliminado ni modificado tus publicaciones.';
    }
  }
  // Aparición progresiva: solo se oculta contenido cuando el observador está disponible.
  if ('IntersectionObserver' in window && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    const revealItems = document.querySelectorAll('.section-header, .method-intro, .method-steps article, .origin-marker, .origin-copy, .principles-grid article, .statement');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
    revealItems.forEach((item) => { item.classList.add('reveal-ready'); revealObserver.observe(item); });
  }
  // El correo se representa como imagen raster generada en el navegador.
  // No se publica como texto ni como enlace mailto en el HTML.
  const footerContact = $('#footerContact');
  const footerContactImage = $('#footerContactImage');
  if (footerContact) {
    const localPart = String.fromCharCode(105, 110, 102, 111);
    const domainPart = String.fromCharCode(108, 105, 112, 97, 115, 111, 110, 46, 109, 120);
    const address = localPart + '@' + domainPart;
    footerContact.addEventListener('click', () => {
      window.location.href = 'mailto:' + address;
    });
    if (footerContactImage) {
      const paintEmail = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const font = '600 15px Inter, system-ui, sans-serif';
        ctx.font = font;
        const width = Math.ceil(ctx.measureText(address).width + 37);
        const height = 30;
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        canvas.width = Math.round(width * dpr);
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.font = font;
        ctx.fillStyle = '#eceaff';
        ctx.textBaseline = 'middle';
        ctx.fillText(address, 35, 15.5);
        ctx.strokeStyle = '#b1a8ff';
        ctx.lineWidth = 1.7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.roundRect(2, 6, 24, 18, 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3.5, 8.5);
        ctx.lineTo(14, 16.5);
        ctx.lineTo(24.5, 8.5);
        ctx.stroke();
        footerContactImage.src = canvas.toDataURL('image/png');
        footerContactImage.width = width;
        footerContactImage.height = height;
      };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(paintEmail, paintEmail);
      } else {
        paintEmail();
      }
    }
  }
  load();
})();
