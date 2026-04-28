export function applyAuthoredLayoutMode({ app, authoredConfig, authoredBoxKeyByProjId, authoredParentBox, applyAuthoredBoxStyles }) {
  if (!app || !authoredConfig) return;
  const authoredRoot = document.getElementById('authoredRoot');
  const liveWidth = authoredRoot?.clientWidth || window.innerWidth || authoredConfig.designWidthPx;
  const liveHeight = authoredRoot?.clientHeight || window.innerHeight || authoredConfig.designHeightPx;
  const scale = Math.min(liveWidth / authoredConfig.designWidthPx, liveHeight / authoredConfig.designHeightPx);
  const translatedX = Math.round((liveWidth - (authoredConfig.designWidthPx * scale)) / 2);
  const translatedY = Math.round((liveHeight - (authoredConfig.designHeightPx * scale)) / 2);
  app.style.width = `${Math.round(authoredConfig.designWidthPx)}px`;
  app.style.height = `${Math.round(authoredConfig.designHeightPx)}px`;
  app.style.transform = `translate(${translatedX}px, ${translatedY}px) scale(${scale.toFixed(5)})`;
  app.style.transformOrigin = 'top left';
  const mapped = new Map();
  app.querySelectorAll('[data-proj-id]').forEach((el) => {
    const projId = el.getAttribute('data-proj-id');
    const boxId = authoredBoxKeyByProjId[projId];
    if (!boxId || mapped.has(boxId)) return;
    mapped.set(boxId, el);
  });
  for (const [boxId, box] of Object.entries(authoredConfig.boxes || {})) {
    const el = mapped.get(boxId);
    if (!el) continue;
    const parentId = authoredParentBox[boxId];
    const origin = parentId ? authoredConfig.boxes[parentId] : null;
    applyAuthoredBoxStyles(el, box, origin);
  }
}
