// Contato: o número fica só aqui. Links com data-wa recebem a mensagem pronta.
const CONTATO = { whatsapp: '5548920009055' };

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// WhatsApp com mensagem contextual (sem JS o link funciona sem a mensagem)
document.querySelectorAll('[data-wa]').forEach((a) => {
  a.href = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(a.dataset.wa)}`;
});

// Sinaliza que o script iniciou (o index.html desliga as animações de rolagem se isso não acontecer)
document.documentElement.classList.add('is-ready');

// Revelação na rolagem, com atraso escalonado entre irmãos.
// Conferida no mesmo quadro da rolagem: o que já entrou na tela (ou ficou acima dela) aparece.
let aRevelar = [...document.querySelectorAll('[data-reveal]')];
if (reduzido) {
  aRevelar.forEach((el) => el.classList.add('is-in'));
  aRevelar = [];
} else {
  aRevelar.forEach((el) => {
    const irmaos = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    const i = irmaos.indexOf(el);
    if (i > 0) el.style.setProperty('--rd', `${Math.min(i, 5) * 80}ms`);
  });
}
function revelar(vh) {
  if (!aRevelar.length) return;
  aRevelar = aRevelar.filter((el) => {
    if (el.getBoundingClientRect().top < vh * 0.9) { el.classList.add('is-in'); return false; }
    return true;
  });
}

// Navegação: fundo ao rolar, modo escuro sobre o showcase e indicador da seção ativa
const nav = document.querySelector('[data-nav]');
const showcase = document.querySelector('[data-showcase]');
const steps = document.querySelector('[data-steps]');
const links = [...document.querySelectorAll('.nav__links a')];
const indicador = document.querySelector('.nav__indicator');
const secoes = links.map((a) => document.querySelector(a.hash)).filter(Boolean);
const parallax = reduzido ? [] : [...document.querySelectorAll('[data-speed]')];

function moverIndicador(link) {
  if (!indicador) return;
  if (!link) { indicador.style.setProperty('--o', 0); return; }
  indicador.style.setProperty('--x', `${link.offsetLeft + 14}px`);
  indicador.style.setProperty('--w', `${link.offsetWidth - 28}px`);
  indicador.style.setProperty('--o', 1);
}

let pendente = false;
function quadro() {
  pendente = false;
  const vh = innerHeight;
  const y = scrollY;

  nav.classList.toggle('is-scrolled', y > 24);
  revelar(vh);

  if (showcase) {
    const r = showcase.getBoundingClientRect();
    nav.classList.toggle('is-dark', r.top < 72 && r.bottom > 72);
    if (!reduzido) showcase.style.setProperty('--p', clamp(1 - r.top / (vh * 0.9), 0, 1).toFixed(3));
  }

  if (steps && !reduzido) {
    const r = steps.getBoundingClientRect();
    steps.style.setProperty('--prog', clamp((vh * 0.7 - r.top) / r.height, 0, 1).toFixed(3));
  } else if (steps) {
    steps.style.setProperty('--prog', 1);
  }

  // Seção ativa: a última cujo topo já passou do meio da tela
  let ativa = null;
  secoes.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.45) ativa = links[i]; });
  const final = document.querySelector('.final');
  if (final && final.getBoundingClientRect().top < vh * 0.45) ativa = null;
  links.forEach((a) => a.classList.toggle('is-active', a === ativa));
  moverIndicador(ativa);

  // Parallax leve: só transform, proporcional à distância do centro da tela
  parallax.forEach((el) => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const centro = r.top + r.height / 2 - vh / 2;
    el.style.setProperty('--py', `${(-centro * parseFloat(el.dataset.speed)).toFixed(1)}px`);
  });
}
const agendar = () => { if (!pendente) { pendente = true; requestAnimationFrame(quadro); } };
addEventListener('scroll', agendar, { passive: true });
addEventListener('resize', agendar);
quadro();

// Feedback de clique nos botões
document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('pointerdown', (e) => {
    if (reduzido) return;
    const r = btn.getBoundingClientRect();
    const onda = document.createElement('span');
    onda.className = 'ripple';
    onda.style.left = `${e.clientX - r.left}px`;
    onda.style.top = `${e.clientY - r.top}px`;
    btn.appendChild(onda);
    onda.addEventListener('animationend', () => onda.remove());
  });
});
