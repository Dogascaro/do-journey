document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("error-message");

  // Ambil data users dari localStorage
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  // Cek kredensial
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    // Simpan status login
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", username);

    // Redirect ke halaman utama
    window.location.href = "index.html";
  } else {
    errorMessage.textContent = "Username atau password salah!";

    // Hapus pesan error setelah 3 detik
    setTimeout(() => {
      errorMessage.textContent = "";
    }, 3000);
  }
});
