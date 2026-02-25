const STORAGE_KEY = 'francine-life-dash-v1';

const defaultState = {
  goals: [],
  todos: [],
  journal: [],
  professionalKpis: [],
  professionalResources: [],
  professionalFeedback: [],
  trainingResponses: [],
  quote: null,
  quoteDate: null,
  settings: {
    weatherCity: 'Vienna'
  }
};

const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
const state = {
  ...defaultState,
  ...savedState,
  settings: {
    ...defaultState.settings,
    ...(savedState.settings || {})
  }
};

ensureProfessionalState();

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const form = {
  goal: document.getElementById('goal-form'),
  todo: document.getElementById('todo-form'),
  journal: document.getElementById('journal-form'),
  dataExport: document.getElementById('export-data'),
  dataImport: document.getElementById('import-data'),
  importInput: document.getElementById('import-file'),
  weather: document.getElementById('weather-form'),
  kpi: document.getElementById('kpi-form'),
  resource: document.getElementById('resource-form'),
  feedback: document.getElementById('feedback-form'),
  training: document.getElementById('training-form')
};

const lists = {
  goals: document.getElementById('goal-list'),
  todos: document.getElementById('todo-list'),
  journal: document.getElementById('journal-list'),
  todaysTodos: document.getElementById('todays-todos'),
  moodSummary: document.getElementById('mood-summary'),
  kpiTable: document.getElementById('kpi-table'),
  kpiLatest: document.getElementById('kpi-latest'),
  resources: document.getElementById('resource-list'),
  feedback: document.getElementById('feedback-list'),
  trainingResponses: document.getElementById('training-responses')
};

const streakEl = document.getElementById('streak');
const moodCanvas = document.getElementById('mood-chart');
const quotaCanvas = document.getElementById('quota-chart');
const quoteEl = document.getElementById('quote');
const quoteAuthorEl = document.getElementById('quote-author');
const weatherEl = document.getElementById('weather');
const weatherCityInput = document.getElementById('weather-city');
const sendFeedbackBtn = document.getElementById('send-feedback');
const scenarioButtons = document.querySelectorAll('.copy-prompt');

const uuid = () => crypto.randomUUID();

function ensureProfessionalState() {
  state.professionalKpis = state.professionalKpis || [];
  state.professionalResources = state.professionalResources || [];
  state.professionalFeedback = state.professionalFeedback || [];
  state.trainingResponses = state.trainingResponses || [];
}

/* ---------- Goals ---------- */
const renderGoals = () => {
  lists.goals.innerHTML = '';
  state.goals
    .sort((a, b) => a.progress - b.progress)
    .forEach((goal) => {
      const item = document.createElement('div');
      item.className = 'list-item goal-item';
      item.innerHTML = `
        <strong>${goal.title}</strong>
        <div class="meta">Target: ${goal.targetDate || 'Open-ended'}</div>
        <div class="progress" aria-label="goal progress for ${goal.title}">
          <div style="background: rgba(255,255,255,0.12); height: 8px; border-radius: 999px; margin: 0.5rem 0;">
            <div style="width: ${goal.progress}%; height: 100%; background: var(--accent); border-radius: 999px;"></div>
          </div>
          <span>${goal.progress}%</span>
        </div>
        <div class="goal-actions">
          <button class="secondary" data-action="edit" data-id="${goal.id}">Edit</button>
          <button class="secondary" data-action="progress" data-id="${goal.id}">Adjust</button>
          <button class="secondary" data-action="delete" data-id="${goal.id}">Delete</button>
        </div>
      `;
      lists.goals.appendChild(item);
    });
};

lists.goals.addEventListener('click', (event) => {
  const btn = event.target.closest('button');
  if (!btn) return;
  const goal = state.goals.find((g) => g.id === btn.dataset.id);
  if (!goal) return;
  if (btn.dataset.action === 'delete') {
    state.goals = state.goals.filter((g) => g.id !== goal.id);
  } else if (btn.dataset.action === 'edit') {
    const title = prompt('Goal title', goal.title);
    const targetDate = prompt('Target date (YYYY-MM-DD or blank)', goal.targetDate || '');
    if (title?.trim()) {
      goal.title = title.trim();
      goal.targetDate = targetDate || '';
    }
  } else if (btn.dataset.action === 'progress') {
    const progress = Number(prompt('Progress (0-100)', goal.progress));
    if (!Number.isNaN(progress)) {
      goal.progress = Math.min(100, Math.max(0, progress));
    }
  }
  saveState();
  renderGoals();
  renderDashboard();
});

