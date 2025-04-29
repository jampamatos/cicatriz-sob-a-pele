// main.js

// ─── Estado global ─────────────────────────────────────────────────────────────
const chaptersPath   = './chapters/';
const chapters       = ['prefacio.md','prologo.md', 'capitulo-01.md'];

let currentChapter = -1;  // -1 = capa, 0 = folha de rosto, 1...N = capítulos, N+1 = contracapa
let currentPage    = 0;   // página dentro do capítulo
let totalPages     = 1;
let pageUnit       = 0;   // altura efetiva por página (múltiplo de line-height)

// ─── Elementos do DOM ──────────────────────────────────────────────────────────
const book           = document.getElementById('book');
const cover          = document.getElementById('cover');
const titlePage      = document.getElementById('title-page');
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
    case 'nextBtn':    nextPage();       break;
    case 'prevBtn':    prevPage();       break;
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
    cover.style.display           = 'flex';
    titlePage.style.display       = 'none';
    pagesContainer.style.display  = 'none';
    if (backPage) backPage.style.display = 'none';
    nextBtn.style.display         = 'block';
    prevBtn.style.display         = 'none';
    return;
  }

  // 2) FOLHA DE ROSTO
  if (currentChapter === 0) {
    cover.style.display           = 'none';
    titlePage.style.display       = 'flex';
    pagesContainer.style.display  = 'none';
    if (backPage) backPage.style.display = 'none';
    nextBtn.style.display         = 'block';
    prevBtn.style.display         = 'block';
    return;
  }

  // 3) CAPÍTULOS
  if (currentChapter >= 1 && currentChapter <= chapters.length) {
    cover.style.display           = 'none';
    titlePage.style.display       = 'none';
    pagesContainer.style.display  = 'block';
    if (backPage) backPage.style.display = 'none';
    nextBtn.style.display         = 'block';
    prevBtn.style.display         = 'block';

    // índice correto no array de capítulos
    const idx = currentChapter - 1;
    const res = await fetch(chaptersPath + chapters[idx]);
    const md  = await res.text();
    const mdWithClasses = md.replace(
      /!\[([^\]]*)\]\(([^)]+)\)\{\.([^\}]+)\}/g,
      '<figure class="$3"><img src="$2" alt="$1"></figure>'
    );
    const html = marked.parse(mdWithClasses);

    book.innerHTML = `<div class="content">${html}</div>`;
    const contentEl = book.querySelector('.content');

    // recálculo de páginas
    const containerHeight = book.clientHeight;
    const lh = parseFloat(getComputedStyle(book).lineHeight);
    const linesPerPage = Math.floor(containerHeight / lh);
    pageUnit = linesPerPage * lh;
    totalPages = Math.ceil(contentEl.scrollHeight / pageUnit);
    currentPage = 0;

    showPage();
    saveProgress();
    return;
  }

  // 4) CONTRACAPA
  if (currentChapter === chapters.length + 1) {
    cover.style.display           = 'none';
    titlePage.style.display       = 'none';
    pagesContainer.style.display  = 'none';
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
}

// ─── Exibe a página atual dentro de um capítulo ────────────────────────────────
function showPage() {
  const contentEl = book.querySelector('.content');
  contentEl.style.transform = `translateY(-${currentPage * pageUnit}px)`;
  prevBtn.style.display = currentPage > 0 ? 'block' : 'none';
  nextBtn.style.display = currentPage < totalPages - 1 ? 'block' : 'none';
}

// ─── Navegação entre seções e páginas ─────────────────────────────────────────
function nextPage() {
  // se dentro de um capítulo, tenta avançar de página
  if (currentChapter >= 1 && currentChapter <= chapters.length) {
    if (currentPage < totalPages - 1) {
      currentPage++;
      showPage();
      saveProgress();
      return;
    }
  }
  // senão, vai para a próxima seção
  if (currentChapter < chapters.length + 1) {
    currentChapter++;
    currentPage = 0;
    render();
  }
}

function prevPage() {
  // se dentro de um capítulo, tenta voltar de página
  if (currentChapter >= 1 && currentChapter <= chapters.length) {
    if (currentPage > 0) {
      currentPage--;
      showPage();
      saveProgress();
      return;
    }
  }
  // senão, volta para a seção anterior
  if (currentChapter > -1) {
    currentChapter--;
    currentPage = 0;
    render();
  }
}

// ─── Persistência do progresso ──────────────────────────────────────────────────
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

// ─── Controles de fonte ─────────────────────────────────────────────────────────
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
  if (currentChapter >= 1 && currentChapter <= chapters.length) {
    render();
  }
}
