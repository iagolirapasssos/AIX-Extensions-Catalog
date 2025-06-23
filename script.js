// script.js

(() => {
  const communities = [
    {
      name: "Kodular",
      base: "https://community.kodular.io",
      catPath: "/c/extensions/5.json",
      searchPath: "/search.json?q="
    },
    {
      name: "MIT App Inventor",
      base: "https://community.appinventor.mit.edu",
      catPath: "/c/extensions/17.json",
      searchPath: "/search.json?q="
    },
    {
      name: "Niotron",
      base: "https://community.niotron.com",
      catPath: "/c/extension/10.json",
      searchPath: "/search.json?q="
    },
    {
      name: "Android Builder",
      base: "https://community.androidbuilder.in",
      catPath: "/c/extensions/9.json",
      searchPath: "/search.json?q="
    }
  ];

  // Quantidade de itens por carregamento
  const INITIAL_LOAD_COUNT = 10;
  const LOAD_MORE_COUNT = 10;

  // DOM
  const container       = document.getElementById("cards-container");
  const updateTimeEl    = document.getElementById("update-time");
  const loadMoreBtn     = document.getElementById("load-more-btn");
  const loadingSpinner  = document.getElementById("loading-spinner");
  const searchInput     = document.getElementById("search-input");
  const searchBtn       = document.getElementById("search-btn");
  const languageSelect  = document.getElementById("language-select");
  const communitySelect = document.getElementById("community-select");
  const toastEl         = document.getElementById("toast");

  // Estado
  let allExtensions      = [];
  let displayedExtensions = [];
  let isLoading          = false;
  let currentSearchTerm  = "";
  let currentLanguage    = "en";
  let currentOffset      = 0;
  let selectedCommunities = communities.map(c => c.name);

  // Traduções
  const translations = {
    en: {
      title:           "Extensions Catalog",
      searchPlaceholder:"Search extensions…",
      searchButton:    "Search",
      loadMore:        "Load More",
      updated:         "By BosonsHiggs Team (Aril Ogai)",
      loading:         "Loading extensions…",
      noResults:       "No extensions found.",
      error:           "Error loading",
      topic:           "View Topic",
      community:       "Community",
      posts:           "Posts",
      replies:         "Replies"
    },
    pt: {
      title:           "Catálogo de Extensões",
      searchPlaceholder:"Pesquisar extensões…",
      searchButton:    "Buscar",
      loadMore:        "Carregar Mais",
      updated:         "By BosonsHiggs Team (Aril Ogai)",
      loading:         "Carregando extensões…",
      noResults:       "Nenhuma extensão encontrada.",
      error:           "Erro ao carregar",
      topic:           "Ver Tópico",
      community:       "Comunidade",
      posts:           "Postagens",
      replies:         "Respostas"
    },
    es: {
      title:           "Catálogo de Extensiones",
      searchPlaceholder:"Buscar extensiones…",
      searchButton:    "Buscar",
      loadMore:        "Cargar Más",
      updated:         "By BosonsHiggs Team (Aril Ogai)",
      loading:         "Cargando extensiones…",
      noResults:       "No se encontraron extensiones.",
      error:           "Error al cargar",
      topic:           "Ver Tema",
      community:       "Comunidad",
      posts:           "Publicaciones",
      replies:         "Respuestas"
    }
  };

  // Exibe um toast rápido
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3000);
  }

  // Comunidades ativas
  function getActiveCommunities() {
    if (selectedCommunities.includes("all")) {
      return communities;
    }
    return communities.filter(c => selectedCommunities.includes(c.name));
  }

  // Inicialização
  function init() {
    loadLanguage();
    setupEventListeners();
    loadInitialExtensions();
  }

  function setupEventListeners() {
    loadMoreBtn.addEventListener("click", loadMoreExtensions);
    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") performSearch();
    });
    languageSelect.addEventListener("change", changeLanguage);
    communitySelect.addEventListener("change", changeCommunities);
  }

  // Carrega idioma salvo
  function loadLanguage() {
    const saved = localStorage.getItem("preferredLanguage") || "en";
    languageSelect.value = saved;
    currentLanguage = saved;
    updateUI();
  }

  function changeLanguage() {
    currentLanguage = languageSelect.value;
    localStorage.setItem("preferredLanguage", currentLanguage);
    updateUI();
    displayExtensions();
  }

  function changeCommunities() {
    const val = communitySelect.value;
    selectedCommunities = val === "all"
      ? communities.map(c => c.name)
      : [val];
    currentOffset = 0;
    loadInitialExtensions();
  }

  function updateUI() {
    const t = translations[currentLanguage];
    document.getElementById("main-title").textContent = t.title;
    searchInput.placeholder = t.searchPlaceholder;
    searchBtn.textContent     = t.searchButton;
    loadMoreBtn.textContent   = t.loadMore;
    updateTimeEl.textContent  = `${t.updated} `;
  }

  // Processa resposta de search
  async function processSearchResults(data, communityName) {
    if (!data?.topics) return [];
    const topicMap = {};
    data.topics.forEach(t => topicMap[t.id] = t);

    return (data.posts||[]).map(post => {
      const topic = topicMap[post.topic_id];
      return topic && {
        id:               topic.id,
        title:            topic.title,
        community:        communityName,
        topicUrl:         `${data.url || communities.find(c=>c.name===communityName)?.base}/t/${topic.slug}/${topic.id}`,
        postsCount:       topic.posts_count,
        replyCount:       topic.reply_count,
        createdAt:        topic.created_at,
        likeCount:        post.like_count,
        blurb:            post.blurb,
        hasAcceptedAnswer: topic.has_accepted_answer
      };
    }).filter(x=>x);
  }

  // Busca dados de uma comunidade (com proxy CORS)
  async function fetchCommunityExtensions(src, searchTerm="", offset=0) {
    const isSearch = Boolean(searchTerm);
    let apiUrl = isSearch
      ? `${src.base}${src.searchPath}${encodeURIComponent(searchTerm)}&offset=${offset}`
      : `${src.base}${src.catPath}?page=${Math.floor(offset/30)+1}`;

    // Usa AllOrigins para evitar bloqueio CORS
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;

    try {
      const res  = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const data = await res.json();

      if (isSearch) {
        data.url = src.base;
        return processSearchResults(data, src.name);
      }

      const topics = data.topic_list?.topics || [];
      return topics.slice(0, INITIAL_LOAD_COUNT).map(topic => ({
        id:                topic.id,
        title:             topic.title,
        community:         src.name,
        topicUrl:          `${src.base}/t/${topic.slug}/${topic.id}`,
        postsCount:        topic.posts_count,
        replyCount:        topic.reply_count,
        createdAt:         topic.created_at,
        hasAcceptedAnswer: topic.has_accepted_answer
      }));
    } catch (err) {
      console.error(`Error fetching ${src.name}:`, err);
      showToast(`${translations[currentLanguage].error} ${src.name}`);
      return [];
    }
  }

  // Carregamento inicial de extensões
  async function loadInitialExtensions() {
    if (isLoading) return;
    isLoading = true;
    currentOffset = 0;
    allExtensions = [];
    displayedExtensions = [];
    container.innerHTML = `<p>${translations[currentLanguage].loading}</p>`;
    loadMoreBtn.disabled = true;
    loadingSpinner.classList.remove("hidden");

    try {
      const actives = getActiveCommunities();
      const lists   = await Promise.all(actives.map(src => fetchCommunityExtensions(src)));
      allExtensions = lists.flat();
      displayedExtensions = [...allExtensions];
      updateTimeEl.textContent = new Date().toLocaleString(currentLanguage);
      displayExtensions();
    } finally {
      isLoading = false;
      loadMoreBtn.disabled = false;
      loadingSpinner.classList.add("hidden");
      updateLoadMoreButton();
    }
  }

  // “Carregar mais”
  async function loadMoreExtensions() {
    if (isLoading) return;
    isLoading = true;
    currentOffset += INITIAL_LOAD_COUNT;
    loadMoreBtn.disabled = true;
    loadingSpinner.classList.remove("hidden");

    try {
      const more = await Promise.all(
        getActiveCommunities().map(src =>
          fetchCommunityExtensions(src, currentSearchTerm, currentOffset)
        )
      );
      const flat  = more.flat();
      allExtensions       = allExtensions.concat(flat);
      displayedExtensions = currentSearchTerm
        ? [...allExtensions]
        : [...displayedExtensions, ...flat];
      displayExtensions();
    } finally {
      isLoading = false;
      loadMoreBtn.disabled = false;
      loadingSpinner.classList.add("hidden");
      updateLoadMoreButton();
    }
  }

  // Pesquisa customizada
  async function performSearch() {
    if (isLoading) return;
    currentSearchTerm    = searchInput.value.trim().toLowerCase();
    currentOffset        = 0;
    allExtensions        = [];
    displayedExtensions  = [];

    isLoading = true;
    container.innerHTML = `<p>${translations[currentLanguage].loading}</p>`;
    loadMoreBtn.disabled = true;
    loadingSpinner.classList.remove("hidden");

    try {
      const lists = await Promise.all(
        getActiveCommunities().map(src =>
          fetchCommunityExtensions(src, currentSearchTerm)
        )
      );
      allExtensions       = lists.flat();
      displayedExtensions = [...allExtensions];
      displayExtensions();
    } finally {
      isLoading = false;
      loadMoreBtn.disabled = false;
      loadingSpinner.classList.add("hidden");
      updateLoadMoreButton();
    }
  }

  // Renderiza os cards
  function displayExtensions() {
    container.innerHTML = "";

    if (!displayedExtensions.length) {
      container.innerHTML = `<p>${translations[currentLanguage].noResults}</p>`;
      return;
    }

    const t = translations[currentLanguage];
    displayedExtensions.forEach(ext => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <div class="info">
          <h2>${ext.title}</h2>
          <div class="meta">
            <span class="community">${t.community}: ${ext.community}</span>
            <div class="stats">
              <span>📅 ${new Date(ext.createdAt).toLocaleDateString(currentLanguage)}</span>
              <span>💬 ${ext.postsCount} ${t.posts}</span>
              <span>↩️ ${ext.replyCount} ${t.replies}</span>
              ${ext.hasAcceptedAnswer?'<span class="solved">✅ Solved</span>':''}
            </div>
            ${ext.blurb?`<p class="blurb">${ext.blurb.slice(0,150)}${ext.blurb.length>150?'…':''}</p>`:''}
          </div>
        </div>
        <div class="links">
          <a href="${ext.topicUrl}" target="_blank" class="topic-link">${t.topic}</a>
        </div>
      `;
      container.appendChild(div);
    });
  }

  function updateLoadMoreButton() {
    // Mantém botão visível se múltiplos exatos
    const canLoad = allExtensions.length % (getActiveCommunities().length * LOAD_MORE_COUNT) === 0;
    loadMoreBtn.style.display = canLoad ? "block" : "none";
  }

  window.addEventListener("DOMContentLoaded", init);
})();

