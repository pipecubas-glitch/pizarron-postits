import * as calendar from './calendar.js';

const USER_KEY = 'pizarron_user_name';
const SAVE_DEBOUNCE_MS = 600;

const el = {
  nameScreen: document.getElementById('name-screen'),
  nameButtons: document.getElementById('name-buttons'),
  app: document.getElementById('app'),
  currentUserLabel: document.getElementById('current-user-label'),
  changeUserBtn: document.getElementById('change-user-btn'),
  canvas: document.getElementById('canvas'),
  addNoteBtn: document.getElementById('add-note-btn'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),
};

let currentUser = localStorage.getItem(USER_KEY);
let notes = [];
let saveTimers = new Map();
let drag = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Identidad ---

function renderNameButtons() {
  el.nameButtons.innerHTML = '';
  window.pizarron.teamNames.forEach((name) => {
    const btn = document.createElement('button');
    btn.className = 'name-btn';
    btn.textContent = name;
    btn.addEventListener('click', () => selectUser(name));
    el.nameButtons.appendChild(btn);
  });
}

function selectUser(name) {
  currentUser = name;
  localStorage.setItem(USER_KEY, name);
  showApp();
}

function showApp() {
  el.nameScreen.classList.add('hidden');
  el.app.classList.remove('hidden');
  el.currentUserLabel.textContent = currentUser;
  loadNotesAndSubscribe();
}

function showNameScreen() {
  el.app.classList.add('hidden');
  el.nameScreen.classList.remove('hidden');
  renderNameButtons();
}

el.changeUserBtn.addEventListener('click', () => {
  localStorage.removeItem(USER_KEY);
  currentUser = null;
  showNameScreen();
});

// --- Tabs ---

el.tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    el.tabButtons.forEach((b) => b.classList.remove('active'));
    el.tabPanels.forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// --- Datos / tiempo real ---

function upsertNote(note) {
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) notes[idx] = note;
  else notes.push(note);
}

function removeNoteById(id) {
  notes = notes.filter((n) => n.id !== id);
}

async function loadNotesAndSubscribe() {
  notes = await window.pizarron.listNotes();
  notes.forEach(renderNoteDom);
  calendar.setNotes(notes);

  window.pizarron.subscribeToNotes((payload) => {
    if (payload.eventType === 'DELETE') {
      removeNoteById(payload.old.id);
      const domEl = document.getElementById(`note-${payload.old.id}`);
      if (domEl) domEl.remove();
    } else {
      upsertNote(payload.new);
      renderNoteDom(payload.new);
    }
    calendar.setNotes(notes);
  });
}

function randomColor() {
  const colors = window.pizarron.noteColors;
  return colors[Math.floor(Math.random() * colors.length)];
}

// --- Canvas de notas ---

el.addNoteBtn.addEventListener('click', async () => {
  const canvasRect = el.canvas.getBoundingClientRect();
  const note = await window.pizarron.createNote({
    text: '',
    color: randomColor(),
    x: Math.round(20 + Math.random() * Math.max(canvasRect.width - 220, 40)),
    y: Math.round(20 + Math.random() * Math.max(canvasRect.height - 200, 40)),
    created_by: currentUser,
  });
  upsertNote(note);
  renderNoteDom(note, { focusText: true });
});

function renderNoteDom(note, opts = {}) {
  let noteEl = document.getElementById(`note-${note.id}`);
  const isNew = !noteEl;
  if (isNew) {
    noteEl = document.createElement('div');
    noteEl.id = `note-${note.id}`;
    noteEl.className = 'note';
    el.canvas.appendChild(noteEl);
  }

  noteEl.style.left = `${note.x}px`;
  noteEl.style.top = `${note.y}px`;
  noteEl.style.background = note.color || '#fff59d';
  noteEl.classList.toggle('claimed', !!note.claimed_by);

  const claimLabel = note.claimed_by
    ? (note.claimed_by === currentUser ? 'Liberar' : `Tomado por ${escapeHtml(note.claimed_by)}`)
    : 'Tomar';
  const claimDisabled = note.claimed_by && note.claimed_by !== currentUser ? 'disabled' : '';

  const textarea = noteEl.querySelector('.note-text');
  const textareaHasFocus = textarea === document.activeElement;

  noteEl.innerHTML = `
    <div class="note-header">
      <span class="note-author">${escapeHtml(note.created_by || '')}</span>
      <button class="note-delete" title="Borrar">✕</button>
    </div>
    <textarea class="note-text" placeholder="Escribí la tarea..."></textarea>
    <div class="note-footer">
      <button class="note-claim-btn" ${claimDisabled}>${claimLabel}</button>
    </div>
  `;

  const newTextarea = noteEl.querySelector('.note-text');
  if (!textareaHasFocus) {
    newTextarea.value = note.text || '';
  } else {
    newTextarea.value = textarea.value;
    newTextarea.focus();
  }

  attachNoteEvents(noteEl, note.id);

  if (opts.focusText) {
    newTextarea.focus();
  }
}

