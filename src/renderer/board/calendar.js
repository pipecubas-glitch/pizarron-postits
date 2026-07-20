const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const grid = document.getElementById('calendar-grid');
const title = document.getElementById('calendar-title');
const dayPanel = document.getElementById('day-tasks-panel');
const prevBtn = document.getElementById('prev-month-btn');
const nextBtn = document.getElementById('next-month-btn');

let notes = [];
let currentMonth = new Date();
currentMonth.setDate(1);
let selectedDay = null;
let callbacks = {};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function notesForDay(dateStr) {
  return notes.filter((n) => n.due_date === dateStr);
}

export function initCalendar(handlers) {
  callbacks = handlers;
  prevBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    render();
  });
  nextBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    render();
  });
  render();
}

export function setNotes(newNotes) {
  notes = newNotes;
  render();
}

function render() {
  title.textContent = `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  grid.innerHTML = '';

  DAY_NAMES.forEach((d) => {
    const head = document.createElement('div');
    head.className = 'calendar-day-name';
    head.textContent = d;
    grid.appendChild(head);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = isoDate(new Date());

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-cell empty';
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = isoDate(new Date(year, month, day));
    const dayTasks = notesForDay(dateStr);
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (dateStr === todayStr) cell.classList.add('today');
    if (dateStr === selectedDay) cell.classList.add('selected');

    cell.innerHTML = `
      <span class="calendar-day-number">${day}</span>
      ${dayTasks.length ? `<span class="calendar-task-count">${dayTasks.length}</span>` : ''}
    `;
    cell.addEventListener('click', () => openDay(dateStr));
    grid.appendChild(cell);
  }

  if (selectedDay && !dayPanel.classList.contains('hidden')) {
    openDay(selectedDay);
  }
}

function openDay(dateStr) {
  selectedDay = dateStr;
  const dayTasks = notesForDay(dateStr);
  dayPanel.classList.remove('hidden');
  dayPanel.innerHTML = `
    <div class="day-tasks-header">
      <h3>${dateStr}</h3>
      <button id="close-day-panel" title="Cerrar">✕</button>
    </div>
    <div class="day-tasks-list"></div>
    <form id="new-task-form">
      <input type="text" id="new-task-input" placeholder="Nueva tarea..." required />
      <button type="submit">Agregar</button>
    </form>
  `;

  const list = dayPanel.querySelector('.day-tasks-list');
  if (dayTasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'day-tasks-empty';
    empty.textContent = 'Sin tareas para este día.';
    list.appendChild(empty);
  }
  dayTasks.forEach((task) => {
    const item = document.createElement('div');
    item.className = 'day-task-item';
    item.innerHTML = `
      <span class="day-task-text ${task.claimed_by ? 'done' : ''}">${escapeHtml(task.text || '(sin texto)')}</span>
      <small class="day-task-claim">${task.claimed_by ? `Tomado por ${escapeHtml(task.claimed_by)}` : ''}</small>
      <button class="claim-toggle">${task.claimed_by ? 'Liberar' : 'Tomar'}</button>
      <button class="delete-task" title="Borrar">✕</button>
    `;
    item.querySelector('.claim-toggle').addEventListener('click', () => callbacks.onToggleClaim(task));
    item.querySelector('.delete-task').addEventListener('click', () => callbacks.onDeleteTask(task));
    list.appendChild(item);
  });

  dayPanel.querySelector('#close-day-panel').addEventListener('click', () => {
    selectedDay = null;
    dayPanel.classList.add('hidden');
  });

  dayPanel.querySelector('#new-task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = dayPanel.querySelector('#new-task-input');
    const text = input.value.trim();
    if (!text) return;
    callbacks.onCreateTask({ text, due_date: dateStr });
    input.value = '';
  });
}
