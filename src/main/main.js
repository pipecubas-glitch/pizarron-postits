const { app, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { createBubbleWindow, createBoardWindow } = require('./windows');

// Evita que Chromium muestre su cartel de "Traducir esta página" (el
// contenido está en español), que en la burbuja tapaba todo el círculo.
app.commandLine.appendSwitch('disable-features', 'Translate,TranslateUI');

const STATE_FILE = path.join(app.getPath('userData'), 'bubble-position.json');

let bubbleWindow = null;
let boardWindow = null;
let isQuitting = false;

function loadBubblePosition() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function saveBubblePosition(pos) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(pos));
  } catch (err) {
    console.error('No se pudo guardar la posición de la burbuja:', err);
  }
}

app.whenReady().then(() => {
  const preloadPath = path.join(__dirname, '../preload/preload.js');

  bubbleWindow = createBubbleWindow(preloadPath);
  boardWindow = createBoardWindow(preloadPath);
  bubbleWindow.webContents.on('console-message', (event, level, message) => {
    console.log('[bubble-console]', message);
  });

  const savedPos = loadBubblePosition();
  if (savedPos) {
    bubbleWindow.setPosition(savedPos.x, savedPos.y);
  } else {
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    bubbleWindow.setPosition(width - 120, 120);
  }

  bubbleWindow.on('moved', () => {
    const [x, y] = bubbleWindow.getPosition();
    saveBubblePosition({ x, y });
  });

  boardWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      boardWindow.hide();
    }
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  ipcMain.on('toggle-board', () => {
    console.log('[main] toggle-board recibido');
    if (boardWindow.isVisible()) {
      boardWindow.hide();
    } else {
      boardWindow.show();
      boardWindow.focus();
    }
  });

  app.on('activate', () => {
    if (!boardWindow.isVisible()) {
      boardWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // La burbuja debe seguir viva; no cerramos la app al cerrar el pizarrón.
  // (En macOS tampoco se cierra por convención al cerrar ventanas.)
});
