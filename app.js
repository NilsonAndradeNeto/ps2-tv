(function () {
  var ui = document.getElementById('ui');
  var pick = document.getElementById('pick');
  var full = document.getElementById('full');
  var statusEl = document.getElementById('status');
  var playing = false;

  function setStatus(msg, err) {
    statusEl.textContent = msg;
    statusEl.className = err ? 'err' : '';
  }

  function fileInput() {
    return document.querySelector('#root input[type=file]');
  }

  function goFullscreen() {
    var el = document.documentElement;
    try {
      var p = (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function isFull() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  // TV não tem F11: qualquer tecla do controle remoto, clique ou toque
  // coloca em tela cheia (o navegador exige um gesto do usuário).
  ['keydown', 'pointerdown', 'mousedown', 'touchstart', 'click'].forEach(function (t) {
    window.addEventListener(t, function () { if (!isFull()) goFullscreen(); }, true);
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

  // Verifica suporte
  if (typeof WebAssembly === 'undefined') {
    setStatus('Este navegador não suporta WebAssembly. Instale o Chrome ou outro navegador atualizado na TV.', true);
  } else if (!window.crossOriginIsolated) {
    // O coi-serviceworker recarrega a página sozinho na primeira visita.
    setStatus('Preparando o navegador… (se esta mensagem não sumir, o navegador da TV não é compatível: use Chrome atualizado)');
  }

  // Espera a UI do Play!.js aparecer (input de arquivo = emulador pronto)
  var readyTimer = setInterval(function () {
    var inp = fileInput();
    if (!inp) return;
    clearInterval(readyTimer);
    setStatus('Emulador pronto. Escolha o jogo.');
    inp.setAttribute('accept', '.iso,.cso,.chd,.isz,.bin,.elf');
    inp.addEventListener('change', function () {
      if (!inp.files || !inp.files.length) return;
      var f = inp.files[0];
      setStatus('Iniciando ' + f.name + '…');
      playing = true;
      try { history.pushState({ game: 1 }, ''); } catch (e) {}
      setTimeout(hideMenu, 400);
    });
  }, 300);

  pick.addEventListener('click', function () {
    var inp = fileInput();
    if (!inp) { setStatus('Aguarde, o emulador ainda está carregando…'); return; }
    goFullscreen();
    inp.click();
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
