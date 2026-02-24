async function loadProfile() {
  try {
    const res = await fetch('./data/profile.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load profile.json');
    return await res.json();
  } catch (e) {
    if (typeof window !== 'undefined' && window.__PROFILE__) {
      return window.__PROFILE__;
    }
    throw e;
  }
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, String(v));
  }
  for (const c of children) node.appendChild(c);
  return node;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value ?? '';
}

function setHTML(id, html) {
  const node = document.getElementById(id);
  if (node) node.innerHTML = html ?? '';
}

function renderLinks(links) {
  const host = document.getElementById('profileLinks');
  if (!host) return;
  host.innerHTML = '';

  for (const link of links || []) {
    if (!link?.label || !link?.url) continue;
    const a = el('a', {
      class: 'pill',
      href: link.url,
      target: link.external === false ? '_self' : '_blank',
      rel: 'noreferrer'
    }, [
      el('span', { class: 'pill__dot', 'aria-hidden': 'true' }),
      el('span', { text: link.label })
    ]);
    host.appendChild(a);
  }
}

function renderNews(news) {
  const host = document.getElementById('newsList');
  if (!host) return;
  host.innerHTML = '';

  for (const item of news || []) {
    const li = document.createElement('li');
    if (item?.url) {
      const a = el('a', { href: item.url, target: '_blank', rel: 'noreferrer', text: item.text || item.date || 'News' });
      li.appendChild(a);
    } else {
      li.textContent = [item?.date, item?.text].filter(Boolean).join(' ');
    }
    host.appendChild(li);
  }
}

function renderTeaching(teaching) {
  const host = document.getElementById('teachingList');
  if (!host) return;
  host.innerHTML = '';

  for (const t of teaching || []) {
    const li = document.createElement('li');
    if (t?.url) {
      const a = el('a', { href: t.url, target: '_blank', rel: 'noreferrer', text: t.text || t.term || 'Teaching' });
      li.appendChild(a);
    } else {
      li.textContent = [t?.term, t?.text].filter(Boolean).join(' — ');
    }
    host.appendChild(li);
  }
}

function pubToSearchText(p) {
  return [
    p.title,
    p.authors,
    p.venue,
    p.year,
    (p.tags || []).join(' ')
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function renderPubs(pubs) {
  const host = document.getElementById('pubList');
  if (!host) return;
  host.innerHTML = '';

  for (const p of pubs || []) {
    const li = el('li', { class: 'pub' });

    const titleLine = el('div', { class: 'pub__title' }, [
      el('span', { text: p.title || 'Untitled' })
    ]);

    const metaParts = [
      p.authors,
      [p.venue, p.year].filter(Boolean).join(', ')
    ].filter(Boolean);

    const meta = el('div', { class: 'pub__meta', text: metaParts.join(' · ') });

    const links = el('div', { class: 'pub__links' });
    for (const l of p.links || []) {
      if (!l?.label || !l?.url) continue;
      links.appendChild(el('a', { href: l.url, target: '_blank', rel: 'noreferrer', text: l.label }));
    }

    const badges = el('div', { class: 'pub__links' });
    for (const tag of p.tags || []) {
      badges.appendChild(el('span', { class: 'badge', text: tag }));
    }

    li.appendChild(titleLine);
    li.appendChild(meta);
    if (links.childNodes.length) li.appendChild(links);
    if (badges.childNodes.length) li.appendChild(badges);
    host.appendChild(li);
  }
}

function setupPubSearch(allPubs) {
  const input = document.getElementById('pubSearch');
  if (!input) return;

  const indexed = (allPubs || []).map((p) => ({
    p,
    t: pubToSearchText(p)
  }));

  const apply = () => {
    const q = (input.value || '').trim().toLowerCase();
    if (!q) {
      renderPubs(allPubs);
      return;
    }
    const filtered = indexed
      .filter((x) => x.t.includes(q))
      .map((x) => x.p);
    renderPubs(filtered);
  };

  input.addEventListener('input', apply);
}

function setAvatarFromName(name) {
  const node = document.getElementById('profileAvatar');
  if (!node) return;

  const s = String(name || '').trim();
  if (!s) {
    node.textContent = 'A';
    return;
  }

  const parts = s.split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] || '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '');
  node.textContent = letters.toUpperCase();
}

function setCVLink(url) {
  const a = document.getElementById('navCv');
  if (!a) return;
  if (!url) {
    a.style.display = 'none';
    return;
  }
  a.href = url;
}

function setBrand(name) {
  const a = document.getElementById('navBrand');
  if (!a) return;
  a.textContent = name || 'Academic';
}

function setCopyright(name) {
  const node = document.getElementById('footerCopyright');
  if (!node) return;
  const y = new Date().getFullYear();
  node.textContent = `© ${y} ${name || ''}`.trim();
}

(async function main() {
  try {
    const data = await loadProfile();

    setText('profileName', data.name);
    setText('profileTitle', data.title);
    setText('profileAffiliation', data.affiliation);
    setText('profileLocation', data.location);
    setText('researchTitle', data.researchTitle || 'Research');

    setHTML('profileBio', (data.bio || '').replace(/\n/g, '<br/>'));
    setHTML('researchBody', data.researchHTML || '');
    setHTML('opportunitiesBody', data.opportunitiesHTML || '');
    setHTML('contactBody', data.contactHTML || '');

    setAvatarFromName(data.name);
    setBrand(data.name);
    setCVLink(data.cvUrl);
    setCopyright(data.name);

    renderLinks(data.links);
    renderNews(data.news);
    renderTeaching(data.teaching);

    const pubs = data.publications || [];
    renderPubs(pubs);
    setupPubSearch(pubs);
  } catch (e) {
    console.error(e);
    const host = document.getElementById('researchBody');
    if (host) {
      host.innerHTML = 'Failed to load profile data. If you are opening via <code>file://</code>, ensure <code>data/profile.js</code> exists. If you are using a server, ensure <code>data/profile.json</code> is reachable.';
    }
  }
})();
