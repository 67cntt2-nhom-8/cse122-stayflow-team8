const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-navigation");

if (menuButton && navigation) {
  const navigationLinks = navigation.querySelectorAll("a");

  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const heroSlides = Array.from(document.querySelectorAll(".hero-slides img"));
const heroButtons = Array.from(
  document.querySelectorAll(".hero-caption button"),
);
let heroIndex = 0;
let heroTimer;

function showHeroSlide(index) {
  if (!heroSlides.length) return;

  heroIndex = (index + heroSlides.length) % heroSlides.length;

  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === heroIndex);
  });

  heroButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === heroIndex);
  });
}

function startHeroSlideshow() {
  window.clearInterval(heroTimer);
  heroTimer = window.setInterval(() => {
    showHeroSlide(heroIndex + 1);
  }, 5000);
}

heroButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    showHeroSlide(index);
    startHeroSlideshow();
  });
});

if (heroSlides.length) {
  showHeroSlide(0);
  startHeroSlideshow();
}

const revealElements = document.querySelectorAll(".reveal, .image-reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}
