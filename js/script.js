(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const main = document.querySelector("main");
  const footer = document.querySelector(".site-footer");
  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const backdrop = document.getElementById("nav-backdrop");
  const mobileMedia = window.matchMedia("(max-width: 991px)");
  const navLinks = [...siteNav.querySelectorAll(":scope > a")];
  const projects = [...document.querySelectorAll("[data-project]")];
  const searchDialog = document.getElementById("search-dialog");
  const searchInput = document.getElementById("project-search");
  const searchResults = document.getElementById("search-results");
  const searchToggle = document.getElementById("search-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  let menuOpen = false;

  function setMenu(open, restoreFocus = false) {
    menuOpen = open && mobileMedia.matches;
    header.classList.toggle("menu-open", menuOpen);
    document.body.classList.toggle("nav-open", menuOpen);
    menuToggle.setAttribute("aria-expanded", String(menuOpen));
    menuToggle.setAttribute("aria-label", menuOpen ? "Tutup navigasi" : "Buka navigasi");
    backdrop.hidden = !menuOpen;
    siteNav.inert = mobileMedia.matches && !menuOpen;
    main.inert = menuOpen;
    footer.inert = menuOpen;
    if (menuOpen) siteNav.querySelector(".nav-close").focus();
    else if (restoreFocus) menuToggle.focus();
  }

  menuToggle.addEventListener("click", () => setMenu(!menuOpen, menuOpen));
  siteNav.querySelector(".nav-close").addEventListener("click", () => setMenu(false, true));
  backdrop.addEventListener("click", () => setMenu(false, true));
  navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));
  mobileMedia.addEventListener("change", () => setMenu(false));
  setMenu(false);

  document.addEventListener("keydown", (event) => {
    if (!menuOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false, true);
    }
    if (event.key === "Tab") {
      const items = [...siteNav.querySelectorAll("a[href], button")];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  function syncThemeButton() {
    const dark = root.dataset.theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.setAttribute("aria-label", dark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    themeColor.setAttribute("content", dark ? "#111111" : "#ffffff");
  }

  themeToggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("portfolio-theme", root.dataset.theme); } catch (_) {}
    syncThemeButton();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    let saved = null;
    try { saved = localStorage.getItem("portfolio-theme"); } catch (_) {}
    if (saved !== "light" && saved !== "dark") {
      root.dataset.theme = event.matches ? "dark" : "light";
      syncThemeButton();
    }
  });
  syncThemeButton();

  function normalize(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("id").trim();
  }

  function renderSearch() {
    const query = normalize(searchInput.value);
    const words = query.split(/\s+/).filter(Boolean);
    const matches = projects.filter((project) => words.every((word) => normalize(project.dataset.search).includes(word)));
    searchResults.replaceChildren();

    matches.forEach((card) => {
      const link = document.createElement("a");
      link.className = "search-result";
      const projectLink = card.matches("a") ? card : card.querySelector(".project-image");
      link.href = projectLink.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const image = card.querySelector("img").cloneNode();
      image.alt = "";
      image.removeAttribute("loading");
      const copy = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = card.querySelector("h3, strong").textContent.trim().replace(/\s+/g, " ");
      const description = document.createElement("small");
      description.textContent = card.querySelector(".project-meta, small").textContent.trim().replace(/\s+/g, " ");
      copy.append(title, description);
      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      arrow.classList.add("icon");
      arrow.setAttribute("aria-hidden", "true");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "#i-arrow");
      arrow.append(use);
      link.append(image, copy, arrow);
      link.addEventListener("click", () => searchDialog.close());
      searchResults.append(link);
    });

    document.getElementById("search-status").textContent = matches.length
      ? matches.length + (query ? " proyek cocok dengan pencarian Anda." : " proyek tersedia. Cari berdasarkan nama atau teknologi.")
      : "Proyek belum ditemukan. Coba kata kunci seperti ESR, Tracking Bus, atau MTQ.";
  }

  searchToggle.addEventListener("click", () => {
    setMenu(false);
    searchInput.value = "";
    renderSearch();
    searchDialog.showModal();
    document.body.classList.add("search-open");
    searchInput.focus();
  });
  document.getElementById("search-close").addEventListener("click", () => searchDialog.close());
  searchDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      searchDialog.close();
    }
  });
  searchInput.addEventListener("input", renderSearch);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const firstResult = searchResults.querySelector("a");
      if (firstResult) {
        event.preventDefault();
        firstResult.click();
      }
    }
  });
  searchDialog.addEventListener("close", () => document.body.classList.remove("search-open"));
  searchDialog.addEventListener("click", (event) => {
    if (event.target !== searchDialog) return;
    const bounds = searchDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) searchDialog.close();
  });

  // Track actual section positions because the desktop sidebar changes page height.
  const navSections = navLinks.map((link) => ({ link, section: document.querySelector(link.hash) }));
  let scrollQueued = false;
  function updateActiveLink() {
    let active = navSections[0];
    navSections.forEach((item) => {
      const top = item.section.getBoundingClientRect().top;
      if (top <= 160 && (!active || item.section.offsetTop >= active.section.offsetTop)) active = item;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = navSections[navSections.length - 1];
    navLinks.forEach((link) => {
      const selected = link === active.link;
      link.classList.toggle("active", selected);
      if (selected) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    scrollQueued = false;
  }
  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateActiveLink);
    }
  }, { passive: true });
  window.addEventListener("resize", updateActiveLink);
  updateActiveLink();

  document.querySelectorAll("svg.icon").forEach((icon) => icon.setAttribute("aria-hidden", "true"));
  document.getElementById("copyright-year").textContent = new Intl.DateTimeFormat("id-ID", { year: "numeric", timeZone: "Asia/Makassar" }).format(new Date());
})();
