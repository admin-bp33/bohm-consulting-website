document.documentElement.classList.add('js');
/* No dependencies, tracking, remote fonts or scroll interception. */
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu(returnFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Apri menu');
  navigation.classList.remove('open');
  header.classList.remove('menu-open');
  document.body.classList.remove('menu-is-open');
  document.querySelectorAll('main, footer').forEach(el => el.inert = false);
  navigation.inert = true;
  if (returnFocus) menuButton.focus();
}
function openMenu() {
  menuButton.setAttribute('aria-expanded','true');
  menuButton.setAttribute('aria-label','Chiudi menu');
  navigation.inert = false;
  navigation.classList.add('open');
  header.classList.add('menu-open');
  document.body.classList.add('menu-is-open');
  document.querySelectorAll('main, footer').forEach(el => el.inert = true);
  navigation.querySelector('a').focus();
}
navigation.inert = true;
menuButton.addEventListener('click', () => menuButton.getAttribute('aria-expanded') === 'true' ? closeMenu(true) : openMenu());
header.addEventListener('click', event => { if(event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if(menuButton.getAttribute('aria-expanded') !== 'true') return;
  if(event.key === 'Escape') { closeMenu(true); return; }
  if(event.key === 'Tab') {
    const items=[...header.querySelectorAll('a,button')];
    const first=items[0],last=items.at(-1);
    if(event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if(!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

/* Replace each null URL independently once its approved destination exists. */
const booking = { project: null, checkup: null };
const messages = {
  project: ['Parliamo del tuo progetto.', 'La prenotazione sarà disponibile a breve. Il calendario per parlare del tuo progetto non è ancora attivo.'],
  checkup: ['Collaudo commerciale', 'La prenotazione della sessione di 60 minuti sarà disponibile a breve. Il calendario non è ancora attivo.'],
  privacy: ['Privacy', 'Informativa in attesa di pubblicazione. In questa anteprima non vengono raccolte email né inviate richieste di prenotazione.'],
  cookies: ['Cookie Policy', 'Documento in attesa di pubblicazione. Questa anteprima non utilizza cookie, strumenti di analisi o contenuti incorporati di terze parti.']
};
const dialog = document.querySelector('#notice');
document.querySelectorAll('[data-booking], [data-info]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.booking || button.dataset.info;
    if (button.dataset.booking && booking[key]) { window.location.assign(booking[key]); return; }
    document.querySelector('#notice-title').textContent = messages[key][0];
    document.querySelector('#notice-text').textContent = messages[key][1];
    dialog.showModal();
  });
});
dialog?.querySelectorAll('.dialog-close, .dialog-done').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog?.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});
