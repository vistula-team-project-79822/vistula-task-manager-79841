const form = document.querySelector('#task-form');
const titleInput = document.querySelector('#task-title');
const descriptionInput = document.querySelector('#task-description');
const submitButton = document.querySelector('#task-submit');
const taskList = document.querySelector('#task-list');
const statusElement = document.querySelector('#status-message');

let apiUrl;
let apiKey;
let tableName;
let tasks = [];
let editingTaskId = null;

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

  const response = await fetch(`${apiUrl}/rest/v1/${tableName}${path}`, {
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
    item.className = `task-item${task.completed ? ' completed' : ''}`;
    item.dataset.id = task.id;

    const toggle = actionButton(task.completed ? '✓' : '○', 'toggle toggle-task', () => {
      updateTask(task.id, { completed: !task.completed });
    });
    toggle.setAttribute('aria-label', task.completed ? `Mark ${task.title} as open` : `Mark ${task.title} as completed`);

    const copy = document.createElement('div');
    const heading = document.createElement('h2');
    heading.className = 'task-title';
    heading.textContent = task.title;
    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = task.description || 'No description';
    const taskStatus = document.createElement('p');
    taskStatus.className = 'task-status';
    taskStatus.textContent = task.completed ? 'Completed' : 'Open';
    copy.append(heading, description, taskStatus);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.append(
      actionButton('Edit', 'edit-task', () => startEditing(task)),
      actionButton('Delete', 'danger delete-task', () => deleteTask(task)),
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
  submitButton.disabled = true;

  try {
    const task = {
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      completed: editingTaskId === null
        ? false
        : Boolean(tasks.find(({ id }) => id === editingTaskId)?.completed),
    };

    await request(editingTaskId === null ? '' : `?id=eq.${encodeURIComponent(editingTaskId)}`, {
      method: editingTaskId === null ? 'POST' : 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(task),
    });
    const wasEditing = editingTaskId !== null;
    editingTaskId = null;
    form.reset();
    submitButton.textContent = 'Add task';
    titleInput.focus();
    await loadTasks();
    setStatus(wasEditing ? 'Task updated.' : 'Task added.');
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

function startEditing(task) {
  editingTaskId = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description || '';
  submitButton.textContent = 'Save task';
  titleInput.focus();
  setStatus(`Editing “${task.title}”.`);
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
    tableName = config.tableName;

    if (!apiUrl || !apiKey?.startsWith('sb_publishable_') || tableName !== 'tasks') {
      throw new Error('Supabase configuration is missing or invalid.');
    }

    form.addEventListener('submit', createTask);
    await loadTasks();
  } catch (error) {
    submitButton.disabled = true;
    setStatus(error.message, true);
  }
}

initialise();
