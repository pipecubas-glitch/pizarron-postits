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
  if (dragging && totalMove < CLICK_THRESHOLD) {
    window.pizarron.toggleBoard();
  }
  dragging = false;
});