form.goal?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form.goal);
  const title = data.get('goal-title').trim();
  if (!title) return;
  state.goals.push({
    id: uuid(),
    title,
    targetDate: data.get('goal-date'),
    progress: Number(data.get('goal-progress')) || 0
  });
  form.goal.reset();
  saveState();
  renderGoals();
  renderDashboard();
});

/* ---------- Todos ---------- */
const renderTodos = () => {
  lists.todos.innerHTML = '';
  const priorities = { High: 1, Medium: 2, Low: 3 };
  state.todos
    .sort((a, b) => {
      if (a.completed === b.completed) {
        return priorities[a.priority] - priorities[b.priority];
      }
      return a.completed - b.completed;
    })
    .forEach((todo) => {
      const item = document.createElement('div');
      item.className = `list-item priority-${todo.priority.toLowerCase()} ${todo.completed ? 'completed' : ''}`;
      item.innerHTML = `
        <label style="display:flex; gap:0.5rem; align-items:center;">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
          <div>
            <strong>${todo.text}</strong>
            <div class="meta">Priority: ${todo.priority}${todo.dueDate ? ` · Due ${todo.dueDate}` : ''}</div>
          </div>
        </label>
        <div class="todo-actions">
          <button class="secondary" data-action="edit" data-id="${todo.id}">Edit</button>
          <button class="secondary" data-action="delete" data-id="${todo.id}">Delete</button>
        </div>
      `;
      lists.todos.appendChild(item);
    });
};

lists.todos.addEventListener('change', (event) => {
  if (event.target.matches('input[type="checkbox"]')) {
    const todo = state.todos.find((t) => t.id === event.target.dataset.id);
    if (todo) {
      todo.completed = event.target.checked;
      saveState();
      renderTodos();
      renderDashboard();
    }
  }
});

lists.todos.addEventListener('click', (event) => {
  const btn = event.target.closest('button');
  if (!btn) return;
  const todo = state.todos.find((t) => t.id === btn.dataset.id);
  if (!todo) return;
  if (btn.dataset.action === 'delete') {
    state.todos = state.todos.filter((t) => t.id !== todo.id);
  } else if (btn.dataset.action === 'edit') {
    const text = prompt('Todo', todo.text);
    const priority = prompt('Priority (High/Medium/Low)', todo.priority) || todo.priority;
    const due = prompt('Due date YYYY-MM-DD (optional)', todo.dueDate || '') || '';
    if (text?.trim()) {
      todo.text = text.trim();
      todo.priority = ['High', 'Medium', 'Low'].includes(priority) ? priority : todo.priority;
      todo.dueDate = due;
    }
  }
  saveState();
  renderTodos();
  renderDashboard();
});

form.todo?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form.todo);
  const text = data.get('todo-text').trim();
  if (!text) return;
  state.todos.push({
    id: uuid(),
    text,
    priority: data.get('todo-priority'),
    dueDate: data.get('todo-date'),
    completed: false
  });
  form.todo.reset();
  saveState();
  renderTodos();
  renderDashboard();
});

