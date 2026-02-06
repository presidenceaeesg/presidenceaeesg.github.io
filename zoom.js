const zoomContent = document.getElementById("zoom-content");

let zoomLevel = 1;
let posX = 0;
let posY = 0;

const zoomStep = 0.2;

/* ---- ZOOM BUTTONS ---- */

document.getElementById("zoom-in").addEventListener("click", () => {
  zoomLevel = Math.min(3, zoomLevel + zoomStep);
  applyTransform();
});

document.getElementById("zoom-out").addEventListener("click", () => {
  zoomLevel = Math.max(0.1, zoomLevel - zoomStep);
  applyTransform();
});

document.getElementById("zoom-reset").addEventListener("click", () => {
  fitToWidth();
});

/* ---- PAN (DRAG) ---- */

let isDragging = false;
let startX = 0;
let startY = 0;

const viewport = document.getElementById("viewport");

viewport.addEventListener("mousedown", e => {
  isDragging = true;
  startX = e.clientX - posX;
  startY = e.clientY - posY;
  viewport.style.cursor = "grabbing";
});

window.addEventListener("mousemove", e => {
  if (!isDragging) return;

  posX = e.clientX - startX;
  posY = e.clientY - startY;
  applyTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  viewport.style.cursor = "grab";
});

/* ---- APPLY ---- */

function applyTransform() {
  zoomContent.style.transform =
    `translate(${posX}px, ${posY}px) scale(${zoomLevel})`;
}

function fitToWidth() {
  const viewport = document.getElementById("viewport");
  const zoomContent = document.getElementById("zoom-content");

  const viewportWidth = viewport.clientWidth;
  const contentWidth = zoomContent.clientWidth;

  // Sécurité
  if (contentWidth === 0) return;

  zoomLevel = viewportWidth / contentWidth;

  // Centrage vertical
  const viewportHeight = viewport.clientHeight;
  const contentHeight = zoomContent.clientHeight;

  posX = 0;
  posY = (viewportHeight - contentHeight * zoomLevel) / 2;

  applyTransform();
}