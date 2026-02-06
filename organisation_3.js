const fileInput = document.getElementById("excel-upload");
const nodesLayer = document.getElementById("nodes-layer");
const linksLayer = document.getElementById("links-layer");

fileInput.addEventListener("change", handleExcel);

function handleExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    buildHierarchy(rows);
  };

  reader.readAsArrayBuffer(file);
}

/* ---------- DIMENSIONS INTELLIGENTES ---------- */

function estimateNodeDimensions(label, siblings = 1) {
  const charWidth = 5;
  const minWidth = 60;
  //const maxWidth = 400;

  let width = label.length * charWidth;
  //width = width / Math.sqrt(siblings);
  //width = Math.max(minWidth, Math.min(maxWidth, width));
  width = Math.max(minWidth, width);

  const fontSize = 8;

  return { width, fontSize };
}

/* ---------- HIERARCHIE DAGRE (ID / Lien) ---------- */

function buildHierarchy(rows) {
  nodesLayer.innerHTML = "";
  linksLayer.innerHTML = "";

  /* 🔑 Map ID → row */
  const rowById = {};
  rows.forEach(r => {
    if (r.ID != null) rowById[r.ID] = r;
  });

  /* Compter enfants par parent */
  const childrenCount = {};
  rows.forEach(r => {
    if (r.Lien != null) {
      childrenCount[r.Lien] = (childrenCount[r.Lien] || 0) + 1;
    }
  });

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB",
    nodesep: 10,
    ranksep: 90
  });
  g.setDefaultEdgeLabel(() => ({}));

  /* -------- NODES -------- */
  rows.forEach(row => {
    if (row.ID == null) return;

    const siblings = childrenCount[row.Lien] || 1;
    const { width, fontSize } =
      estimateNodeDimensions(row.Nom || "", siblings);

    row.__width = width;
    row.__fontSize = fontSize;

    g.setNode(row.ID, {
      label: row.Nom,
      width,
      height: 50
    });
  });

  /* -------- EDGES -------- */
  rows.forEach(row => {
    if (
      row.Lien != null &&
      row.ID != null &&
      rowById[row.Lien]
    ) {
      g.setEdge(row.Lien, row.ID);
    }
  });

  /* -------- LAYOUT -------- */
  dagre.layout(g);

  /* SVG viewBox */
  linksLayer.setAttribute(
    "viewBox",
    `0 0 ${g.graph().width} ${g.graph().height}`
  );

  const graphWidth  = g.graph().width;
  const graphHeight = g.graph().height;

  const zoomContent = document.getElementById("zoom-content");

    zoomContent.style.width  = `${graphWidth}px`;
    zoomContent.style.height = `${graphHeight}px`;

const viewportWidth = viewport.clientWidth;
const contentWidth = zoomContent.clientWidth;

zoomLevel = viewportWidth / contentWidth;

// Centrage vertical optionnel
const viewportHeight = viewport.clientHeight;
const contentHeight = zoomContent.clientHeight;

posX = 0;
posY = (viewportHeight - contentHeight * zoomLevel) / 2;

applyTransform();

  /* -------- ARROW -------- */
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");

  marker.setAttribute("id", "arrow");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "10");
  marker.setAttribute("refX", "8");
  marker.setAttribute("refY", "3");
  marker.setAttribute("orient", "auto");

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arrow.setAttribute("d", "M0,0 L0,6 L9,3 z");
  arrow.setAttribute("fill", "#555");

  marker.appendChild(arrow);
  defs.appendChild(marker);
  linksLayer.appendChild(defs);

  /* -------- DRAW NODES -------- */
  g.nodes().forEach(id => {
    const node = g.node(id);
    const row = rowById[id];

    const div = document.createElement("div");
    div.className = "node";
    div.textContent = node.label;

    div.style.width = `${row.__width}px`;
    div.style.fontSize = `${row.__fontSize}px`;
    div.style.left = `${(node.x - node.width / 2)}px`;
    div.style.top  = `${(node.y - node.height / 2)}px`;

    div.dataset.id = id;

    nodesLayer.appendChild(div);
  });

  drawLinks(g);
}

/* ---------- LINKS ---------- */

function drawLinks(graph) {
  graph.edges().forEach(edge => {
    const points = graph.edge(edge).points;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = points
      .map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`)
      .join(" ");

    path.setAttribute("d", d);
    path.setAttribute("stroke", "#555");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", "url(#arrow)");

    linksLayer.appendChild(path);
  });
}
