const STORAGE_KEY = 'vine-crm-state-v1';
const AUTH_KEY = 'vine-crm-auth-v1';
const defaultState = {
  users: [
    { id: 'u1', name: 'Ava Chen', email: 'admin@vinecrm.com', role: 'Admin', status: 'Active' },
    { id: 'u2', name: 'Noah Patel', email: 'sales@vinecrm.com', role: 'Sales Rep', status: 'Active' },
    { id: 'u3', name: 'Lina Ortiz', email: 'service@vinecrm.com', role: 'Support Lead', status: 'Pending' }
  ],
  contacts: [
    { id: 'ct1', firstName: 'Mina', lastName: 'Khan', title: 'Head of Growth', email: 'mina@northstarlabs.com', phone: '+1 555 990', companyId: '1', createdAt: '2026-06-10' },
    { id: 'ct2', firstName: 'Jonathan', lastName: 'Brooks', title: 'Operations Lead', email: 'jon@atlascommerce.com', phone: '+1 555 014', companyId: '2', createdAt: '2026-06-14' }
  ],
  companies: [
    { id: '1', name: 'Northstar Labs', industry: 'SaaS', website: 'northstarlabs.com', owner: 'Mina', createdAt: '2026-05-02' },
    { id: '2', name: 'Atlas Commerce', industry: 'Retail', website: 'atlascommerce.com', owner: 'Ava', createdAt: '2026-05-18' }
  ],
  deals: [
    { id: 'd1', title: 'Expansion package', companyId: '1', contactId: 'ct1', stage: 'Proposal', value: 18000, closeDate: '2026-07-18', ownerId: 'u2' },
    { id: 'd2', title: 'Renewal discussion', companyId: '2', contactId: 'ct2', stage: 'Qualified', value: 9500, closeDate: '2026-07-24', ownerId: 'u1' }
  ],
  tasks: [
    { id: 't1', title: 'Send proposal follow-up', dueDate: '2026-07-09', priority: 'High', relatedTo: '1', status: 'Open' },
    { id: 't2', title: 'Confirm renewal meeting', dueDate: '2026-07-12', priority: 'Medium', relatedTo: '2', status: 'Open' }
  ],
  activities: [
    { id: 'a1', description: 'Added new contact Mina Khan', createdAt: '2026-07-05' },
    { id: 'a2', description: 'Moved deal Expansion package to Proposal', createdAt: '2026-07-06' },
    { id: 'a3', description: 'Completed task Confirm renewal meeting', createdAt: '2026-07-07' }
  ]
};

const DEAL_STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(task) {
  return task.status === 'Open' && task.dueDate && task.dueDate < todayStr();
}

function normalizeState(parsed) {
  const base = structuredClone(defaultState);
  if (!parsed || typeof parsed !== 'object') return base;
  const normalized = {};
  for (const key of Object.keys(base)) {
    normalized[key] = Array.isArray(parsed[key]) ? parsed[key] : base[key];
  }
  normalized.tasks = normalized.tasks.map((task) => ({ priority: 'Medium', status: 'Open', ...task }));
  normalized.deals = normalized.deals.map((deal) => ({
    ...deal,
    value: Number(deal.value) || 0,
    stage: DEAL_STAGES.includes(deal.stage) ? deal.stage : 'New'
  }));
  return normalized;
}

let state = loadState();
let currentUser = loadAuth();
let searchQuery = '';

function matchesSearch(...fields) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return fields.some((field) => String(field ?? '').toLowerCase().includes(q));
}
const views = document.querySelectorAll('.nav-btn');
const pageTitle = document.getElementById('page-title');

function loadState() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return structuredClone(defaultState);
    return normalizeState(JSON.parse(json));
  } catch {
    return structuredClone(defaultState);
  }
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedIfNeeded() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    state = structuredClone(defaultState);
    saveState();
  }
}

function getCompanyName(companyId) {
  const company = state.companies.find((item) => item.id === companyId);
  return company ? company.name : 'Unassigned';
}

function getContactName(contactId) {
  const contact = state.contacts.find((item) => item.id === contactId);
  return contact ? `${contact.firstName} ${contact.lastName}` : 'Unassigned';
}

