// script.js

(() => {
  /**
   * Configurações principais e constantes
   */
  const TAG_REGEX = /\[\s*(?:paid|PAID|free|FREE|f\/os|F\/OS|wip|WIP|Freemium|FREEMIUM)\s*\]/;
  const RATE_LIMIT_DELAY = 200;

  const communities = [
    { name: "Kodular", base: "https://community.kodular.io", catPath: "/c/extensions/5.json", searchPath: "/search.json?q=", spSuffix: "%20%23extensions" },
    { name: "MIT App Inventor", base: "https://community.appinventor.mit.edu", catPath: "/c/extensions/17.json", searchPath: "/search.json?q=", spSuffix: "%20category%3Aextensions" },
    { name: "Niotron", base: "https://community.niotron.com", catPath: "/c/extension/10.json", searchPath: "/search.json?q=", spSuffix: "%20%23extension" },
    { name: "Android Builder", base: "https://community.androidbuilder.in", catPath: "/c/extensions/9.json", searchPath: "/search.json?q=", spSuffix: "%20%23extensions" }
  ];

  const INITIAL_LOAD_COUNT = 10;
  const LOAD_MORE_COUNT    = 10;

  // Elementos do DOM
  const container       = document.getElementById("cards-container");
  const updateTimeEl    = document.getElementById("update-time");
  const loadMoreBtn     = document.getElementById("load-more-btn");
  const loadingSpinner  = document.getElementById("loading-spinner");
  const searchInput     = document.getElementById("search-input");
  const searchBtn       = document.getElementById("search-btn");
  const languageSelect  = document.getElementById("language-select");
  const communitySelect = document.getElementById("community-select");
  const toastEl         = document.getElementById("toast");

  // Estado interno
  let allExtensions       = [];
  let displayedExtensions = [];
  let isLoading           = false;
  let currentSearchTerm   = "";
  let currentLanguage     = "en";
  let currentOffset       = 0;
  let selectedCommunities = communities.map(c => c.name);

  // Traduções
  const translations = {
    en: {
      title:             "Extensions Catalog",
      searchPlaceholder: "Search extensions…",
      searchButton:      "Search",
      loadMore:          "Load More",
      updated:           "By BosonsHiggs Team (Aril Ogai)",
      loading:           "Loading extensions…",
      noResultsToast:    "No extensions found.",
      searching:         "Searching extensions…",
      pleaseWait:        "Please wait a few seconds while loading extensions...",
      topic:             "View Topic",
      community:         "Community",
      posts:             "Posts",
      replies:           "Replies"
    },
    pt: {
      title:             "Catálogo de Extensões",
      searchPlaceholder: "Pesquisar extensões…",
      searchButton:      "Buscar",
      loadMore:          "Carregar Mais",
      updated:           "By BosonsHiggs Team (Aril Ogai)",
      loading:           "Carregando extensões…",
      noResultsToast:    "Nenhuma extensão encontrada.",
      searching:         "Buscando extensões…",
      pleaseWait:        "Aguarde alguns segundos enquanto carregamos as extensões...",
      topic:             "Ver Tópico",
      community:         "Comunidade",
      posts:             "Postagens",
      replies:           "Respostas"
    },
    es: {
      title:             "Catálogo de Extensiones",
      searchPlaceholder: "Buscar extensiones…",
      searchButton:      "Buscar",
      loadMore:          "Cargar Más",
      updated:           "By BosonsHiggs Team (Aril Ogai)",
      loading:           "Cargando extensiones…",
      noResultsToast:    "No se encontraron extensiones.",
      searching:         "Buscando extensiones…",
      pleaseWait:        "Por favor, espera unos segundos mientras cargamos extensiones...",
      topic:             "Ver Tema",
      community:         "Comunidad",
      posts:             "Publicaciones",
      replies:           "Respuestas"
    }
  };

  // Cache em sessionStorage
  function saveCache() {
    sessionStorage.setItem('extensionsCache', JSON.stringify(allExtensions));
  }
  function loadCache() {
    try { return JSON.parse(sessionStorage.getItem('extensionsCache')); } catch { return null; }
  }
  function clearCache() { sessionStorage.removeItem('extensionsCache'); }

  // Rate limiter
  function rateLimitedFetch(src, term = "", offset = 0, idx = 0) {
    return new Promise(resolve => {
      setTimeout(() => resolve(fetchCommunityExtensions(src, term, offset)), idx * RATE_LIMIT_DELAY);
    });
  }

  // Toast
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  // Comunidades ativas
  function getActiveCommunities() {
    return selectedCommunities.includes('all')
      ? communities
      : communities.filter(c => selectedCommunities.includes(c.name));
  }

  // Renderiza cards
  function appendExtensions(list) {
    list.forEach(ext => {
      const blurbHTML = ext.blurb
        ? '<p class="blurb">' + ext.blurb.slice(0,150) + (ext.blurb.length > 150 ? '…' : '') + '</p>'
        : '';
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div class="info">' +
          '<h2>' + ext.title + '</h2>' +
          '<div class="meta">' +
            '<span class="community">' + translations[currentLanguage].community + ': ' + ext.community + '</span>' +
            '<div class="stats">' +
              '📅 ' + new Date(ext.createdAt).toLocaleDateString(currentLanguage) + ' ' +
              '💬 ' + ext.postsCount + ' ' + translations[currentLanguage].posts + ' ' +
              '↩️ ' + ext.replyCount + ' ' + translations[currentLanguage].replies +
            '</div>' +
            blurbHTML +
          '</div>' +
        '</div>' +
        '<div class="links">' +
          '<a href="' + ext.topicUrl + '" target="_blank" class="topic-link">' + translations[currentLanguage].topic + '</a>' +
        '</div>';
      container.appendChild(card);
    });
  }

  // Carrega idioma
  function loadLanguage() {
    const saved = localStorage.getItem('preferredLanguage') || 'en';
    currentLanguage = saved;
    languageSelect.value = saved;
    updateUI();
  }
  function updateUI() {
    const t = translations[currentLanguage];
    document.getElementById('main-title').textContent = t.title;
    searchInput.placeholder = t.searchPlaceholder;
    searchBtn.textContent = t.searchButton;
    loadMoreBtn.textContent = t.loadMore;
    updateTimeEl.textContent = t.updated;
  }
  function changeLanguage() {
    localStorage.setItem('preferredLanguage', languageSelect.value);
    loadLanguage();
  }
  function changeCommunities() {
    clearCache();
    selectedCommunities = communitySelect.value === 'all'
      ? communities.map(c => c.name)
      : [communitySelect.value];
    currentOffset = 0;
    container.innerHTML = '';
    loadInitialExtensions();
  }

  // Busca dados
  async function fetchCommunityExtensions(src, term = '', offset = 0) {
    const isSearch = Boolean(term);
    const apiUrl = isSearch
      ? src.base + src.searchPath + encodeURIComponent(term) + src.spSuffix + '&offset=' + offset
      : src.base + src.catPath + '?page=' + (Math.floor(offset/30) + 1);
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(apiUrl);
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) return [];
      const data = await res.json();
      if (isSearch) {
        const topicMap = {};
        (data.topics || []).forEach(t => topicMap[t.id] = t);
        return (data.posts || []).map(post => {
          const topic = topicMap[post.topic_id];
          return topic
            ? {
                id: topic.id,
                title: topic.title,
                community: src.name,
                topicUrl: src.base + '/t/' + topic.slug + '/' + topic.id,
                postsCount: topic.posts_count,
                replyCount: topic.reply_count,
                createdAt: topic.created_at,
                blurb: post.blurb,
                hasAcceptedAnswer: topic.has_accepted_answer
              }
            : null;
        }).filter(x => x);
      }
      return (data.topic_list?.topics || []).map(topic => ({
        id: topic.id,
        title: topic.title,
        community: src.name,
        topicUrl: src.base + '/t/' + topic.slug + '/' + topic.id,
        postsCount: topic.posts_count,
        replyCount: topic.reply_count,
        createdAt: topic.created_at,
        hasAcceptedAnswer: topic.has_accepted_answer
      }));
    } catch {
      return [];
    }
  }

  // Inicialização
  async function init() {
    loadLanguage();
    setupEventListeners();
    const cached = loadCache();
    if (cached && !searchInput.value.trim()) {
      allExtensions = cached;
      container.innerHTML = '';
      appendExtensions(allExtensions);
      updateTimeEl.textContent = new Date().toLocaleString(currentLanguage);
      updateLoadMoreButton();
    } else {
      await loadInitialExtensions();
    }
  }

  function setupEventListeners() {
    loadMoreBtn.addEventListener('click', loadMoreExtensions);
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
    languageSelect.addEventListener('change', changeLanguage);
    communitySelect.addEventListener('change', changeCommunities);
  }

  // Carrega iniciais
  async function loadInitialExtensions() {
    if (isLoading) return;
    isLoading = true;
    clearCache();
    currentOffset = 0; allExtensions = []; displayedExtensions = [];
    showToast(translations[currentLanguage].pleaseWait);
    container.innerHTML = '<p>' + translations[currentLanguage].loading + '</p>';
    loadMoreBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');
    container.innerHTML = '';
    const actives = getActiveCommunities();
    const tasks = actives.map((src, i) =>
      rateLimitedFetch(src, '', 0, i)
        .then(list => list.filter(ext => TAG_REGEX.test(ext.title)))
        .then(filtered => { allExtensions.push(...filtered); appendExtensions(filtered); })
    );
    await Promise.all(tasks);
    displayedExtensions = [...allExtensions];
    saveCache();
    updateTimeEl.textContent = new Date().toLocaleString(currentLanguage);
    isLoading = false; loadMoreBtn.disabled = false; loadingSpinner.classList.add('hidden'); updateLoadMoreButton();
  }

  // Carrega mais
  async function loadMoreExtensions() {
    if (isLoading) return;
    isLoading = true; currentOffset += INITIAL_LOAD_COUNT;
    loadMoreBtn.disabled = true; loadingSpinner.classList.remove('hidden'); showToast(translations[currentLanguage].pleaseWait);
    const actives = getActiveCommunities();
    const tasks = actives.map((src, i) =>
      rateLimitedFetch(src, currentSearchTerm, currentOffset, i)
        .then(list => list.filter(ext => TAG_REGEX.test(ext.title)))
        .then(filtered => { allExtensions.push(...filtered); appendExtensions(filtered); })
    );
    await Promise.all(tasks);
    displayedExtensions = currentSearchTerm
      ? [...allExtensions]
      : [...displayedExtensions, ...allExtensions.slice(-tasks.length)];
    saveCache();
    isLoading = false; loadMoreBtn.disabled = false; loadingSpinner.classList.add('hidden'); updateLoadMoreButton();
  }

  // Pesquisa
  async function performSearch() {
    const term = searchInput.value.trim();
    if (!term) {
      const cached = loadCache();
      if (cached) {
        allExtensions = cached; container.innerHTML = ''; appendExtensions(allExtensions);
        updateTimeEl.textContent = new Date().toLocaleString(currentLanguage); updateLoadMoreButton();
      } else {
        await loadInitialExtensions();
      }
      return;
    }
    clearCache(); currentSearchTerm = term.toLowerCase(); currentOffset = 0;
    allExtensions = []; displayedExtensions = []; isLoading = true;
    showToast(translations[currentLanguage].searching);
    container.innerHTML = '<p>' + translations[currentLanguage].loading + '</p>';
    loadMoreBtn.disabled = true; loadingSpinner.classList.remove('hidden'); container.innerHTML = '';
    const actives = getActiveCommunities();
    const tasks = actives.map((src, i) =>
      rateLimitedFetch(src, currentSearchTerm, 0, i)
        .then(list => list.filter(ext => TAG_REGEX.test(ext.title)))
    );
    const results = await Promise.all(tasks);
    const flat = results.flat();
    if (!flat.length) {
      showToast(translations[currentLanguage].noResultsToast);
      isLoading = false; loadMoreBtn.disabled = false; loadingSpinner.classList.add('hidden'); updateLoadMoreButton();
      return;
    }
    flat.forEach(ext => { allExtensions.push(ext); appendExtensions([ext]); });
    displayedExtensions = [...allExtensions]; saveCache();
    isLoading = false; loadMoreBtn.disabled = false; loadingSpinner.classList.add('hidden'); updateLoadMoreButton();
  }

  // Atualiza botão
  function updateLoadMoreButton() {
    const can = (allExtensions.length % (getActiveCommunities().length * LOAD_MORE_COUNT) === 0);
    loadMoreBtn.style.display = can ? 'block' : 'none';
  }

  window.addEventListener('DOMContentLoaded', init);
})();

