# CV. Cahaya Mandiri — Website CCTV

## Menjalankan website

Website booking memerlukan Node.js 22 atau lebih baru. SQLite sudah digunakan oleh aplikasi dan tidak perlu dipasang secara terpisah.

### Windows

1. Pasang Node.js versi 22 atau lebih baru dari [nodejs.org](https://nodejs.org/).
2. Jalankan `start.bat` (dependensi akan dipasang otomatis saat pertama kali dijalankan).
3. Buka `http://localhost:3000` di browser.

### Terminal

1. Jalankan `npm install`.
2. Jalankan `npm start`.
3. Buka `http://localhost:3000` di browser. Jangan membuka `index.html` langsung karena pemeriksaan jadwal memerlukan API.

## GitHub Pages (versi demo)

Repository ini memiliki workflow GitHub Actions untuk menerbitkan file website statis ke GitHub Pages setiap ada push ke branch `main`. Aktifkan **Settings → Pages → Build and deployment → Source: GitHub Actions** di repository.

GitHub Pages tidak menjalankan Node.js atau menyimpan SQLite. Pada domain `github.io`, formulir hanya mengirim permintaan tanggal ke WhatsApp untuk konfirmasi CS; website demo tidak mengunci atau menandai tanggal penuh. Gunakan server Node.js untuk booking yang tersimpan dan pengecekan tanggal otomatis.

Database otomatis dibuat di `storage/bookings.sqlite`. Untuk hosting, gunakan disk persisten dan (bila diperlukan) set variabel lingkungan `BOOKING_DB_PATH` ke lokasi database yang dapat ditulis. Jangan menghapus database saat deploy karena data booking tersimpan di sana.

## Aturan booking

Satu tanggal hanya dapat memiliki satu booking. Ketersediaan diperiksa saat tanggal dipilih dan dikunci kembali di database saat formulir dikirim, sehingga dua permintaan bersamaan tidak dapat mengambil tanggal yang sama. Permintaan yang berhasil disimpan akan membuka WhatsApp untuk konfirmasi lanjutan.

Penyimpanan ini hanya mengunci tanggal, bukan jam atau kapasitas teknisi. Pembatalan dan pembukaan kembali tanggal penuh saat ini dilakukan dengan mengelola data booking di database.
