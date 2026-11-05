// Ponte Controle (Gamepad API) -> teclado do Play!.js
// Teclas do Play!.js: D-pad=setas, Analógico esq=F/H/T/G, Analógico dir=J/L/I/K,
// Quadrado=A, X=Z, Triângulo=S, Bola=X, Start=Enter, Select=Backspace,
// L1=1, L2=2, L3=3, R1=8, R2=9, R3=0
(function () {
  function k(code, key, keyCode) { return { code: code, key: key, keyCode: keyCode }; }
  var KEYS = {
    cross: k('KeyZ', 'z', 90), circle: k('KeyX', 'x', 88), square: k('KeyA', 'a', 65), triangle: k('KeyS', 's', 83),
    l1: k('Digit1', '1', 49), l2: k('Digit2', '2', 50), l3: k('Digit3', '3', 51),
    r1: k('Digit8', '8', 56), r2: k('Digit9', '9', 57), r3: k('Digit0', '0', 48),
    select: k('Backspace', 'Backspace', 8), start: k('Enter', 'Enter', 13),
    up: k('ArrowUp', 'ArrowUp', 38), down: k('ArrowDown', 'ArrowDown', 40),
    left: k('ArrowLeft', 'ArrowLeft', 37), right: k('ArrowRight', 'ArrowRight', 39),
    lsLeft: k('KeyF', 'f', 70), lsRight: k('KeyH', 'h', 72), lsUp: k('KeyT', 't', 84), lsDown: k('KeyG', 'g', 71),
    rsLeft: k('KeyJ', 'j', 74), rsRight: k('KeyL', 'l', 76), rsUp: k('KeyI', 'i', 73), rsDown: k('KeyK', 'k', 75)
  };
  // Layout "standard" da Gamepad API (Xbox/PS/genéricos no Chrome)
  var BUTTONS = ['cross', 'circle', 'square', 'triangle', 'l1', 'r1', 'l2', 'r2',
                 'select', 'start', 'l3', 'r3', 'up', 'down', 'left', 'right'];
  var DEAD = 0.45;
  var state = {};

  function target() { return document.getElementById('outputCanvas') || window; }

  function send(name, down) {
    if (!!state[name] === down) return;
    state[name] = down;
    var d = KEYS[name];
    var ev = new KeyboardEvent(down ? 'keydown' : 'keyup', {
      key: d.key, code: d.code, bubbles: true, cancelable: true
    });
    try {
      Object.defineProperty(ev, 'keyCode', { get: function () { return d.keyCode; } });
      Object.defineProperty(ev, 'which', { get: function () { return d.keyCode; } });
    } catch (e) {}
    target().dispatchEvent(ev);
  }

  function releaseAll() { Object.keys(state).forEach(function (n) { send(n, false); }); }

  // Navegação do menu pelo controle
  var menuPrev = {};
  function menuNav(gp) {
    var btns = window.__psTvMenuButtons ? window.__psTvMenuButtons() : [];
    if (!btns.length) return;
    var idx = btns.indexOf(document.activeElement);
    function edge(i) { var p = !!(gp.buttons[i] && gp.buttons[i].pressed); var r = p && !menuPrev[i]; menuPrev[i] = p; return r; }
    var ax = gp.axes[0] || 0;
    var right = edge(15) || (ax > DEAD && !menuPrev.ax && (menuPrev.ax = 1));
    var left = edge(14) || (ax < -DEAD && !menuPrev.ax && (menuPrev.ax = 1));
    if (Math.abs(ax) < DEAD) menuPrev.ax = 0;
    if (right) btns[(idx + 1 + btns.length) % btns.length].focus();
    if (left) btns[(idx - 1 + btns.length) % btns.length].focus();
    if (edge(0) || edge(9)) (document.activeElement && btns.indexOf(document.activeElement) >= 0 ? document.activeElement : btns[0]).click();
  }

  var padEl, lastId = '';
  function loop() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var gp = null;
    for (var i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) { gp = pads[i]; break; }

    padEl = padEl || document.getElementById('pad');
    var id = gp ? gp.id : '';
    if (padEl && id !== lastId) {
      lastId = id;
      padEl.textContent = gp ? 'Controle conectado: ' + gp.id : 'Controle: nenhum detectado. Aperte qualquer botão do controle.';
    }

    if (gp) {
      if (window.__psTvMenuVisible && window.__psTvMenuVisible()) {
        releaseAll();
        menuNav(gp);
      } else {
        menuPrev = {};
        for (var b = 0; b < BUTTONS.length; b++) {
          var btn = gp.buttons[b];
          var pressed = !!btn && (btn.pressed || btn.value > 0.3);
          send(BUTTONS[b], pressed);
        }
        var a = gp.axes;
        send('lsLeft', (a[0] || 0) < -DEAD); send('lsRight', (a[0] || 0) > DEAD);
        send('lsUp', (a[1] || 0) < -DEAD);   send('lsDown', (a[1] || 0) > DEAD);
        send('rsLeft', (a[2] || 0) < -DEAD); send('rsRight', (a[2] || 0) > DEAD);
        send('rsUp', (a[3] || 0) < -DEAD);   send('rsDown', (a[3] || 0) > DEAD);
      }
    } else {
      releaseAll();
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener('gamepadconnected', function () {});
  window.addEventListener('blur', releaseAll);
  requestAnimationFrame(loop);
})();
