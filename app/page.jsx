"use client";

import Link from "next/link";
import LayoutWithSidebar from "./components/LayoutWithSidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <LayoutWithSidebar currentPage="home">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="mb-12 rounded-lg bg-gradient-to-r from-toska to-blue-600 text-white p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">Selamat Datang</h1>
            <p className="text-lg opacity-90 mb-6 text-gray-700
            ">
              Sistem Manajemen Pembayaran IPL Perumahan Margasari
            </p>
            <p className="text-sm opacity-75 text-gray-700">
              Kelola data warga dan catatan pembayaran iuran pemeliharaan lingkungan dengan mudah
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Data Warga */}
            <Link href="/data-warga">
              <div className="group cursor-pointer rounded-lg border-2 border-gray-200 p-6 hover:border-toska hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Data Warga</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Kelola master data pemilik dan penghuni rumah
                </p>
                <div className="inline-block text-toska font-semibold group-hover:translate-x-1 transition">
                  Kelola →
                </div>
              </div>
            </Link>

            {/* Daftar Pembayaran */}
            <Link href="/pembayaran">
              <div className="group cursor-pointer rounded-lg border-2 border-gray-200 p-6 hover:border-toska hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">💳</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Daftar Pembayaran</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Catat dan pantau pembayaran iuran per bulan
                </p>
                <div className="inline-block text-toska font-semibold group-hover:translate-x-1 transition">
                  Lihat →
                </div>
              </div>
            </Link>

            {/* Statistik */}
            <Link href="/statistik">
              <div className="group cursor-pointer rounded-lg border-2 border-gray-200 p-6 hover:border-toska hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Statistik</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Analisis data pembayaran dan laporan tahunan
                </p>
                <div className="inline-block text-toska font-semibold group-hover:translate-x-1 transition">
                  Lihat →
                </div>
              </div>
            </Link>
          </div>

          {/* Features Section */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fitur Utama</h2>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-toska font-bold text-lg">✓</span>
                <span className="text-gray-700">
                  <strong>Manajemen Data Warga</strong> - Tambah, edit, dan hapus data pemilik/penghuni rumah
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-toska font-bold text-lg">✓</span>
                <span className="text-gray-700">
                  <strong>Pencatatan Pembayaran</strong> - Catat pembayaran bulanan untuk setiap rumah
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-toska font-bold text-lg">✓</span>
                <span className="text-gray-700">
                  <strong>Laporan Statistik</strong> - Analisis pembayaran per periode, blok, dan warga
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-toska font-bold text-lg">✓</span>
                <span className="text-gray-700">
                  <strong>Integrasi WhatsApp</strong> - Kirim pemberitahuan atau penagihan langsung via WhatsApp
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-toska font-bold text-lg">✓</span>
                <span className="text-gray-700">
                  <strong>Multi-tahun</strong> - Kelola pembayaran untuk multiple tahun anggaran
                </span>
              </li>
            </ul>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border-l-4 border-toska bg-blue-50 p-6">
              <h3 className="font-bold text-gray-900 mb-2">💡 Tips Penggunaan</h3>
              <p className="text-sm text-gray-600">
                Mulai dengan menambahkan data warga terlebih dahulu di menu <strong>Data Warga</strong>, kemudian catat pembayaran di menu <strong>Daftar Pembayaran</strong>.
              </p>
            </div>
            <div className="rounded-lg border-l-4 border-green-600 bg-green-50 p-6">
              <h3 className="font-bold text-gray-900 mb-2">📱 WhatsApp Integration</h3>
              <p className="text-sm text-gray-600">
                Dari detail warga, Anda dapat langsung mengirim pesan via WhatsApp tanpa keluar dari aplikasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
    </ProtectedRoute>
  );
}
