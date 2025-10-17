const CONFIG = {
  titleText: "Performance Against Benchmarks",
  scrollText: " Scroll ▼",
  fontSize: 20,
  lineHeight: 24,
  rowHeight: 24,
  sortStartY: 48,
  hoverDuration: 3000
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

const textContainer = document.getElementById('text-container');
const scrollable = document.getElementById('scrollable');

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
let animationReq = null;
let hoveredRow = -1;
let lastHover = 0;
let hoveredLink = null;
let lastSymbolHover = 0;
const elWidthCache = new Map();

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
  const span = document.createElement('span');
  span.style.font = `${CONFIG.fontSize}px Arial, sans-serif`;
  span.style.position = 'absolute';
  span.style.visibility = 'hidden';
  span.style.whiteSpace = 'nowrap';
  span.innerHTML = text.replace(/ /g, '&nbsp;');
  document.body.appendChild(span);
  const width = span.offsetWidth;
  document.body.removeChild(span);
  elWidthCache.set(text, width);
  return width;
}

function computeLayoutParams() {
  marginLeftPx = Math.round(window.innerWidth * 0.0161);
  rightMarginPx = marginLeftPx;
  spaceWidth = getTextWidth(' ');
  charWidth = getTextWidth('A');
  scrollable.style.height = `${window.innerHeight * 2}px`;
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

      const workSpan = document.createElement('span');
      workSpan.className = 'work';
      workSpan.textContent = info.title.work;

      const artistSpan = document.createElement('span');
      artistSpan.className = 'artist';
      artistSpan.textContent = info.title.artist;

      const animSymbolsSpan = document.createElement('span');
      animSymbolsSpan.className = 'anim-symbols';
      info.title.symbols.split('').forEach((char, idx) => {
        const charSpan = document.createElement('span');
        charSpan.className = 'anim-char';
        charSpan.textContent = char;
        charSpan.dataset.idx = idx;
        animSymbolsSpan.appendChild(charSpan);
      });

      const symbolSpan = document.createElement('span');
      symbolSpan.className = 'symbol';
      symbolSpan.textContent = '◍';

      link.appendChild(workSpan);
      link.appendChild(artistSpan);
      link.appendChild(animSymbolsSpan);
      link.appendChild(symbolSpan);

      li.appendChild(link);

      link.addEventListener('mouseenter', () => {
        hoveredLink = link;
        lastSymbolHover = Date.now();
      });

      link.addEventListener('mouseleave', () => {
        hoveredLink = null;
        const animChars = link.querySelectorAll('.anim-char');
        animChars.forEach(el => {
          el.style.transform = 'translateX(0px)';
        });
      });
    } else {
      li.textContent = info.keyForLi;
    }

    li.addEventListener('mouseenter', () => {
      hoveredRow = parseInt(li.dataset.row);
      lastHover = Date.now();
    });

    li.addEventListener('mouseleave', () => {
      hoveredRow = -1;
    });

    alphabetList.appendChild(li);
  });
}

function createChars() {
  textContainer.querySelectorAll('.char').forEach(node => node.remove());
  chars = [];
  charPositions = [];

  const tokens = fullText.split(/(\s+)/);
  let currentX = marginLeftPx;
  let currentY = 0;
  const indent = window.innerWidth * 0.0625;
  currentX += indent;
  const fragment = document.createDocumentFragment();
  let charIndex = 0;

  for (const token of tokens) {
    const tokenWidth = getTextWidth(token.replace(/\s/g, ' '));
    if (currentX + tokenWidth > window.innerWidth - rightMarginPx) {
      currentY += CONFIG.lineHeight;
      currentX = marginLeftPx;
    }

    for (const character of token) {
      const span = document.createElement('span');
      span.className = 'char';
      span.innerHTML = character === ' ' ? '&nbsp;' : character;
      span.dataset.char = character;
      span.dataset.originalY = currentY;
      span.style.left = `${currentX}px`;
      span.style.top = `${currentY}px`;

      const type = charIndex < CONFIG.titleText.length ? 'title' :
                   charIndex < CONFIG.titleText.length + mainText.substring(CONFIG.titleText.length).length ? 'rest' : 'scroll';
      span.dataset.type = type;
      if (type === 'scroll') span.style.color = '#1eff00';

      fragment.appendChild(span);
      const width = getTextWidth(character === ' ' ? ' ' : character);
      charPositions.push({ x: currentX, y: currentY, w: width });
      chars.push(span);
      currentX += width;
      charIndex++;
    }
  }

  textContainer.appendChild(fragment);
}

