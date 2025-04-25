// Carrega capítulos e controla navegação
const chaptersPath = './chapters/';
const chapters = ["prologue.md", "chapter-01.md"];
let currentPage = -1 // -1 = capa

const book = document.getElementById('book');

const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const fontDecBtn = document.getElementById('fontDecBtn');
const fontIncBtn = document.getElementById('fontIncBtn');

// Fonte preferida
initFontControls();

/* ----- Navegação ----- */
nextBtn.addEventListener('click', nextPage);
prevBtn.addEventListener('click', prevPage);
document.addEventListener('keydown', evt => {
    if (evt.key === 'ArrowRight') nextPage();
    if (evt.key === 'ArrowLeft') prevPage();
});

function nextPage() {
    if (currentPage < chapters.length) currentPage++;
    render();
}

function prevPage() {
    if (currentPage > -1) currentPage--;
    render();
}

async function render() {
    const cover = document.getElementById('cover');


    // Capa?
    if (currentPage === -1) {
        cover.style.display = 'flex';
        book.innerHTML = '';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        return;
    }

    // Páginas
    cover.style.display = 'none';
    prevBtn.style.display = 'block';
    nextBtn.style.display = 'block';

    // Contracapa?
    if (currentPage === chapters.length) {
        book.innerHTML = document.getElementById('back-cover').innerHTML;
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'none';
        return;
    }

    // Capítulo
    const res = await fetch(chaptersPath + chapters[currentPage]);
    const md = await res.text();
    const html = marked.parse(md);       // usa a lib Marked (adicionar via CDN)
    book.innerHTML = `<section class="page">${html}</section>`;
    saveProgress();
}

/* ----- Persistência ----- */
function saveProgress() {
    localStorage.setItem('lastPage', currentPage);
}

function loadProgress() {
    const p = parseInt(localStorage.getItem('lastPage'));
    if (!isNaN(p)) currentPage = p;
}
loadProgress();

/* ----- Controles de Fonte ----- */
function initFontControls() {
    const saved = localStorage.getItem('fontSize');
    if (saved) document.documentElement.style.setProperty('--reader-font-size', saved);

    fontDecBtn.addEventListener('click', () => changeFont(-0.1));
    fontIncBtn.addEventListener('click', () => changeFont(+0.1));
}

initFontControls();

function changeFont(delta) {
    const root = document.documentElement;
    const current = parseFloat(getComputedStyle(root).getPropertyValue('--reader-font-size'));
    const next = (current + delta).toFixed(2) + 'rem';
    root.style.setProperty('--reader-font-size', next);
    localStorage.setItem('fontSize', next);
    render(); // re-render pra recalcular quebras no futuro
}

/* Primeira renderização */
render();