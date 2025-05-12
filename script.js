// Cek login status
function checkLogin() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const username = localStorage.getItem("username");
  if (!isLoggedIn || !username) {
    window.location.href = "login.html";
  }
  return username;
}

// Inisialisasi username dan catatan
const currentUsername = checkLogin();
document.getElementById("username-display").textContent = currentUsername;

// Fungsi untuk mendapatkan catatan spesifik user
function getUserNotes(username) {
  const allNotes = JSON.parse(localStorage.getItem("userNotes") || "{}");
  return allNotes[username] || [];
}

// Fungsi untuk mendapatkan kategori user
function getUserCategories(username) {
  const allCategories = JSON.parse(
    localStorage.getItem("userCategories") || "{}"
  );
  if (!allCategories[username]) {
    allCategories[username] = [];
    localStorage.setItem("userCategories", JSON.stringify(allCategories));
  }
  return allCategories[username];
}

// Inisialisasi variabel global
let catatan = getUserNotes(currentUsername);
let sedangDiedit = null;

// Fungsi untuk menyimpan catatan ke localStorage
function simpanCatatan() {
  const allNotes = JSON.parse(localStorage.getItem("userNotes") || "{}");
  allNotes[currentUsername] = catatan;
  localStorage.setItem("userNotes", JSON.stringify(allNotes));
}

// Fungsi untuk menyimpan kategori
function simpanKategori(categories) {
  const allCategories = JSON.parse(
    localStorage.getItem("userCategories") || "{}"
  );
  allCategories[currentUsername] = categories;
  localStorage.setItem("userCategories", JSON.stringify(allCategories));
  updateKategoriDropdowns(); // Update dropdown setelah menyimpan
}

// Fungsi untuk mengupdate kategori dropdown
function updateKategoriDropdowns() {
  const filterDropdown = document.getElementById("filter-kategori");
  const inputDropdown = document.getElementById("kategori");
  const categories = getUserCategories(currentUsername);

  // Simpan nilai saat ini sebelum memperbarui
  const currentFilterValue = filterDropdown.value;
  const currentInputValue = inputDropdown.value;

  // Reset kedua dropdown
  filterDropdown.innerHTML = '<option value="semua">Semua Kategori</option>';
  inputDropdown.innerHTML = '<option value="">Pilih Kategori</option>';

  // Tambahkan kategori ke kedua dropdown
  categories.forEach((category) => {
    const capitalizedCategory =
      category.charAt(0).toUpperCase() + category.slice(1);

    // Tambahkan ke filter dropdown
    const filterOption = document.createElement("option");
    filterOption.value = category;
    filterOption.textContent = capitalizedCategory;
    filterDropdown.appendChild(filterOption);

    // Tambahkan ke input dropdown
    const inputOption = document.createElement("option");
    inputOption.value = category;
    inputOption.textContent = capitalizedCategory;
    inputDropdown.appendChild(inputOption);
  });

  // Kembalikan nilai terpilih jika masih valid
  if (currentFilterValue && categories.includes(currentFilterValue)) {
    filterDropdown.value = currentFilterValue;
  }
  if (currentInputValue && categories.includes(currentInputValue)) {
    inputDropdown.value = currentInputValue;
  }
}

// Fungsi untuk menampilkan loading overlay
function showLoading() {
  document.getElementById("loading-overlay").classList.add("active");
}

// Fungsi untuk menyembunyikan loading overlay
function hideLoading() {
  document.getElementById("loading-overlay").classList.remove("active");
}

