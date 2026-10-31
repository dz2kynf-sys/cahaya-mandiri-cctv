const WHATSAPP_NUMBER = "6285135077771";

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Buka menu navigasi" : "Tutup menu navigasi");
  mainNav?.classList.toggle("open", !isOpen);
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Buka menu navigasi");
  });
});

const calculatorForm = document.querySelector("#calculator-form");
const cameraCount = document.querySelector("#camera-count");
const cameraOutput = document.querySelector("#camera-output");
const cameraQuality = document.querySelector("#camera-quality");
const installationCheckbox = document.querySelector("#include-installation");
const estimatePrice = document.querySelector("#estimate-price");
const estimateDetail = document.querySelector("#estimate-detail");
const calculatorWa = document.querySelector("#calculator-wa");

const packagePrices = { 2: 2500000, 4: 3800000, 6: 5300000, 8: 6900000, 10: 8500000, 12: 9900000, 14: 11400000, 16: 12900000 };
const qualityNames = {
  "0": "Full HD",
  "350000": "Color Night Vision",
  "650000": "Resolusi tinggi",
};

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function updateEstimate() {
  if (!cameraCount || !cameraOutput || !cameraQuality || !installationCheckbox || !estimatePrice || !estimateDetail) return;

  const count = Number(cameraCount.value);
  const cameraUpgrade = Number(cameraQuality.value) * count;
  const basePrice = packagePrices[count] ?? Math.ceil(count * 850000 / 100000) * 100000;
  const installation = installationCheckbox.checked ? 0 : -Math.round(basePrice * 0.12);
  const total = basePrice + cameraUpgrade + installation;
  const quality = qualityNames[cameraQuality.value] ?? "Full HD";

  cameraOutput.value = String(count);
  cameraOutput.textContent = String(count);
  estimatePrice.textContent = formatRupiah(total);
  estimateDetail.textContent = `Paket ${count} kamera • ${quality}${installationCheckbox.checked ? " • termasuk instalasi standar" : " • perangkat saja"}`;

  if (calculatorWa) {
    const message = `Halo CV. Cahaya Mandiri, saya ingin konsultasi estimasi CCTV: ${count} kamera, ${quality}, ${installationCheckbox.checked ? "termasuk" : "belum termasuk"} instalasi standar. Estimasi website ${formatRupiah(total)}.`;
    calculatorWa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}

calculatorForm?.addEventListener("input", updateEstimate);
document.querySelector("#camera-minus")?.addEventListener("click", () => {
  if (!cameraCount) return;
  cameraCount.value = String(Math.max(Number(cameraCount.min), Number(cameraCount.value) - Number(cameraCount.step)));
  updateEstimate();
});
document.querySelector("#camera-plus")?.addEventListener("click", () => {
  if (!cameraCount) return;
  cameraCount.value = String(Math.min(Number(cameraCount.max), Number(cameraCount.value) + Number(cameraCount.step)));
  updateEstimate();
});
updateEstimate();

document.querySelectorAll("[data-package]").forEach((button) => {
  button.addEventListener("click", () => {
    const packageSelect = document.querySelector("#customer-package");
    if (packageSelect instanceof HTMLSelectElement) {
      packageSelect.value = button.dataset.package ?? "";
    }
  });
});

const bookingForm = document.querySelector("#booking-form");
const bookingDate = document.querySelector("#customer-date");
const formError = document.querySelector("#form-error");
const dateAvailability = document.querySelector("#date-availability");
const bookingSubmit = bookingForm?.querySelector('button[type="submit"]');
const FULL_DATE_MESSAGE = "Maaf, tanggal ini telah penuh. Silakan pilih tanggal yang lain.";
const isGitHubPagesDemo = window.location.hostname.endsWith(".github.io");
let availabilityRequestId = 0;
let selectedDateAvailable = false;

if (isGitHubPagesDemo) {
  const demoNotice = document.querySelector("#github-demo-notice");
  const bookingHeading = bookingForm?.querySelector(".form-heading h3");
  const bookingPrivacy = bookingForm?.querySelector(".form-privacy");

  if (demoNotice) {
    demoNotice.textContent =
      "Versi demo GitHub Pages tidak menyimpan jadwal. Ajukan tanggal lewat WhatsApp; jadwal baru pasti setelah dikonfirmasi CS.";
    demoNotice.hidden = false;
  }
  if (bookingHeading) bookingHeading.textContent = "Ajukan jadwal via WhatsApp";
  if (bookingPrivacy) {
    bookingPrivacy.textContent =
      "Permintaan tanggal akan dikirim ke WhatsApp dan perlu dikonfirmasi CS. Tanggal belum dipesan melalui website.";
  }
}

if (bookingDate instanceof HTMLInputElement) {
  const localToday = new Date();
  const timezoneOffset = localToday.getTimezoneOffset() * 60000;
  bookingDate.min = new Date(localToday.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

async function checkDateAvailability() {
  if (!(bookingDate instanceof HTMLInputElement) || !dateAvailability) return false;

  if (isGitHubPagesDemo) {
    selectedDateAvailable = true;
    dateAvailability.textContent = "Jadwal akan dikonfirmasi melalui WhatsApp; website demo tidak menyimpan ketersediaan.";
    dateAvailability.dataset.state = "loading";
    return true;
  }

  const date = bookingDate.value;
  const requestId = ++availabilityRequestId;
  selectedDateAvailable = false;
  bookingDate.setCustomValidity("");

  if (!date) {
    dateAvailability.textContent = "";
    dateAvailability.removeAttribute("data-state");
    return false;
  }

  dateAvailability.textContent = "Memeriksa ketersediaan tanggal...";
  dateAvailability.dataset.state = "loading";

  try {
    const response = await fetch(`/api/availability?date=${encodeURIComponent(date)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Ketersediaan tanggal tidak dapat diperiksa.");
    if (requestId !== availabilityRequestId || date !== bookingDate.value) return false;

    selectedDateAvailable = result.available === true;
    if (selectedDateAvailable) {
      dateAvailability.textContent = "Tanggal tersedia.";
      dateAvailability.dataset.state = "available";
    } else {
      dateAvailability.textContent = FULL_DATE_MESSAGE;
      dateAvailability.dataset.state = "full";
      bookingDate.setCustomValidity(FULL_DATE_MESSAGE);
    }
    return selectedDateAvailable;
  } catch {
    if (requestId !== availabilityRequestId) return false;
    dateAvailability.textContent = "Ketersediaan tanggal tidak dapat diperiksa. Silakan coba lagi.";
    dateAvailability.dataset.state = "error";
    return false;
  }
}

bookingDate?.addEventListener("change", () => {
  if (formError) formError.hidden = true;
  void checkDateAvailability();
});

bookingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(bookingForm instanceof HTMLFormElement) || !formError) return;

  if (!bookingForm.reportValidity()) return;

  if (selectedDateAvailable !== true) {
    const isAvailable = await checkDateAvailability();
    if (!isAvailable) return;
  }

  const formData = new FormData(bookingForm);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const selectedPackage = String(formData.get("package") ?? "").trim() || "Belum tahu / konsultasi";
  const date = String(formData.get("date") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !phone || !service || !location) {
    formError.hidden = false;
    formError.textContent = "Mohon lengkapi semua kolom yang wajib diisi.";
    return;
  }

  const message = [
    isGitHubPagesDemo
      ? "Halo CV. Cahaya Mandiri, saya ingin mengajukan permintaan jadwal CCTV. Mohon konfirmasi apakah tanggal pilihan masih tersedia."
      : "Halo CV. Cahaya Mandiri, saya ingin mengajukan konsultasi / booking CCTV.",
    "",
    `Nama: ${name}`,
    `Nomor WhatsApp: ${phone}`,
    `Kebutuhan: ${service}`,
    `Paket: ${selectedPackage}`,
    `Tanggal yang diinginkan: ${date || "Fleksibel"}`,
    `Lokasi: ${location}`,
    `Catatan: ${notes || "-"}`,
  ].join("\n");

  formError.hidden = true;
  if (bookingSubmit instanceof HTMLButtonElement) bookingSubmit.disabled = true;
  const whatsappWindow = window.open("about:blank", "_blank");

  if (isGitHubPagesDemo) {
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      whatsappWindow.location.href = whatsappUrl;
    } else {
      window.location.assign(whatsappUrl);
    }
    if (bookingSubmit instanceof HTMLButtonElement) bookingSubmit.disabled = false;
    return;
  }

  try {
    const booking = { name, phone, service, package: selectedPackage, date, location, notes };
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    const result = await response.json();

    if (response.status === 409) {
      selectedDateAvailable = false;
      bookingDate?.setCustomValidity(FULL_DATE_MESSAGE);
      if (dateAvailability) {
        dateAvailability.textContent = FULL_DATE_MESSAGE;
        dateAvailability.dataset.state = "full";
      }
      formError.textContent = FULL_DATE_MESSAGE;
      formError.hidden = false;
      whatsappWindow?.close();
      return;
    }
    if (!response.ok) throw new Error(result.error || "Booking tidak dapat disimpan. Silakan coba lagi.");

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      whatsappWindow.location.href = whatsappUrl;
    } else {
      window.location.assign(whatsappUrl);
    }
  } catch {
    whatsappWindow?.close();
    formError.textContent = "Permintaan booking belum dapat disimpan. Periksa koneksi lalu coba lagi.";
    formError.hidden = false;
  } finally {
    if (bookingSubmit instanceof HTMLButtonElement) bookingSubmit.disabled = false;
  }
});

const reviewsTrack = document.querySelector("#reviews-track");
const reviewDots = Array.from(document.querySelectorAll("#review-dots button"));
let activeReview = 0;

function showReview(index) {
  if (!reviewsTrack || reviewDots.length === 0) return;
  activeReview = (index + reviewDots.length) % reviewDots.length;
  reviewsTrack.style.transform = `translateX(-${activeReview * 100}%)`;
  reviewDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === activeReview);
    dot.setAttribute("aria-pressed", String(dotIndex === activeReview));
  });
}

document.querySelector("#review-prev")?.addEventListener("click", () => showReview(activeReview - 1));
document.querySelector("#review-next")?.addEventListener("click", () => showReview(activeReview + 1));
reviewDots.forEach((dot, index) => dot.addEventListener("click", () => showReview(index)));
showReview(0);

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
