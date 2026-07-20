const { contextBridge, ipcRenderer } = require('electron');
const { getClient } = require('../shared/supabaseClient');
const config = require('../shared/config');

const supabase = getClient();

async function listNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

async function createNote(note) {
  const { data, error } = await supabase.from('notes').insert(note).select().single();
  if (error) throw error;
  return data;
}

async function updateNote(id, changes) {
  const { data, error } = await supabase.from('notes').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

function subscribeToNotes(onChange) {
  const channel = supabase
    .channel('notes-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (payload) => {
      onChange(payload);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

contextBridge.exposeInMainWorld('pizarron', {
  teamNames: config.teamNames,
  noteColors: config.noteColors,
  toggleBoard: () => ipcRenderer.send('toggle-board'),
  moveBubbleBy: (dx, dy) => ipcRenderer.send('bubble-move-by', { dx, dy }),
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  subscribeToNotes,
});
