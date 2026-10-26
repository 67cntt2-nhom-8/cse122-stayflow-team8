/* =========================================================================
 * about.js — Tương tác trang Giới thiệu khách sạn Aurora Grand
 * -------------------------------------------------------------------------
 * Nhiệm vụ:
 *   1. Mở/đóng menu điều hướng trên màn hình nhỏ (mobile).
 *   2. Slideshow ảnh bìa (hero) — chỉ đổi khi người dùng bấm chấm.
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

/* --- 2. Slideshow ảnh bìa (hero) — chỉ đổi khi người dùng bấm chấm ---
 * ponytail: bỏ tự chuyển mỗi 5 giây (hiệu ứng thừa, lại thành cắt ảnh đột ngột
 * khi đã tắt transition toàn cục). Cần tự chuyển lại thì bật startHeroSlideshow(). */
const heroSlides = Array.from(document.querySelectorAll(".hero-slides img"));
const heroButtons = Array.from(
  document.querySelectorAll(".hero-caption button"),
);
let heroIndex = 0; // chỉ số ảnh đang hiển thị

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

// Bấm chấm để chuyển ảnh thủ công
heroButtons.forEach((button, index) => {
  button.addEventListener("click", () => showHeroSlide(index));
});

// Chỉ khởi động slideshow khi trang thực sự có ảnh hero
if (heroSlides.length) {
  showHeroSlide(0);
}
