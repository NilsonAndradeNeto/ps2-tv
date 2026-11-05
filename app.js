(function () {
  var ui = document.getElementById('ui');
  var pick = document.getElementById('pick');   // input de arquivo real (visível sob o botão)
  var full = document.getElementById('full');
  var statusEl = document.getElementById('status');
  var playing = false;
  var emuInput = null;                          // input de arquivo do Play!.js (escondido)

  function setStatus(msg, err) {
    statusEl.textContent = msg;
    statusEl.className = err ? 'err' : '';
  }

  function isFull() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function goFullscreen() {
    var el = document.documentElement;
    try {
      var p = (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  // TV não tem F11: qualquer tecla do controle remoto, clique ou toque coloca em
  // tela cheia. Não mexe quando o gesto é no seletor de arquivo, pra não atrapalhar.
  ['keydown', 'pointerdown', 'mousedown', 'touchstart', 'click'].forEach(function (t) {
    window.addEventListener(t, function (e) {
      if (e.target === pick || (e.target && e.target.id === 'pickwrap')) return;
      if (!isFull()) goFullscreen();
    }, true);
  });
  document.addEventListener('fullscreenchange', function () {
    document.getElementById('hint').textContent = isFull() ? 'Voltar: menu' : 'Aperte qualquer botão do controle remoto para tela cheia';
  });

  function showMenu() {
    ui.classList.remove('hidden');
    pick.focus();
  }

  function hideMenu() {
    ui.classList.add('hidden');
    var c = document.getElementById('outputCanvas');
    if (c) c.focus();
  }

  if (typeof WebAssembly === 'undefined') {
    setStatus('Este navegador não suporta WebAssembly. Instale Chrome, Kiwi ou TV Bro na TV.', true);
  } else if (!window.crossOriginIsolated) {
    setStatus('Preparando o navegador… (se esta mensagem não sumir, o navegador da TV não é compatível: use Chrome, Kiwi ou TV Bro)');
  }

  // Espera o Play!.js ficar pronto (ele cria o input de arquivo dele)
  var readyTimer = setInterval(function () {
    var inp = document.querySelector('#root input[type=file]');
    if (!inp) return;
    clearInterval(readyTimer);
    emuInput = inp;
    setStatus('Emulador pronto. Escolha o jogo.');
    if (pendingFile) bootFile(pendingFile);
  }, 300);

  var pendingFile = null;

  // Entrega o arquivo escolhido para o Play!.js
  function bootFile(f) {
    if (!emuInput) {
      pendingFile = f;
      setStatus('Arquivo escolhido: ' + f.name + '. Aguardando o emulador terminar de carregar…');
      return;
    }
    pendingFile = null;
    try {
      var dt = new DataTransfer();
      dt.items.add(f);
      emuInput.files = dt.files;
      emuInput.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      setStatus('Este navegador não deixou passar o arquivo para o emulador (' + e.message + '). Use Chrome, Kiwi ou TV Bro.', true);
      return;
    }
    setStatus('Iniciando ' + f.name + '…');
    playing = true;
    try { history.pushState({ game: 1 }, ''); } catch (e) {}
    setTimeout(function () { hideMenu(); goFullscreen(); }, 400);
  }

  pick.addEventListener('change', function () {
    if (pick.files && pick.files.length) bootFile(pick.files[0]);
  });

  full.addEventListener('click', function () {
    goFullscreen();
    if (playing) hideMenu();
  });

  // Botão Voltar da TV / Esc abre o menu em vez de sair da página
  window.addEventListener('popstate', function () {
    if (!playing) return;
    showMenu();
    try { history.pushState({ game: 1 }, ''); } catch (e) {}
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && playing) {
      if (ui.classList.contains('hidden')) showMenu(); else hideMenu();
    }
  });

  window.__psTvMenuVisible = function () { return !ui.classList.contains('hidden'); };
  window.__psTvMenuButtons = function () { return [pick, full]; };
})();
