const CONFIG = {
  titleText: "Performance Against Benchmarks",
  scrollText: " Scroll ▼",
  fontSize: 20,
  lineHeight: 24,
  rowHeight: 24,
  sortStartY: 48
};

const mainText = `Performance Against Benchmarks inhabits the margins of corporate, goal-driven AI, and feeding on its structures — without feeding into its logic. Rather than staging a revolution through acts of resistance, which will inevitably fail, works of the pavilion adopt strategies of quiet co-existence: parasitic, symbiotic, and persistently askew or wrong. Through translation errors, skewed distances, reassembled fragments, and intimate misalignments, each work folds a glitch into the system’s fabric. These are not large refusals to ever use the AI, but small, structural recalibrations — shifts in tone, rhythm, and relation that open up spaces where human and machine share an uneasy, generative terrain. Here, AI is not an engine of optimisation, but a material subject to drift, mistranslation, and poetic misuse — its outputs worn out, its frameworks discreetly rewritten. The title does exactly that – borrowed from the corporate lexicon, where 'performance against benchmarks' measures productivity and compliance, here it is interpreted literary: 'to perform' – to play, to improvise, to wander; to be 'against' does not just measure relation, but becomes a preposition of refuse, of pressing back, testing the edges of any rule and benchmark.`;

const fullText = CONFIG.titleText + mainText.substring(CONFIG.titleText.length) + CONFIG.scrollText;

const titles = [
  { work: "Autonomy of a Fall", artist: "Soyun Park   &   Olympia Kotopoulos   &   Bregje Benecke", symbols: "scrl⛶⬊", url: "./autonomy-of-a-fall/" },
  { work: "Curse of Dimensionality", artist: "Philipp Schmitt", symbols: "▣∃∰", url: "./curse-of-dimensionality/" },
  { work: "Dandelions", artist: "David Young", symbols: "∎◍⏵◎", url: "./dandelions/" },
  { work: "For Ruth & Violette", artist: "Paul O'Neill", symbols: "◉◍⚿◎", url: "./for-ruth-and-violette/" },
  { work: "Focus", artist: "Adelina Fishova", symbols: "cam⬤⛶", url: "./focus/" },
  { work: "KaoYao", artist: "Luisa Grigorian", symbols: "cam⬤(·∀·)", url: "./kaoyao/" },
  { work: "Mercedes CLR GTR", artist: "Lev Pereulkov   &   Tanya Bronnikova", symbols: "⟳◉≊≋", url: "./meltdown/" },
  { work: "Polyphonic Embodiment(s)", artist: "Amina Abbas-Nazari", symbols: "◉⍤⏵[⍥]", url: "./polyphonic-embodiments/" },
  { work: "Trajectories", artist: "Adelina Fishova", symbols: "◉⛶⦧⦦", url: "./pathways/" },
  { work: "Reconstructions", artist: "Allison Parrish", symbols: "⧗⦄Ⅰ⦃", url: "./reconstructions/" },
  { work: "select important things", artist: "Jane Frances Dunlop", symbols: "◉⍍◎▣", url: "./select-important-things/" }
];

const canvas = document.getElementById('text-canvas');
const ctx = canvas.getContext('2d');

let chars = [];
let charPositions = [];
let charWidth = 0;
let marginLeftPx = 0;
let rightMarginPx = 0;
let spaceWidth = 0;
let charToRowStart = {};
let charNumSub = {};
let rowInfo = [];
let leftRight = {};
let rowsWithTitles = new Set();
const elWidthCache = new Map();
let lastProgress = -1;
let isMobile = false;
let dpr = 1;
let animationReq = null;

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getTextWidth(text) {
  if (elWidthCache.has(text)) return elWidthCache.get(text);
  const width = ctx.measureText(text).width;
  elWidthCache.set(text, width);
  return width;
}

