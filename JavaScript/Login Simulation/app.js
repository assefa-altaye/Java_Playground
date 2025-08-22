/* ========= Utilities ========= */
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

function toast(msg, type = 'success', timeout = 2800) {
  const el = $('#toast');
  if (!el) return;
  el.className = `toast ${type}`;
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => el.classList.remove('show'), timeout);
}

function togglePassword(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    input.type = input.type === 'password' ? 'text' : 'password';
  });
}

function csvDownload(filename, rows) {
  const csv = [Object.keys(rows[0]).join(',')]
    .concat(
      rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ========= Auth Store (localStorage) =========
  - users: key 'users' -> array of {name,email,username,password}
  - session: key 'sessionUser' -> username string
*/
const store = {
  get users() {
    return JSON.parse(localStorage.getItem('users') || '[]');
  },
  set users(list) {
    localStorage.setItem('users', JSON.stringify(list));
  },
  addUser(user) {
    const list = store.users;
    list.push(user);
    store.users = list;
  },
  findUser(login) {
    return store.users.find((u) => u.username === login || u.email === login);
  },
  setSession(username, remember = false) {
    // sessionStorage by default; fallback to localStorage if "remember me"
    (remember ? localStorage : sessionStorage).setItem('sessionUser', username);
    if (!remember) localStorage.removeItem('sessionUser'); // ensure single source when not remembering
  },
  getSession() {
    return (
      sessionStorage.getItem('sessionUser') ||
      localStorage.getItem('sessionUser')
    );
  },
  clearSession() {
    sessionStorage.removeItem('sessionUser');
    localStorage.removeItem('sessionUser');
  },
};

/* ========= Password Scoring ========= */
function scorePassword(pw) {
  let s = 0;
  if (!pw) return 0;
  const letters = {};
  for (const c of pw) {
    letters[c] = (letters[c] || 0) + 1;
    s += 5.0 / letters[c];
  }
  const variations = {
    digits: /\d/.test(pw),
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    nonWords: /\W/.test(pw),
  };
  let variationCount = 0;
  for (const v in variations) {
    variationCount += variations[v] ? 1 : 0;
  }
  s += (variationCount - 1) * 10;
  return Math.min(100, parseInt(s));
}

/* ========= Page: Register ========= */
(function registerPage() {
  if (!location.pathname.endsWith('register.html')) return;

  togglePassword('toggle-reg-pass', 'reg-password');

  const pwInput = $('#reg-password');
  const bar = $('#pw-strength');

  pwInput.addEventListener('input', () => {
    const val = pwInput.value;
    const sc = scorePassword(val);
    bar.style.width = `${sc}%`;
  });

  $('#btn-register').addEventListener('click', () => {
    const name = $('#reg-name').value.trim();
    const email = $('#reg-email').value.trim().toLowerCase();
    const username = $('#reg-username').value.trim();
    const password = $('#reg-password').value;

    if (!name || !email || !username || !password)
      return toast('Please fill all fields.', 'warn');
    if (password.length < 8)
      return toast('Password must be at least 8 characters.', 'warn');
    if (store.findUser(username) || store.findUser(email))
      return toast(
        'User already exists. Choose another email/username.',
        'danger'
      );

    store.addUser({ name, email, username, password });
    toast('Account created ✔️ Redirecting to sign in...');
    setTimeout(() => (location.href = 'index.html'), 900);
  });
})();

/* ========= Page: Login ========= */
(function loginPage() {
  if (
    !location.pathname.endsWith('index.html') &&
    location.pathname.split('/').pop() !== ''
  )
    return;

  togglePassword('toggle-login-pass', 'login-password');

  const loginBtn = $('#btn-login');
  const remember = $('#remember');
  const forgotLink = $('#forgot-link');
  const forgotModal = $('#forgot-modal');
  const resetBtn = $('#btn-reset');

  // If already logged in, jump to dashboard
  if (store.getSession()) {
    location.href = 'dashboard.html';
    return;
  }

  loginBtn?.addEventListener('click', () => {
    const login = $('#login-username').value.trim();
    const pass = $('#login-password').value;
    const user = store.findUser(login);
    if (!user || user.password !== pass)
      return toast('Invalid credentials.', 'danger');
    store.setSession(user.username, remember.checked);
    toast('Signed in! Redirecting...');
    setTimeout(() => (location.href = 'dashboard.html'), 600);
  });

  // Forgot password (simulated)
  forgotLink?.addEventListener('click', (e) => {
    e.preventDefault();
    forgotModal.style.display = 'flex';
  });
  resetBtn?.addEventListener('click', () => {
    const email = $('#reset-email').value.trim();
    if (!email) return toast('Enter an email.', 'warn');
    forgotModal.style.display = 'none';
    toast(`If ${email} exists, we sent a reset link.`, 'success');
  });
  $$('[data-close]').forEach((btn) =>
    btn.addEventListener('click', () => (forgotModal.style.display = 'none'))
  );
})();

/* ========= Page: Dashboard ========= */
(function dashboardPage() {
  if (!location.pathname.endsWith('dashboard.html')) return;

  // Guard route
  const username = store.getSession();
  if (!username) {
    location.href = 'index.html';
    return;
  }

  // Personalization
  $('#year').textContent = new Date().getFullYear();
  const user = store.findUser(username) || { name: username };
  $('#avatar').textContent = (user.name || username).slice(0, 1).toUpperCase();

  // Theme restore
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') document.documentElement.classList.add('light');

  // Sidebar toggle (mobile)
  const sidebar = $('#sidebar');
  $('#btn-menu').addEventListener('click', () =>
    sidebar.classList.toggle('open')
  );

  // Top actions
  $('#btn-logout').addEventListener('click', () => {
    store.clearSession();
    location.href = 'index.html';
  });
  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#btn-new').addEventListener(
    'click',
    () => ($('#new-modal').style.display = 'flex')
  );
  $$('#new-modal [data-close]').forEach((b) =>
    b.addEventListener('click', () => ($('#new-modal').style.display = 'none'))
  );
  $('#btn-quick-save').addEventListener('click', () => {
    const t = $('#quick-title').value.trim();
    if (!t) return toast('Title required', 'warn');
    $('#new-modal').style.display = 'none';
    $('#quick-title').value = '';
    $('#quick-notes').value = '';
    toast('Saved to your notes ✔️', 'success');
  });

  // Settings
  $('#btn-toggle-theme').addEventListener('click', toggleTheme);
  $('#btn-collapse-sidebar').addEventListener('click', () =>
    sidebar.classList.toggle('open')
  );
  $('#btn-save-acct').addEventListener('click', () => {
    const nm = $('#acct-name').value.trim();
    const list = store.users.map((u) =>
      u.username === username ? { ...u, name: nm || u.name } : u
    );
    store.users = list;
    toast('Profile updated', 'success');
    $('#avatar').textContent = (nm || username).slice(0, 1).toUpperCase();
  });

  // Navigation
  $$('.nav a').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const view = a.dataset.nav;
      $$('.nav a').forEach((x) => x.classList.remove('active'));
      a.classList.add('active');
      showView(view);
      sidebar.classList.remove('open');
    });
  });

  // KPI + Charts + Tables
  const demo = generateDemoData();
  hydrateKPIs(demo.kpis);
  drawLineChart($('#rev-chart'), demo.revenue, { color: '#22c55e' });
  drawLineChart($('#signup-chart'), demo.signups, { color: '#60a5fa' });
  drawFunnel($('#funnel-chart'), demo.funnel);
  drawHeat($('#heat-chart'));
  fillProjectsTable($('#projects-table tbody'), demo.projects.slice(0, 6));
  fillProjectsTable($('#projects-table-2 tbody'), demo.projects);

  // Export CSV
  $('#btn-export').addEventListener('click', () =>
    csvDownload('projects.csv', demo.projects)
  );

  // Create Project
  $('#btn-create').addEventListener('click', () => {
    const name = $('#proj-name').value.trim();
    const budget = parseFloat($('#proj-budget').value);
    const owner = $('#proj-owner').value.trim() || user.name || username;
    if (!name || isNaN(budget))
      return toast('Name & valid budget required', 'warn');
    const row = {
      name,
      owner,
      budget: `$${budget.toLocaleString()}`,
      status: 'ok',
      updated: new Date().toLocaleDateString(),
    };
    demo.projects.unshift(row);
    fillProjectsTable($('#projects-table-2 tbody'), demo.projects);
    fillProjectsTable($('#projects-table tbody'), demo.projects.slice(0, 6));
    $('#proj-name').value = '';
    $('#proj-budget').value = '';
    $('#proj-owner').value = '';
    toast('Project created ✔️');
  });

  // Search filter
  $('#search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = demo.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q)
    );
    fillProjectsTable($('#projects-table-2 tbody'), filtered);
  });

  // Settings inputs
  $('#acct-name').value = user.name || '';

  function toggleTheme() {
    document.documentElement.classList.toggle('light');
    const isLight = document.documentElement.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }
})();

