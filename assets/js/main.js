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
