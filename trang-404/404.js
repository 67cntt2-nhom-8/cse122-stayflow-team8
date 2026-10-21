const backButton = document.getElementById("back-button");
const HOME_URL = "../index.html";

backButton.addEventListener("click", () => {
  // ponytail: history.length > 1 chỉ là ước lượng "có trang trước"; trình duyệt
  // không cho đọc URL lịch sử nên đây là cách gọn nhất cho trang tĩnh.
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = HOME_URL;
  }
});