/* ========= Views ========= */
function showView(view) {
  const map = {
    overview: '#view-overview',
    analytics: '#view-analytics',
    projects: '#view-projects',
    settings: '#view-settings',
  };
  Object.values(map).forEach((sel) => $(sel).classList.add('hidden'));
  $(map[view]).classList.remove('hidden');
}

/* ========= Demo Data ========= */
function generateDemoData() {
  // KPIs
  const rnd = (min, max) => Math.random() * (max - min) + min;
  const kpis = {
    revenue: 128_420,
    revenueDelta: +7.4,
    users: 4820,
    usersDelta: +3.9,
    conv: 4.1,
    convDelta: +0.6,
    churn: 1.7,
    churnDelta: -0.3,
  };

  // Series (12 months)
  const labels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return d.toLocaleString(undefined, { month: 'short' });
  });
  const revenue = labels.map((m, i) => ({
    label: m,
    value: Math.round(8000 + i * 900 + rnd(-1500, 2500)),
  }));
  const signups = labels.map((m, i) => ({
    label: m,
    value: Math.round(200 + i * 30 + rnd(-80, 120)),
  }));

  // Funnel
  const funnel = [
    { label: 'Visits', value: 42000 },
    { label: 'Signups', value: 6200 },
    { label: 'Trials', value: 2400 },
    { label: 'Paid', value: 960 },
  ];

  // Projects
  const owners = [
    'Alex',
    'Brooke',
    'Casey',
    'Drew',
    'Emery',
    'Frank',
    'Gianna',
  ];
  const statuses = ['ok', 'late', 'fail'];
  const projects = Array.from({ length: 18 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const now = new Date();
    now.setDate(now.getDate() - Math.floor(Math.random() * 40));
    return {
      name: `Project ${String.fromCharCode(65 + i)}`,
      owner: owners[i % owners.length],
      budget: `$${(10000 + Math.random() * 90000)
        .toFixed(0)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
      status,
      updated: now.toLocaleDateString(),
    };
  });

  return { kpis, revenue, signups, funnel, projects };
}

/* ========= KPI + Tables ========= */
function hydrateKPIs(k) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('kpi-revenue', `$${k.revenue.toLocaleString()}`);
  set('kpi-users', k.users.toLocaleString());
  set('kpi-conv', `${k.conv.toFixed(1)}%`);
  set('kpi-churn', `${k.churn.toFixed(1)}%`);

  const t = (delta) =>
    delta >= 0 ? `▲ ${delta.toFixed(1)}%` : `▼ ${Math.abs(delta).toFixed(1)}%`;
  $('#kpi-revenue-trend').textContent = t(k.revenueDelta);
  $('#kpi-users-trend').textContent = t(k.usersDelta);
  $('#kpi-conv-trend').textContent = t(k.convDelta);
  $('#kpi-churn-trend').textContent = t(k.churnDelta);
  [
    'kpi-revenue-trend',
    'kpi-users-trend',
    'kpi-conv-trend',
    'kpi-churn-trend',
  ].forEach((id) => {
    const el = document.getElementById(id);
    const isUp = el.textContent.trim().startsWith('▲');
    el.className = `trend ${isUp ? 'up' : 'down'}`;
  });
}

function fillProjectsTable(tbody, rows) {
  if (!tbody) return;
  tbody.innerHTML = '';
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.owner}</td>
      <td>${r.budget}</td>
      <td><span class="status ${r.status}">${r.status}</span></td>
      <td>${r.updated}</td>
      ${
        tbody.id === 'projects-table-2'
          ? '<td><button class="btn icon secondary btn-del" title="Delete">🗑️</button></td>'
          : ''
      }
    `.trim();
    tbody.appendChild(tr);
  }
  // delete buttons (projects view)
  $$('.btn-del', tbody).forEach((b, i) => {
    b.addEventListener('click', () => {
      tbody.deleteRow(i);
      toast('Project removed', 'warn');
    });
  });
}

/* ========= Tiny Charts (no libs) ========= */
function drawLineChart(canvas, series, { color = '#60a5fa' } = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const pad = 22;
  const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
  const h = (canvas.height = canvas.clientHeight * devicePixelRatio);
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const values = series.map((s) => s.value);
  const min = Math.min(...values) * 0.95,
    max = Math.max(...values) * 1.05;
  const xStep = (canvas.clientWidth - pad * 2) / (series.length - 1);

  // grid
  ctx.strokeStyle = 'rgba(148,163,184,.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = pad + (canvas.clientHeight - pad * 2) * (i / 3);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(canvas.clientWidth - pad, y);
    ctx.stroke();
  }

  // area
  ctx.beginPath();
  series.forEach((pt, i) => {
    const x = pad + i * xStep;
    const y = scale(pt.value, min, max, canvas.clientHeight - pad, pad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  const grd = ctx.createLinearGradient(0, pad, 0, canvas.clientHeight - pad);
  grd.addColorStop(0, color + 'AA');
  grd.addColorStop(1, color + '00');
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.lineTo(canvas.clientWidth - pad, canvas.clientHeight - pad);
  ctx.lineTo(pad, canvas.clientHeight - pad);
  ctx.closePath();
  ctx.fillStyle = grd;
  ctx.fill();

  // labels (last value)
  const last = series[series.length - 1];
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter, system-ui';
  ctx.fillText(
    `${last.label}`,
    canvas.clientWidth - pad - 28,
    canvas.clientHeight - 6
  );
}

function drawFunnel(canvas, funnel) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
  const h = (canvas.height = canvas.clientHeight * devicePixelRatio);
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6'];
  const pad = 10,
    width = canvas.clientWidth - pad * 2;
  const stepH = (canvas.clientHeight - pad * 2) / funnel.length;

  let topW = width,
    left = pad;
  funnel.forEach((f, i) => {
    const bottomW =
      width * (((funnel[i + 1]?.value ?? f.value) / f.value) * 0.95 || 0.6);
    const x1 = left,
      x2 = left + topW;
    const x3 = left + (topW - bottomW) / 2,
      x4 = x3 + bottomW;
    const y1 = pad + i * stepH,
      y2 = y1 + stepH - 8;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x4, y2);
    ctx.lineTo(x3, y2);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 12px Inter, system-ui';
    ctx.fillText(`${f.label}: ${f.value.toLocaleString()}`, x1 + 12, y1 + 16);

    topW = bottomW;
    left = x3;
  });
}

function drawHeat(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
  const h = (canvas.height = canvas.clientHeight * devicePixelRatio);
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const cols = 24,
    rows = 6,
    pad = 12;
  const cw = (canvas.clientWidth - pad * 2) / cols;
  const ch = (canvas.clientHeight - pad * 2) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = Math.random();
      ctx.fillStyle = `rgba(99,102,241,${0.15 + v * 0.75})`;
      ctx.fillRect(pad + c * cw, pad + r * ch, cw - 2, ch - 2);
    }
  }
}

function scale(v, min, max, outMin, outMax) {
  const t = (v - min) / (max - min);
  return outMin + (outMax - outMin) * (1 - t);
}
