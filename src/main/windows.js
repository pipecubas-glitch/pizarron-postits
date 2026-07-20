const { BrowserWindow } = require('electron');
const path = require('path');

function createBubbleWindow(preloadPath) {
  const win = new BrowserWindow({
    width: 72,
    height: 72,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Nivel máximo de "always on top" y visible incluso sobre apps en pantalla
  // completa / al cambiar de Space, que es el requisito central de la burbuja.
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, '../renderer/bubble/bubble.html'));
  return win;
}

function createBoardWindow(preloadPath) {
  const win = new BrowserWindow({
    width: 1150,
    height: 780,
    minWidth: 800,
    minHeight: 560,
    show: false,
    title: 'Pizarrón de la oficina',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, '../renderer/board/board.html'));
  return win;
}

module.exports = { createBubbleWindow, createBoardWindow };