function computeLayoutParams() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.font = `${CONFIG.fontSize}px Arial, sans-serif`;
  ctx.textBaseline = 'top';

  marginLeftPx = Math.round(window.innerWidth * 0.0161);
  rightMarginPx = marginLeftPx;
  spaceWidth = getTextWidth(' ');
  charWidth = getTextWidth('A');
}

function buildTitleAssignments() {
  charToRowStart = {};
  charNumSub = {};
  rowInfo = [];
  rowsWithTitles.clear();
  leftRight = {};

  const uniqueChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat('•');

  const groups = titles.reduce((acc, title) => {
    let key = title.work[0]?.toUpperCase() || '•';
    if (!/[A-Z]/.test(key)) key = '•';
    acc[key] = acc[key] || [];
    acc[key].push(title);
    return acc;
  }, {});

  let rowIndex = 0;
  for (const key of uniqueChars) {
    const group = groups[key] || [];
    group.sort((a, b) => a.work.toLowerCase().localeCompare(b.work.toLowerCase()));
    const numRows = Math.max(1, group.length);
    charToRowStart[key] = rowIndex;
    charNumSub[key] = numRows;

    for (let subIndex = 0; subIndex < numRows; subIndex++) {
      const row = rowIndex;
      const hasTitle = subIndex < group.length;
      let theTitle = null;
      let keyForLi = key;
      if (hasTitle) {
        theTitle = group[subIndex];
        rowsWithTitles.add(row);
      } else if (key === '•') {
        keyForLi = '.,';
      }
      rowInfo.push({ row, key, subIndex, hasTitle, title: theTitle, keyForLi });
      let text = hasTitle ? theTitle.work : keyForLi;
      leftRight[row] = marginLeftPx + getTextWidth(text) + spaceWidth;
      rowIndex++;
    }
  }
}

function generateAlphabetList() {
  const alphabetList = document.getElementById('alphabet-list');
  alphabetList.innerHTML = '';
  rowInfo.forEach(info => {
    const li = document.createElement('li');
    li.dataset.row = info.row;
    if (info.hasTitle) {
      const link = document.createElement('a');
      link.href = info.title.url;
      link.textContent = info.title.work;
      li.appendChild(link);
    } else {
      li.textContent = info.keyForLi;
    }
    alphabetList.appendChild(li);
  });
}

function createChars() {
  chars = [];
  charPositions = [];

  const tokens = fullText.split(/(\s+)/);
  let currentX = marginLeftPx;
  let currentY = 0;
  const indent = window.innerWidth * 0.0625;
  currentX += indent;
  let charIndex = 0;

  for (const token of tokens) {
    const tokenUpper = token.toUpperCase();
    const tokenWidth = getTextWidth(tokenUpper);
    if (currentX + tokenWidth > window.innerWidth - rightMarginPx) {
      currentY += CONFIG.lineHeight;
      currentX = marginLeftPx;
    }

    for (const character of token) {
      const upperChar = character.toUpperCase();
      const text = upperChar === ' ' ? ' ' : upperChar;
      const type = charIndex < CONFIG.titleText.length ? 'title' :
                   charIndex < CONFIG.titleText.length + mainText.substring(CONFIG.titleText.length).length ? 'rest' : 'scroll';
      const obj = {
        text,
        x: currentX,
        y: currentY,
        type,
        char: upperChar,
        width: getTextWidth(text)
      };
      chars.push(obj);
      charPositions.push({ x: currentX, y: currentY, w: obj.width });
      currentX += obj.width;
      charIndex++;
    }
  }
}

function assignSubRows() {
  const byKey = {};
  chars.forEach((obj, i) => {
    if (obj.type === 'scroll') return;
    const key = /[A-Z]/.test(obj.char) ? obj.char : ((obj.char !== ' ' && obj.char.trim() !== '') ? '•' : null);
    if (key) (byKey[key] = byKey[key] || []).push({ obj, idx: i });
  });

  for (const key in byKey) {
    const array = byKey[key];
    shuffle(array);
    const numSub = charNumSub[key] || 1;
    const perSub = Math.floor(array.length / numSub);
    const extra = array.length % numSub;
    let pointer = 0;

    for (let subIndex = 0; subIndex < numSub; subIndex++) {
      const count = perSub + (subIndex < extra ? 1 : 0);
      for (let c = 0; c < count; c++) {
        const item = array[pointer++];
        item.obj.subRow = subIndex;
        item.obj.targetRow = charToRowStart[key] + subIndex;
      }
    }
  }
}