/* ---------- Journal ---------- */
const renderJournal = () => {
  lists.journal.innerHTML = '';
  state.journal
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <strong>${entry.date}</strong>
        <div class="meta">Mood: ${entry.mood}/5</div>
        <p>${entry.text || ''}</p>
      `;
      lists.journal.appendChild(item);
    });
};

const calculateStreak = () => {
  if (!state.journal.length) return 0;
  const dates = [...new Set(state.journal.map((entry) => entry.date))]
    .sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  let current = new Date();
  for (const date of dates) {
    const entryDate = new Date(date);
    if (
      entryDate.getFullYear() === current.getFullYear() &&
      entryDate.getMonth() === current.getMonth() &&
      entryDate.getDate() === current.getDate()
    ) {
      streak += 1;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

const renderMoodChart = () => {
  const ctx = moodCanvas.getContext('2d');
  ctx.clearRect(0, 0, moodCanvas.width, moodCanvas.height);
  if (!state.journal.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Add journal entries to see mood trends', 10, 30);
    return;
  }
  const sorted = state.journal
    .slice(-14)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const padding = 20;
  const width = moodCanvas.width - padding * 2;
  const height = moodCanvas.height - padding * 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height + padding);
  ctx.lineTo(width + padding, height + padding);
  ctx.stroke();

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  sorted.forEach((entry, index) => {
    const x = padding + (width / (sorted.length - 1 || 1)) * index;
    const y = padding + height - (entry.mood - 1) * (height / 4);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '12px Inter';
  sorted.forEach((entry, index) => {
    const x = padding + (width / (sorted.length - 1 || 1)) * index;
    const y = padding + height - (entry.mood - 1) * (height / 4);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
};

form.journal?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form.journal);
  const date = data.get('journal-date');
  const mood = Number(data.get('journal-mood'));
  if (!date || !mood) return;
  state.journal.push({
    id: uuid(),
    date,
    mood,
    text: data.get('journal-text').trim()
  });
  form.journal.reset();
  saveState();
  renderJournal();
  renderDashboard();
  renderMoodChart();
});

/* ---------- Professional KPIs ---------- */
const renderKpis = () => {
  const entries = [...state.professionalKpis].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!entries.length) {
    lists.kpiLatest.textContent = 'No KPI data yet.';
    lists.kpiTable.innerHTML = '<tr><td colspan="6" class="muted">Log your first day to unlock insights.</td></tr>';
    renderQuotaChart();
    return;
  }

  const latest = entries[0];
  lists.kpiLatest.innerHTML = `Latest: <strong>${latest.date}</strong> · ${latest.calls} calls · ${latest.meetings} meetings · Pipeline ${latest.pipeline}% · Quota ${latest.quota}%`;

  lists.kpiTable.innerHTML = '';
  entries.forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.calls}</td>
      <td>${entry.meetings}</td>
      <td>${entry.pipeline}%</td>
      <td>${entry.quota}%</td>
      <td><button class="secondary" data-id="${entry.id}" data-action="delete-kpi">✕</button></td>
    `;
    lists.kpiTable.appendChild(row);
  });

  renderQuotaChart();
};

const renderQuotaChart = () => {
  if (!quotaCanvas) return;
  const ctx = quotaCanvas.getContext('2d');
  ctx.clearRect(0, 0, quotaCanvas.width, quotaCanvas.height);
  const entries = state.professionalKpis
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14);
  if (!entries.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Log KPIs to see quota & pipeline trend', 10, 30);
    return;
  }
  const padding = 30;
  const width = quotaCanvas.width - padding * 2;
  const height = quotaCanvas.height - padding * 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height + padding);
  ctx.lineTo(width + padding, height + padding);
  ctx.stroke();

  const metrics = [
    { key: 'pipeline', color: '#fbbf24' },
    { key: 'quota', color: '#4ade80' }
  ];
  const maxValue = Math.max(
    120,
    ...metrics.map((m) => Math.max(...entries.map((entry) => entry[m.key] || 0)))
  );

  metrics.forEach((metric) => {
    ctx.beginPath();
    ctx.strokeStyle = metric.color;
    ctx.lineWidth = 2;
    entries.forEach((entry, index) => {
      const x = padding + (width / (entries.length - 1 || 1)) * index;
      const ratio = (entry[metric.key] || 0) / maxValue;
      const y = padding + height - ratio * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
};

lists.kpiTable?.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action="delete-kpi"]');
  if (!btn) return;
  state.professionalKpis = state.professionalKpis.filter((entry) => entry.id !== btn.dataset.id);
  saveState();
  renderKpis();
});

form.kpi?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form.kpi);
  const entry = {
    id: uuid(),
    date: data.get('kpi-date'),
    calls: Number(data.get('kpi-calls')) || 0,
    meetings: Number(data.get('kpi-meetings')) || 0,
    pipeline: Number(data.get('kpi-pipeline')) || 0,
    quota: Number(data.get('kpi-quota')) || 0
  };
  if (!entry.date) return;
  state.professionalKpis = state.professionalKpis.filter((kpi) => kpi.date !== entry.date);
  state.professionalKpis.push(entry);
  saveState();
  renderKpis();
});

/* ---------- Resources ---------- */
const renderResources = () => {
  if (!lists.resources) return;
  lists.resources.innerHTML = '';
  if (!state.professionalResources.length) {
    lists.resources.innerHTML = '<p class="muted">Add the playbooks, pods, and videos fueling your ramp.</p>';
    return;
  }
  state.professionalResources.forEach((resource) => {
    const item = document.createElement('div');
    item.className = 'list-item resource-item';
    item.innerHTML = `
      <strong>${resource.title} <span class="badge">${resource.type}</span></strong>
      ${resource.link ? `<a href="${resource.link}" target="_blank" rel="noopener">${resource.link}</a>` : ''}
      ${resource.notes ? `<p>${resource.notes}</p>` : ''}
      <div class="todo-actions">
        <button class="secondary" data-action="delete-resource" data-id="${resource.id}">Delete</button>
      </div>
    `;
    lists.resources.appendChild(item);
  });
};

