// main.js

// ─── Estado global ─────────────────────────────────────────────────────────────
const chaptersPath   = './chapters/';
const chapters       = ['prologue.md', 'chapter-01.md'];

let currentChapter = -1;
let currentPage    = 0;
let totalPages     = 1;
let pageUnit       = 0;    // altura efetiva por página (múltiplo de line-height)

// ─── Elementos do DOM ──────────────────────────────────────────────────────────
const book           = document.getElementById('book');
const cover          = document.getElementById('cover');
const pagesContainer = document.getElementById('pages');
const tpl            = document.getElementById('back-cover');
let backPage         = null;

const nextBtn    = document.getElementById('nextBtn');
const prevBtn    = document.getElementById('prevBtn');
const fontDecBtn = document.getElementById('fontDecBtn');
const fontIncBtn = document.getElementById('fontIncBtn');

// ─── Listeners ─────────────────────────────────────────────────────────────────
document.body.addEventListener('click', evt => {
  const btn = evt.target.closest('button');
  if (!btn) return;
  switch (btn.id) {
    case 'nextBtn':    nextPage();      break;
    case 'prevBtn':    prevPage();      break;
    case 'fontDecBtn': changeFont(-0.1); break;
    case 'fontIncBtn': changeFont(+0.1); break;
  }
});
document.addEventListener('keydown', evt => {
  if      (evt.key === 'ArrowRight') nextPage();
  else if (evt.key === 'ArrowLeft')  prevPage();
  else if (evt.key === 'ArrowUp')    changeFont(+0.1);
  else if (evt.key === 'ArrowDown')  changeFont(-0.1);
});

// ─── Inicialização ─────────────────────────────────────────────────────────────
initFontControls();
loadProgress();
render();

// ─── Função principal de render ─────────────────────────────────────────────────
async function render() {
  // 1) CAPA
  if (currentChapter === -1) {
    cover.style.display         = 'flex';
    pagesContainer.style.display = 'none';
    if (backPage) backPage.style.display = 'none';
    nextBtn.style.display       = 'block';
    prevBtn.style.display       = 'none';
    return;
  }

  // 2) CONTRACAPA
  if (currentChapter === chapters.length) {
    cover.style.display         = 'none';
    pagesContainer.style.display = 'none';
    if (!backPage) {
      const clone = tpl.content.cloneNode(true);
      document.querySelector('.reader').appendChild(clone);
      backPage = document.getElementById('back-cover-page');
    }
    backPage.style.display = 'flex';
    nextBtn.style.display  = 'none';
    prevBtn.style.display  = 'block';
    return;
  }

  // 3) CAPÍTULO
  cover.style.display         = 'none';
  pagesContainer.style.display = 'block';
  if (backPage) backPage.style.display = 'none';
  nextBtn.style.display       = 'block';
  prevBtn.style.display       = 'block';

  // 4) Carrega e parseia Markdown
  const res = await fetch(chaptersPath + chapters[currentChapter]);
  const md  = await res.text();
  const mdWithClasses = md.replace(
    /!\[([^\]]*)\]\(([^)]+)\)\{\.([^\}]+)\}/g,
    '<figure class="$3"><img src="$2" alt="$1"></figure>'
  );
  const html = marked.parse(mdWithClasses);

  // 5) Injeta o fluxo contínuo
  book.innerHTML = `<div class="content">${html}</div>`;
  
  const contentEl = book.querySelector('.content');

  // 6) Calcula altura de página alinhada a linhas inteiras
  const containerHeight = book.clientHeight;
  const lh = parseFloat(getComputedStyle(book).lineHeight);
  const linesPerPage = Math.floor(containerHeight / lh);
  pageUnit = linesPerPage * lh;

  // 7) Calcula total de páginas
  const totalHeight = contentEl.scrollHeight;
  totalPages = Math.ceil(totalHeight / pageUnit);
  currentPage = 0;

  showPage();
  saveProgress();
}

// ─── Exibe a página atual ───────────────────────────────────────────────────────
function showPage() {
  const contentEl = book.querySelector('.content');
  contentEl.style.transform = `translateY(-${currentPage * pageUnit}px)`;

  // controles
  prevBtn.style.display = currentPage > 0 ? 'block' : 'none';
  nextBtn.style.display = currentPage < totalPages - 1 ? 'block' : 'none';
}

// ─── Navegação ─────────────────────────────────────────────────────────────────
function nextPage() {
  if (currentChapter === -1) {
    currentChapter = 0;
    render();
    return;
  }
  if (currentChapter < chapters.length) {
    if (currentPage < totalPages - 1) {
      currentPage++;
      showPage();
      saveProgress();
    } else {
      currentChapter++;
      render();
    }
  }
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    showPage();
    saveProgress();
  } else if (currentChapter > 0) {
    currentChapter--;
    render();
  } else {
    currentChapter = -1;
    render();
  }
}

// ─── Persistência ───────────────────────────────────────────────────────────────
function saveProgress() {
  localStorage.setItem(
    'lastProgress',
    JSON.stringify({ chapter: currentChapter, page: currentPage })
  );
}
function loadProgress() {
  const data = localStorage.getItem('lastProgress');
  if (!data) return;
  try {
    const { chapter, page } = JSON.parse(data);
    currentChapter = chapter;
    currentPage   = page;
  } catch {}
}

// ─── Controles de Fonte ─────────────────────────────────────────────────────────
function initFontControls() {
  const saved = localStorage.getItem('fontSize');
  if (saved) {
    document.documentElement.style.setProperty('--reader-font-size', saved);
  }
}
function changeFont(delta) {
  const root    = document.documentElement;
  const current = parseFloat(getComputedStyle(root).getPropertyValue('--reader-font-size'));
  const next    = (current + delta).toFixed(2) + 'rem';
  root.style.setProperty('--reader-font-size', next);
  localStorage.setItem('fontSize', next);

  // re-renderiza para recalcular pageUnit e totalPages
  if (currentChapter >= 0 && currentChapter < chapters.length) {
    render();
  }
}
