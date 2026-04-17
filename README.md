# 🏘️ Magnolia - Sistem Manajemen Pembayaran IPL

Aplikasi web untuk mengelola data warga dan pembayaran iuran pemeliharaan lingkungan (IPL) di perumahan. Built dengan Next.js 15, React 19, Supabase, dan Tailwind CSS.

## ✨ Fitur Utama

- 🔐 **Authentication**: Login system dengan password terenkripsi (bcrypt)
- 👥 **Data Warga**: CRUD untuk master data pemilik/penghuni rumah
- 💳 **Pembayaran**: Tracking pembayaran per bulan per tahun
- 📊 **Statistik**: Dashboard dengan metrics dan visualisasi
- 🔧 **Settings**: Pengaturan biaya iuran per jenis properti
- 📱 **WhatsApp Integration**: Kirim reminder pembayaran via WhatsApp
- 🛡️ **Protected Routes**: Semua halaman memerlukan autentikasi

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone <repository-url>
cd magnolia
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan nilai dari Supabase project Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Database Setup

Execute SQL dari `setup-auth.sql` di Supabase SQL Editor:
- Dashboard Supabase → SQL Editor → New Query
- Copy file `setup-auth.sql`
- Execute

### 4. Create Default Admin

```bash
set -a && source .env.local && set +a && node scripts/setup-admin.js
```

**Login credentials:**
- Username: `admin`
- Password: `clustermagnoliaburaden2025`

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000/login](http://localhost:3000/login)

## 📁 Project Structure

```
magnolia/
├── app/
│   ├── api/                    # API routes
│   │   ├── login/              # Authentication endpoint
│   │   ├── logout/
│   │   ├── auth/check/         # Session validation
│   │   └── ...
│   ├── components/             # React components
│   │   ├── LayoutWithSidebar/  # Main layout
│   │   ├── ProtectedRoute/     # Route protection
│   │   └── ...
│   ├── lib/                    # Utilities
│   │   ├── AuthContext.jsx     # Auth state management
│   │   └── ...
│   ├── login/                  # Login page
│   ├── data-warga/             # Master data page
│   ├── pembayaran/             # Payment tracking page
│   ├── statistik/              # Dashboard page
│   └── settings/               # Settings page
├── scripts/
│   ├── setup-admin.js          # Create default admin user
│   └── import-2025.js          # Data import script
├── setup-auth.sql             # Auth database schema
├── setup-schema.sql           # Initial schema
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
└── ...
```

## 🔐 Authentication & Credentials

Sistem autentikasi menggunakan:
- ✅ **bcryptjs** untuk password hashing (10 salt rounds)
- ✅ **Supabase + JWT** untuk session management
- ✅ **HTTP-only cookies** untuk token storage
- ✅ **7-day expiration** untuk session otomatis

**Lihat:** `CREDENTIALS_STORAGE.md` untuk detail teknis

## 📚 Documentation

- **AUTH_SETUP_GUIDE.md** - Panduan setup authentication lengkap
- **CREDENTIALS_STORAGE.md** - Detail sistem penyimpanan & enkripsi password
- **MIGRATION_GUIDE.md** - Panduan migrasi database
- **SETUP_INSTRUCTIONS.md** - Instruksi setup awal

## 🛠️ Development

### Build Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 📦 Dependencies

```json
{
  "@supabase/supabase-js": "^2.49.1",
  "bcryptjs": "^2.4.3",
  "next": "^15.3.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

## 🌐 Deployment

### Netlify

1. Push ke GitHub/GitLab/Bitbucket
2. Connect repository ke Netlify
3. Set environment variables di Netlify dashboard
4. Deploy automatic triggered on push

### Vercel

Similar steps, bisa langsung connect GitHub account

## 📝 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/login` | User authentication |
| POST | `/api/logout` | End session |
| GET | `/api/auth/check` | Validate session |
| POST | `/api/add-warga` | Create resident |
| POST | `/api/update-pembayaran` | Update payment |
| GET | `/api/update-cost-settings` | Get cost settings |

## 🐛 Troubleshooting

**"Missing Supabase environment variables"**
- Check .env.local sudah dikonfigurasi dengan benar
- Restart dev server setelah ubah .env

**Login tidak bekerja**
- Ensure setup-auth.sql sudah di-execute di Supabase
- Check setup-admin.js sudah dijalankan
- Clear browser cookies dan coba lagi

**Protected routes redirect ke login**
- Check /api/auth/check endpoint
- Verify auth_token cookie di browser

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Created for Perumahan Margasari - Cluster Magnolia

---

**Questions?** Check the documentation files atau buat issue di repository.

5. Deploy.

## Catatan

- Build command: `npm run build`
- Next.js runtime di Netlify diaktifkan via plugin `@netlify/plugin-nextjs` pada `netlify.toml`.
