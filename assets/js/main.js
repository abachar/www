// Les vidéos YouTube ne sont chargées qu'au clic : aucun appel à Google avant.
document.querySelectorAll(".video[data-youtube]").forEach((video) => {
  const button = video.querySelector(".video__play");
  button.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${video.dataset.youtube}?autoplay=1&rel=0`;
    iframe.title = button.textContent.replace(/^(Lire la vidéo|Play video) ?: /, "");
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    video.replaceChildren(iframe);
    iframe.focus();
  });
});

// Sur la page française, propose la version anglaise aux navigateurs qui ne lisent pas le français.
// Pas de redirection ni de cookie : le visiteur choisit.
const hint = document.querySelector(".lang-hint");
if (hint) {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  if (!languages.some((language) => language?.toLowerCase().startsWith("fr"))) {
    hint.hidden = false;
    hint.querySelector(".lang-hint__close").addEventListener("click", () => {
      hint.hidden = true;
    });
  }
}

// Les schémas de la section Expertise se jouent à leur entrée dans la fenêtre, puis au survol.
// Rien ne bouge si le visiteur préfère un mouvement réduit : les figures restent à l'état final.
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const figures = document.querySelectorAll(".service__figure[data-figure]");
if (figures.length && !reducedMotion && "IntersectionObserver" in window) {
  const playedAt = new WeakMap();
  const play = (figure) => {
    figure.classList.remove("is-paused");
    playedAt.set(figure, performance.now());
  };
  const replay = (figure) => {
    if (figure.classList.contains("is-paused") || performance.now() - playedAt.get(figure) < 2500) return;
    figure.classList.remove("is-live");
    void figure.getBoundingClientRect(); // force le rendu de l'état final avant de relancer
    figure.classList.add("is-live");
    playedAt.set(figure, performance.now());
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      play(target);
      observer.unobserve(target);
    });
  }, { threshold: 0.4 });
  figures.forEach((figure) => {
    figure.classList.add("is-live", "is-paused");
    figure.addEventListener("mouseenter", () => replay(figure));
    // Une fois le schéma joué, on revient au rendu statique : identique à l'original au pixel près.
    figure.addEventListener("animationend", () => {
      if (!figure.getAnimations({ subtree: true }).some((animation) => animation.playState === "running")) {
        figure.classList.remove("is-live");
      }
    });
    observer.observe(figure);
  });
}

// Les blocs encore sous la fenêtre se révèlent à leur entrée, avec un léger décalage entre voisins.
// Ce qui est visible au chargement n'est jamais masqué, et rien n'est masqué sans JavaScript.
if (!reducedMotion && "IntersectionObserver" in window) {
  const targets = document.querySelectorAll(".service, .mission, .talk, .note, .repos li, .more, .skills > div, .contact__inner > *");
  let armed = false;
  const observer = new IntersectionObserver((entries) => {
    let delay = 0;
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) {
        target.classList.add("reveal");
        return;
      }
      if (armed) {
        setTimeout(() => target.classList.add("is-in"), delay);
        delay += 60;
      }
      observer.unobserve(target);
    });
    armed = true;
  }, { rootMargin: "0px 0px -8% 0px" });
  targets.forEach((target) => observer.observe(target));
}

// Le menu souligne la section visible : un trait bleu glisse d'un lien à l'autre au défilement.
const nav = document.querySelector(".site-nav");
const entries = nav
  ? [...nav.querySelectorAll('a[href^="#"]')]
      .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
      .filter(({ section }) => section)
  : [];
if (entries.length) {
  const header = document.querySelector(".site-header");
  const marker = document.createElement("span");
  marker.className = "site-nav__marker";
  marker.setAttribute("aria-hidden", "true");
  nav.prepend(marker); // en premier, pour ne pas devenir le :last-child que la version mobile conserve

  const update = () => {
    const line = header.offsetHeight + window.innerHeight * 0.3;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let current = null;
    entries.forEach(({ link, section }) => {
      if (section.getBoundingClientRect().top <= line) current = link;
    });
    if (atBottom) current = entries[entries.length - 1].link;
    entries.forEach(({ link }) => {
      if (link === current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (!current || !current.offsetWidth) {
      marker.classList.remove("is-on");
      return;
    }
    if (!marker.classList.contains("is-on")) {
      // Première apparition : on se place sans glisser.
      marker.style.transition = "none";
      void marker.getBoundingClientRect();
    }
    marker.style.transform = `translateX(${current.offsetLeft}px)`;
    marker.style.width = `${current.offsetWidth}px`;
    void marker.getBoundingClientRect();
    marker.style.transition = "";
    marker.classList.add("is-on");
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      update();
    });
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.fonts?.ready.then(update);
  update();
}
