<<<<<<< HEAD:js/404.js
﻿const backButton = document.getElementById("back-button");
const HOME_URL = "about.html";
=======
const backButton = document.getElementById("back-button");
const HOME_URL = "../index.html";
>>>>>>> 49a844f8a9319b01d5624decc66c819623bb0bce:trang-404/404.js

backButton.addEventListener("click", () => {
  // ponytail: history.length > 1 chỉ là ước lượng "có trang trước"; trình duyệt
  // không cho đọc URL lịch sử nên đây là cách gọn nhất cho trang tĩnh.
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = HOME_URL;
  }
});
