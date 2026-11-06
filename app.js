const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const taskList = document.querySelector('#task-list');
const statusElement = document.querySelector('#status');

let apiUrl;
let apiKey;
let tasks = [];

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

async function readResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.hint || `Request failed (${response.status})`);
  }

  return data;
}

async function request(path = '', options = {}) {
  const headers = {
    apikey: apiKey,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${apiUrl}/rest/v1/tasks${path}`, {
    ...options,
    headers,
  });

  return readResponse(response);
}

function actionButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = className;
  button.addEventListener('click', onClick);
  return button;
}

function renderTasks() {
  taskList.replaceChildren();

  if (!tasks.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No tasks yet. Add the first one above.';
    taskList.append(empty);
    return;
  }

  for (const task of tasks) {
    const item = document.createElement('li');
    item.className = `task${task.completed ? ' completed' : ''}`;

    const toggle = actionButton(task.completed ? '✓' : '○', 'toggle', () => {
      updateTask(task.id, { completed: !task.completed });
    });
    toggle.setAttribute('aria-label', task.completed ? `Mark ${task.title} as open` : `Mark ${task.title} as completed`);

    const copy = document.createElement('div');
    const heading = document.createElement('h2');
    heading.textContent = task.title;
    const description = document.createElement('p');
    description.textContent = task.description || 'No description';
    copy.append(heading, description);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.append(
      actionButton('Edit', '', () => editTask(task)),
      actionButton('Delete', 'danger', () => deleteTask(task)),
    );

    item.append(toggle, copy, actions);
    taskList.append(item);
  }
}

async function loadTasks() {
  setStatus('Loading tasks…');
  try {
    tasks = await request('?select=id,title,description,completed&order=id.asc');
    renderTasks();
    setStatus(`${tasks.length} task${tasks.length === 1 ? '' : 's'} loaded.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function createTask(event) {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    await request('', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        completed: false,
      }),
    });
    form.reset();
    titleInput.focus();
    await loadTasks();
    setStatus('Task added.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
}

async function updateTask(id, changes) {
  setStatus('Saving changes…');
  try {
    await request(`?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(changes),
    });
    await loadTasks();
    setStatus('Task updated.');
  } catch (error) {
    setStatus(error.message, true);
  }
}

function editTask(task) {
  const title = window.prompt('Task title', task.title);
  if (title === null) return;

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    setStatus('A task title is required.', true);
    return;
  }

  const description = window.prompt('Task description', task.description || '');
  if (description === null) return;

  updateTask(task.id, { title: trimmedTitle, description: description.trim() });
}

async function deleteTask(task) {
  if (!window.confirm(`Delete “${task.title}”?`)) return;

  setStatus('Deleting task…');
  try {
    await request(`?id=eq.${encodeURIComponent(task.id)}`, { method: 'DELETE' });
    await loadTasks();
    setStatus('Task deleted.');
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function initialise() {
  try {
    const response = await fetch('config.json', { cache: 'no-store' });
    const config = await readResponse(response);
    apiUrl = config.supabaseUrl.replace(/\/$/, '');
    apiKey = config.supabasePublishableKey;

    if (!apiUrl || !apiKey?.startsWith('sb_publishable_')) {
      throw new Error('Supabase configuration is missing or invalid.');
    }

    form.addEventListener('submit', createTask);
    await loadTasks();
  } catch (error) {
    form.querySelector('button[type="submit"]').disabled = true;
    setStatus(error.message, true);
  }
}

initialise();