function render() {
  seedIfNeeded();
  updateAuthUI();
  renderDashboard();
  renderContacts();
  renderCompanies();
  renderOpportunities();
  renderTasks();
  renderUsers();
  renderFocusSummary();
}

function renderDashboard() {
  document.getElementById('open-deals-count').textContent = state.deals.filter((deal) => deal.stage !== 'Won' && deal.stage !== 'Lost').length;
  document.getElementById('contacts-count').textContent = state.contacts.length;
  document.getElementById('upcoming-tasks-count').textContent = state.tasks.filter((task) => task.status === 'Open').length;
  document.getElementById('overdue-count').textContent = state.tasks.filter(isOverdue).length;

  const priorityList = document.getElementById('priority-list');
  const nextTasks = state.tasks
    .filter((task) => task.status === 'Open')
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    .slice(0, 4);
  priorityList.innerHTML = nextTasks.length
    ? nextTasks.map((task) => `<li><strong>${escapeHtml(task.title)}</strong><div class="meta">Due ${escapeHtml(task.dueDate || 'soon')} · ${escapeHtml(task.priority)} priority${isOverdue(task) ? ' · <span class="overdue-flag">Overdue</span>' : ''}</div></li>`).join('')
    : '<li>No tasks pending.</li>';

  const activityList = document.getElementById('activity-list');
  activityList.innerHTML = state.activities.slice(0, 5).map((activity) => `<li>${escapeHtml(activity.description)} <div class="meta">${escapeHtml(activity.createdAt)}</div></li>`).join('');
}

function renderContacts() {
  const list = document.getElementById('contacts-list');
  const visible = state.contacts.filter((c) => matchesSearch(c.firstName, c.lastName, c.title, c.email, c.phone, getCompanyName(c.companyId)));
  list.innerHTML = visible.length ? visible.map((contact) => `
    <article class="card">
      <h4>${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName)}</h4>
      <p class="meta">${escapeHtml(contact.title || 'Contact')}</p>
      <p class="meta">${escapeHtml(contact.email || 'No email')} · ${escapeHtml(contact.phone || 'No phone')}</p>
      <p class="meta">Company: ${escapeHtml(getCompanyName(contact.companyId))}</p>
      <div class="card-actions">
        <button class="muted-btn" data-action="edit-contact" data-id="${escapeHtml(contact.id)}">Edit</button>
        <button class="muted-btn danger-text" data-action="delete-contact" data-id="${escapeHtml(contact.id)}" aria-label="Delete contact ${escapeHtml(contact.firstName)} ${escapeHtml(contact.lastName)}">Delete</button>
      </div>
    </article>
  `).join('') : `<p class="meta empty-note">${searchQuery ? 'No contacts match your search.' : 'No contacts yet.'}</p>`;

  populateSelect('contact-company', state.companies, 'Select company');
}

function renderCompanies() {
  const list = document.getElementById('companies-list');
  const visible = state.companies.filter((c) => matchesSearch(c.name, c.industry, c.website, c.owner));
  list.innerHTML = visible.length ? visible.map((company) => `
    <article class="card">
      <h4>${escapeHtml(company.name)}</h4>
      <p class="meta">${escapeHtml(company.industry || 'Industry not set')}</p>
      <p class="meta">Website: ${escapeHtml(company.website || 'Not listed')} · Owner: ${escapeHtml(company.owner || 'TBD')}</p>
      <div class="card-actions">
        <button class="muted-btn" data-action="edit-company" data-id="${escapeHtml(company.id)}">Edit</button>
        <button class="muted-btn danger-text" data-action="delete-company" data-id="${escapeHtml(company.id)}" aria-label="Delete company ${escapeHtml(company.name)}">Delete</button>
      </div>
    </article>
  `).join('') : `<p class="meta empty-note">${searchQuery ? 'No companies match your search.' : 'No companies yet.'}</p>`;
}

