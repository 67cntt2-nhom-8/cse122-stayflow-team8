/* =========================================================================
 * script.js — Tương tác trang Giới thiệu khách sạn Aurora Grand
 * -------------------------------------------------------------------------
 * Nhiệm vụ:
 *   1. Mở/đóng menu điều hướng trên màn hình nhỏ (mobile).
 *   2. Slideshow ảnh bìa (hero) tự động chuyển sau mỗi 5 giây.
 *   3. Hiệu ứng phần tử xuất hiện dần khi cuộn tới (scroll reveal).
 * ========================================================================= */

/* --- 1. Menu mobile: bấm nút MENU để mở/đóng thanh điều hướng --- */
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-navigation");

// Chỉ chạy khi cả nút menu và thanh nav đều tồn tại trên trang
if (menuButton && navigation) {
  const navigationLinks = navigation.querySelectorAll("a");

  menuButton.addEventListener("click", () => {
    // toggle() trả về true nếu class "open" vừa được thêm (menu đang mở)
    const isOpen = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  // Sau khi bấm một mục trong menu thì tự đóng menu lại
  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

/* --- 2. Slideshow ảnh bìa (hero) --- */
// heroSlides: các <img> ảnh nền; heroButtons: các nút chấm để chuyển ảnh
const heroSlides = Array.from(document.querySelectorAll(".hero-slides img"));
const heroButtons = Array.from(
  document.querySelectorAll(".hero-caption button"),
);
let heroIndex = 0; // chỉ số ảnh đang hiển thị
let heroTimer; // id của setInterval chạy slideshow

// Hiển thị ảnh theo chỉ số và cập nhật chấm đang "active".
// Phép (index + length) % length giúp quay vòng đúng cả khi index âm/quá lớn.
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

// Bắt đầu (hoặc khởi động lại) vòng tự chuyển ảnh mỗi 5 giây
function startHeroSlideshow() {
  window.clearInterval(heroTimer);
  heroTimer = window.setInterval(() => {
    showHeroSlide(heroIndex + 1);
  }, 5000);
}

// Bấm chấm để chuyển ảnh thủ công, rồi đặt lại đồng hồ tự chuyển
heroButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    showHeroSlide(index);
    startHeroSlideshow();
  });
});

// Chỉ khởi động slideshow khi trang thực sự có ảnh hero
if (heroSlides.length) {
  showHeroSlide(0);
  startHeroSlideshow();
}

/* --- 3. Hiệu ứng xuất hiện dần khi cuộn tới (scroll reveal) --- */
const revealElements = document.querySelectorAll(".reveal, .image-reveal");

// Nếu trình duyệt hỗ trợ IntersectionObserver: thêm class "visible" khi
// phần tử lọt vào màn hình, sau đó ngừng theo dõi nó cho nhẹ.
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
    { threshold: 0.12 }, // kích hoạt khi ~12% phần tử đã hiện ra
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  // Trình duyệt cũ: hiển thị toàn bộ luôn để nội dung không bị ẩn
  revealElements.forEach((element) => element.classList.add("visible"));
}
