'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const cfg = window.LIPA_CONFIG || {};
  const scenes = ['loadingState','loginState','verifyState','noInviteState','consentState','completeState'];
  let client, currentUser = null, invitation = null, response = null, otpEmail = '';
  const status = $('#formStatus');
  function show(id) {
    for(const name of scenes) $('#'+name).hidden = name !== id;
    status.textContent = '';
    status.classList.remove('error');
    $('#signOut').hidden = !currentUser;
  }
  function message(value, error=false) {
    status.textContent = value;
    status.classList.toggle('error',error);
  }
  function busy(button, enabled, text) {
    if(!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.disabled = enabled;
    button.textContent = enabled ? text : button.dataset.defaultText;
  }
  function options(rec) {
    const items = [];
    if(rec.authorize_ficha) items.push('Ficha académica');
    if(rec.authorize_prototype) items.push('Prototipo');
    if(rec.authorize_document) items.push('Documento completo');
    return items.join(' · ') || 'Ninguna';
  }
  function receipt(rec) {
    response = rec;
    $('#receiptId').textContent = rec.id;
    $('#receiptDate').textContent = new Date(rec.accepted_at).toLocaleString('es-MX',{dateStyle:'long',timeStyle:'short'});
    $('#receiptOpts').textContent = options(rec);
    show('completeState');
  }
  async function loadInvitation(user) {
    currentUser = user;
    show('loadingState');
    const {data, error} = await client.from('lipa_consent_invites')
      .select('id,project_id,demo_title,author_name,invited_email,is_demo,is_enabled')
      .eq('is_demo',true).eq('is_enabled',true)
      .order('created_at',{ascending:false}).limit(1);
    if (error) {show('noInviteState');message('No fue posible verificar la invitación.',true);return;}
    invitation = data?.[0];
    if(!invitation || invitation.project_id !== null || !invitation.is_demo) {
      show('noInviteState');return;
    }
    const lookup = await client.from('lipa_consent_responses')
      .select('id,invitation_id,authorize_ficha,authorize_prototype,authorize_document,accepted_at')
      .eq('invitation_id',invitation.id).limit(1);
    if(lookup.error){show('noInviteState');message('No se pudo consultar la demostración.',true);return;}
    if(lookup.data?.length){receipt(lookup.data[0]);return;}
    $('#projectTitle').textContent = invitation.demo_title;
    $('#authorName').textContent = invitation.author_name;
    $('#verifiedEmail').textContent = user.email || '';
    $('#consentForm').reset();
    show('consentState');
  }
  async function restore() {
    try {
      const {data,error} = await client.auth.getUser();
      if(error || !data?.user){currentUser=null;show('loginState');return;}
      await loadInvitation(data.user);
    } catch {currentUser=null;show('loginState');message('No fue posible consultar la sesión.',true);}
  }
  $('#loginForm').addEventListener('submit',async (ev)=>{
    ev.preventDefault();
    const button=$('#sendButton');
    otpEmail=$('#email').value.trim().toLowerCase();
    if(!otpEmail)return;
    busy(button,true,'Enviando…');
    try {
      const {error}=await client.auth.signInWithOtp({
        email:otpEmail,options:{shouldCreateUser:false,emailRedirectTo:'https://lipason.mx/autorizacion.html'}
      });
      if(error){message('No fue posible enviar el acceso. Comprueba tu correo e inténtalo más tarde.',true);return;}
      $('#verifyText').textContent='Si hay una cuenta registrada, recibirás un código temporal o enlace. Introduce el código o abre el enlace.';
      show('verifyState');
    } catch {message('No se pudo conectar con el servicio de correo.',true);}
    finally {busy(button,false);}
  });
  $('#verifyForm').addEventListener('submit',async (ev)=>{
    ev.preventDefault();
    const button=$('#verifyButton'), token=$('#otp').value.trim();
    if(!/^\d{6,8}$/.test(token)){message('Introduce el código de tu correo.',true);return;}
    busy(button,true,'Comprobando…');
    try {
      const {data,error}=await client.auth.verifyOtp({email:otpEmail,token,type:'email'});
      if(error || !data?.user){message('El código no es válido o ya caducó.',true);return;}
      await loadInvitation(data.user);
    } catch {message('No se pudo completar la verificación.',true);}
    finally {busy(button,false);}
  });
  $('#changeEmail').addEventListener('click',()=>{otpEmail='';$('#otp').value='';show('loginState');});
  async function logout(){
    try{await client.auth.signOut();}catch{}
    currentUser=null;invitation=null;response=null;
    $('#loginForm').reset();$('#verifyForm').reset();
    show('loginState');
  }
  $('#signOut').addEventListener('click',logout);
  $('#noInviteExit').addEventListener('click',logout);
  $('#consentForm').addEventListener('submit',async(ev)=>{
    ev.preventDefault();
    if(!currentUser||!invitation||!invitation.is_demo)return;
    const data={
      invitation_id:invitation.id,auth_user_id:currentUser.id,
      authorize_ficha:$('#ficha').checked,
      authorize_prototype:$('#prototype').checked,
      authorize_document:$('#document').checked,
      accepted_tos:$('#ack').checked
    };
    if(!data.accepted_tos){message('Debes reconocer que es una prueba técnica.',true);return;}
    if(!data.authorize_ficha&&!data.authorize_prototype&&!data.authorize_document){message('Selecciona alguna opción para probar el registro.',true);return;}
    const button=$('#submitConsent');
    busy(button,true,'Guardando prueba…');
    try {
      const {data:rec,error}=await client.from('lipa_consent_responses')
        .insert(data)
        .select('id,invitation_id,authorize_ficha,authorize_prototype,authorize_document,accepted_at')
        .single();
      if(error||!rec){message('No fue posible guardar. La cuenta debe corresponder a la invitación y no tener otra respuesta activa.',true);return;}
      receipt(rec);
    } catch {message('No se pudo completar el registro.',true);}
    finally {busy(button,false);}
  });
  $('#resetDemo').addEventListener('click',async()=>{
    const button=$('#resetDemo');
    if(!currentUser||!invitation?.is_demo||!response?.id)return;
    busy(button,true,'Restableciendo…');
    try {
      const {error}=await client.from('lipa_consent_responses').delete().eq('id',response.id).eq('invitation_id',invitation.id);
      if(error){message('No se pudo restablecer la prueba.',true);return;}
      response=null;
      await loadInvitation(currentUser);
    } catch {message('No fue posible eliminar la prueba.',true);}
    finally {busy(button,false);}
  });
  async function init(){
    if(!window.supabase?.createClient||!cfg.supabaseUrl||!cfg.supabasePublishableKey) {
      show('loadingState');message('No está disponible la conexión con Supabase.',true);return;
    }
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,
      {auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
    await client.auth.initialize();
    await restore();
  }
  init();
})();