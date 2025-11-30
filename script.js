const CONFIG = {
  margin: '20px',
  marginMobile: '10px',
  indent: '4.62em',
  indentMobile: '0px',
  defaultCharColor: '#678486',
  titleCharColor: '#000000',
  scrollCharColor: '#1eff00',
  hoverBgColor: '#1eff00',
  animationDuration: 3000,
  symbolText: 'о',
  noTitleSymbol: '.,',
  titleText: "Performance against Benchmarks".toUpperCase(),
  scrollText: " Scroll ▼".toUpperCase(),
  uniqueChars: 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('').concat('•')
};

const titlesData = [
  { work: "Autonomy of a Fall !!!", artist: "Soyun Park   &   Olympia Kotopoulos   &   Bregje Benecke", symbols: "scrl⛶⬊", url: "./autonomy-of-a-fall/" },
  { work: "Curse of Dimensionality", artist: "Philipp Schmitt", symbols: "▣∃∰", url: "./curse-of-dimensionality/" },
  { work: "Dandelions", artist: "David Young", symbols: "∎◍⏵◎", url: "./dandelions/" },
  { work: "For Ruth & Violette", artist: "Paul O'Neill", symbols: "◉◍⚿◎", url: "./for-ruth-and-violette/" },
  { work: "Focus", artist: "Adelina Fishova", symbols: "cam⬤⛶", url: "./focus/" },
  { work: "KaoYao", artist: "Luisa Grigorian", symbols: "cam⬤(·∀·)", url: "./kaoyao/" },
  { work: "Mercedes CLR GTR", artist: "Lev Pereulkov   &   Tanya Bronnikova", symbols: "⟳◉≊≋", url: "./mercedes-clr-gtr/" },
  { work: "Polyphonic Embodiment(s)", artist: "Amina Abbas-Nazari", symbols: "◉⍤⏵[⍥]", url: "./polyphonic-embodiments/" },
  { work: "Trajectories", artist: "Adelina Fishova", symbols: "◉⛶⦧⦦", url: "./trajectories/" },
  { work: "Reconstructions", artist: "Allison Parrish", symbols: "⧗⦄Ⅰ⦃", url: "./reconstructions/" },
  { work: "select important things", artist: "Jane Frances Dunlop", symbols: "◉⍍◎▣", url: "./select-important-things/" }
].map(t => ({
  work: t.work.toUpperCase(),
  artist: t.artist.toUpperCase(),
  symbols: t.symbols.toUpperCase(),
  url: t.url
}));

const mainText = (`Performance against Benchmarks inhabits the margins of corporate, goal-driven AI, and feeds on its structures — yet without feeding into its logic. Rather than staging a revolution through acts of resistance, which will inevitably fail, we adopt strategies of quiet co-existence: parasitic, symbiotic, and persistently wrong. Through translation errors, skewed distances, reassembled fragments, and intimate misalignments, each work folds a glitch into the system’s fabric. These are not large refusals to ever use the AI, but small, structural recalibrations — shifts in tone, rhythm, and relation that open up spaces where human and machine share an uneasy, generative terrain. Here, AI is not an engine of optimisation, but a material subject to drift, mistranslation, and poetic misuse — its outputs worn out, its frameworks discreetly rewritten. The title does exactly that — borrowed from the corporate lexicon, where ‘performance against benchmarks’ measures productivity and compliance, here it is interpreted literally — we perform, play, improvise, and wander, testing the edges of any rule or benchmark.`).toUpperCase();
const fullText = CONFIG.titleText + mainText.substring(CONFIG.titleText.length) + CONFIG.scrollText;

const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const scrollable = document.getElementById('scrollable');

let dpr = 1;
let chars = [];
let textWidthCache = new Map();
let rowInfo = [];
let charToRowStart = {};
let charNumSub = {};
let leftRight = {};
let rowsWithTitles = new Set();

let effectiveFontSize = 26;
let effectiveLineHeight = 32;
let rowHeight = 32;
let baselineOffset = 26;
let marginPx = 0;
let indentPx = 0;
let canvasWidth = 0;
let canvasHeight = 0;

let hoveredRow = -1, hoveredLink = null, lastHover = 0, lastSymbolHover = 0;

let isMobile = window.innerWidth <= 800;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t){ return a + (b - a) * t; }

