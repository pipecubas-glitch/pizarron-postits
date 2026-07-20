console.log('[bubble] script cargado, window.pizarron =', window.pizarron);

const bubble = document.getElementById('bubble');

let dragging = false;
let lastX = 0;
let lastY = 0;
let totalMove = 0;
const CLICK_THRESHOLD = 6;

bubble.addEventListener('mousedown', (e) => {
  dragging = true;
  lastX = e.screenX;
  lastY = e.screenY;
  totalMove = 0;
  console.log('[bubble] mousedown');
});

window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const dx = e.screenX - lastX;
  const dy = e.screenY - lastY;
  lastX = e.screenX;
  lastY = e.screenY;
  totalMove += Math.abs(dx) + Math.abs(dy);
  window.pizarron.moveBubbleBy(dx, dy);
});

window.addEventListener('mouseup', () => {
  console.log('[bubble] mouseup totalMove=', totalMove);
  if (dragging && totalMove < CLICK_THRESHOLD) {
    console.log('[bubble] considerado click, llamando toggleBoard');
    window.pizarron.toggleBoard();
  }
  dragging = false;
});