function assignSubRows() {
  const byKey = {};
  chars.forEach((span, i) => {
    if (span.dataset.type === 'scroll') return;
    const character = span.dataset.char.toUpperCase();
    const key = /[A-Z]/.test(character) ? character : ((character !== ' ' && character.trim() !== '') ? '•' : null);
    if (key) (byKey[key] = byKey[key] || []).push({ el: span, idx: i });
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
        item.el.dataset.subRow = subIndex;
        item.el.dataset.targetRow = charToRowStart[key] + subIndex;
      }
    }
  }
}

function positionElements() {
  const links = document.querySelectorAll('.alphabet a');
  links.forEach(link => {
    const artist = link.querySelector('.artist');
    const symbol = link.querySelector('.symbol');
    const animSymbols = link.querySelector('.anim-symbols');

    const linkRect = link.getBoundingClientRect();
    const artistRect = artist.getBoundingClientRect();
    const symbolRect = symbol.getBoundingClientRect();

    const artistLeft = artistRect.left - linkRect.left;
    const artistWidth = artistRect.width;
    const symbolLeft = symbolRect.left - linkRect.left;

    const gap = symbolLeft - (artistLeft + artistWidth);
    const animWidth = animSymbols.offsetWidth;
    animSymbols.style.left = `${artistLeft + artistWidth + (gap - animWidth) / 2}px`;
  });
}

function animateSymbols() {
  if (hoveredLink) {
    const time = (Date.now() - lastSymbolHover) % CONFIG.hoverDuration;
    const phase = time / CONFIG.hoverDuration * Math.PI * 2;
    const animChars = hoveredLink.querySelectorAll('.anim-char');
    animChars.forEach((el, i) => {
      const deltaX = Math.round(Math.sin(phase + i * 0.8) * 6) * charWidth;
      el.style.transform = `translateX(${deltaX}px)`;
    });
  }
  requestAnimationFrame(animateSymbols);
}

function animateChars() {
  const scrollY = window.scrollY;
  const progress = clamp(scrollY / window.innerHeight, 0, 1);

  chars.forEach((el, i) => {
    const type = el.dataset.type;
    let targetY = parseInt(el.dataset.originalY, 10);
    let vis = 'visible';
    let color = type === 'scroll' ? '#1eff00' : (progress > 0 && type === 'title' ? '#000' : '#678486');
    let transX = 0;

    if (type === 'title') {
    } else if (type === 'scroll') {
      vis = progress > 0 ? 'hidden' : 'visible';
    } else if (type === 'rest' && el.dataset.targetRow != null) {
      const sortY = parseInt(el.dataset.targetRow, 10) * CONFIG.rowHeight + CONFIG.sortStartY;
      targetY = lerp(targetY, sortY, progress);
      targetY = Math.round(targetY / CONFIG.rowHeight) * CONFIG.rowHeight;
      const row = parseInt(el.dataset.targetRow);
      const posX = charPositions[i].x;
      const w = charPositions[i].w;
      if (progress > 0.9) {
        let hide = false;
        if (leftRight[row] && posX < leftRight[row]) hide = true;
        if (hoveredRow === row && rowsWithTitles.has(row)) hide = true;
        vis = hide ? 'hidden' : 'visible';
      }
    }

    el.style.top = `${targetY}px`;
    el.style.visibility = vis;
    el.style.color = color;
    el.style.transform = `translateX(${transX}px)`;
  });

  if (hoveredRow >= 0 && progress > 0.9 && !rowsWithTitles.has(hoveredRow)) {
    const time = (Date.now() - lastHover) % CONFIG.hoverDuration;
    const phase = time / CONFIG.hoverDuration * Math.PI * 2;
    chars.forEach((el, i) => {
      if (parseInt(el.dataset.targetRow) === hoveredRow && el.dataset.type === 'rest') {
        const deltaX = Math.round(Math.sin(phase + i * 0.3) * 3) * charWidth;
        let finalX = charPositions[i].x + deltaX;
        finalX = clamp(finalX, marginLeftPx, window.innerWidth - rightMarginPx - charPositions[i].w);
        el.style.transform = `translateX(${finalX - charPositions[i].x}px)`;
        el.style.visibility = 'visible';
      }
    });
  }

  animationReq = requestAnimationFrame(animateChars);
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
  const marginBottom = width * 0.0052; // 0.52vw
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
  positionElements();
  updateScrollEffects();
};

const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(rebuildAll, 80);
};

const init = () => {
  computeLayoutParams();
  buildTitleAssignments();
  generateAlphabetList();
  createChars();
  assignSubRows();
  positionElements();
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', updateScrollEffects, { passive: true });
  document.addEventListener('mouseleave', () => { hoveredRow = -1; });
  if (animationReq) cancelAnimationFrame(animationReq);
  animateSymbols();
  animationReq = requestAnimationFrame(animateChars);
  updateScrollEffects();
};

window.addEventListener('load', init);