function attachNoteEvents(noteEl, noteId) {
  const header = noteEl.querySelector('.note-header');
  const textarea = noteEl.querySelector('.note-text');
  const deleteBtn = noteEl.querySelector('.note-delete');
  const claimBtn = noteEl.querySelector('.note-claim-btn');

  header.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    startDrag(e, noteEl, noteId);
  });

  textarea.addEventListener('input', () => {
    clearTimeout(saveTimers.get(noteId));
    const value = textarea.value;
    saveTimers.set(
      noteId,
      setTimeout(() => {
        window.pizarron.updateNote(noteId, { text: value });
      }, SAVE_DEBOUNCE_MS)
    );
  });

  deleteBtn.addEventListener('click', () => {
    if (confirm('¿Borrar esta nota?')) {
      window.pizarron.deleteNote(noteId);
    }
  });

  claimBtn.addEventListener('click', () => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    if (note.claimed_by && note.claimed_by !== currentUser) return;
    if (note.claimed_by === currentUser) {
      window.pizarron.updateNote(noteId, { claimed_by: null, claimed_at: null });
    } else {
      window.pizarron.updateNote(noteId, { claimed_by: currentUser, claimed_at: new Date().toISOString() });
    }
  });
}

function startDrag(e, noteEl, noteId) {
  const canvasRect = el.canvas.getBoundingClientRect();
  const noteRect = noteEl.getBoundingClientRect();
  drag = {
    noteId,
    noteEl,
    offsetX: e.clientX - noteRect.left,
    offsetY: e.clientY - noteRect.top,
  };
  noteEl.classList.add('dragging');
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd, { once: true });

  function onDragMove(moveEvent) {
    if (!drag) return;
    const x = moveEvent.clientX - canvasRect.left - drag.offsetX;
    const y = moveEvent.clientY - canvasRect.top - drag.offsetY;
    drag.noteEl.style.left = `${Math.max(0, x)}px`;
    drag.noteEl.style.top = `${Math.max(0, y)}px`;
  }

  function onDragEnd() {
    window.removeEventListener('pointermove', onDragMove);
    if (!drag) return;
    drag.noteEl.classList.remove('dragging');
    const x = parseFloat(drag.noteEl.style.left) || 0;
    const y = parseFloat(drag.noteEl.style.top) || 0;
    window.pizarron.updateNote(drag.noteId, { x, y });
    drag = null;
  }
}

// --- Calendario ---

calendar.initCalendar({
  onCreateTask: async ({ text, due_date }) => {
    const note = await window.pizarron.createNote({
      text,
      color: randomColor(),
      x: 20,
      y: 20,
      created_by: currentUser,
      due_date,
    });
    upsertNote(note);
    renderNoteDom(note);
    calendar.setNotes(notes);
  },
  onToggleClaim: (task) => {
    if (task.claimed_by && task.claimed_by !== currentUser) return;
    if (task.claimed_by === currentUser) {
      window.pizarron.updateNote(task.id, { claimed_by: null, claimed_at: null });
    } else {
      window.pizarron.updateNote(task.id, { claimed_by: currentUser, claimed_at: new Date().toISOString() });
    }
  },
  onDeleteTask: (task) => {
    if (confirm('¿Borrar esta tarea?')) {
      window.pizarron.deleteNote(task.id);
    }
  },
});

// --- Inicio ---

if (currentUser) {
  showApp();
} else {
  showNameScreen();
}
