-- EJECUTAR SOLO DESPUÉS de subir las 11 imágenes a /LIPASON/assets/ en GitHub Pages.
-- No modifica las primeras cuatro fichas. Solo actualiza image_url vacío en estas once.
update public.lipa_projects
set image_url = case slug
  when 'protocoloclaria' then 'assets/project-protocoloclaria.webp'
  when 'brujulaues' then 'assets/project-brujulaues.webp'
  when 'sigesalud' then 'assets/project-sigesalud.webp'
  when 'mgcip' then 'assets/project-mgcip.webp'
  when 'mitse' then 'assets/project-mitse.webp'
  when 'quiriegocercadeti' then 'assets/project-quiriegocercadeti.webp'
  when 'soeci' then 'assets/project-soeci.webp'
  when 'sigeslegislativo' then 'assets/project-sigeslegislativo.webp'
  when 'sigessonora' then 'assets/project-sigessonora.webp'
  when 'controlpje' then 'assets/project-controlpje.webp'
  when 'hermosilloconecta' then 'assets/project-hermosilloconecta.webp'
end
where slug in (
  'protocoloclaria',
  'brujulaues',
  'sigesalud',
  'mgcip',
  'mitse',
  'quiriegocercadeti',
  'soeci',
  'sigeslegislativo',
  'sigessonora',
  'controlpje',
  'hermosilloconecta'
) and coalesce(image_url,'') = '';

-- Comprobar:
select slug, image_url, is_published from public.lipa_projects
where slug in (
  'protocoloclaria',
  'brujulaues',
  'sigesalud',
  'mgcip',
  'mitse',
  'quiriegocercadeti',
  'soeci',
  'sigeslegislativo',
  'sigessonora',
  'controlpje',
  'hermosilloconecta'
) order by sort_order;
