const video = document.getElementById("player");
const grid = document.getElementById("channels-grid");
const message = document.getElementById("player-message");
const currentName = document.getElementById("current-name");
const currentLogoWrap = document.getElementById("current-logo-wrap");
const playerStatus = document.getElementById("player-status");
const count = document.getElementById("channel-count");
const emptyMessage = document.getElementById("empty-message");
const fullscreenButton = document.getElementById("fullscreen-button");

let channels = [];
let selectedIndex = -1;
let hlsInstance = null;

async function loadChannels() {
  try {
    const response = await fetch("./canales.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar canales.json");
    const data = await response.json();
    channels = Array.isArray(data.canales) ? data.canales : [];
    renderChannels();
  } catch (error) {
    console.error(error);
    playerStatus.textContent = "No se pudo leer canales.json. Abrí la página desde un servidor web.";
    emptyMessage.hidden = false;
    emptyMessage.textContent = "No se pudo cargar canales.json. Revisá que el archivo esté junto a index.html y abrí la web mediante un servidor web.";
  }
}

function renderChannels() {
  grid.innerHTML = "";
  count.textContent = `${channels.length} ${channels.length === 1 ? "canal" : "canales"}`;
  emptyMessage.hidden = channels.length > 0;
  channels.forEach((channel, index) => {
    const button = document.createElement("button");
    button.className = "channel-card";
    button.type = "button";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `Reproducir ${channel.nombre || "canal"}`);

    const logoBox = document.createElement("span");
    logoBox.className = "logo-box";
    if (channel.logo) {
      const img = document.createElement("img");
      img.src = channel.logo;
      img.alt = `Logo de ${channel.nombre || "canal"}`;
      img.loading = "lazy";
      img.onerror = () => { img.remove(); logoBox.textContent = initials(channel.nombre); };
      logoBox.appendChild(img);
    } else {
      logoBox.textContent = initials(channel.nombre);
    }

    const name = document.createElement("span");
    name.className = "channel-name";
    name.textContent = channel.nombre || `Canal ${index + 1}`;

    const subtitle = document.createElement("span");
    subtitle.className = "channel-subtitle";
    subtitle.textContent = "TV en vivo";

    button.append(logoBox, name, subtitle);
    button.addEventListener("click", () => playChannel(index));
    grid.appendChild(button);
  });
  updateSelectedCard();
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(word => word[0] || "").join("").toUpperCase() || "TV";
}

function updateSelectedCard() {
  [...grid.querySelectorAll(".channel-card")].forEach((card, index) => {
    card.classList.toggle("selected", index === selectedIndex);
    if (index === selectedIndex) card.setAttribute("aria-current", "true");
    else card.removeAttribute("aria-current");
  });
}

function playChannel(index) {
  const channel = channels[index];
  if (!channel || !channel.url || !/^https?:\/\//i.test(channel.url)) {
    playerStatus.textContent = "Este canal no tiene una URL .m3u8 válida en canales.json.";
    return;
  }

  selectedIndex = index;
  updateSelectedCard();
  currentName.textContent = channel.nombre || `Canal ${index + 1}`;
  currentLogoWrap.innerHTML = "";
  if (channel.logo) {
    const img = document.createElement("img");
    img.src = channel.logo;
    img.alt = channel.nombre ? `Logo de ${channel.nombre}` : "Logo del canal";
    img.onerror = () => { currentLogoWrap.innerHTML = `<span>${escapeHtml(initials(channel.nombre))}</span>`; };
    currentLogoWrap.appendChild(img);
  } else {
    currentLogoWrap.innerHTML = `<span>${escapeHtml(initials(channel.nombre))}</span>`;
  }
  message.classList.add("hidden");
  playerStatus.textContent = "Conectando con la transmisión…";

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
  video.pause();
  video.removeAttribute("src");
  video.load();

  // Safari y algunos navegadores de TV reproducen HLS de forma nativa.
  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
    video.play().then(() => {
      playerStatus.textContent = "Reproduciendo en vivo";
    }).catch(() => {
      playerStatus.textContent = "La transmisión está lista. Presioná Play si no comienza automáticamente.";
    });
  } else if (window.Hls && Hls.isSupported()) {
    hlsInstance = new Hls();
    hlsInstance.loadSource(channel.url);
    hlsInstance.attachMedia(video);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().then(() => {
        playerStatus.textContent = "Reproduciendo en vivo";
      }).catch(() => {
        playerStatus.textContent = "La transmisión está lista. Presioná Play para comenzar.";
      });
    });
    hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        playerStatus.textContent = "No se pudo reproducir. Revisá el enlace, CORS o si la transmisión está disponible.";
      }
    });
  } else {
    playerStatus.textContent = "Este navegador no admite HLS. Probá con otro navegador compatible o una app de TV.";
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

fullscreenButton.addEventListener("click", async () => {
  const target = document.querySelector(".video-wrap");
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (target.requestFullscreen) await target.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  } catch (error) {
    console.warn("Pantalla completa no disponible:", error);
  }
});

// Navegación con flechas y OK/Enter, pensada para controles remotos de TV.
document.addEventListener("keydown", event => {
  const cards = [...grid.querySelectorAll(".channel-card")];
  if (!cards.length) return;

  const activeCard = document.activeElement?.closest?.(".channel-card");
  let index = activeCard ? Number(activeCard.dataset.index) : selectedIndex;
  if (index < 0) index = 0;

  const columns = getColumnCount();
  let next = index;
  switch (event.key) {
    case "ArrowRight": next = Math.min(cards.length - 1, index + 1); break;
    case "ArrowLeft": next = Math.max(0, index - 1); break;
    case "ArrowDown": next = Math.min(cards.length - 1, index + columns); break;
    case "ArrowUp":
      if (index - columns >= 0) next = index - columns;
      else { fullscreenButton.focus(); event.preventDefault(); return; }
      break;
    case "Enter":
    case " ":
      if (activeCard) { event.preventDefault(); playChannel(index); }
      return;
    case "Escape":
    case "Backspace":
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else { video.pause(); }
      return;
    default: return;
  }
  event.preventDefault();
  cards[next]?.focus();
  cards[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
});

function getColumnCount() {
  const cards = [...grid.querySelectorAll(".channel-card")];
  if (cards.length < 2) return 1;
  const firstTop = cards[0].getBoundingClientRect().top;
  const sameRow = cards.filter(card => Math.abs(card.getBoundingClientRect().top - firstTop) < 5);
  return Math.max(1, sameRow.length);
}

video.addEventListener("playing", () => { playerStatus.textContent = "Reproduciendo en vivo"; });
video.addEventListener("waiting", () => { playerStatus.textContent = "Cargando transmisión…"; });
video.addEventListener("error", () => {
  if (selectedIndex >= 0) playerStatus.textContent = "Error de reproducción. El enlace puede estar caído o bloqueado por el servidor.";
});

loadChannels();