function renderOpportunities() {
  const pipeline = document.getElementById('opportunities-pipeline');
  const visibleDeals = state.deals.filter((d) => matchesSearch(d.title, getCompanyName(d.companyId), getContactName(d.contactId), getUserName(d.ownerId)));
  pipeline.innerHTML = DEAL_STAGES.map((stage, stageIndex) => {
    const stageDeals = visibleDeals.filter((deal) => deal.stage === stage);
    const stageTotal = stageDeals.reduce((sum, deal) => sum + (Number(deal.value) || 0), 0);
    return `
      <div class="pipeline-column">
        <h4>${stage} <span class="stage-count">${stageDeals.length}</span></h4>
        <div class="meta stage-total">$${stageTotal.toLocaleString()}</div>
        ${stageDeals.map((deal) => `
          <div class="pipeline-card">
            <strong>${escapeHtml(deal.title)}</strong>
            <div class="meta">${escapeHtml(getCompanyName(deal.companyId))} · ${escapeHtml(getContactName(deal.contactId))}</div>
            <div class="meta">Owner: ${escapeHtml(getUserName(deal.ownerId))}</div>
            <div class="meta">Value: $${(Number(deal.value) || 0).toLocaleString()}</div>
            <div class="meta">Close: ${escapeHtml(deal.closeDate || 'TBD')}</div>
            <div class="card-actions">
              <button class="muted-btn" data-action="move-deal-prev" data-id="${escapeHtml(deal.id)}" aria-label="Move ${escapeHtml(deal.title)} to previous stage" ${stageIndex === 0 ? 'disabled' : ''}>&#9664;</button>
              <button class="muted-btn" data-action="move-deal-next" data-id="${escapeHtml(deal.id)}" aria-label="Move ${escapeHtml(deal.title)} to next stage" ${stageIndex === DEAL_STAGES.length - 1 ? 'disabled' : ''}>&#9654;</button>
              <button class="muted-btn" data-action="edit-deal" data-id="${escapeHtml(deal.id)}">Edit</button>
              <button class="muted-btn danger-text" data-action="delete-deal" data-id="${escapeHtml(deal.id)}" aria-label="Delete deal ${escapeHtml(deal.title)}">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  populateSelect('opportunity-company', state.companies, 'Select company');
  populateSelect('opportunity-contact', state.contacts, 'Select contact');
  populateSelect('opportunity-owner', state.users, 'Select owner');
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  const visible = state.tasks.filter((t) => matchesSearch(t.title, getCompanyName(t.relatedTo), t.priority));
  list.innerHTML = visible.length ? visible.map((task) => `
    <article class="card">
      <h4>${escapeHtml(task.title)}</h4>
      <p class="meta">Due ${escapeHtml(task.dueDate || 'soon')}${isOverdue(task) ? ' · <span class="overdue-flag">Overdue</span>' : ''}</p>
      <p class="meta">Related to: ${escapeHtml(getCompanyName(task.relatedTo))}</p>
      <span class="badge ${escapeHtml((task.priority || 'Medium').toLowerCase())}">${escapeHtml(task.priority || 'Medium')}</span>
      <div class="card-actions">
        <button class="muted-btn" data-action="toggle-task" data-id="${escapeHtml(task.id)}">${task.status === 'Open' ? 'Mark done' : 'Reopen'}</button>
        <button class="muted-btn" data-action="edit-task" data-id="${escapeHtml(task.id)}">Edit</button>
        <button class="muted-btn danger-text" data-action="delete-task" data-id="${escapeHtml(task.id)}" aria-label="Delete task ${escapeHtml(task.title)}">Delete</button>
      </div>
    </article>
  `).join('') : `<p class="meta empty-note">${searchQuery ? 'No tasks match your search.' : 'No tasks yet.'}</p>`;

  populateSelect('task-related-to', state.companies, 'Select related company');
}

function renderUsers() {
  const list = document.getElementById('users-list');
  list.innerHTML = state.users.map((user) => `
    <article class="card">
      <h4>${escapeHtml(user.name)}</h4>
      <p class="meta">${escapeHtml(user.role)}</p>
      <p class="meta">${escapeHtml(user.email)}</p>
      <span class="badge ${user.status === 'Active' ? 'low' : 'medium'}">${escapeHtml(user.status)}</span>
    </article>
  `).join('');
}

function renderFocusSummary() {
  const summary = document.getElementById('focus-summary');
  const openTasks = state.tasks.filter((task) => task.status === 'Open');
  summary.textContent = openTasks.length
    ? `${openTasks[0].title} is due ${openTasks[0].dueDate || 'soon'}.`
    : 'Everything is on track for today.';
}

function getUserName(userId) {
  const user = state.users.find((item) => item.id === userId);
  return user ? user.name : 'Unassigned';
}

function populateSelect(id, items, placeholder) {
  const select = document.getElementById(id);
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '';

  if (placeholder) {
    const placeholderOption = document.createElement('option');
    placeholderOption.textContent = placeholder;
    placeholderOption.value = '';
    select.appendChild(placeholderOption);
  }

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name || `${item.firstName} ${item.lastName}`;
    select.appendChild(option);
  });

  if (currentValue) {
    select.value = currentValue;
  }
}