lists.resources?.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action="delete-resource"]');
  if (!btn) return;
  state.professionalResources = state.professionalResources.filter((res) => res.id !== btn.dataset.id);
  saveState();
  renderResources();
});

form.resource?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form.resource);
  const title = data.get('resource-title')?.trim();
  if (!title) return;
  const link = (data.get('resource-link') || '').trim();
  const notes = (data.get('resource-notes') || '').trim();
  state.professionalResources.push({
    id: uuid(),
    title,
    type: data.get('resource-type'),
    link,
    notes
  });
  form.resource.reset();
  saveState();
  renderResources();
});

/* ---------- Feedback ---------- */
const renderFeedback = () => {
  if (!lists.feedback) return;
  lists.feedback.innerHTML = '';
  if (!state.professionalFeedback.length) {
    lists.feedback.innerHTML = '<p class="muted">Log notable bot convos + score quality 1–5.</p>';
    return;
  }
  state.professionalFeedback
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'list-item feedback-item';
      item.innerHTML = `
        <div class="meta">${new Date(entry.createdAt).toLocaleString()}</div>
        <div class="feedback-rating">Rating: ${entry.rating}/5</div>
        <p>${entry.text}</p>
        <div class="todo-actions">
          <button class="secondary" data-action="delete-feedback" data-id="${entry.id}">Delete</button>
        </div>
      `;
      lists.feedback.appendChild(item);
    });
};

lists.feedback?.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action="delete-feedback"]');
  if (!btn) return;
  state.professionalFeedback = state.professionalFeedback.filter((entry) => entry.id !== btn.dataset.id);
  saveState();
  renderFeedback();
});

form.feedback?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form.feedback);
  const textValue = data.get('feedback-context')?.trim();
  if (!textValue) return;
  state.professionalFeedback.push({
    id: uuid(),
    text: textValue,
    rating: Number(data.get('feedback-rating')) || 0,
    createdAt: Date.now()
  });
  form.feedback.reset();
  saveState();
  renderFeedback();
});

sendFeedbackBtn?.addEventListener('click', async () => {
  const latest = state.professionalFeedback.slice().sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!latest) {
    alert('No feedback available yet. Save one first.');
    return;
  }
  const payload = `Feedback for Buster\nRating: ${latest.rating}/5\nLogged: ${new Date(latest.createdAt).toLocaleString()}\n---\n${latest.text}`;
  try {
    await navigator.clipboard.writeText(payload);
    sendFeedbackBtn.textContent = 'Copied for Buster!';
    setTimeout(() => (sendFeedbackBtn.textContent = 'Send feedback to Buster'), 1500);
  } catch (error) {
    alert('Clipboard unavailable. Copy manually:\n\n' + payload);
  }
});

/* ---------- Training ---------- */
const renderTrainingResponses = () => {
  if (!lists.trainingResponses) return;
  lists.trainingResponses.innerHTML = '';
  if (!state.trainingResponses.length) {
    lists.trainingResponses.innerHTML = '<p class="muted">After each drill, jot down the takeaways.</p>';
    return;
  }
  state.trainingResponses
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'list-item training-item';
      item.innerHTML = `
        <strong>${entry.scenario}</strong>
        <div class="meta">${new Date(entry.createdAt).toLocaleString()}</div>
        <p>${entry.response}</p>
        <div class="todo-actions">
          <button class="secondary" data-action="delete-training" data-id="${entry.id}">Delete</button>
        </div>
      `;
      lists.trainingResponses.appendChild(item);
    });
};

lists.trainingResponses?.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action="delete-training"]');
  if (!btn) return;
  state.trainingResponses = state.trainingResponses.filter((entry) => entry.id !== btn.dataset.id);
  saveState();
  renderTrainingResponses();
});

form.training?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form.training);
  const scenario = data.get('training-scenario')?.trim();
  const response = data.get('training-response')?.trim();
  if (!scenario || !response) return;
  state.trainingResponses.push({
    id: uuid(),
    scenario,
    response,
    createdAt: Date.now()
  });
  form.training.reset();
  saveState();
  renderTrainingResponses();
});

scenarioButtons.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const prompt = btn.dataset.prompt;
    const title = btn.dataset.title;
    const trainingScenarioInput = document.getElementById('training-scenario');
    if (trainingScenarioInput && title) {
      trainingScenarioInput.value = title;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 1500);
    } catch (error) {
      alert('Clipboard unavailable. Prompt:\n\n' + prompt);
    }
  });
});

