(() => {
  'use strict';

  const state = {
    data: structuredClone(window.ATHENA_ZOOM_DATA),
    currentIndex: 0,
    currentNodeId: null,
    panelOpen: false,
    overview: false
  };

  const el = {
    title: document.getElementById('projectTitle'),
    subtitle: document.getElementById('projectSubtitle'),
    viewport: document.getElementById('viewport'),
    canvas: document.getElementById('canvas'),
    panel: document.getElementById('sidePanel'),
    panelKicker: document.getElementById('panelKicker'),
    panelTitle: document.getElementById('panelTitle'),
    panelBody: document.getElementById('panelBody'),
    panelMedia: document.getElementById('panelMedia'),
    panelActions: document.getElementById('panelActions'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    btnOverview: document.getElementById('btnOverview'),
    btnTeacher: document.getElementById('btnTeacher'),
    btnHelp: document.getElementById('btnHelp'),
    closePanel: document.getElementById('closePanel'),
    progressLabel: document.getElementById('progressLabel'),
    progressBar: document.getElementById('progressBar'),
    teacherDialog: document.getElementById('teacherDialog'),
    helpDialog: document.getElementById('helpDialog'),
    btnExport: document.getElementById('btnExport'),
    fileImport: document.getElementById('fileImport'),
    jsonPreview: document.getElementById('jsonPreview')
  };

  const nodeById = () => new Map(state.data.nodes.map(n => [n.id, n]));

  function init() {
    el.title.textContent = state.data.title || 'AthenaZoom';
    el.subtitle.textContent = state.data.subtitle || 'Lavagna narrativa zoomabile';
    renderCanvas();
    const start = state.data.startNode || state.data.path?.[0] || state.data.nodes[0]?.id;
    state.currentIndex = Math.max(0, (state.data.path || []).indexOf(start));
    goToNode(start, { openPanel: false });
    bindEvents();
    updateJsonPreview();
    registerServiceWorker();
  }

  function renderCanvas() {
    el.canvas.innerHTML = '';
    renderEdges();
    const path = state.data.path || [];
    for (const node of state.data.nodes) {
      const button = document.createElement('button');
      button.className = `node ${node.type === 'center' ? 'center' : ''}`;
      button.id = `node-${node.id}`;
      button.type = 'button';
      button.style.left = `${node.x}px`;
      button.style.top = `${node.y}px`;
      button.style.rotate = `${node.rotate || 0}deg`;
      button.dataset.nodeId = node.id;
      const step = path.indexOf(node.id) + 1;
      button.innerHTML = `
        ${step > 0 ? `<span class="step-badge">${step}</span>` : ''}
        <div class="icon" aria-hidden="true">${escapeHtml(node.icon || '•')}</div>
        <h3>${escapeHtml(node.title || 'Nodo')}</h3>
        <p>${escapeHtml(node.subtitle || '')}</p>
      `;
      button.addEventListener('click', () => {
        const index = path.indexOf(node.id);
        if (index >= 0) state.currentIndex = index;
        goToNode(node.id, { openPanel: true });
      });
      el.canvas.appendChild(button);
    }
  }

  function renderEdges() {
    const map = nodeById();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'edge-layer');
    svg.setAttribute('width', '5000');
    svg.setAttribute('height', '3200');
    svg.setAttribute('viewBox', '0 0 5000 3200');

    for (const [fromId, toId] of state.data.edges || []) {
      const from = map.get(fromId);
      const to = map.get(toId);
      if (!from || !to) continue;
      const path = edgePath(from, to);
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      glow.setAttribute('class', 'edge glow');
      glow.setAttribute('d', path);
      svg.appendChild(glow);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('class', 'edge');
      line.setAttribute('d', path);
      svg.appendChild(line);
    }
    el.canvas.appendChild(svg);
  }

  function edgePath(a, b) {
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const curve = Math.min(260, Math.hypot(dx, dy) * 0.22);
    const nx = -dy / Math.max(1, Math.hypot(dx, dy));
    const ny = dx / Math.max(1, Math.hypot(dx, dy));
    return `M ${a.x} ${a.y} Q ${midX + nx * curve} ${midY + ny * curve} ${b.x} ${b.y}`;
  }

  function bindEvents() {
    el.btnPrev.addEventListener('click', previousStep);
    el.btnNext.addEventListener('click', nextStep);
    el.btnOverview.addEventListener('click', showOverview);
    el.closePanel.addEventListener('click', closePanel);
    el.btnTeacher.addEventListener('click', () => {
      updateJsonPreview();
      el.teacherDialog.showModal();
    });
    el.btnHelp.addEventListener('click', () => el.helpDialog.showModal());
    el.btnExport.addEventListener('click', exportJson);
    el.fileImport.addEventListener('change', importJson);
    window.addEventListener('resize', () => {
      if (state.overview) applyCamera(state.data.overview || defaultOverview());
      else if (state.currentNodeId) focusNode(nodeById().get(state.currentNodeId));
    });
    window.addEventListener('keydown', handleKeys);
  }

  function handleKeys(event) {
    if (event.target && ['TEXTAREA', 'INPUT'].includes(event.target.tagName)) return;
    if (event.key === 'ArrowRight' || event.key === ' ') {
      event.preventDefault(); nextStep();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault(); previousStep();
    } else if (event.key === 'Escape') {
      if (state.panelOpen) closePanel();
      else showOverview();
    }
  }

  function nextStep() {
    const path = state.data.path || [];
    if (!path.length) return;
    state.currentIndex = Math.min(path.length - 1, state.currentIndex + 1);
    goToNode(path[state.currentIndex], { openPanel: true });
  }

  function previousStep() {
    const path = state.data.path || [];
    if (!path.length) return;
    state.currentIndex = Math.max(0, state.currentIndex - 1);
    goToNode(path[state.currentIndex], { openPanel: true });
  }

  function goToNode(id, options = {}) {
    const node = nodeById().get(id);
    if (!node) return;
    state.currentNodeId = id;
    state.overview = false;
    focusNode(node);
    setActiveNode(id);
    if (options.openPanel) openPanel(node);
    updateProgress();
  }

  function focusNode(node) {
    const vw = el.viewport.clientWidth;
    const vh = el.viewport.clientHeight;
    const targetScale = node.scale || 1;
    const panelPenalty = state.panelOpen && vw > 900 ? 210 : 0;
    const x = (vw / 2 - panelPenalty) - node.x * targetScale;
    const y = vh / 2 - node.y * targetScale;
    el.canvas.style.transform = `translate(${x}px, ${y}px) scale(${targetScale}) rotate(${-(node.rotate || 0) * 0.15}deg)`;
  }

  function showOverview() {
    state.overview = true;
    closePanel();
    applyCamera(state.data.overview || defaultOverview());
    clearActiveNode();
  }

  function defaultOverview() {
    return { x: 2500, y: 1600, scale: 0.28, rotate: 0 };
  }

  function applyCamera(camera) {
    const vw = el.viewport.clientWidth;
    const vh = el.viewport.clientHeight;
    const scale = camera.scale || 0.3;
    const x = vw / 2 - (camera.x || 2500) * scale;
    const y = vh / 2 - (camera.y || 1600) * scale;
    el.canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${camera.rotate || 0}deg)`;
  }

  function setActiveNode(id) {
    clearActiveNode();
    document.getElementById(`node-${id}`)?.classList.add('active');
  }

  function clearActiveNode() {
    document.querySelectorAll('.node.active').forEach(n => n.classList.remove('active'));
  }

  function openPanel(node) {
    state.panelOpen = true;
    el.panelKicker.textContent = node.kicker || 'Approfondimento';
    el.panelTitle.textContent = node.title || '';
    el.panelBody.textContent = node.body || node.subtitle || '';
    renderMedia(node);
    renderActions(node);
    el.panel.classList.add('open');
    requestAnimationFrame(() => focusNode(node));
  }

  function closePanel() {
    state.panelOpen = false;
    el.panel.classList.remove('open');
    const node = nodeById().get(state.currentNodeId);
    if (node && !state.overview) requestAnimationFrame(() => focusNode(node));
  }

  function renderMedia(node) {
    el.panelMedia.innerHTML = '';
    if (!node.media) return;
    for (const item of node.media) {
      if (item.type === 'image' && item.src) {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || '';
        el.panelMedia.appendChild(img);
      }
      if (item.type === 'youtube' && item.src) {
        const wrap = document.createElement('div');
        wrap.className = 'embed-wrap';
        wrap.innerHTML = `<iframe src="${safeUrl(item.src)}" allowfullscreen title="${escapeHtml(item.title || 'Video')}"></iframe>`;
        el.panelMedia.appendChild(wrap);
      }
      if (item.type === 'audio' && item.src) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = item.src;
        el.panelMedia.appendChild(audio);
      }
    }
  }

  function renderActions(node) {
    el.panelActions.innerHTML = '';
    for (const action of node.actions || []) {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = action.label || 'Apri';
      a.addEventListener('click', event => {
        event.preventDefault();
        if (action.target) {
          const path = state.data.path || [];
          const idx = path.indexOf(action.target);
          if (idx >= 0) state.currentIndex = idx;
          goToNode(action.target, { openPanel: true });
        } else if (action.href) {
          window.open(action.href, '_blank', 'noopener,noreferrer');
        }
      });
      el.panelActions.appendChild(a);
    }
  }

  function updateProgress() {
    const total = (state.data.path || []).length;
    const current = total ? state.currentIndex + 1 : 0;
    el.progressLabel.textContent = `${current} / ${total}`;
    el.progressBar.style.width = total ? `${(current / total) * 100}%` : '0%';
    el.btnPrev.disabled = current <= 1;
    el.btnNext.disabled = current >= total;
  }

  function updateJsonPreview() {
    el.jsonPreview.value = JSON.stringify(state.data, null, 2);
  }

  function exportJson() {
    updateJsonPreview();
    const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(state.data.title || 'athenazoom')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function importJson(event) {
    const [file] = event.target.files || [];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      validateData(parsed);
      state.data = parsed;
      state.currentIndex = 0;
      state.currentNodeId = null;
      state.panelOpen = false;
      closePanel();
      init();
    } catch (error) {
      alert(`Importazione non riuscita: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  }

  function validateData(data) {
    if (!data || !Array.isArray(data.nodes) || !data.nodes.length) {
      throw new Error('il JSON deve contenere almeno nodes[]');
    }
    for (const node of data.nodes) {
      if (!node.id || typeof node.x !== 'number' || typeof node.y !== 'number') {
        throw new Error('ogni nodo deve avere id, x e y');
      }
    }
    if (!Array.isArray(data.path)) data.path = data.nodes.map(n => n.id);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function safeUrl(value) {
    return String(value).replace(/"/g, '%22');
  }

  function slugify(value) {
    return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'athenazoom';
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  init();
})();
