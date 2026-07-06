(() => {
  "use strict";

  const STORAGE_KEY = "athenazoom-desk-v2";

  const deepClone = (value) => JSON.parse(JSON.stringify(value));
  const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const state = {
    project: loadProject(),
    mode: "build",
    tool: "select",
    selectedNodeId: null,
    selectedEdgeId: null,
    connectFromId: null,
    pathIndex: 0,
    view: { zoom: 0.32, x: 0, y: 0 },
    drag: null,
    pan: null,
    pointers: new Map(),
    pinch: null,
    suppressClickUntil: 0
  };

  const el = {
    app: document.getElementById("app"),
    title: document.getElementById("projectTitle"),
    subtitle: document.getElementById("projectSubtitle"),
    buildModeBtn: document.getElementById("buildModeBtn"),
    presentModeBtn: document.getElementById("presentModeBtn"),
    saveBtn: document.getElementById("saveBtn"),
    exportBtn: document.getElementById("exportBtn"),
    importInput: document.getElementById("importInput"),
    helpBtn: document.getElementById("helpBtn"),
    helpDialog: document.getElementById("helpDialog"),
    toolPanel: document.getElementById("toolPanel"),
    inspector: document.getElementById("inspector"),
    stage: document.getElementById("stage"),
    viewport: document.getElementById("viewport"),
    canvas: document.getElementById("canvas"),
    edgeLayer: document.getElementById("edgeLayer"),
    nodeLayer: document.getElementById("nodeLayer"),
    selectTool: document.getElementById("selectTool"),
    panTool: document.getElementById("panTool"),
    connectTool: document.getElementById("connectTool"),
    connectHint: document.getElementById("connectHint"),
    addTextBtn: document.getElementById("addTextBtn"),
    addLinkBtn: document.getElementById("addLinkBtn"),
    assetInput: document.getElementById("assetInput"),
    edgeColorDefault: document.getElementById("edgeColorDefault"),
    edgeWidthDefault: document.getElementById("edgeWidthDefault"),
    edgeStyleDefault: document.getElementById("edgeStyleDefault"),
    zoomInBtn: document.getElementById("zoomInBtn"),
    zoomOutBtn: document.getElementById("zoomOutBtn"),
    fitBtn: document.getElementById("fitBtn"),
    emptyInspector: document.getElementById("emptyInspector"),
    nodeInspector: document.getElementById("nodeInspector"),
    edgeInspector: document.getElementById("edgeInspector"),
    nodeTitle: document.getElementById("nodeTitle"),
    nodeBody: document.getElementById("nodeBody"),
    nodeColor: document.getElementById("nodeColor"),
    nodeIcon: document.getElementById("nodeIcon"),
    nodeWidth: document.getElementById("nodeWidth"),
    nodeHeight: document.getElementById("nodeHeight"),
    nodeUrl: document.getElementById("nodeUrl"),
    urlRow: document.getElementById("urlRow"),
    addToPathBtn: document.getElementById("addToPathBtn"),
    duplicateNodeBtn: document.getElementById("duplicateNodeBtn"),
    deleteNodeBtn: document.getElementById("deleteNodeBtn"),
    edgeLabel: document.getElementById("edgeLabel"),
    edgeColor: document.getElementById("edgeColor"),
    edgeWidth: document.getElementById("edgeWidth"),
    edgeStyle: document.getElementById("edgeStyle"),
    deleteEdgeBtn: document.getElementById("deleteEdgeBtn"),
    pathList: document.getElementById("pathList"),
    clearPathBtn: document.getElementById("clearPathBtn"),
    playFromStartBtn: document.getElementById("playFromStartBtn"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    overviewBtn: document.getElementById("overviewBtn"),
    focusDialog: document.getElementById("focusDialog"),
    closeFocusBtn: document.getElementById("closeFocusBtn"),
    focusContent: document.getElementById("focusContent"),
    linkDialog: document.getElementById("linkDialog"),
    linkForm: document.getElementById("linkForm"),
    cancelLinkBtn: document.getElementById("cancelLinkBtn"),
    linkTitleInput: document.getElementById("linkTitleInput"),
    linkUrlInput: document.getElementById("linkUrlInput")
  };

  function loadProject() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeProject(JSON.parse(saved));
    } catch (err) {
      console.warn("Impossibile leggere il progetto salvato", err);
    }
    return normalizeProject(deepClone(window.ATHENA_ZOOM_DATA));
  }

  function normalizeProject(project) {
    const base = project || {};
    base.version = base.version || "2.0";
    base.title = base.title || "AthenaZoom Desk";
    base.subtitle = base.subtitle || "Costruisci percorsi, proietta mappe vive";
    base.world = base.world || { width: 5200, height: 3400 };
    base.nodes = Array.isArray(base.nodes) ? base.nodes : [];
    base.edges = Array.isArray(base.edges) ? base.edges : [];
    base.path = Array.isArray(base.path) ? base.path : [];
    base.nodes.forEach((n, i) => {
      n.id = n.id || uid("node");
      n.type = n.type || "text";
      n.title = n.title || `Oggetto ${i + 1}`;
      n.body = n.body || "";
      n.x = Number.isFinite(n.x) ? n.x : 2400 + i * 80;
      n.y = Number.isFinite(n.y) ? n.y : 1600 + i * 80;
      n.w = Number.isFinite(n.w) ? n.w : 340;
      n.h = Number.isFinite(n.h) ? n.h : 180;
      n.color = n.color || "#f6ead0";
      n.icon = n.icon || iconForType(n.type);
    });
    base.edges.forEach((e) => {
      e.id = e.id || uid("edge");
      e.color = e.color || "#c99a48";
      e.width = Number.isFinite(e.width) ? e.width : 4;
      e.style = e.style || "solid";
      e.label = e.label || "";
    });
    base.path = base.path.filter((id) => base.nodes.some((n) => n.id === id));
    return base;
  }

  function iconForType(type) {
    return ({ text: "✎", image: "▧", pdf: "PDF", file: "▣", link: "↗" })[type] || "•";
  }

  function init() {
    applyProjectMeta();
    bindEvents();
    renderAll();
    requestAnimationFrame(() => fitToWorld());
    registerServiceWorker();
  }

  function bindEvents() {
    el.title.addEventListener("input", () => { state.project.title = el.title.value; saveSoon(); });
    el.subtitle.addEventListener("input", () => { state.project.subtitle = el.subtitle.value; saveSoon(); });
    el.buildModeBtn.addEventListener("click", () => setMode("build"));
    el.presentModeBtn.addEventListener("click", () => setMode("present"));
    el.playFromStartBtn.addEventListener("click", () => { state.pathIndex = 0; setMode("present"); focusPathNode(); });
    el.saveBtn.addEventListener("click", () => saveProject(true));
    el.exportBtn.addEventListener("click", exportProject);
    el.importInput.addEventListener("change", importProject);
    el.helpBtn.addEventListener("click", () => el.helpDialog.showModal());

    [el.selectTool, el.panTool, el.connectTool].forEach((button) => {
      button.addEventListener("click", () => setTool(button.dataset.tool));
    });

    el.addTextBtn.addEventListener("click", () => addTextNode());
    el.addLinkBtn.addEventListener("click", () => openLinkDialog());
    el.assetInput.addEventListener("change", handleAssetUpload);
    el.zoomInBtn.addEventListener("click", () => zoomAtCenter(1.18));
    el.zoomOutBtn.addEventListener("click", () => zoomAtCenter(1 / 1.18));
    el.fitBtn.addEventListener("click", () => fitToWorld());

    el.viewport.addEventListener("pointerdown", onViewportPointerDown);
    el.viewport.addEventListener("pointermove", onViewportPointerMove);
    el.viewport.addEventListener("pointerup", onViewportPointerUp);
    el.viewport.addEventListener("pointercancel", onViewportPointerUp);
    el.viewport.addEventListener("wheel", onWheel, { passive: false });

    el.nodeTitle.addEventListener("input", () => updateSelectedNode("title", el.nodeTitle.value));
    el.nodeBody.addEventListener("input", () => updateSelectedNode("body", el.nodeBody.value));
    el.nodeColor.addEventListener("input", () => updateSelectedNode("color", el.nodeColor.value));
    el.nodeIcon.addEventListener("input", () => updateSelectedNode("icon", el.nodeIcon.value));
    el.nodeWidth.addEventListener("input", () => updateSelectedNode("w", Number(el.nodeWidth.value)));
    el.nodeHeight.addEventListener("input", () => updateSelectedNode("h", Number(el.nodeHeight.value)));
    el.nodeUrl.addEventListener("input", () => updateSelectedNode("url", el.nodeUrl.value));
    el.addToPathBtn.addEventListener("click", addSelectedToPath);
    el.duplicateNodeBtn.addEventListener("click", duplicateSelectedNode);
    el.deleteNodeBtn.addEventListener("click", deleteSelectedNode);

    el.edgeLabel.addEventListener("input", () => updateSelectedEdge("label", el.edgeLabel.value));
    el.edgeColor.addEventListener("input", () => updateSelectedEdge("color", el.edgeColor.value));
    el.edgeWidth.addEventListener("input", () => updateSelectedEdge("width", Number(el.edgeWidth.value)));
    el.edgeStyle.addEventListener("input", () => updateSelectedEdge("style", el.edgeStyle.value));
    el.deleteEdgeBtn.addEventListener("click", deleteSelectedEdge);

    el.clearPathBtn.addEventListener("click", () => { state.project.path = []; state.pathIndex = 0; renderPath(); renderNodes(); saveSoon(); });
    el.prevBtn.addEventListener("click", previousStep);
    el.nextBtn.addEventListener("click", nextStep);
    el.overviewBtn.addEventListener("click", fitToWorld);

    el.closeFocusBtn.addEventListener("click", () => el.focusDialog.close());
    el.focusDialog.addEventListener("click", (ev) => { if (ev.target === el.focusDialog) el.focusDialog.close(); });

    el.cancelLinkBtn.addEventListener("click", () => el.linkDialog.close());
    el.linkForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const title = el.linkTitleInput.value.trim() || "Nuovo link";
      const url = el.linkUrlInput.value.trim();
      if (!url) return;
      addNode({ type: "link", title, body: "Collegamento esterno.", url, icon: "↗", color: "#c9ddf0", w: 370, h: 170 });
      el.linkDialog.close();
    });

    window.addEventListener("resize", () => applyTransform());
    window.addEventListener("keydown", handleKeys);
  }

  function applyProjectMeta() {
    el.title.value = state.project.title;
    el.subtitle.value = state.project.subtitle;
    el.canvas.style.width = `${state.project.world.width}px`;
    el.canvas.style.height = `${state.project.world.height}px`;
    el.edgeLayer.setAttribute("width", state.project.world.width);
    el.edgeLayer.setAttribute("height", state.project.world.height);
    el.edgeLayer.setAttribute("viewBox", `0 0 ${state.project.world.width} ${state.project.world.height}`);
  }

  function renderAll() {
    renderEdges();
    renderNodes();
    renderInspector();
    renderPath();
    applyTransform();
  }

  function renderNodes() {
    const frag = document.createDocumentFragment();
    const pathMap = new Map(state.project.path.map((id, index) => [id, index + 1]));

    state.project.nodes.forEach((node) => {
      const div = document.createElement("article");
      div.className = "desk-node";
      if (node.id === state.selectedNodeId) div.classList.add("selected");
      if (state.mode === "present" && state.project.path[state.pathIndex] === node.id) div.classList.add("path-current");
      div.dataset.nodeId = node.id;
      div.style.left = `${node.x}px`;
      div.style.top = `${node.y}px`;
      div.style.width = `${node.w}px`;
      div.style.minHeight = `${node.h}px`;
      div.style.setProperty("--node-color", node.color || "#f6ead0");
      const step = pathMap.get(node.id);
      div.innerHTML = `
        ${step ? `<span class="step-dot">${step}</span>` : ""}
        <header class="node-head">
          <span class="node-icon">${escapeHtml(node.icon || iconForType(node.type))}</span>
          <h3 class="node-title">${escapeHtml(node.title)}</h3>
        </header>
        ${previewMarkup(node)}
        <p class="node-body">${escapeHtml(node.body || "")}</p>
      `;
      div.addEventListener("pointerdown", (ev) => onNodePointerDown(ev, node.id));
      div.addEventListener("click", (ev) => onNodeClick(ev, node.id));
      frag.appendChild(div);
    });

    el.nodeLayer.innerHTML = "";
    el.nodeLayer.appendChild(frag);
  }

  function previewMarkup(node) {
    if (node.type === "image" && node.src) {
      return `<div class="node-preview"><img src="${safeAttr(node.src)}" alt="${escapeHtml(node.title)}" draggable="false"></div>`;
    }
    if (node.type === "pdf") {
      return `<div class="node-preview"><div class="file-badge">PDF<small>${escapeHtml(node.fileName || "documento.pdf")}</small></div></div>`;
    }
    if (node.type === "file") {
      return `<div class="node-preview"><div class="file-badge">DOC<small>${escapeHtml(node.fileName || "documento")}</small></div></div>`;
    }
    if (node.type === "link" && node.url) {
      return `<a class="link-chip" href="${safeAttr(node.url)}" target="_blank" rel="noopener">Apri link ↗</a>`;
    }
    return "";
  }

  function renderEdges() {
    const byId = new Map(state.project.nodes.map((n) => [n.id, n]));
    el.edgeLayer.innerHTML = "";
    state.project.edges.forEach((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) return;
      const d = edgeCurve(from, to);
      const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hit.setAttribute("class", "edge-hit");
      hit.setAttribute("d", d);
      hit.addEventListener("click", (ev) => {
        if (state.mode !== "build") return;
        ev.stopPropagation();
        selectEdge(edge.id);
      });
      el.edgeLayer.appendChild(hit);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", `edge-path ${edge.id === state.selectedEdgeId ? "selected" : ""}`);
      path.setAttribute("d", d);
      path.setAttribute("stroke", edge.color || "#c99a48");
      path.setAttribute("stroke-width", edge.width || 4);
      path.setAttribute("stroke-dasharray", dashFor(edge.style, edge.width || 4));
      path.addEventListener("click", (ev) => {
        if (state.mode !== "build") return;
        ev.stopPropagation();
        selectEdge(edge.id);
      });
      el.edgeLayer.appendChild(path);

      if (edge.label) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("class", "edge-label");
        text.setAttribute("x", (from.x + to.x) / 2);
        text.setAttribute("y", (from.y + to.y) / 2 - 18);
        text.setAttribute("text-anchor", "middle");
        text.textContent = edge.label;
        el.edgeLayer.appendChild(text);
      }
    });
  }

  function edgeCurve(a, b) {
    const x1 = a.x;
    const y1 = a.y;
    const x2 = b.x;
    const y2 = b.y;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const curve = clamp(distance * 0.17, 80, 260);
    const nx = -dy / distance;
    const ny = dx / distance;
    const cx = (x1 + x2) / 2 + nx * curve;
    const cy = (y1 + y2) / 2 + ny * curve;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }

  function dashFor(style, width) {
    if (style === "dashed") return `${width * 4} ${width * 3}`;
    if (style === "dotted") return `1 ${width * 2.4}`;
    return "";
  }

  function onViewportPointerDown(ev) {
    el.viewport.setPointerCapture(ev.pointerId);
    state.pointers.set(ev.pointerId, pointFromEvent(ev));

    if (state.pointers.size === 2) {
      beginPinch();
      return;
    }

    const clickedCanvas = ev.target === el.viewport || ev.target === el.canvas || ev.target === el.nodeLayer || ev.target === el.edgeLayer;
    const shouldPan = state.tool === "pan" || state.mode === "present" || clickedCanvas;
    if (shouldPan) {
      state.pan = { pointerId: ev.pointerId, sx: ev.clientX, sy: ev.clientY, x: state.view.x, y: state.view.y };
      el.viewport.classList.add("panning");
      if (clickedCanvas && state.mode === "build" && state.tool !== "connect") clearSelection();
    }
  }

  function onViewportPointerMove(ev) {
    if (state.pointers.has(ev.pointerId)) state.pointers.set(ev.pointerId, pointFromEvent(ev));

    if (state.pinch && state.pointers.size >= 2) {
      updatePinch();
      return;
    }

    if (state.drag && state.drag.pointerId === ev.pointerId) {
      ev.preventDefault();
      const node = getNode(state.drag.nodeId);
      if (!node) return;
      const world = clientToWorld(ev.clientX, ev.clientY);
      node.x = world.x - state.drag.offsetX;
      node.y = world.y - state.drag.offsetY;
      state.suppressClickUntil = Date.now() + 180;
      renderNodes();
      renderEdges();
      saveSoon();
      return;
    }

    if (state.pan && state.pan.pointerId === ev.pointerId) {
      ev.preventDefault();
      state.view.x = state.pan.x + (ev.clientX - state.pan.sx);
      state.view.y = state.pan.y + (ev.clientY - state.pan.sy);
      state.suppressClickUntil = Date.now() + 180;
      applyTransform();
    }
  }

  function onViewportPointerUp(ev) {
    state.pointers.delete(ev.pointerId);
    if (state.drag && state.drag.pointerId === ev.pointerId) {
      const nodeEl = document.querySelector(`.desk-node[data-node-id="${CSS.escape(state.drag.nodeId)}"]`);
      nodeEl?.classList.remove("dragging");
      state.drag = null;
      saveProject(false);
    }
    if (state.pan && state.pan.pointerId === ev.pointerId) {
      state.pan = null;
      el.viewport.classList.remove("panning");
    }
    if (state.pointers.size < 2) state.pinch = null;
  }

  function onNodePointerDown(ev, nodeId) {
    ev.stopPropagation();
    state.pointers.set(ev.pointerId, pointFromEvent(ev));
    if (state.mode !== "build") return;
    selectNode(nodeId);
    if (state.tool === "select") {
      const node = getNode(nodeId);
      const world = clientToWorld(ev.clientX, ev.clientY);
      state.drag = { pointerId: ev.pointerId, nodeId, offsetX: world.x - node.x, offsetY: world.y - node.y };
      ev.currentTarget.setPointerCapture(ev.pointerId);
      ev.currentTarget.classList.add("dragging");
    }
  }

  function onNodeClick(ev, nodeId) {
    ev.stopPropagation();
    if (Date.now() < state.suppressClickUntil) return;
    if (state.mode === "present") {
      const node = getNode(nodeId);
      focusNode(node, true);
      openFocus(node);
      return;
    }
    if (state.tool === "connect") {
      handleConnectClick(nodeId);
    } else {
      selectNode(nodeId);
    }
  }

  function beginPinch() {
    const pts = [...state.pointers.values()].slice(0, 2);
    const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    state.pinch = {
      startDistance: distance(pts[0], pts[1]),
      startZoom: state.view.zoom,
      centerWorld: clientToWorld(center.x, center.y)
    };
  }

  function updatePinch() {
    const pts = [...state.pointers.values()].slice(0, 2);
    const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    const nextZoom = clamp(state.pinch.startZoom * (distance(pts[0], pts[1]) / state.pinch.startDistance), 0.12, 2.8);
    zoomToPoint(nextZoom, center.x, center.y, state.pinch.centerWorld);
    state.suppressClickUntil = Date.now() + 220;
  }

  function onWheel(ev) {
    ev.preventDefault();
    const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
    const nextZoom = clamp(state.view.zoom * factor, 0.12, 2.8);
    zoomToPoint(nextZoom, ev.clientX, ev.clientY);
  }

  function zoomAtCenter(factor) {
    const rect = el.viewport.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    zoomToPoint(clamp(state.view.zoom * factor, 0.12, 2.8), cx, cy);
  }

  function zoomToPoint(nextZoom, clientX, clientY, fixedWorld = null) {
    const world = fixedWorld || clientToWorld(clientX, clientY);
    const rect = el.viewport.getBoundingClientRect();
    state.view.zoom = nextZoom;
    state.view.x = clientX - rect.left - world.x * nextZoom;
    state.view.y = clientY - rect.top - world.y * nextZoom;
    applyTransform();
  }

  function applyTransform() {
    el.canvas.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.zoom})`;
  }

  function fitToWorld() {
    const rect = el.viewport.getBoundingClientRect();
    const margin = state.mode === "present" ? 90 : 160;
    const zoom = clamp(Math.min((rect.width - margin) / state.project.world.width, (rect.height - margin) / state.project.world.height), 0.12, 1.2);
    state.view.zoom = zoom;
    state.view.x = (rect.width - state.project.world.width * zoom) / 2;
    state.view.y = (rect.height - state.project.world.height * zoom) / 2;
    applyTransform();
  }

  function focusNode(node, tighter = false) {
    if (!node) return;
    const rect = el.viewport.getBoundingClientRect();
    const targetZoom = clamp(tighter ? Math.min(1.15, 720 / Math.max(node.w, node.h)) : Math.min(0.9, 620 / Math.max(node.w, node.h)), 0.24, 1.45);
    state.view.zoom = targetZoom;
    state.view.x = rect.width / 2 - node.x * targetZoom;
    state.view.y = rect.height / 2 - node.y * targetZoom;
    applyTransform();
    renderNodes();
  }

  function clientToWorld(clientX, clientY) {
    const rect = el.viewport.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.view.x) / state.view.zoom,
      y: (clientY - rect.top - state.view.y) / state.view.zoom
    };
  }

  function viewportCenterWorld() {
    const rect = el.viewport.getBoundingClientRect();
    return clientToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function setMode(mode) {
    state.mode = mode;
    state.tool = mode === "present" ? "pan" : "select";
    state.connectFromId = null;
    el.app.classList.toggle("build-mode", mode === "build");
    el.app.classList.toggle("present-mode", mode === "present");
    el.buildModeBtn.classList.toggle("active", mode === "build");
    el.presentModeBtn.classList.toggle("active", mode === "present");
    setTool(state.tool);
    renderNodes();
    if (mode === "present") focusPathNode();
  }

  function setTool(tool) {
    state.tool = tool;
    [el.selectTool, el.panTool, el.connectTool].forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
    if (tool !== "connect") state.connectFromId = null;
    updateConnectHint();
  }

  function updateConnectHint() {
    if (state.tool !== "connect") {
      el.connectHint.textContent = "Tocca “Connetti”, poi scegli due oggetti.";
      return;
    }
    el.connectHint.textContent = state.connectFromId
      ? "Ora tocca il secondo oggetto: nascerà il collegamento."
      : "Tocca il primo oggetto da collegare.";
  }

  function handleConnectClick(nodeId) {
    if (!state.connectFromId) {
      state.connectFromId = nodeId;
      selectNode(nodeId);
      updateConnectHint();
      return;
    }
    if (state.connectFromId === nodeId) return;
    const exists = state.project.edges.some((e) => e.from === state.connectFromId && e.to === nodeId);
    if (!exists) {
      const edge = {
        id: uid("edge"),
        from: state.connectFromId,
        to: nodeId,
        color: el.edgeColorDefault.value,
        width: Number(el.edgeWidthDefault.value),
        style: el.edgeStyleDefault.value,
        label: ""
      };
      state.project.edges.push(edge);
      selectEdge(edge.id);
      renderEdges();
      saveSoon();
    }
    state.connectFromId = null;
    updateConnectHint();
  }

  function selectNode(id) {
    state.selectedNodeId = id;
    state.selectedEdgeId = null;
    renderNodes();
    renderEdges();
    renderInspector();
  }

  function selectEdge(id) {
    state.selectedEdgeId = id;
    state.selectedNodeId = null;
    renderNodes();
    renderEdges();
    renderInspector();
  }

  function clearSelection() {
    state.selectedNodeId = null;
    state.selectedEdgeId = null;
    renderNodes();
    renderEdges();
    renderInspector();
  }

  function renderInspector() {
    const node = getNode(state.selectedNodeId);
    const edge = getEdge(state.selectedEdgeId);
    el.emptyInspector.classList.toggle("hidden", !!node || !!edge);
    el.nodeInspector.classList.toggle("hidden", !node);
    el.edgeInspector.classList.toggle("hidden", !edge);

    if (node) {
      el.nodeTitle.value = node.title || "";
      el.nodeBody.value = node.body || "";
      el.nodeColor.value = normalizeColor(node.color || "#f6ead0");
      el.nodeIcon.value = node.icon || "";
      el.nodeWidth.value = node.w || 340;
      el.nodeHeight.value = node.h || 180;
      el.nodeUrl.value = node.url || "";
      el.urlRow.classList.toggle("hidden", !(node.type === "link" || node.url));
    }
    if (edge) {
      el.edgeLabel.value = edge.label || "";
      el.edgeColor.value = normalizeColor(edge.color || "#c99a48");
      el.edgeWidth.value = edge.width || 4;
      el.edgeStyle.value = edge.style || "solid";
    }
  }

  function renderPath() {
    el.pathList.innerHTML = "";
    state.project.path.forEach((id, index) => {
      const node = getNode(id);
      if (!node) return;
      const li = document.createElement("li");
      li.innerHTML = `<div class="path-item"><span>${escapeHtml(node.title)}</span><button type="button" data-action="up">↑</button><button type="button" data-action="remove">×</button></div>`;
      li.querySelector('[data-action="up"]').addEventListener("click", () => {
        if (index === 0) return;
        const tmp = state.project.path[index - 1];
        state.project.path[index - 1] = state.project.path[index];
        state.project.path[index] = tmp;
        renderPath(); renderNodes(); saveSoon();
      });
      li.querySelector('[data-action="remove"]').addEventListener("click", () => {
        state.project.path.splice(index, 1);
        renderPath(); renderNodes(); saveSoon();
      });
      el.pathList.appendChild(li);
    });
  }

  function updateSelectedNode(key, value) {
    const node = getNode(state.selectedNodeId);
    if (!node) return;
    node[key] = value;
    renderNodes();
    renderEdges();
    renderPath();
    saveSoon();
  }

  function updateSelectedEdge(key, value) {
    const edge = getEdge(state.selectedEdgeId);
    if (!edge) return;
    edge[key] = value;
    renderEdges();
    saveSoon();
  }

  function addTextNode() {
    addNode({ type: "text", title: "Nuova scheda", body: "Scrivi qui il contenuto della scheda.", icon: "✎", color: "#f6ead0", w: 360, h: 180 });
  }

  function openLinkDialog() {
    el.linkTitleInput.value = "Nuovo link";
    el.linkUrlInput.value = "";
    el.linkDialog.showModal();
    setTimeout(() => el.linkUrlInput.focus(), 60);
  }

  function addNode(partial) {
    const center = viewportCenterWorld();
    const node = {
      id: uid("node"),
      x: clamp(center.x, 240, state.project.world.width - 240),
      y: clamp(center.y, 180, state.project.world.height - 180),
      w: 360,
      h: 180,
      color: "#f6ead0",
      body: "",
      icon: iconForType(partial.type),
      ...partial
    };
    state.project.nodes.push(node);
    selectNode(node.id);
    renderAll();
    saveSoon();
  }

  async function handleAssetUpload(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    const type = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "file";
    addNode({
      type,
      title: file.name.replace(/\.[^.]+$/, ""),
      body: type === "image" ? "Immagine inserita nel desk." : "Documento inserito nel desk. In proiezione puoi aprirlo o ingrandirlo.",
      src: dataUrl,
      fileName: file.name,
      mime: file.type || "application/octet-stream",
      icon: iconForType(type),
      color: type === "image" ? "#f6ead0" : type === "pdf" ? "#ffd6cf" : "#d9d4f2",
      w: type === "image" ? 390 : 360,
      h: type === "image" ? 240 : 180
    });
  }

  function duplicateSelectedNode() {
    const node = getNode(state.selectedNodeId);
    if (!node) return;
    const copy = deepClone(node);
    copy.id = uid("node");
    copy.x += 80;
    copy.y += 80;
    copy.title = `${copy.title} copia`;
    state.project.nodes.push(copy);
    selectNode(copy.id);
    renderAll();
    saveSoon();
  }

  function deleteSelectedNode() {
    const id = state.selectedNodeId;
    if (!id) return;
    state.project.nodes = state.project.nodes.filter((n) => n.id !== id);
    state.project.edges = state.project.edges.filter((e) => e.from !== id && e.to !== id);
    state.project.path = state.project.path.filter((nodeId) => nodeId !== id);
    state.selectedNodeId = null;
    renderAll();
    saveSoon();
  }

  function deleteSelectedEdge() {
    const id = state.selectedEdgeId;
    if (!id) return;
    state.project.edges = state.project.edges.filter((e) => e.id !== id);
    state.selectedEdgeId = null;
    renderAll();
    saveSoon();
  }

  function addSelectedToPath() {
    const id = state.selectedNodeId;
    if (!id) return;
    if (!state.project.path.includes(id)) state.project.path.push(id);
    renderPath(); renderNodes(); saveSoon();
  }

  function nextStep() {
    if (!state.project.path.length) return;
    state.pathIndex = clamp(state.pathIndex + 1, 0, state.project.path.length - 1);
    focusPathNode();
  }

  function previousStep() {
    if (!state.project.path.length) return;
    state.pathIndex = clamp(state.pathIndex - 1, 0, state.project.path.length - 1);
    focusPathNode();
  }

  function focusPathNode() {
    const id = state.project.path[state.pathIndex];
    const node = getNode(id);
    if (node) focusNode(node);
    else fitToWorld();
  }

  function openFocus(node) {
    if (!node) return;
    el.focusContent.innerHTML = `
      <h2 class="focus-title">${escapeHtml(node.title)}</h2>
      ${focusMediaMarkup(node)}
      <div class="focus-body">${escapeHtml(node.body || "")}</div>
      ${node.type === "link" && node.url ? `<a class="focus-link" href="${safeAttr(node.url)}" target="_blank" rel="noopener">Apri collegamento esterno ↗</a>` : ""}
    `;
    el.focusDialog.showModal();
  }

  function focusMediaMarkup(node) {
    if (node.type === "image" && node.src) return `<div class="focus-media"><img src="${safeAttr(node.src)}" alt="${escapeHtml(node.title)}"></div>`;
    if (node.type === "pdf" && node.src) return `<div class="focus-media"><object data="${safeAttr(node.src)}" type="application/pdf"><a href="${safeAttr(node.src)}" download="${escapeHtml(node.fileName || "documento.pdf")}">Apri PDF</a></object></div>`;
    if (node.type === "file" && node.src) return `<div class="focus-media"><p><strong>Documento:</strong> ${escapeHtml(node.fileName || node.title)}</p><a class="focus-link" href="${safeAttr(node.src)}" download="${escapeHtml(node.fileName || "documento")}">Scarica / apri documento</a></div>`;
    return "";
  }

  function handleKeys(ev) {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(ev.target?.tagName)) return;
    if (ev.key === "Escape") {
      if (el.focusDialog.open) el.focusDialog.close();
      else if (state.mode === "present") setMode("build");
    }
    if (state.mode === "present") {
      if (ev.key === "ArrowRight" || ev.key === " ") { ev.preventDefault(); nextStep(); }
      if (ev.key === "ArrowLeft") { ev.preventDefault(); previousStep(); }
      if (ev.key.toLowerCase() === "o") fitToWorld();
    }
  }

  function exportProject() {
    saveProject(false);
    const blob = new Blob([JSON.stringify(state.project, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slugify(state.project.title)}.athenazoom.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importProject(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      state.project = normalizeProject(JSON.parse(text));
      state.selectedNodeId = null;
      state.selectedEdgeId = null;
      state.pathIndex = 0;
      applyProjectMeta();
      renderAll();
      fitToWorld();
      saveProject(true);
    } catch (err) {
      alert("Il file non sembra un progetto AthenaZoom valido.");
      console.error(err);
    }
  }

  let saveTimer = null;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveProject(false), 300);
  }

  function saveProject(withNotice) {
    state.project.title = el.title.value.trim() || "AthenaZoom Desk";
    state.project.subtitle = el.subtitle.value.trim() || "";
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project));
      if (withNotice) flashSave();
    } catch (err) {
      console.warn("Salvataggio locale non riuscito", err);
      alert("Il browser non riesce a salvare: probabilmente il progetto contiene file troppo pesanti. Usa Esporta per conservarlo oppure riduci i file.");
    }
  }

  function flashSave() {
    el.saveBtn.textContent = "Salvato";
    setTimeout(() => { el.saveBtn.textContent = "Salva"; }, 900);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getNode(id) { return state.project.nodes.find((n) => n.id === id); }
  function getEdge(id) { return state.project.edges.find((e) => e.id === id); }
  function pointFromEvent(ev) { return { x: ev.clientX, y: ev.clientY }; }
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function normalizeColor(value) {
    if (/^#[0-9a-f]{6}$/i.test(value)) return value;
    return "#f6ead0";
  }
  function slugify(text) {
    return (text || "athenazoom").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "athenazoom";
  }
  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>'"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  }
  function safeAttr(str) {
    return escapeHtml(str);
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }

  init();
})();
