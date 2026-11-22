// --- Tasks Drawer (CRUD, Search, Filter, Sort) ---
let tasks = JSON .parse(localStorage.getItem('focus_studio_tasks')) || [];

const tasksPanel = document.getElementById('tasksPanel');
const tasksToggleBtn = document.getElementById('tasksToggleBtn');
const closeTasksBtn = document.getElementById('closeTasksBtn');
const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskPriority = document.getElementById('taskPriority');
const taskPomodoros = document.getElementById('taskPomodoros');
const taskTag = document.getElementById('taskTag');
const taskList = document.getElementById('taskList');
const taskStats = document.getElementById('taskStats');
const emptyState = document.getElementById('emptyState');

const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const sortBy = document.getElementById('sortBy');

function saveTasks() {
  localStorage.setItem('focus_studio_tasks', JSON.stringify(tasks));
  renderTasks();
}

function renderTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const priority = priorityFilter.value;
  const sort = sortBy.value;
  const weights = { high: 3, medium: 2, low: 1};

  const filtered = tasks.filter(task => {
    const matchText = task.title.toLowerCase().includes(query) || task.tag.toLowerCase().includes(query);
    const matchStatus = status === 'all' || (status === 'completed' ? task.completed : !task.completed);
    const matchPriority = priority === 'all' || task.priority === priority;
    return matchText && matchStatus && matchPriority;
  });

  filtered.sort((a, b) => {
    if (sort === 'priority') return weights[b.priority] - weights[a.priority];
    if (sort === 'pomodoros') return b.pomodoros - a.pomodoros;
    return b.createdAt - a.createdAt;
  });

  const doneCount = tasks.filter(t => t.completed).length;
  taskStats.textContent = `${doneCount} / ${tasks.length}`;

  taskList.innerHTML = '';
  emptyState.textContent = tasks.length === 0 ? 'No tasks yet. Add one above.' : 'No matching tasks.';
  emptyState.classList.toggle('hidden', filtered.length > 0);

  filtered.forEach(task => {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'completed' : ''}`;

    const left = document.createElement('div');
    left.className = 'task-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveTasks();
    });

    const info = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `${task.priority} | ${task.pomodoros} sessions${task.tag ? ' |#' + task.tag : ''}`;

    info.append(title, meta);
    left.append(checkbox, info);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
    });

    item.append(left, delBtn);
    taskList.appendChild(item);
  });
}

tasksToggleBtn.addEventListener('click', () => tasksPanel.classList.toggle('hidden'));
closeTasksBtn.addEventListener('click', () => tasksPanel.classList.add('hidden'));

taskForm.addEventListener('submit' , e => {
  e.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) return;

  tasks.unshift({
    id: Date.now(),
    title,
    priority: taskPriority.value,
    pomodoros: Number(taskPomodoros.value),
    tag: taskTag.value.trim(),
    completed: false,
    createdAt: Date.now()
  });

  taskTitle.value = '';
  taskTag.value = '';
  saveTasks();
});

[searchInput, statusFilter, priorityFilter, sortBy].forEach(el => {
  el.addEventListener('input', renderTasks);
});

renderTasks();

