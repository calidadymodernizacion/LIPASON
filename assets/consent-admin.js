'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const cfg = window.LIPA_CONFIG || {};
  let client = null;
  let projects = [];
  let authors = [];
  let projectId = null;
  let editingId = null;
  let isBusy = false;

  function tell(selector, message, isError = false) {
    const element = $(selector);
    element.textContent = message;
    element.classList.toggle('error', isError);
  }

  function setBusy(value) {
    isBusy = value;
    $('#saveAuthor').disabled = value;
    $('#saveAuthor').textContent = value ? 'Guardando…' : 'Guardar registro';
  }

  function showWorkspace() {
    $('#authPanel').hidden = true;
    $('#privateWorkspace').hidden = false;
    $('#exitButton').hidden = false;
  }

  function concealWorkspace() {
    $('#authPanel').hidden = false;
    $('#privateWorkspace').hidden = true;
    $('#exitButton').hidden = true;
    projects = [];
    authors = [];
    projectId = null;
    editingId = null;
  }

  async function authorized(user) {
    if (!user?.id) return false;
    const {data,error} = await client.from('lipa_admins')
      .select('user_id').eq('user_id',user.id).maybeSingle();
    if (error || !data) return false;
    return true;
  }

  async function refresh() {
    const [projectResult, authorResult] = await Promise.all([
      client.from('lipa_projects').select('id,title,slug,is_published')
        .order('sort_order',{ascending:true}).order('created_at',{ascending:true}),
      client.from('lipa_consent_invites')
        .select('id,project_id,author_name,invited_email,is_demo,is_enabled,created_at')
        .eq('is_demo',false).order('created_at',{ascending:true})
    ]);
    if (projectResult.error || authorResult.error) {
      tell('#editorStatus','No se pudieron consultar los datos privados. Comprueba los permisos del panel.',true);
      throw projectResult.error || authorResult.error;
    }
    projects = projectResult.data || [];
    authors = authorResult.data || [];
    $('#projectCount').textContent = String(projects.length);
    $('#authorCount').textContent = String(authors.length);
    $('#activeCount').textContent = String(authors.filter((r)=>r.is_enabled).length);
    if(projectId && !projects.some((r)=>r.id===projectId)) projectId = null;
    if(!projectId && projects.length) projectId = projects[0].id;
    renderProjects();
    renderSelected();
  }

  function renderProjects() {
    const list = $('#projectList');
    list.replaceChildren();
    const query = $('#projectSearch').value.trim().toLocaleLowerCase('es-MX');
    const filtered = projects.filter((p)=>p.title.toLocaleLowerCase('es-MX').includes(query)
      || p.slug.toLocaleLowerCase('es-MX').includes(query));
    if(!filtered.length) {
      const p = document.createElement('p');
      p.className = 'cons-message';
      p.textContent = 'No hay proyectos con ese nombre.';
      list.append(p);
      return;
    }
    for(const project of filtered) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cons-project-item' + (project.id===projectId ? ' selected':'');
      btn.dataset.projectId = project.id;
      btn.setAttribute('aria-pressed', String(project.id===projectId));
      const labels = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = project.title;
      const subtitle = document.createElement('small');
      subtitle.textContent = project.is_published ? 'Ficha pública existente' : 'Borrador';
      labels.append(title,subtitle);
      const counter = document.createElement('span');
      counter.className = 'cons-count';
      counter.textContent = String(authors.filter((a)=>a.project_id===project.id).length);
      counter.setAttribute('aria-label','Autores registrados');
      btn.append(labels,counter);
      list.append(btn);
    }
  }

  function hideAuthorForm() {
    editingId = null;
    $('#authorForm').hidden = true;
    $('#authorForm').reset();
    $('#deleteAuthor').hidden = true;
  }

  function showAuthorForm(row = null) {
    if(!projectId) return;
    editingId = row?.id || null;
    $('#authorForm').reset();
    $('#authorName').value = row?.author_name || '';
    $('#authorEmail').value = row?.invited_email || '';
    $('#authorFormTitle').textContent = row ? 'Editar información de autoría' : 'Registrar persona autora';
    $('#deleteAuthor').hidden = !row;
    $('#authorForm').hidden = false;
    tell('#editorStatus','');
    $('#authorName').focus();
  }

  function renderSelected() {
    const project = projects.find((p)=>p.id===projectId);
    $('#editorEmpty').hidden = Boolean(project);
    $('#editorActive').hidden = !project;
    if(!project) {
      $('#selectedTitle').textContent = 'Selecciona un proyecto';
      $('#selectedSubtitle').textContent = 'Los registros se mantienen privados.';
      hideAuthorForm();
      return;
    }
    $('#selectedTitle').textContent = project.title;
    $('#selectedSubtitle').textContent = 'La información aquí registrada no modifica el crédito ni la publicación de la ficha.';
    const projectAuthors = authors.filter((a)=>a.project_id===project.id);
    $('#selectedCount').textContent = String(projectAuthors.length);
    const list = $('#authorList');
    list.replaceChildren();
    if(!projectAuthors.length) {
      const empty = document.createElement('p');
      empty.className = 'cons-empty';
      empty.textContent = 'Todavía no se han registrado autores para este proyecto.';
      list.append(empty);
    }
    for(const author of projectAuthors) {
      const row = document.createElement('div');
      row.className = 'cons-author-card';
      const data = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = author.author_name;
      const email = document.createElement('small');
      email.textContent = author.invited_email;
      const badge = document.createElement('span');
      badge.className = 'cons-status';
      badge.textContent = author.is_enabled ? 'Revisar estado' : 'Preparado · sin invitación';
      data.append(name,email,badge);
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'cons-text-button';
      edit.textContent = 'Editar';
      edit.dataset.authorId = author.id;
      row.append(data,edit);
      list.append(row);
    }
    if(editingId && !projectAuthors.some((a)=>a.id===editingId)) hideAuthorForm();
  }

  async function loadPrivate(user) {
    if(!await authorized(user)) {
      await client.auth.signOut();
      concealWorkspace();
      tell('#loginStatus','Esta cuenta no está autorizada para administrar LIPASON.',true);
      return;
    }
    showWorkspace();
    try {await refresh();}
    catch {}
  }

  async function start() {
    if(!window.supabase?.createClient || !cfg.supabasePublishableKey ||
       !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl||'')) {
      tell('#loginStatus','No se pudo cargar la conexión segura de LIPASON.',true);
      $('#loginButton').disabled = true;
      return;
    }
    client = window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
    try {
      const {data,error} = await client.auth.getUser();
      if(data?.user && !error) await loadPrivate(data.user);
    } catch {tell('#loginStatus','No se pudo recuperar la sesión.',true);}
  }

  $('#authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if(!client || isBusy) return;
    const button = $('#loginButton');
    button.disabled = true;
    tell('#loginStatus','Verificando acceso…');
    try {
      const {data,error} = await client.auth.signInWithPassword({
        email:$('#loginEmail').value.trim(),
        password:$('#loginPassword').value
      });
      if(error || !data?.user) {
        tell('#loginStatus','No se pudo iniciar sesión. Revisa las credenciales.',true);
        return;
      }
      tell('#loginStatus','');
      await loadPrivate(data.user);
    } catch {tell('#loginStatus','Error de conexión. Intenta de nuevo.',true);}
    finally {button.disabled = false;}
  });

  $('#exitButton').addEventListener('click', async () => {
    if(client) await client.auth.signOut();
    concealWorkspace();
    $('#authForm').reset();
    tell('#loginStatus','');
  });

  $('#projectSearch').addEventListener('input',renderProjects);
  $('#projectList').addEventListener('click',(event)=>{
    const btn = event.target.closest('button[data-project-id]');
    if(!btn) return;
    projectId = btn.dataset.projectId;
    hideAuthorForm();
    tell('#editorStatus','');
    renderProjects();
    renderSelected();
  });

  $('#newAuthor').addEventListener('click',()=>showAuthorForm());
  $('#cancelAuthor').addEventListener('click',hideAuthorForm);
  $('#authorList').addEventListener('click',(event)=>{
    const button = event.target.closest('button[data-author-id]');
    if(!button) return;
    const row = authors.find((a)=>a.id===button.dataset.authorId && a.project_id===projectId);
    if(row && !row.is_enabled) showAuthorForm(row);
  });

  $('#authorForm').addEventListener('submit',async(event)=>{
    event.preventDefault();
    if(isBusy || !client || !projectId) return;
    const name = $('#authorName').value.trim().replace(/\s+/g,' ');
    const email = $('#authorEmail').value.trim().toLowerCase();
    if(name.length<3 || name.length>160) {
      tell('#editorStatus','Verifica el nombre completo.',true);return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      tell('#editorStatus','Verifica el correo electrónico.',true);return;
    }
    setBusy(true);
    tell('#editorStatus','');
    try {
      const values = {
        project_id:projectId,
        author_name:name,
        invited_email:email,
        is_demo:false,
        is_enabled:false,
        demo_title:null
      };
      const operation = editingId
        ? client.from('lipa_consent_invites').update(values).eq('id',editingId).eq('project_id',projectId).eq('is_demo',false)
        : client.from('lipa_consent_invites').insert(values);
      const {data,error} = await operation.select('id').single();
      if(error || !data) throw error || new Error('No se guardó el registro');
      hideAuthorForm();
      await refresh();
      tell('#editorStatus','Autor registrado en preparación, sin invitación enviada ni autorización activa.');
    } catch(error) {
      const duplicate = error?.code === '23505';
      tell('#editorStatus',duplicate
        ? 'Este correo ya figura como autor de este proyecto.'
        : 'No se pudo guardar. Comprueba tus permisos y vuelve a intentarlo.',true);
    } finally {setBusy(false);}
  });

  $('#deleteAuthor').addEventListener('click',async()=>{
    if(!editingId || !projectId || isBusy || !client) return;
    const row = authors.find((a)=>a.id===editingId && a.project_id===projectId);
    if(!row || row.is_enabled) return;
    if(!confirm('¿Eliminar el registro preparado de «'+row.author_name+'»? No se cambiará ningún proyecto público.')) return;
    setBusy(true);
    try {
      const {error} = await client.from('lipa_consent_invites')
        .delete().eq('id',editingId).eq('project_id',projectId).eq('is_demo',false);
      if(error) throw error;
      hideAuthorForm();
      await refresh();
      tell('#editorStatus','Registro preparado eliminado.');
    } catch {
      tell('#editorStatus','No se pudo eliminar. Verifica que no exista una autorización asociada.',true);
    } finally {setBusy(false);}
  });

  start();
})();