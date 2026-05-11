function createSeededRandom(seedValue) {
  let seed = (Number(seedValue) || 1) >>> 0;
  return function next() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseMaskImageUrl(rawValue) {
  const value = String(rawValue || '').trim();
  const match = value.match(/^url\((['"]?)(.+)\1\)$/i);
  return match ? match[2] : '';
}

function readMaskImageUrl(element, variableName = '--emoji-mask-src') {
  if (!(element instanceof Element)) return '';
  const inlineValue = element.style.getPropertyValue(variableName);
  if (inlineValue) return parseMaskImageUrl(inlineValue);
  return parseMaskImageUrl(getComputedStyle(element).getPropertyValue(variableName));
}

function getCanvas2dContext(canvas) {
  return canvas.getContext('2d', { alpha: true, willReadFrequently: false });
}

export function createWobblyOutlineRenderer() {
  const imageCache = new Map();
  const emojiBitmapCache = new Map();
  const rectPathCache = new Map();

  function ensureOutlineCanvas(target, scope) {
    if (!(target instanceof HTMLElement)) return null;
    let canvas = target.querySelector(`:scope > canvas[data-wobbly-outline="${scope}"]`);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.dataset.wobblyOutline = scope;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '1';
      target.appendChild(canvas);
    }
    const computedPosition = getComputedStyle(target).position;
    if (computedPosition === 'static' && !target.style.position) target.style.position = 'relative';
    return canvas;
  }

  function loadImage(src) {
    const key = String(src || '').trim();
    if (!key) return Promise.resolve(null);
    if (imageCache.has(key)) return imageCache.get(key);
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = key;
    });
    imageCache.set(key, promise);
    return promise;
  }

  function drawMaskSilhouette(ctx, image, dx, dy, width, height, color) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.drawImage(image, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function getEmojiOutlineBitmap(image, {
    width,
    height,
    lineWidth = 2.4,
    wobble = 0.9,
    seed = 1,
    color = '#000000',
  }) {
    const key = `${image.src}|${width}|${height}|${lineWidth}|${wobble}|${seed}|${color}`;
    if (emojiBitmapCache.has(key)) return emojiBitmapCache.get(key);
    const bitmap = document.createElement('canvas');
    bitmap.width = Math.max(1, width);
    bitmap.height = Math.max(1, height);
    const ctx = getCanvas2dContext(bitmap);
    if (!ctx) return bitmap;
    const rng = createSeededRandom(seed);
    const steps = Math.max(24, Math.round((Math.PI * 2 * Math.max(width, height)) / 18));
    for (let i = 0; i < steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const offsetRadius = Math.max(0.2, lineWidth + (rng() - 0.5) * 2 * wobble);
      const dx = Math.cos(angle) * offsetRadius;
      const dy = Math.sin(angle) * offsetRadius;
      drawMaskSilhouette(ctx, image, dx, dy, width, height, color);
    }
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(image, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    emojiBitmapCache.set(key, bitmap);
    return bitmap;
  }

  function getWobblyRectPath({
    width,
    height,
    inset = 1.5,
    step = 12,
    wobble = 1.25,
    seed = 1,
  }) {
    const key = `${width}|${height}|${inset}|${step}|${wobble}|${seed}`;
    if (rectPathCache.has(key)) return rectPathCache.get(key);
    const left = inset;
    const right = Math.max(left + 1, width - inset);
    const top = inset;
    const bottom = Math.max(top + 1, height - inset);
    const points = [];
    const rng = createSeededRandom(seed);
    const pushPoint = (x, y, nx, ny) => {
      const push = (rng() - 0.5) * 2 * wobble;
      points.push({ x: x + nx * push, y: y + ny * push });
    };
    for (let x = left; x <= right; x += step) pushPoint(x, top, 0, -1);
    for (let y = top; y <= bottom; y += step) pushPoint(right, y, 1, 0);
    for (let x = right; x >= left; x -= step) pushPoint(x, bottom, 0, 1);
    for (let y = bottom; y >= top; y -= step) pushPoint(left, y, -1, 0);
    if (!points.length) points.push({ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom });
    rectPathCache.set(key, points);
    return points;
  }

  function drawWobblyStroke(ctx, points) {
    if (!points.length) return;
    const first = points[0];
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.moveTo((first.x + last.x) / 2, (first.y + last.y) / 2);
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const next = points[(index + 1) % points.length];
      const mx = (point.x + next.x) / 2;
      const my = (point.y + next.y) / 2;
      ctx.quadraticCurveTo(point.x, point.y, mx, my);
    }
    ctx.closePath();
    ctx.stroke();
  }

  function renderRectOutline(target, {
    color = '#000000',
    lineWidth = 2.4,
    wobble = 1.3,
    step = 12,
    seed = 1,
  } = {}) {
    const canvas = ensureOutlineCanvas(target, 'ui');
    if (!canvas) return;
    const width = Math.max(1, Math.round(target.clientWidth));
    const height = Math.max(1, Math.round(target.clientHeight));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = getCanvas2dContext(canvas);
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = getWobblyRectPath({ width, height, inset: lineWidth * 0.65, step, wobble, seed });
    drawWobblyStroke(ctx, path);
  }

  function renderEmojiOutline(target, {
    lineWidth = 2.5,
    wobble = 0.9,
    seed = 1,
    color = '#000000',
  } = {}) {
    const maskUrl = readMaskImageUrl(target);
    if (!maskUrl) return;
    const canvas = ensureOutlineCanvas(target, 'emoji');
    if (!canvas) return;
    const width = Math.max(1, Math.round(target.clientWidth));
    const height = Math.max(1, Math.round(target.clientHeight));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const drawToken = `${maskUrl}|${width}|${height}|${lineWidth}|${wobble}|${seed}|${color}`;
    canvas.dataset.wobblyOutlineToken = drawToken;
    loadImage(maskUrl).then((image) => {
      if (!image || !canvas.isConnected) return;
      if (canvas.dataset.wobblyOutlineToken !== drawToken) return;
      const bitmap = getEmojiOutlineBitmap(image, { width, height, lineWidth, wobble, seed, color });
      const ctx = getCanvas2dContext(canvas);
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
    });
  }

  function clearOutline(target, scope) {
    if (!(target instanceof Element)) return;
    target.querySelectorAll(`:scope > canvas[data-wobbly-outline="${scope}"]`).forEach((node) => node.remove());
  }

  return {
    renderRectOutline,
    renderEmojiOutline,
    clearOutline,
    clearCache() {
      imageCache.clear();
      emojiBitmapCache.clear();
      rectPathCache.clear();
    },
  };
}
