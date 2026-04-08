const header = document.querySelector(".site-header");
const menuToggle = document.querySelector("#menu-toggle");
const siteNav = document.querySelector("#site-nav");
const navLinks = siteNav ? siteNav.querySelectorAll("a") : [];
const revealItems = document.querySelectorAll(".reveal");

function closeMenu() {
  if (!header || !menuToggle) {
    return;
  }

  header.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

function toggleScrolledState() {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

if (menuToggle && header) {
  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("click", (event) => {
  if (!header || !header.classList.contains("menu-open")) {
    return;
  }

  if (!header.contains(event.target)) {
    closeMenu();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 860) {
    closeMenu();
  }
});

window.addEventListener("scroll", toggleScrolledState, { passive: true });
toggleScrolledState();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
