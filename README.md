# AURA

**Adaptive Unified Runtime Assistant (AURA)** – Mini OS-Layer AI untuk Termux.  
Membantu otomatisasi workflow, backup, deploy, auto Git push, scheduler, plugin, dan dashboard real-time.

---

## 1. Fitur Utama

1. **Full Automation Engine**
   - Backup, deploy, push, build otomatis sesuai event.
2. **Scheduler Task Engine**
   - Jalankan task periodik sesuai jadwal user.
3. **Adaptive AI Learning Engine**
   - Belajar pola workflow user & prioritas project.
4. **Plugin Marketplace Online**
   - Install/update plugin dari repository resmi.
5. **Dashboard Visual & Logs**
   - Monitoring file, memory, network secara real-time.
6. **Event-driven Automation**
   - Trigger task saat file berubah atau network online.
7. **Auto Git Push**
   - Commit & push otomatis ke repositori target.

---

## 2. Instalasi

### 2.1 Via GitHub
```bash
git clone https://github.com/djunekz/aura
cd aura
npm install -g .
```

### 2.2 Via NPM
```bash
npm install -g aura-terminal
```

---

## 3. Menjalankan AURA
```bash
aura
```
> CLI interaktif akan muncul dengan dashboard, logs, dan AI suggestion.

---

## 4. Perintah Penting

| No | Perintah | Fungsi |
|----|----------|--------|
| 1 | `status` | Tampilkan status kernel & project |
| 2 | `context` | Tampilkan context project |
| 3 | `memory` | Tampilkan memory AI |
| 4 | `identity` | Tampilkan identity user |
| 5 | `watch on/off` | Hidupkan/matikan watcher file |
| 6 | `network on/off` | Hidupkan/matikan network watcher |
| 7 | `plugin install <path>` | Install plugin lokal |
| 8 | `plugin install-url <url>` | Install plugin dari URL |
| 9 | `plugin update <name>` | Update plugin |
| 10 | `marketplace list` | Lihat plugin marketplace tersedia |
| 11 | `marketplace install <name>` | Install plugin dari marketplace |
| 12 | `scheduler add <name> <interval>` | Tambahkan task periodik |
| 13 | `scheduler stop` | Hentikan semua task scheduler |

---

## 5. Plugin Marketplace

- Semua plugin dapat diakses & diupdate dari marketplace online.
- Plugin populer: `AutoBackup`, `AutoDeploy`, `SchedulerEnhancer`.

---

## 6. Kontribusi

1. Buat pull request di GitHub.
2. Submit plugin ke marketplace.
3. Selalu test plugin baru di sandbox environment sebelum release.

---

## 7. Lisensi

MIT License © 2026 djunekz

---

## 8. Tips Penggunaan

1. **Environment Variable untuk GitHub PAT** (untuk AutoDeploy otomatis):
```bash
export GITHUB_TOKEN=ghp_xxxxyyyyzzz
```

2. **Menjalankan Scheduler**
```text
scheduler add AutoBackup 300    # Backup setiap 5 menit
scheduler add AutoPush 600      # Auto push setiap 10 menit
```

3. **Update Core & Plugin**
```bash
npm run auto-update
npm run update-plugins
```

4. **Dashboard**
- Refresh otomatis setiap 2 detik.
- Menampilkan status project, logs, memory, network, dan suggestion.

---

**Selamat menggunakan AURA** 🚀
Terminal Termux Anda sekarang lebih cerdas, adaptif, dan otomatis.
