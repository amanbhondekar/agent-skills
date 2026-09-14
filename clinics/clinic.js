(function () {
  'use strict';

  if (typeof CLINIC_DATA === 'undefined') return;

  const D = CLINIC_DATA;
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const slot = (name) => $$('[data-slot="' + name + '")');

  // -------- HEAD ------------------------------------------------
  document.getElementById('page-title').textContent =
    D.name + ' — Padmanabhanagar, Bengaluru';
  document.getElementById('page-desc').setAttribute('content',
    D.tagline + ' ' + D.address);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: D.name,
    url: (location.origin || '') + (D.url || ''),
    telephone: '+918884007530',
    email: 'info@swasthaivf.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: D.address,
      addressLocality: 'Bengaluru',
      addressRegion: 'Karnataka',
      postalCode: '560070',
      addressCountry: 'IN'
    },
    openingHours: D.hours || '',
    medicalSpecialty: D.specialties || []
  };
  document.getElementById('ldjson').textContent = JSON.stringify(ld, null, 2);

  // -------- TEXT SLOTS ------------------------------------------
  slot('clinic-name').forEach((el) => (el.textContent = D.name));
  slot('overview').forEach((el) => (el.textContent = D.overview));
  slot('address').forEach((el) => (el.textContent = D.address));
  slot('hours').forEach((el) => (el.textContent = D.hours || ''));
  slot('map-address').forEach((el) => (el.textContent = D.address));

  const meta = slot('clinic-name-meta')[0];
  if (meta) meta.setAttribute('content', D.name);

  // -------- STORY & CTA HEADLINE --------------------------------
  const storyEl = slot('story')[0];
  if (storyEl) {
    storyEl.textContent = D.overview +
      ' Our team focuses on unhurried consultations, honest guidance, and continuity of care — the kind of relationship a neighbourhood clinic makes possible.';
  }
  const ctaHead = slot('cta-headline')[0];
  if (ctaHead) ctaHead.textContent = 'Ready to visit ' + D.name + '?';

  // -------- SPECIALTY PILLS -------------------------------------
  const pillsWrap = slot('specialty-pills')[0];
  if (pillsWrap) {
    pillsWrap.innerHTML = '';
    (D.specialties || []).forEach((s) => {
      const li = document.createElement('li');
      li.className = 'tag';
      li.textContent = s;
      pillsWrap.appendChild(li);
    });
  }

  // -------- HIGHLIGHTS ------------------------------------------
  const ICONS = {
    shield:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    team:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M14 20c0-2.2 2-3.5 4-3.5s3 1 3 3.5"/></svg>',
    tools:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3l3 3-8 8-3-3 8-8z"/><path d="M4 20l4-1 1-4"/><path d="M14 14l6 6"/></svg>',
    heart:
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z"/></svg>'
  };

  const highlightsWrap = slot('highlights')[0];
  if (highlightsWrap) {
    highlightsWrap.innerHTML = '';
    (D.highlights || []).forEach((h) => {
      const card = document.createElement('article');
      card.className = 'highlight-card';
      card.innerHTML =
        '<div class="highlight-icon" aria-hidden="true">' +
        (ICONS[h.icon] || ICONS.heart) +
        '</div>' +
        '<h3></h3><p></p>';
      card.querySelector('h3').textContent = h.label;
      card.querySelector('p').textContent = h.description;
      highlightsWrap.appendChild(card);
    });
  }

  // -------- SERVICES (conditional grouping) ---------------------
  const servicesWrap = slot('services')[0];
  if (servicesWrap) {
    servicesWrap.innerHTML = '';
    const specs = D.specialties || [];
    const buildCard = (svc) => {
      const card = document.createElement('article');
      card.className = 'service-card';
      card.setAttribute('data-specialty', svc.specialty || '');
      card.innerHTML =
        '<h4></h4><p></p>' +
        '<a href="#" class="link-arrow">Learn More <span aria-hidden="true">→</span></a>';
      card.querySelector('h4').textContent = svc.name;
      card.querySelector('p').textContent = svc.description || '';
      return card;
    };

    if (specs.length <= 1) {
      const grid = document.createElement('div');
      grid.className = 'service-grid';
      (D.services || []).forEach((s) => grid.appendChild(buildCard(s)));
      servicesWrap.appendChild(grid);
    } else {
      specs.forEach((sp) => {
        const group = document.createElement('div');
        group.className = 'service-group';
        group.setAttribute('data-specialty', sp);

        const head = document.createElement('div');
        head.className = 'service-group-heading';
        head.innerHTML = '<h3></h3><span class="rule" aria-hidden="true"></span>';
        head.querySelector('h3').textContent = sp;
        group.appendChild(head);

        const grid = document.createElement('div');
        grid.className = 'service-grid';
        (D.services || [])
          .filter((s) => s.specialty === sp)
          .forEach((s) => grid.appendChild(buildCard(s)));
        group.appendChild(grid);

        servicesWrap.appendChild(group);
      });
    }
  }

  // -------- DOCTORS (placeholder cards, filtered by slug) -------
  const doctorsWrap = slot('doctors')[0];
  if (doctorsWrap) {
    const placeholders = [
      { name: 'Dr. Doctor Name', desig: 'Senior Consultant — Obstetrics & Gynaecology', tag: 'Ob-Gyn' },
      { name: 'Dr. Doctor Name', desig: 'Fertility Specialist — IVF, IUI, ICSI',       tag: 'Fertility' },
      { name: 'Dr. Doctor Name', desig: 'Consultant Pulmonologist',                    tag: 'Pulmonology' }
    ];
    const count = (D.specialties || []).length <= 1 ? 2 : 3;
    placeholders.slice(0, count).forEach((doc) => {
      const card = document.createElement('article');
      card.className = 'doctor-card';
      card.setAttribute('data-clinic', D.slug || '');
      card.innerHTML =
        '<div class="doctor-photo" aria-hidden="true"></div>' +
        '<div class="doctor-body">' +
        '  <h3><span class="doctor-name"></span></h3>' +
        '  <p class="doctor-desig"></p>' +
        '  <span class="tag tag-solid"></span>' +
        '  <a href="#" class="link-arrow">View Profile <span aria-hidden="true">→</span></a>' +
        '</div>';
      card.querySelector('.doctor-name').textContent = doc.name;
      card.querySelector('.doctor-desig').textContent = doc.desig;
      card.querySelector('.tag-solid').textContent = doc.tag;
      doctorsWrap.appendChild(card);
    });
  }

  const allDocsLink = slot('all-doctors-link')[0];
  if (allDocsLink) allDocsLink.setAttribute('href', '/doctors?clinic=' + encodeURIComponent(D.slug || ''));

  // -------- LOCATION: DIRECTIONS & MAP --------------------------
  const mapsHref = D.mapsUrl ||
    ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(D.address || ''));
  slot('directions-btn').forEach((a) => a.setAttribute('href', mapsHref));
  slot('directions-link').forEach((a) => a.setAttribute('href', mapsHref));

  const map = document.getElementById('clinic-map');
  if (map) map.setAttribute('data-address', D.address || '');
})();
