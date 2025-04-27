// Carrega capítulos e controla navegação
const chaptersPath = './chapters/';
const chapters = ["prologue.md", "chapter-01.md"];
let currentPage = -1 // -1 = capa

const book = document.getElementById('book');

const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const fontDecBtn = document.getElementById('fontDecBtn');
const fontIncBtn = document.getElementById('fontIncBtn');

const cover = document.getElementById('cover');
const pages = document.getElementById('pages');
const reader = document.querySelector('.reader');
const tpl = document.getElementById('back-cover');

let backPage = null;

document.body.addEventListener('click', evt => {
    const btn = evt.target.closest('button');
    if (!btn) return;

    if (btn.id === 'nextBtn') {
        nextPage();
    }
    if (btn.id === 'prevBtn') {
        prevPage();
    }
    if (btn.id === 'fontDecBtn') {
        changeFont(-0.1);
    }
    if (btn.id === 'fontIncBtn') {
        changeFont(+0.1);
    }
})

// Fonte preferida
initFontControls();

/* ----- Navegação ----- */
document.addEventListener('keydown', evt => {
    if (evt.key === 'ArrowRight') nextPage();
    if (evt.key === 'ArrowLeft') prevPage();
    if (evt.key === 'ArrowUp') changeFont(+0.1);
    if (evt.key === 'ArrowDown') changeFont(-0.1);
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
    // Capa?
    if (currentPage === -1) {
        cover.style.display = 'flex';
        pages.style.display = 'none';
        if (backPage) backPage.style.display = 'none';
        return;
    }

    // Texto (capítulos)
    if (currentPage < chapters.length) {
        cover.style.display = 'none';
        pages.style.display = 'block';
        if (backPage) backPage.style.display = 'none';
        // carrega o markdown dentro de #book...
        const res = await fetch(chaptersPath + chapters[currentPage]);
        const md = await res.text();
        const mdWithClasses = md.replace(
            /!\[([^\]]*)\]\(([^)]+)\)\{\.([^\}]+)\}/g,
            '<figure class="$3"><img src="$2" alt="$1"></figure>'
        )
        const html = marked.parse(mdWithClasses).replace(
            /<figure class="fullpage">([\s\S]*?)<\/figure>/g,
            '<section class="page fullpage">$&</section>'
        );       // usa a lib Marked (adicionar via CDN)
        book.innerHTML = `<section class="page">${html}</section>`;
        saveProgress();
        return;
    }

    // ==== Contracapa ====
    if (currentPage === chapters.length) {
        // 1) Esconde capa e páginas
        cover.style.display = 'none';
        pages.style.display = 'none';
    
        // 2) Clona o template UMA vez, se ainda não clonou
        if (!backPage) {
        const clone = tpl.content.cloneNode(true);
        reader.appendChild(clone);
        backPage = document.getElementById('back-cover-page');
        }
    
        // 3) Exibe a contracapa
        backPage.style.display = 'flex';
    
        // 4) Esconder o botão “next” e manter apenas o “prev”
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'block';
        return;
    }
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