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