function showView(viewId) {
  if (!currentUser) {
    document.getElementById('auth-overlay').classList.remove('hidden');
    return;
  }
  document.getElementById('auth-overlay').classList.add('hidden');
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === `${viewId}-view`));
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    const isActive = btn.dataset.view === viewId;
    btn.classList.toggle('active', isActive);
    if (isActive) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  pageTitle.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
}

views.forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));

function attachFormHandlers() {
  try {
    const loginForm = document.getElementById('login-form');
    const loginSubmit = document.getElementById('login-submit');
    if (loginForm && loginSubmit) {
      loginForm.onsubmit = (e) => { e.preventDefault(); handleLogin(e); return false; };
      loginSubmit.onclick = (e) => { e.preventDefault(); handleLogin(e); return false; };
    }
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = handleLogout;
  } catch (err) { console.error('Auth setup error:', err); }
  
  document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);
  document.getElementById('company-form').addEventListener('submit', handleCompanySubmit);
  document.getElementById('opportunity-form').addEventListener('submit', handleOpportunitySubmit);
  document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);

  document.querySelectorAll('.cancel-btn').forEach((button) => button.addEventListener('click', () => hideForms()));

  document.getElementById('add-contact-btn').addEventListener('click', () => openForm('contact'));
  document.getElementById('add-company-btn').addEventListener('click', () => openForm('company'));
  document.getElementById('add-opportunity-btn').addEventListener('click', () => openForm('opportunity'));
  document.getElementById('add-task-btn').addEventListener('click', () => openForm('task'));

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === 'edit-contact') editContact(id);
    if (action === 'delete-contact') deleteContact(id);
    if (action === 'edit-company') editCompany(id);
    if (action === 'delete-company') deleteCompany(id);
    if (action === 'edit-deal') editDeal(id);
    if (action === 'delete-deal') deleteDeal(id);
    if (action === 'edit-task') editTask(id);
    if (action === 'delete-task') deleteTask(id);
    if (action === 'toggle-task') toggleTask(id);
    if (action === 'move-deal-prev') moveDeal(id, -1);
    if (action === 'move-deal-next') moveDeal(id, 1);
  });

  document.getElementById('reset-data-btn').addEventListener('click', () => {
    if (!confirm('Reset all data back to the sample dataset? Everything you added will be permanently deleted.')) return;
    state = structuredClone(defaultState);
    saveState();
    render();
  });

  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      render();
    });
  }
}

function openForm(type) {
  if (!currentUser) return;
  hideForms();
  document.getElementById(`${type}-form`).classList.remove('hidden');
}

function hideForms() {
  document.querySelectorAll('.form-panel').forEach((form) => form.classList.add('hidden'));
  document.querySelectorAll('form').forEach((form) => form.reset());
}

function handleContactSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('contact-id').value;
  const payload = {
    id: id || crypto.randomUUID(),
    firstName: document.getElementById('contact-first-name').value,
    lastName: document.getElementById('contact-last-name').value,
    title: document.getElementById('contact-title').value,
    email: document.getElementById('contact-email').value,
    phone: document.getElementById('contact-phone').value,
    companyId: document.getElementById('contact-company').value,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  if (id) {
    state.contacts = state.contacts.map((item) => (item.id === id ? payload : item));
  } else {
    state.contacts.push(payload);
    state.activities.unshift({ id: crypto.randomUUID(), description: `Added contact ${payload.firstName} ${payload.lastName}`, createdAt: payload.createdAt });
  }

  saveState();
  render();
  hideForms();
}

