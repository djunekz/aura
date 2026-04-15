# AURA

**Adaptive Unified Runtime Assistant (AURA)** – Mini OS-Layer AI untuk Termux.  
Otomatisasi workflow, backup, deploy, git, scheduler, plugin, dan dashboard real-time.

---

## 1. Fitur Utama

1. **Full Automation Engine** — Backup, deploy, push, build otomatis.
2. **Scheduler Task Engine** — Jalankan task periodik sesuai jadwal.
3. **Git Manager** — `git status`, `add`, `commit`, `push`, `pull`, `autopush` langsung dari CLI.
4. **Script Runner** — Jalankan npm/python/make script dari dalam aura.
5. **Adaptive AI Learning Engine** — Belajar pola workflow & beri saran.
6. **Plugin Marketplace** — Install/update plugin dari repository resmi.
7. **Persistent Logs** — Riwayat aktivitas tersimpan di `core/aura.log`.
8. **Config File** — Auto-load settings dari `aura.config.json`.
9. **Command History** — Riwayat command tersimpan antar sesi.
10. **Event-driven Automation** — Trigger saat file berubah atau network online.

---

## 2. Instalasi

### Via GitHub
```bash
git clone https://github.com/djunekz/aura
cd aura
npm install
```

### Via NPM
```bash
npm install -g aura-terminal
```

---

## 3. Menjalankan AURA
```bash
aura
```

---

## 4. Perintah Lengkap

### System
| Perintah | Fungsi |
|----------|--------|
| `status` | Status kernel & project |
| `context` | Tipe project terdeteksi |
| `identity` | Tampilkan identitas user |
| `identity set <nama>` | Ubah nama user |
| `help` | Tampilkan semua perintah |
| `exit` | Keluar dari AURA |

### Memory
| Perintah | Fungsi |
|----------|--------|
| `memory` | Lihat semua data memory |
| `memory set <key> <val>` | Simpan data |
| `memory get <key>` | Ambil data |
| `memory delete <key>` | Hapus key |
| `memory clear` | Kosongkan semua |

### Git *(baru)*
| Perintah | Fungsi |
|----------|--------|
| `git status` | Lihat status repo |
| `git log [n]` | Lihat n commit terakhir (default 5) |
| `git add [path]` | Stage file (default `.`) |
| `git commit [pesan]` | Commit dengan pesan |
| `git push [remote] [branch]` | Push ke remote |
| `git pull [remote] [branch]` | Pull dari remote |
| `git autopush [pesan]` | Add + commit + push sekaligus |

### Script Runner *(baru)*
| Perintah | Fungsi |
|----------|--------|
| `run` | Tampilkan script tersedia |
| `run <perintah>` | Jalankan perintah (npm, python, make, dll) |
| `kill` | Hentikan proses yang sedang berjalan |

### Watcher & Network
| Perintah | Fungsi |
|----------|--------|
| `watch on / off` | Aktifkan/matikan file watcher |
| `network on / off` | Aktifkan/matikan network watcher |

### AI
| Perintah | Fungsi |
|----------|--------|
| `ask <pertanyaan>` | Tanya AI tentang project, error, deploy, dll |

### Plugin
| Perintah | Fungsi |
|----------|--------|
| `plugin list` | Lihat plugin terinstall |
| `plugin install <path>` | Install plugin lokal |
| `plugin install-url <url>` | Install plugin dari URL |
| `plugin update <nama>` | Update plugin |
| `marketplace list` | Lihat plugin marketplace |
| `marketplace install <nama>` | Install dari marketplace |

### Scheduler
| Perintah | Fungsi |
|----------|--------|
| `scheduler list` | Lihat task aktif |
| `scheduler add <nama> <detik>` | Tambah task periodik |
| `scheduler stop` | Hentikan semua task |
| `scheduler stop <id\|nama>` | Hentikan task tertentu |

### Logs *(baru)*
| Perintah | Fungsi |
|----------|--------|
| `logs` | Tampilkan 20 log terakhir |
| `logs <n>` | Tampilkan n log terakhir |
| `logs clear` | Kosongkan log |

### Config *(baru)*
| Perintah | Fungsi |
|----------|--------|
| `config` | Tampilkan config saat ini |
| `config init` | Buat `aura.config.json` template |
| `config set <key> <val>` | Ubah nilai config |

### Lainnya
| Perintah | Fungsi |
|----------|--------|
| `history` | Tampilkan command history (30 terakhir) |
| `world status` | Lihat data users & projects |
| `world user <id> <key> <val>` | Update data user |
| `world project <nama> <key> <val>` | Update data project |

---

## 5. Config File (`aura.config.json`)

Buat dengan `config init` lalu edit:

```json
{
  "autoWatch": false,
  "autoScheduler": [
    { "name": "AutoBackup", "interval": 300 }
  ],
  "identity": "Nama Kamu",
  "theme": "default"
}
```

Config ini akan di-load otomatis setiap AURA dijalankan.

---

## 6. Contoh Workflow

### Auto push setiap 10 menit
```text
scheduler add GitPush 600
```
> Perlu plugin AutoDeploy untuk action custom

### Git autopush cepat
```text
git autopush fix: update konfigurasi
```

### Jalankan build
```text
run npm run build
```

### Cek error terakhir
```text
ask error
```

---

## 7. Environment Variables

```bash
export GITHUB_TOKEN=ghp_xxxxyyyyzzz   # untuk AutoDeploy
```

---

## 8. Kontribusi

1. Buat pull request di GitHub.
2. Submit plugin ke marketplace.
3. Selalu test plugin di sandbox sebelum release.

---

## 9. Lisensi

MIT License © 2026 djunekz

---

**Selamat menggunakan AURA**