function getTextWidth(text){
  const key = `${text}|${effectiveFontSize.toFixed(3)}`;
  if (textWidthCache.has(key)) return textWidthCache.get(key);
  const w = ctx.measureText(text).width;
  textWidthCache.set(key, w);
  return w;
}

function cssUnitToPx(raw, fontPx){
  if (!raw) return 0;
  raw = raw.trim();
  if (raw.endsWith('px')) return parseFloat(raw);
  if (raw.endsWith('em')) return parseFloat(raw) * fontPx;
  if (raw.endsWith('%')) return parseFloat(raw) / 100 * fontPx;
  return parseFloat(raw) || 0;
}

function updateVisualParams(){
  const bodyStyle = getComputedStyle(document.body);
  effectiveFontSize = parseFloat(bodyStyle.fontSize);
  const lh = bodyStyle.lineHeight;
  effectiveLineHeight = lh.includes('%') ? effectiveFontSize * (parseFloat(lh) / 100) : parseFloat(lh);
  rowHeight = effectiveLineHeight;
  baselineOffset = effectiveFontSize;
isMobile = window.innerWidth <= 800;
  marginPx = cssUnitToPx(isMobile ? CONFIG.marginMobile : CONFIG.margin, effectiveFontSize);
  indentPx = cssUnitToPx(isMobile ? CONFIG.indentMobile : CONFIG.indent, effectiveFontSize);
}

function buildTitleAssignments(){
  charToRowStart = {};
  charNumSub = {};
  rowInfo = [];
  rowsWithTitles.clear();
  leftRight = {};
  const groups = {};
  for (const t of titlesData){
    let key = (t.work[0] || '•').toUpperCase();
    if (!/[A-Z]/.test(key)) key = '•';
    (groups[key] || (groups[key] = [])).push(t);
  }
  let row = 0;
  for (const key of CONFIG.uniqueChars){
    const group = groups[key] || [];
    group.sort((a,b) => a.work.localeCompare(b.work));
    const numRows = Math.max(1, group.length);
    charToRowStart[key] = row;
    charNumSub[key] = numRows;
    for (let sub = 0; sub < numRows; sub++){
      const hasTitle = sub < group.length;
      const title = hasTitle ? group[sub] : null;
      const keyForLi = hasTitle ? null : (key === '•' ? CONFIG.noTitleSymbol : key);
      rowInfo.push({ row, key, subIndex: sub, hasTitle, title, keyForLi });
      if (hasTitle) rowsWithTitles.add(row);
      const text = hasTitle ? title.work : keyForLi;
      leftRight[row] = marginPx + getTextWidth(text) + getTextWidth(' ');
      row++;
    }
  }
}

function computeAlphabetPositions(){
  for (const info of rowInfo){
    if (!info.hasTitle) continue;
    const artistW = getTextWidth(info.title.artist);
    let animW = 0;
    for (const c of info.title.symbols) animW += getTextWidth(c);
    info.artistX = marginPx + (canvasWidth - marginPx * 2) / 3;
    info.symbolX = canvasWidth - marginPx - getTextWidth(CONFIG.symbolText);
    const gap = info.symbolX - (info.artistX + artistW);
    info.animX = info.artistX + artistW + (gap - animW) / 2;
  }
}

function createChars(){
  chars = [];
  const tokens = fullText.split(/(\s+)/);
  let x = marginPx + indentPx;
  let y = 0;
  let originalIndex = 0;
  const titleLen = CONFIG.titleText.length;
  const restLen = mainText.length - titleLen;
  for (const token of tokens){
    const tokenW = getTextWidth(token);
    const isWhitespace = token.trim() === '';
    if (x + tokenW > canvasWidth - marginPx){
      y += rowHeight;
      x = marginPx;
      if (isWhitespace){ originalIndex += token.length; continue; }
    }
    for (const ch of token){
      const w = getTextWidth(ch);
      const type = originalIndex < titleLen ? 'title' : (originalIndex < titleLen + restLen ? 'rest' : 'scroll');
      chars.push({ text: ch, x, originalY: y, type, targetRow: undefined, subRow: undefined, vis: true, color: CONFIG.defaultCharColor, transX: 0, targetY: y, w });
      x += w; originalIndex++;
    }
  }
if (isMobile) {
  for (const ch of chars) {
    if (ch.type === 'rest' && Math.random() < 0.6) {
      ch.hideAt = 0.1 + Math.random() * 0.9;
    }
  }
}
  canvasHeight = y + rowHeight;
}

