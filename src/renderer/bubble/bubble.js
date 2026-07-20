console.log('[bubble] script cargado, window.pizarron =', window.pizarron);

const bubble = document.getElementById('bubble');

let downTime = 0;
let downX = 0;
let downY = 0;

bubble.addEventListener('mousedown', (e) => {
  downTime = Date.now();
  downX = e.screenX;
  downY = e.screenY;
  console.log('[bubble] mousedown');
});

bubble.addEventListener('mouseup', (e) => {
  const elapsed = Date.now() - downTime;
  const dist = Math.abs(e.screenX - downX) + Math.abs(e.screenY - downY);
  console.log('[bubble] mouseup elapsed=', elapsed, 'dist=', dist);
  if (elapsed < 400 && dist < 6) {
    console.log('[bubble] considerado click, llamando toggleBoard');
    window.pizarron.toggleBoard();
  }
});