// Fungsi untuk mendeteksi lokasi
function deteksiLokasi() {
  showLoading();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async function (position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=id`
          );
          const data = await response.json();
          const lokasi = data.display_name.split(",").slice(0, 3).join(",");
          document.getElementById("lokasi").value = lokasi;
          hideLoading();
        } catch (error) {
          hideLoading();
          alert("Gagal mendapatkan nama lokasi: " + error.message);
        }
      },
      function (error) {
        hideLoading();
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Izin akses lokasi ditolak.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Informasi lokasi tidak tersedia.");
            break;
          case error.TIMEOUT:
            alert("Waktu permintaan lokasi habis.");
            break;
          default:
            alert("Terjadi kesalahan: " + error.message);
        }
      }
    );
  } else {
    hideLoading();
    alert("Geolokasi tidak didukung oleh browser ini.");
  }
}

// Fungsi untuk mengunduh catatan sebagai file txt
function unduhCatatanSebagaiTxt(item) {
  const isiFile = `Judul: ${item.judul}
Tanggal: ${formatTanggal(item.tanggal)}
${item.lokasi ? `Lokasi: ${item.lokasi}` : ""}
\nIsi Catatan:
${item.isi}`;

  const blob = new Blob([isiFile], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  const namaFile = `${item.tanggal}_${item.judul
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}.txt`;

  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Fungsi untuk menampilkan catatan
function tampilkanCatatan() {
  const daftarCatatan = document.getElementById("daftar-catatan");
  daftarCatatan.innerHTML = "";

  const filterKategori = document.getElementById("filter-kategori").value;

  let catatanTampil = [...catatan];
  if (filterKategori !== "semua") {
    catatanTampil = catatan.filter((item) => item.kategori === filterKategori);
  }

  if (catatanTampil.length === 0) {
    daftarCatatan.innerHTML = `
      <div class="empty-state">
        <i class="material-icons">note_add</i>
        <p>Belum ada catatan. Tap tombol "+" untuk mulai menambahkan.</p>
      </div>
    `;
    return;
  }

  catatanTampil.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "catatan";
    const previewText =
      item.isi.length > 100 ? item.isi.substring(0, 100) + "..." : item.isi;

    div.innerHTML = `
      <div class="catatan-preview" onclick="toggleIsiCatatan(${index})">
        <div class="catatan-info">
          <h3>${item.judul}</h3>
          <div class="kategori-tag kategori-${item.kategori}">${
      item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)
    }</div>
          <div class="tanggal"><i class="material-icons" style="font-size: 14px; margin-right: 4px;">calendar_today</i> ${formatTanggal(
            item.tanggal
          )}</div>
          ${
            item.lokasi
              ? `<div class="lokasi"><i class="material-icons" style="font-size: 14px; margin-right: 4px;">location_on</i> ${item.lokasi}</div>`
              : ""
          }
          <div class="preview-text">${previewText}</div>
        </div>
        <i class="material-icons toggle-icon">expand_more</i>
      </div>
      <div class="catatan-content" id="content-${index}">
        <div class="isi">${item.isi.replace(/\n/g, "<br>")}</div>
        <div class="button-group">
          <button class="edit-btn" onclick="event.stopPropagation(); mulaiEdit(${index})">
            <i class="material-icons">edit</i> Edit
          </button>
          <button class="hapus-btn" onclick="event.stopPropagation(); hapusCatatan(${index})">
            <i class="material-icons">delete</i> Hapus
          </button>
          <button class="unduh-btn" onclick="event.stopPropagation(); unduhCatatanSebagaiTxt(catatan[${index}])">
            <i class="material-icons">download</i> Unduh
          </button>
        </div>
      </div>
    `;
    daftarCatatan.appendChild(div);
  });
}

// Fungsi untuk toggle tampilan isi catatan
function toggleIsiCatatan(index) {
  const content = document.getElementById(`content-${index}`);
  const toggleIcon =
    content.previousElementSibling.querySelector(".toggle-icon");
  const allContents = document.querySelectorAll(".catatan-content");
  const allIcons = document.querySelectorAll(".toggle-icon");

  allContents.forEach((content, idx) => {
    if (idx !== index) {
      content.classList.remove("active");
      allIcons[idx].textContent = "expand_more";
    }
  });

  content.classList.toggle("active");
  toggleIcon.textContent = content.classList.contains("active")
    ? "expand_less"
    : "expand_more";
}

function mulaiEdit(index) {
  sedangDiedit = index;
  const item = catatan[index];

  document.getElementById("judul").value = item.judul;
  document.getElementById("tanggal").value = item.tanggal;
  document.getElementById("lokasi").value = item.lokasi || "";
  document.getElementById("kategori").value = item.kategori;
  document.getElementById("isi").value = item.isi;

  const tambahButton = document.querySelector(".input-section button");
  tambahButton.innerHTML = '<i class="material-icons">save</i> Update Catatan';
  tambahButton.onclick = function () {
    updateCatatan(index);
  };

  // Alihkan ke tab tambah
  toggleInputSection(true);
}

// Fungsi untuk update catatan
function updateCatatan(index) {
  const judul = document.getElementById("judul").value;
  const tanggal = document.getElementById("tanggal").value;
  const lokasi = document.getElementById("lokasi").value;
  const kategori = document.getElementById("kategori").value;
  const isi = document.getElementById("isi").value;

  if (!judul || !tanggal || !isi || !kategori) {
    alert("Judul, tanggal, kategori, dan isi catatan harus diisi!");
    return;
  }

  showLoading();

  setTimeout(() => {
    // Update catatan yang ada
    catatan[index] = {
      judul: judul,
      tanggal: tanggal,
      lokasi: lokasi,
      kategori: kategori,
      isi: isi,
    };

    // Simpan ke localStorage
    simpanCatatan();

    // Reset form dan tampilkan catatan yang diperbarui
    const tambahButton = document.querySelector(".input-section button");
    tambahButton.innerHTML = '<i class="material-icons">add</i> Tambah Catatan';
    tambahButton.onclick = tambahCatatan;

    // Reset form
    document.getElementById("judul").value = "";
    document.getElementById("tanggal").value = "";
    document.getElementById("lokasi").value = "";
    document.getElementById("kategori").value = "";
    document.getElementById("isi").value = "";

    // Reset sedangDiedit
    sedangDiedit = null;

    // Tampilkan catatan yang diperbarui
    tampilkanCatatan();

    // Alihkan ke tab daftar
    toggleInputSection(false);

    hideLoading();
  }, 1000); // Simulasi delay untuk menampilkan loading
}

// Fungsi untuk menambah catatan baru
function tambahCatatan() {
  const judul = document.getElementById("judul").value;
  const tanggal = document.getElementById("tanggal").value;
  const lokasi = document.getElementById("lokasi").value;
  const kategori = document.getElementById("kategori").value;
  const isi = document.getElementById("isi").value;

  if (!judul || !tanggal || !isi || !kategori) {
    alert("Judul, tanggal, kategori, dan isi catatan harus diisi!");
    return;
  }

  showLoading();

  setTimeout(() => {
    const catatanBaru = {
      judul: judul,
      tanggal: tanggal,
      lokasi: lokasi,
      kategori: kategori,
      isi: isi,
    };

    catatan.push(catatanBaru);
    simpanCatatan();

    // Reset form
    document.getElementById("judul").value = "";
    document.getElementById("tanggal").value = new Date()
      .toISOString()
      .split("T")[0];
    document.getElementById("lokasi").value = "";
    document.getElementById("kategori").value = "";
    document.getElementById("isi").value = "";

    tampilkanCatatan();

    // Alihkan ke tab daftar
    toggleInputSection(false);

    hideLoading();
  }, 1000); // Simulasi delay untuk menampilkan loading
}

// Fungsi untuk menghapus catatan
function hapusCatatan(index) {
  if (confirm("Apakah Anda yakin ingin menghapus catatan ini?")) {
    showLoading();

    setTimeout(() => {
      catatan.splice(index, 1);
      simpanCatatan();
      tampilkanCatatan();
      hideLoading();
    }, 800); // Simulasi delay untuk menampilkan loading
  }
}

// Fungsi untuk mengurutkan catatan
function urutkanCatatan() {
  const metodePengurutan = document.getElementById("urutkan").value;

  switch (metodePengurutan) {
    case "terbaru":
      catatan.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      break;
    case "terlama":
      catatan.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
      break;
    case "judul":
      catatan.sort((a, b) => a.judul.localeCompare(b.judul));
      break;
    case "lokasi":
      catatan.sort((a, b) => {
        if (!a.lokasi) return 1;
        if (!b.lokasi) return -1;
        return a.lokasi.localeCompare(b.lokasi);
      });
      break;
  }

  tampilkanCatatan();
}

// Fungsi untuk memformat tanggal
function formatTanggal(tanggal) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(tanggal).toLocaleDateString("id-ID", options);
}

// Fungsi logout
function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  window.location.href = "login.html";
}

// Tampilkan catatan saat halaman dimuat
tampilkanCatatan();

function filterKategori() {
  tampilkanCatatan();
}

// Fungsi untuk toggle input section
function toggleInputSection(showInput) {
  const inputSection = document.querySelector(".input-section");
  const navItems = document.querySelectorAll(".nav-item");

  if (showInput) {
    inputSection.classList.remove("hidden");
    navItems.forEach((item) => item.classList.remove("active"));
    navItems[0].classList.add("active");
    window.scrollTo(0, 0);
  } else {
    inputSection.classList.add("hidden");
    navItems.forEach((item) => item.classList.remove("active"));
    navItems[1].classList.add("active");
  }
}

// Menampilkan modal info aplikasi
function tampilkanInfoAplikasi() {
  document.getElementById("modal-info-aplikasi").classList.add("active");
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => item.classList.remove("active"));
  navItems[2].classList.add("active");
}

// Fungsi tutup info aplikasi
function tutupInfoAplikasi() {
  document.getElementById("modal-info-aplikasi").classList.remove("active");
}

// Fungsi untuk menambah kategori baru
function tambahKategoriBaru() {
  const kategoriInput = document.getElementById("kategori-baru");
  const kategoriBaru = kategoriInput.value.trim();
  const modal = document.getElementById("modal-kategori");

  if (!kategoriBaru) {
    alert("Nama kategori tidak boleh kosong!");
    return;
  }

  const categories = getUserCategories(currentUsername);

  if (categories.includes(kategoriBaru)) {
    alert("Kategori ini sudah ada!");
    return;
  }

  categories.push(kategoriBaru);
  simpanKategori(categories);

  // Tutup modal dan reset input
  modal.classList.remove("active");
  kategoriInput.value = "";

  // Pilih kategori baru
  const kategoriSelect = document.getElementById("kategori");
  if (kategoriSelect) {
    kategoriSelect.value = kategoriBaru;
  }
}

// Event listener untuk tombol toggle input
document.addEventListener("DOMContentLoaded", function () {
  // Inisialisasi dropdown kategori
  updateKategoriDropdowns();

  // Event listener untuk tombol tambah kategori
  const tambahKategoriBtn = document.getElementById("tambahKategoriBtn");
  if (tambahKategoriBtn) {
    tambahKategoriBtn.addEventListener("click", function () {
      const modal = document.getElementById("modal-kategori");
      const kategoriInput = document.getElementById("kategori-baru");
      modal.classList.add("active");
      kategoriInput.value = "";
      kategoriInput.focus();
    });
  }

  // Event listener untuk tombol Batal
  const batalBtn = document.querySelector(".batal-kategori-btn");
  if (batalBtn) {
    batalBtn.addEventListener("click", function () {
      const modal = document.getElementById("modal-kategori");
      modal.classList.remove("active");
    });
  }

  // Event listener untuk tombol Simpan
  const simpanBtn = document.querySelector(".tambah-kategori-btn");
  if (simpanBtn) {
    simpanBtn.addEventListener("click", tambahKategoriBaru);
  }

  // Event listener untuk input kategori (Enter key)
  const kategoriInput = document.getElementById("kategori-baru");
  if (kategoriInput) {
    kategoriInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        tambahKategoriBaru();
      }
    });
  }

  // Event listener untuk input tambah kategori di kelola kategori (Enter key)
  const kategoriTambahInput = document.getElementById("kategori-tambah");
  if (kategoriTambahInput) {
    kategoriTambahInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        tambahKategoriDariKelola();
      }
    });
  }

  // Event listener untuk menutup modal saat klik di luar
  const modals = document.querySelectorAll(".modal");
  if (modals.length) {
    modals.forEach((modal) => {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) {
          modal.classList.remove("active");
        }
      });
    });
  }

  // Set tanggal hari ini secara default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("tanggal").value = today;
});

// Fungsi untuk menghapus kategori terpilih
function hapusKategoriTerpilih() {
  const filterDropdown = document.getElementById("filter-kategori");
  const kategoriTerpilih = filterDropdown.value;

  if (kategoriTerpilih === "semua") {
    alert("Silakan pilih kategori yang ingin dihapus terlebih dahulu.");
    return;
  }

  // Konfirmasi penghapusan
  if (
    !confirm(
      `Apakah Anda yakin ingin menghapus kategori "${kategoriTerpilih}"?`
    )
  ) {
    return;
  }

  showLoading();

  setTimeout(() => {
    // Mendapatkan daftar kategori
    const userCategories = getUserCategories(currentUsername);

    // Cek apakah kategori sedang digunakan
    const kategoriDipakai = catatan.some(
      (item) => item.kategori === kategoriTerpilih
    );

    if (kategoriDipakai) {
      // Jika tidak ada kategori lain yang tersedia, beri tahu pengguna
      if (userCategories.length <= 1) {
        hideLoading();
        alert(
          "Tidak dapat menghapus kategori terakhir yang masih digunakan oleh catatan. Buat kategori baru terlebih dahulu."
        );
        return;
      }

      hideLoading();
      // Tanyakan kategori pengganti
      const kategoriBaru = prompt(
        `Kategori "${kategoriTerpilih}" sedang digunakan pada beberapa catatan. Masukkan nama kategori pengganti:`,
        userCategories.filter((k) => k !== kategoriTerpilih)[0] || ""
      );

      if (
        !kategoriBaru ||
        !userCategories.includes(kategoriBaru) ||
        kategoriBaru === kategoriTerpilih
      ) {
        alert("Kategori pengganti tidak valid. Penghapusan dibatalkan.");
        return;
      }

      showLoading();

      // Ubah kategori catatan yang terkait
      catatan.forEach((item) => {
        if (item.kategori === kategoriTerpilih) {
          item.kategori = kategoriBaru;
        }
      });

      // Simpan perubahan catatan
      simpanCatatan();
    }

    // Hapus kategori
    const indexKategori = userCategories.indexOf(kategoriTerpilih);
    if (indexKategori !== -1) {
      userCategories.splice(indexKategori, 1);
      simpanKategori(userCategories);

      // Reset filter ke semua kategori
      filterDropdown.value = "semua";

      // Perbarui tampilan
      tampilkanCatatan();

      hideLoading();
      alert(`Kategori "${kategoriTerpilih}" berhasil dihapus.`);
    } else {
      hideLoading();
    }
  }, 1000); // Simulasi delay untuk menampilkan loading
}
