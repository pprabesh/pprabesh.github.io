(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    root.classList.add('js');

    /* ---------- Helpers ---------- */
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const toastEl = $('#toast');
    let toastTimer;
    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2000);
    }
    // Single source of truth: the email shown in the Contact section
    const emailLink = $('.email-link');
    const getEmail = () => (emailLink ? emailLink.textContent.trim() : '');

    $('#year').textContent = new Date().getFullYear();
    if (!isMac) $$('.kbd-mod, .hint kbd:first-child').forEach(k => (k.textContent = 'Ctrl'));

    /* ---------- Theme toggle ---------- */
    function currentTheme() {
        return root.dataset.theme ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    function toggleTheme() {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) {}
        toast(next === 'dark' ? '🌙 Dark mode' : '☀️ Light mode');
    }
    $('#theme-toggle').addEventListener('click', toggleTheme);

    /* ---------- Typing effect ---------- */
    const words = ['fast', 'accessible', 'pixel-perfect', 'AI-powered', 'delightful'];
    const typed = $('#typed');
    if (!reduceMotion && typed) {
        let w = 0, i = words[0].length, deleting = true;
        const tick = () => {
            typed.textContent = words[w].slice(0, i);
            if (deleting) {
                i--;
                if (i < 0) { deleting = false; w = (w + 1) % words.length; i = 0; }
                setTimeout(tick, 45);
            } else {
                i++;
                if (i > words[w].length) { deleting = true; i = words[w].length; setTimeout(tick, 1800); return; }
                setTimeout(tick, 85);
            }
        };
        setTimeout(tick, 1800);
    }

    /* ---------- Cursor spotlight in hero ---------- */
    const hero = $('.hero');
    if (!reduceMotion && hero) {
        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
            hero.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    }

    /* ---------- Reveal on scroll ---------- */
    const revealTargets = $$('.section-title, .job, .skill-group, .interest-col, .project, .card, .contact-lead');
    if ('IntersectionObserver' in window && !reduceMotion) {
        revealTargets.forEach(el => el.classList.add('reveal'));
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        revealTargets.forEach(el => io.observe(el));
    }

    /* ---------- Active nav link ---------- */
    const navLinks = $$('.nav-links a');
    if ('IntersectionObserver' in window) {
        const sectionIo = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) sectionIo.observe(s); });
    }

    /* ---------- Subtle 3D tilt on project cards ---------- */
    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
        $$('.project').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.setProperty('--ry', `${x * 6}deg`);
                card.style.setProperty('--rx', `${-y * 6}deg`);
            });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--ry', '0deg');
                card.style.setProperty('--rx', '0deg');
            });
        });
    }

    /* ---------- Copy email ---------- */
    async function copyEmail() {
        const email = getEmail();
        try { await navigator.clipboard.writeText(email); toast('📋 Email copied'); }
        catch (e) { toast(email); }
    }
    $('#copy-email').addEventListener('click', copyEmail);

    /* ---------- Inspect mode ---------- */
    const tip = $('#inspect-tip');
    let inspecting = false, hovered = null;
    function onInspectMove(e) {
        const el = e.target.closest('main *');
        if (hovered && hovered !== el) hovered.classList.remove('inspect-hover');
        if (!el) { tip.style.display = 'none'; return; }
        hovered = el;
        el.classList.add('inspect-hover');
        const r = el.getBoundingClientRect();
        const cls = [...el.classList].filter(c => !['inspect-hover', 'reveal', 'in'].includes(c))[0];
        tip.innerHTML = `<b>${el.tagName.toLowerCase()}</b>${cls ? `<i>.${cls}</i>` : ''} <em>${Math.round(r.width)} × ${Math.round(r.height)}</em>`;
        tip.style.display = 'block';
        tip.style.left = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8) + 'px';
        tip.style.top = Math.min(e.clientY + 18, window.innerHeight - tip.offsetHeight - 8) + 'px';
    }
    function toggleInspect() {
        inspecting = !inspecting;
        document.body.classList.toggle('inspect', inspecting);
        if (inspecting) {
            document.addEventListener('pointermove', onInspectMove);
            toast('🔍 Inspect mode on — press Esc to exit');
        } else {
            document.removeEventListener('pointermove', onInspectMove);
            if (hovered) hovered.classList.remove('inspect-hover');
            tip.style.display = 'none';
            toast('Inspect mode off');
        }
    }
    $('#inspect-hint').addEventListener('click', toggleInspect);

    /* ---------- Confetti (tiny, dependency-free) ---------- */
    function confetti() {
        if (reduceMotion) { toast('🎉'); return; }
        const colors = ['#3b5bfd', '#b14bf4', '#22c55e', '#febc2e', '#ff5f57'];
        for (let n = 0; n < 80; n++) {
            const p = document.createElement('span');
            const size = 6 + Math.random() * 6;
            Object.assign(p.style, {
                position: 'fixed', zIndex: 70, pointerEvents: 'none',
                left: '50%', top: '40%', width: size + 'px', height: size * 0.5 + 'px',
                background: colors[n % colors.length], borderRadius: '2px'
            });
            document.body.appendChild(p);
            const angle = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 260;
            p.animate([
                { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
                { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 220}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove();
        }
    }

    /* ---------- Command palette ---------- */
    const palette = $('#palette');
    const input = $('#palette-input');
    const list = $('#palette-list');
    const go = id => () => $(id).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    const openUrl = sel => () => { const a = $(sel); if (a) window.open(a.href, '_blank', 'noopener'); };
    const commands = [
        { icon: '💼', label: 'Go to Experience', run: go('#experience') },
        { icon: '🛠️', label: 'Go to Skills', run: go('#skills') },
        { icon: '✨', label: 'Go to Interests', run: go('#interests') },
        { icon: '🚀', label: 'Go to Projects', run: go('#projects') },
        { icon: '📄', label: 'Go to Research & Education', run: go('#research') },
        { icon: '✉️', label: 'Go to Contact', run: go('#contact') },
        { icon: '🌓', label: 'Toggle theme', run: toggleTheme, key: 'T' },
        { icon: '🔍', label: 'Toggle inspect mode', run: toggleInspect, key: 'I' },
        { icon: '📋', label: 'Copy email address', run: copyEmail },
        { icon: '🐙', label: 'Open GitHub', run: openUrl('.social a[href*="github"]') },
        { icon: '🦊', label: 'Open GitLab', run: openUrl('.social a[href*="gitlab"]') },
        { icon: '🔗', label: 'Open LinkedIn', run: openUrl('.social a[href*="linkedin"]') },
        { icon: '🎉', label: 'Celebrate', run: confetti },
    ];
    let filtered = commands, sel = 0;

    function render() {
        const q = input.value.trim().toLowerCase();
        filtered = commands.filter(c => c.label.toLowerCase().includes(q));
        sel = Math.min(sel, Math.max(filtered.length - 1, 0));
        list.innerHTML = filtered.length
            ? filtered.map((c, i) =>
                `<li role="option" id="pc-${i}" aria-selected="${i === sel}" data-i="${i}"><span class="pi" aria-hidden="true">${c.icon}</span>${c.label}${c.key ? `<span class="pk">${c.key}</span>` : ''}</li>`
              ).join('')
            : '<li class="empty">No results — try “theme” or “projects”</li>';
        input.setAttribute('aria-activedescendant', filtered.length ? `pc-${sel}` : '');
        const active = $(`#pc-${sel}`);
        if (active) active.scrollIntoView({ block: 'nearest' });
    }
    function openPalette() {
        if (palette.open) return;
        input.value = ''; sel = 0; render();
        palette.showModal();
        input.focus();
    }
    function closePalette() { if (palette.open) palette.close(); }
    function runSelected(i = sel) {
        const c = filtered[i];
        if (!c) return;
        closePalette();
        c.run();
    }

    $('#open-palette').addEventListener('click', openPalette);
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', e => {
        const n = Math.max(filtered.length, 1);
        if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % n; render(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + n) % n; render(); }
        else if (e.key === 'Enter') { e.preventDefault(); runSelected(); }
    });
    list.addEventListener('click', e => {
        const li = e.target.closest('li[data-i]');
        if (li) runSelected(+li.dataset.i);
    });
    palette.addEventListener('click', e => { if (e.target === palette) closePalette(); });

    /* ---------- Global keyboard shortcuts ---------- */
    const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let kIdx = 0;
    document.addEventListener('keydown', e => {
        const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            palette.open ? closePalette() : openPalette();
            return;
        }
        if (e.key === 'Escape' && inspecting && !palette.open) { toggleInspect(); return; }
        if (typing || palette.open || e.metaKey || e.ctrlKey || e.altKey) return;

        // Konami code easter egg (checked first so arrow keys still scroll normally)
        kIdx = (e.key === konami[kIdx]) ? kIdx + 1 : (e.key === konami[0] ? 1 : 0);
        if (kIdx === konami.length) { kIdx = 0; confetti(); toast('🎮 Achievement unlocked: Konami code'); return; }

        if (e.key === 't') toggleTheme();
        if (e.key === 'i') toggleInspect();
    });

    /* ---------- Hello, fellow dev ---------- */
    console.log(
        '%c👋 Hey, fellow dev!%c\nPoking around the source? I like you already.\nThis site is hand-written HTML, CSS & vanilla JS — try ⌘K, "i" for inspect mode, or the Konami code.\nSay hi via the Contact section.',
        'font: 600 16px Inter, sans-serif; color: #3b5bfd;',
        'font: 13px/1.6 Inter, sans-serif;'
    );
})();