function handleCompanySubmit(event) {
  event.preventDefault();
  const id = document.getElementById('company-id').value;
  const payload = {
    id: id || crypto.randomUUID(),
    name: document.getElementById('company-name').value,
    industry: document.getElementById('company-industry').value,
    website: document.getElementById('company-website').value,
    owner: document.getElementById('company-owner').value,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  if (id) {
    state.companies = state.companies.map((item) => (item.id === id ? payload : item));
  } else {
    state.companies.push(payload);
    state.activities.unshift({ id: crypto.randomUUID(), description: `Added company ${payload.name}`, createdAt: payload.createdAt });
  }

  saveState();
  render();
  hideForms();
}

function handleOpportunitySubmit(event) {
  event.preventDefault();
  const id = document.getElementById('opportunity-id').value;
  const payload = {
    id: id || crypto.randomUUID(),
    title: document.getElementById('opportunity-title').value,
    companyId: document.getElementById('opportunity-company').value,
    contactId: document.getElementById('opportunity-contact').value,
    stage: document.getElementById('opportunity-stage').value,
    ownerId: document.getElementById('opportunity-owner').value,
    value: Number(document.getElementById('opportunity-value').value) || 0,
    closeDate: document.getElementById('opportunity-close-date').value,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  if (id) {
    const existing = state.deals.find((item) => item.id === id);
    if (existing && existing.stage !== payload.stage) {
      state.activities.unshift({ id: crypto.randomUUID(), description: `Moved deal ${payload.title} to ${payload.stage}`, createdAt: todayStr() });
    }
    state.deals = state.deals.map((item) => (item.id === id ? { ...item, ...payload, createdAt: item.createdAt } : item));
  } else {
    state.deals.push(payload);
    state.activities.unshift({ id: crypto.randomUUID(), description: `Added opportunity ${payload.title}`, createdAt: payload.createdAt });
  }

  saveState();
  render();
  hideForms();
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('task-id').value;
  const payload = {
    id: id || crypto.randomUUID(),
    title: document.getElementById('task-title').value,
    dueDate: document.getElementById('task-due-date').value,
    priority: document.getElementById('task-priority').value,
    relatedTo: document.getElementById('task-related-to').value,
    status: 'Open',
    createdAt: new Date().toISOString().slice(0, 10)
  };

  if (id) {
    state.tasks = state.tasks.map((item) => (item.id === id ? { ...item, ...payload, status: item.status, createdAt: item.createdAt } : item));
  } else {
    state.tasks.push(payload);
    state.activities.unshift({ id: crypto.randomUUID(), description: `Added task ${payload.title}`, createdAt: payload.createdAt });
  }

  saveState();
  render();
  hideForms();
}

function editContact(id) {
  const contact = state.contacts.find((item) => item.id === id);
  if (!contact) return;
  document.getElementById('contact-id').value = contact.id;
  document.getElementById('contact-first-name').value = contact.firstName;
  document.getElementById('contact-last-name').value = contact.lastName;
  document.getElementById('contact-title').value = contact.title;
  document.getElementById('contact-email').value = contact.email;
  document.getElementById('contact-phone').value = contact.phone;
  document.getElementById('contact-company').value = contact.companyId;
  openForm('contact');
}

function moveDeal(id, direction) {
  const deal = state.deals.find((item) => item.id === id);
  if (!deal) return;
  const currentIndex = DEAL_STAGES.indexOf(deal.stage);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= DEAL_STAGES.length) return;
  deal.stage = DEAL_STAGES[nextIndex];
  state.activities.unshift({ id: crypto.randomUUID(), description: `Moved deal ${deal.title} to ${deal.stage}`, createdAt: todayStr() });
  saveState();
  render();
}

function deleteContact(id) {
  const contact = state.contacts.find((item) => item.id === id);
  if (!contact) return;
  if (!confirm(`Delete contact ${contact.firstName} ${contact.lastName}? This cannot be undone.`)) return;
  state.contacts = state.contacts.filter((item) => item.id !== id);
  saveState();
  render();
}

function editCompany(id) {
  const company = state.companies.find((item) => item.id === id);
  if (!company) return;
  document.getElementById('company-id').value = company.id;
  document.getElementById('company-name').value = company.name;
  document.getElementById('company-industry').value = company.industry;
  document.getElementById('company-website').value = company.website;
  document.getElementById('company-owner').value = company.owner;
  openForm('company');
}

function deleteCompany(id) {
  const company = state.companies.find((item) => item.id === id);
  if (!company) return;
  const linkedContacts = state.contacts.filter((c) => c.companyId === id).length;
  const linkedDeals = state.deals.filter((d) => d.companyId === id).length;
  const linkedTasks = state.tasks.filter((t) => t.relatedTo === id).length;
  const linked = linkedContacts + linkedDeals + linkedTasks;
  const warning = linked
    ? ` It is linked to ${linkedContacts} contact(s), ${linkedDeals} deal(s), and ${linkedTasks} task(s); those links will show "Unassigned".`
    : '';
  if (!confirm(`Delete company ${company.name}?${warning} This cannot be undone.`)) return;
  state.companies = state.companies.filter((item) => item.id !== id);
  saveState();
  render();
}

function editDeal(id) {
  const deal = state.deals.find((item) => item.id === id);
  if (!deal) return;
  document.getElementById('opportunity-id').value = deal.id;
  document.getElementById('opportunity-title').value = deal.title;
  document.getElementById('opportunity-company').value = deal.companyId;
  document.getElementById('opportunity-contact').value = deal.contactId;
  document.getElementById('opportunity-stage').value = deal.stage;
  document.getElementById('opportunity-owner').value = deal.ownerId;
  document.getElementById('opportunity-value').value = deal.value;
  document.getElementById('opportunity-close-date').value = deal.closeDate;
  openForm('opportunity');
}

function deleteDeal(id) {
  const deal = state.deals.find((item) => item.id === id);
  if (!deal) return;
  if (!confirm(`Delete deal ${deal.title}? This cannot be undone.`)) return;
  state.deals = state.deals.filter((item) => item.id !== id);
  saveState();
  render();
}

function editTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-due-date').value = task.dueDate;
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-related-to').value = task.relatedTo;
  openForm('task');
}

function deleteTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  if (!confirm(`Delete task ${task.title}? This cannot be undone.`)) return;
  state.tasks = state.tasks.filter((item) => item.id !== id);
  saveState();
  render();
}

function toggleTask(id) {
  state.tasks = state.tasks.map((task) => {
    if (task.id !== id) return task;
    const nextStatus = task.status === 'Open' ? 'Done' : 'Open';
    return { ...task, status: nextStatus };
  });
  saveState();
  render();
}

function handleLogin(event) {
  event.preventDefault();
  const btn = document.getElementById('login-submit');
  const statusDiv = document.getElementById('login-status');
  btn.disabled = true;
  statusDiv.textContent = 'Signing in...';
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const user = state.users.find((item) => item.email === email);
  
  setTimeout(() => {
    if (user && password === 'demo123') {
      currentUser = user;
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      statusDiv.textContent = 'Success! Welcome back.';
      document.getElementById('auth-overlay').style.display = 'none';
      document.getElementById('user-badge').textContent = user.name + ' · ' + user.role;
      document.getElementById('logout-btn').classList.remove('hidden');
      render();
    } else {
      statusDiv.textContent = 'Invalid credentials. Try admin@vinecrm.com / demo123';
      btn.disabled = false;
    }
  }, 400);
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  render();
  showView('dashboard');
}

function updateAuthUI() {
  const overlay = document.getElementById('auth-overlay');
  const logoutBtn = document.getElementById('logout-btn');
  const userBadge = document.getElementById('user-badge');
  if (currentUser) {
    overlay.style.display = 'none';
    logoutBtn.classList.remove('hidden');
    userBadge.textContent = currentUser.name + ' · ' + currentUser.role;
  } else {
    overlay.style.display = 'flex';
    logoutBtn.classList.add('hidden');
    userBadge.textContent = 'Guest';
  }
}

attachFormHandlers();
seedIfNeeded();
render();
showView('dashboard');