function updateChars() {
  const scrollY = window.scrollY;
  const progress = clamp(scrollY / window.innerHeight, 0, 1);

  if (progress === lastProgress || (isMobile && Math.abs(progress - lastProgress) < 0.02)) {
    animationReq = requestAnimationFrame(updateChars);
    return;
  }

  lastProgress = progress;

  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  chars.forEach((obj, i) => {
    const type = obj.type;
    const originalY = obj.y;
    const originalX = obj.x;
    let targetY = originalY;
    let vis = 'visible';
    let color = type === 'scroll' ? '#1eff00' : (progress > 0 && type === 'title' ? '#000' : '#678486');

    if (type === 'title') {
      // stays the same
    } else if (type === 'scroll') {
      vis = progress > 0 ? 'hidden' : 'visible';
    } else if (type === 'rest' && obj.targetRow != null) {
      const sortY = obj.targetRow * CONFIG.rowHeight + CONFIG.sortStartY;
      let lerped = lerp(originalY, sortY, progress);
      targetY = Math.round(lerped / CONFIG.rowHeight) * CONFIG.rowHeight;
      const row = obj.targetRow;
      const posX = charPositions[i].x;
      if (progress > 0.9) {
        let hide = false;
        if (leftRight[row] && posX < leftRight[row]) hide = true;
        vis = hide ? 'hidden' : 'visible';
      }
    }

    if (vis === 'visible') {
      ctx.fillStyle = color;
      ctx.fillText(obj.text, originalX, targetY);
    }
  });

  animationReq = requestAnimationFrame(updateChars);
}

function updateScrollEffects() {
  const scrollY = window.scrollY;
  const height = window.innerHeight;
  const width = window.innerWidth;
  const progress = Math.min(1, scrollY / height);

  const alphabet = document.querySelector('.alphabet');

  if (progress >= 0.9) {
    alphabet.style.opacity = 1;
    alphabet.classList.add('visible');
  } else {
    alphabet.style.opacity = 0;
    alphabet.classList.remove('visible');
  }

  const arrow = document.querySelector('.d-arrow');
  const initialWidth = width * 0.9677;
  const finalWidth = 95;
  const newWidth = lerp(initialWidth, finalWidth, progress);
  const newHeight = newWidth * (50 / 95);
  const newLeft = (width - newWidth) / 2;
  const marginBottom = width * 0.0052;
  const initialTop = height / 2;
  const finalTop = height - newHeight - marginBottom;
  const newTop = lerp(initialTop, finalTop, progress);
  const translateY = progress < 1 ? 'translateY(-50%)' : '';

  arrow.style.width = `${newWidth}px`;
  arrow.style.height = `${newHeight}px`;
  arrow.style.left = `${newLeft}px`;
  arrow.style.top = `${newTop}px`;
  arrow.style.transform = `${translateY} rotate(${lerp(0, 180, progress)}deg)`;
}

let resizeTimer = null;
const rebuildAll = () => {
  computeLayoutParams();
  createChars();
  assignSubRows();
  updateScrollEffects();
};

const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(rebuildAll, 80);
};

const init = () => {
  isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
  computeLayoutParams();
  buildTitleAssignments();
  generateAlphabetList();
  createChars();
  assignSubRows();
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', updateScrollEffects, { passive: true });
  if (animationReq) cancelAnimationFrame(animationReq);
  animationReq = requestAnimationFrame(updateChars);
  updateScrollEffects();
};

window.addEventListener('load', init);
