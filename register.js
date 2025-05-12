document
  .getElementById("registerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorMessage = document.getElementById("error-message");

    // Validasi username
    if (username.length < 4) {
      errorMessage.textContent = "Username minimal 4 karakter!";
      return;
    }

    // Validasi password
    if (password.length < 6) {
      errorMessage.textContent = "Password minimal 6 karakter!";
      return;
    }

    // Validasi konfirmasi password
    if (password !== confirmPassword) {
      errorMessage.textContent = "Password tidak cocok!";
      return;
    }

    // Cek apakah username sudah ada
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some((user) => user.username === username)) {
      errorMessage.textContent = "Username sudah digunakan!";
      return;
    }

    // Simpan user baru
    users.push({
      username: username,
      password: password, // Dalam praktik nyata, password harus di-hash
    });
    localStorage.setItem("users", JSON.stringify(users));

    // Redirect ke halaman login
    alert("Registrasi berhasil! Silakan login.");
    window.location.href = "login.html";
  });