/* ---------- Dashboard ---------- */
const renderDashboard = () => {
  const today = new Date().toISOString().slice(0, 10);
  const todays = state.todos.filter(
    (todo) => !todo.completed && (todo.dueDate === today || !todo.dueDate)
  );
  lists.todaysTodos.innerHTML = todays.length
    ? todays
        .map((todo) => `<li>${todo.text} <small>(${todo.priority})</small></li>`)
        .join('')
    : '<li>All clear for today 🎉</li>';

  const streak = calculateStreak();
  streakEl.textContent = `${streak} day${streak === 1 ? '' : 's'}`;

  if (state.journal.length) {
    const lastMood = state.journal[state.journal.length - 1].mood;
    lists.moodSummary.textContent = `Latest mood: ${lastMood}/5`;
  } else {
    lists.moodSummary.textContent = 'Log a mood to start tracking vibes.';
  }
};

/* ---------- Weather ---------- */
const fetchWeather = async (city) => {
  if (!city) return;
  weatherEl.innerHTML = '<p>Loading weather…</p>';
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoJson = await geoRes.json();
    if (!geoJson.results?.length) throw new Error('City not found');
    const { latitude, longitude, name, country } = geoJson.results[0];
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code`
    );
    const weatherJson = await weatherRes.json();
    const current = weatherJson.current;
    weatherEl.innerHTML = `
      <div class="temp">${Math.round(current.temperature_2m)}°C</div>
      <div>${name}, ${country}</div>
      <div>Humidity: ${current.relative_humidity_2m}%</div>
    `;
    state.settings.weatherCity = city;
    saveState();
  } catch (error) {
    weatherEl.innerHTML = `<p>Weather unavailable (${error.message})</p>`;
  }
};

weatherCityInput.value = state.settings.weatherCity || '';
form.weather?.addEventListener('submit', (event) => {
  event.preventDefault();
  fetchWeather(weatherCityInput.value.trim());
});

/* ---------- Quotes ---------- */
const loadQuote = async () => {
  try {
    const cachedDate = state.quoteDate;
    const today = new Date().toISOString().slice(0, 10);
    if (cachedDate === today && state.quote) {
      quoteEl.textContent = state.quote.text;
      quoteAuthorEl.textContent = state.quote.author;
      return;
    }
    const response = await fetch('https://api.quotable.io/random');
    const data = await response.json();
    state.quote = { text: data.content, author: data.author };
    state.quoteDate = today;
    saveState();
    quoteEl.textContent = data.content;
    quoteAuthorEl.textContent = data.author;
  } catch (error) {
    quoteEl.textContent = 'Could not fetch today\'s quote.';
    quoteAuthorEl.textContent = '';
  }
};

/* ---------- Data Sync ---------- */
form.dataExport?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `life-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

form.dataImport?.addEventListener('click', () => form.importInput.click());

form.importInput?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      Object.assign(state, parsed);
      ensureProfessionalState();
      saveState();
      renderEverything();
      alert('Dashboard restored from file');
    } catch (error) {
      alert('Invalid file');
    }
  };
  reader.readAsText(file);
});

const copyToClipboardBtn = document.getElementById('copy-json');
copyToClipboardBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
    copyToClipboardBtn.textContent = 'Copied!';
    setTimeout(() => (copyToClipboardBtn.textContent = 'Copy JSON'), 1500);
  } catch {
    alert('Clipboard unavailable in this context');
  }
});

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  const installBtn = document.getElementById('install-btn');
  installBtn.hidden = false;
  installBtn.addEventListener('click', async () => {
    installBtn.hidden = true;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
});

/* ---------- Helpers ---------- */
const renderEverything = () => {
  renderGoals();
  renderTodos();
  renderJournal();
  renderDashboard();
  renderMoodChart();
  renderKpis();
  renderResources();
  renderFeedback();
  renderTrainingResponses();
  fetchWeather(state.settings.weatherCity);
  loadQuote();
  setDefaultDates();
};

const setDefaultDates = () => {
  const today = new Date().toISOString().slice(0, 10);
  const journalDateInput = document.getElementById('journal-date');
  if (journalDateInput && !journalDateInput.value) journalDateInput.value = today;
  const kpiDateInput = document.getElementById('kpi-date');
  if (kpiDateInput && !kpiDateInput.value) kpiDateInput.value = today;
};

renderEverything();