function assignSubRows(){
  const byKey = {};
  for (let i = 0; i < chars.length; i++){
    const ch = chars[i];
    if (ch.type === 'scroll') continue;
    const character = ch.text.toUpperCase();
    const key = /[A-Z]/.test(character) ? character : (character.trim() !== '' ? '•' : null);
    if (key) (byKey[key] || (byKey[key] = [])).push({ obj: ch, idx: i });
  }
  for (const key in byKey){
    const arr = byKey[key];
    shuffle(arr);
    const numSub = charNumSub[key] || 1;
    const per = Math.floor(arr.length / numSub);
    const extra = arr.length % numSub;
    let p = 0;
    for (let sub = 0; sub < numSub; sub++){
      const cnt = per + (sub < extra ? 1 : 0);
      for (let c = 0; c < cnt; c++){
        const it = arr[p++];
        it.obj.subRow = sub;
        it.obj.targetRow = charToRowStart[key] + sub;
      }
    }
  }
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function animate(){
  const now = Date.now();
  const scrollY = window.scrollY;
  const progress = clamp(scrollY / window.innerHeight, 0, 1);
  const alphabetVisible = progress >= 0.9;
  const efRowH = rowHeight;
  const efSortY = rowHeight * 2;
  for (let i = 0; i < chars.length; i++){
    const ch = chars[i];
  if (isMobile && ch.hideAt !== undefined && progress >= ch.hideAt) {
    ch.vis = false;
    continue;
  }
    ch.targetY = ch.originalY;
    ch.vis = true;
    ch.color = ch.type === 'scroll' ? CONFIG.scrollCharColor : CONFIG.defaultCharColor;
    ch.transX = 0;
    if (ch.type === 'title' && progress > 0.01) ch.color = CONFIG.titleCharColor;
    else if (ch.type === 'scroll') ch.vis = progress <= 0.01;
    else if (ch.type === 'rest' && ch.targetRow !== undefined){
      const sortY = ch.targetRow * efRowH + efSortY;
      ch.targetY = lerp(ch.originalY, sortY, progress);
      ch.targetY = Math.round(ch.targetY / efRowH) * efRowH;
      if (progress > 0.9){
        let hide = false;
        const posX = ch.x;
        if (leftRight[ch.targetRow] && posX < leftRight[ch.targetRow]) hide = true;
        if (hoveredRow === ch.targetRow && rowsWithTitles.has(ch.targetRow)) hide = true;
        ch.vis = !hide;
      }
    }
    if (hoveredRow >= 0 && progress > 0.9 && !rowsWithTitles.has(hoveredRow) && !isMobile){
      if (ch.targetRow === hoveredRow && ch.type === 'rest'){
        const time = (now - lastHover) % CONFIG.animationDuration;
        const phase = time / CONFIG.animationDuration * Math.PI * 2 + i * 0.3;
        const step = Math.round(Math.sin(phase) * 3);
        const deltaX = step * getTextWidth('A');
        let finalX = ch.x + deltaX;
        finalX = clamp(finalX, marginPx, canvasWidth - marginPx - ch.w);
        ch.transX = finalX - ch.x;
      }
    }
  }

  let maxY = 0;
  for (const ch of chars) if (ch.vis) maxY = Math.max(maxY, ch.targetY + rowHeight);
  if (alphabetVisible) maxY = Math.max(maxY, efSortY + rowInfo.length * rowHeight);
  if (Math.abs(canvasHeight - maxY) > 1){
    canvasHeight = maxY;
    canvas.style.height = canvasHeight + 'px';
    canvas.height = canvasHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.font = `${effectiveFontSize}px ${getComputedStyle(document.body).fontFamily}`;
  for (const ch of chars){
    if (!ch.vis) continue;
    ctx.fillStyle = ch.color;
    ctx.fillText(ch.text, ch.x + ch.transX, ch.targetY + baselineOffset);
  }
  if (alphabetVisible){
    const timeSym = (now - lastSymbolHover) % CONFIG.animationDuration;
    const phaseBase = timeSym / CONFIG.animationDuration * Math.PI * 2;
    for (const info of rowInfo){
      const rowTopY = efSortY + info.row * rowHeight;
      const baselineY = rowTopY + baselineOffset;
      const isHovered = hoveredRow === info.row;
      if (info.hasTitle && isHovered){
        ctx.fillStyle = CONFIG.hoverBgColor;
        ctx.fillRect(marginPx, rowTopY, canvasWidth - marginPx * 2, rowHeight);
      }
      ctx.fillStyle = info.hasTitle ? CONFIG.titleCharColor : CONFIG.defaultCharColor;
      if (info.hasTitle){
        ctx.fillText(info.title.work, marginPx, baselineY);
        if (!isMobile && isHovered){
          ctx.fillText(info.title.artist, info.artistX, baselineY);
          ctx.fillText(CONFIG.symbolText, info.symbolX, baselineY);
          let currentX = info.animX;
          for (let idx = 0; idx < info.title.symbols.length; idx++){
            const ch = info.title.symbols[idx];
            const phase = phaseBase + idx * 0.8;
            const step = Math.round(Math.sin(phase) * 6);
            const deltaX_raw = step * getTextWidth('A');
            const charW = getTextWidth(ch);
            const baseX = currentX;
            let finalX = baseX + deltaX_raw;
            finalX = clamp(finalX, marginPx, canvasWidth - marginPx - charW);
            const deltaX = finalX - baseX;
            ctx.fillText(ch, baseX + deltaX, baselineY);
            currentX += charW;
          }
        }
      } else {
        ctx.fillText(info.keyForLi, marginPx, baselineY);
      }
    }
  }
  requestAnimationFrame(animate);
}

function rebuildAll(){
  dpr = window.devicePixelRatio || 1;
  canvasWidth = window.innerWidth;
  updateVisualParams();
  canvas.width = canvasWidth * dpr;
  ctx.font = `${effectiveFontSize}px ${getComputedStyle(document.body).fontFamily}`;
  textWidthCache.clear();
  buildTitleAssignments();
  createChars();
  assignSubRows();
  computeAlphabetPositions();
  canvas.style.height = canvasHeight + 'px';
  canvas.height = canvasHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initInteraction(){
  canvas.addEventListener('mousemove', (e) =>{
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvasHeight / rect.height);
    let newHoveredRow = -1, newHoveredLink = null;
    const progress = clamp(window.scrollY / window.innerHeight, 0, 1);
    if (progress >= 0.9){
      for (const info of rowInfo){
        const rowTopY = rowHeight * 2 + info.row * rowHeight;
        const rowBottomY = rowTopY + rowHeight;
        if (mouseX >= marginPx && mouseX <= canvasWidth - marginPx && mouseY >= rowTopY && mouseY < rowBottomY){
          newHoveredRow = info.row;
          if (info.hasTitle) newHoveredLink = info;
          break;
        }
      }
    }
    if (newHoveredRow !== hoveredRow){ hoveredRow = newHoveredRow; lastHover = Date.now(); }
    if (newHoveredLink !== hoveredLink){ hoveredLink = newHoveredLink; lastSymbolHover = Date.now(); }
    canvas.style.cursor = newHoveredLink ? 'pointer' : 'default';
  });
  canvas.addEventListener('mouseleave', () => { hoveredRow = -1; hoveredLink = null; canvas.style.cursor = 'default'; });
  canvas.addEventListener('click', () => { if (hoveredLink) window.location.href = hoveredLink.title.url; });
}

window.addEventListener('load', () => { rebuildAll(); initInteraction(); requestAnimationFrame(animate); });
window.addEventListener('resize', () => { clearTimeout(window.__resizeTimer); window.__resizeTimer = setTimeout(rebuildAll, 0); });

const arrow = document.querySelector('.arrow');
const updateScrollProgress = () => {
  const h = document.documentElement;
  const p = (window.pageYOffset || h.scrollTop) / (h.scrollHeight - window.innerHeight);
  arrow.style.setProperty('--scroll-progress', Math.max(0, Math.min(1, p || 0)));
};

window.addEventListener('scroll', updateScrollProgress);
window.addEventListener('resize', updateScrollProgress);
