"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import LayoutWithSidebar from "./components/LayoutWithSidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./lib/AuthContext";

const monthsKey = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agt", "sep", "okt", "nov", "des"];
const monthsLabel = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function KPICard({ label, value, sub, icon, gradient, textColor, subColor }) {
  return (
    <div className={`rounded-2xl p-6 shadow-md border border-white/60 ${gradient} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200`}>
      <div className="absolute -right-4 -top-4 text-8xl opacity-10 select-none">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className={`text-4xl font-extrabold ${textColor} mt-1 tabular-nums`}>{value}</p>
      {sub && <p className={`text-xs mt-2 font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}

function MonthBar({ label, pct, bayar, belum, isCurrentMonth }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0 group cursor-default">
      <div className="relative w-full flex flex-col items-center justify-end" style={{ height: 80 }}>
        {/* tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
          <div className="font-semibold">{label}</div>
          <div className="text-green-400">Bayar: {bayar}</div>
          <div className="text-red-400">Belum: {belum}</div>
          <div className="text-gray-300">{pct}% lunas</div>
        </div>
        {/* bar */}
        <div
          className={`w-full rounded-t-md transition-all duration-700 ease-out ${
            pct >= 80
              ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
              : pct >= 50
              ? "bg-gradient-to-t from-amber-500 to-amber-400"
              : "bg-gradient-to-t from-red-500 to-red-400"
          } ${isCurrentMonth ? "ring-2 ring-offset-1 ring-teal-600" : ""}`}
          style={{ height: `${Math.max(pct, 4)}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isCurrentMonth ? "text-teal-700 font-bold" : "text-gray-500"} truncate`}>
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentUnpaid, setRecentUnpaid] = useState([]);
  const [time, setTime] = useState(new Date());
  const [activeYear, setActiveYear] = useState(currentYear);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Direct fetch for current year (same pattern as statistik page)
      let fetchYear = currentYear;
      let { data: paymentData, error } = await supabaseClient
        .from("pembayaran_ipl")
        .select("*, data_warga(nama, blok, no, property_type)")
        .eq("tahun", fetchYear);

      if (error) {
        console.error("Dashboard fetch error (year " + fetchYear + "):", error.message, error.code, error.details);
      }

      // Fallback to previous year if no data found
      if (!paymentData || paymentData.length === 0) {
        fetchYear = currentYear - 1;
        const res = await supabaseClient
          .from("pembayaran_ipl")
          .select("*, data_warga(nama, blok, no, property_type)")
          .eq("tahun", fetchYear);
        paymentData = res.data;
        if (res.error) console.error("Fallback fetch error:", res.error);
      }

      setActiveYear(fetchYear);

      const totalWarga = paymentData?.length || 0;
      let totalLunas = 0;
      let totalBelum = 0;
      const monthlyStats = {};

      monthsKey.forEach((m, i) => {
        monthlyStats[i] = { bayar: 0, belum: 0 };
      });

      const unpaidThisMonth = [];

      paymentData?.forEach((payment) => {
        let allPaid = true;
        let paidCount = 0;

        monthsKey.forEach((month, idx) => {
          const value = payment[month];
          const notPaid =
            value === 0 ||
            value === "0" ||
            value === "N/A" ||
            value === null ||
            value === undefined;

          if (notPaid) {
            monthlyStats[idx].belum++;
            allPaid = false;
          } else {
            monthlyStats[idx].bayar++;
            paidCount++;
          }
        });

        if (allPaid && paidCount === 12) {
          totalLunas++;
        } else {
          totalBelum++;
        }

        // Check if unpaid this month
        const thisMonthKey = monthsKey[currentMonth];
        const thisVal = payment[thisMonthKey];
        const unpaidThisMonthVal =
          thisVal === 0 ||
          thisVal === "0" ||
          thisVal === "N/A" ||
          thisVal === null ||
          thisVal === undefined;
        if (unpaidThisMonthVal && payment.data_warga) {
          unpaidThisMonth.push({
            nama: payment.data_warga.nama,
            blok: payment.data_warga.blok,
            no: payment.data_warga.no,
            property_type: payment.data_warga.property_type,
          });
        }
      });

      const persenLunas =
        totalWarga > 0 ? Math.round((totalLunas / totalWarga) * 100) : 0;

      const monthlyArr = monthsKey.map((_, i) => {
        const d = monthlyStats[i];
        const total = d.bayar + d.belum;
        return {
          label: monthsLabel[i],
          bayar: d.bayar,
          belum: d.belum,
          pct: total > 0 ? Math.round((d.bayar / total) * 100) : 0,
        };
      });

      setStats({
        totalWarga,
        totalLunas,
        totalBelum,
        persenLunas,
        monthlyArr,
      });

      setRecentUnpaid(unpaidThisMonth.slice(0, 6));
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  const greeting = () => {
    const h = time.getHours();
    if (h < 11) return "Selamat Pagi";
    if (h < 15) return "Selamat Siang";
    if (h < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const formatDate = (d) =>
    d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (d) =>
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <ProtectedRoute>
      <LayoutWithSidebar currentPage="home">
        <div className="flex-1 overflow-y-auto bg-gray-50 min-h-screen">
          {/* ── Hero / Greeting Banner ─────────────────────────────────── */}
          <div
            className="relative overflow-hidden px-6 py-8 md:px-10 md:py-10"
            style={{
              background: "linear-gradient(135deg, #008080 0%, #00a896 50%, #02c39a 100%)",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute top-16 -right-4 w-24 h-24 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 left-1/2 w-64 h-32 bg-black/5 rounded-full" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">
                  {formatDate(time)}
                </p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                  {greeting()}, {user?.name || user?.username || "Admin"} 👋
                </h1>
                <p className="text-white/80 text-sm mt-2">
                  Sistem Manajemen IPL · Perumahan Margasari
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl md:text-4xl font-mono font-bold text-white tabular-nums">
                  {formatTime(time)}
                </div>
                <p className="text-white/70 text-xs mt-1">Tahun Aktif: {activeYear}</p>
              </div>
            </div>
          </div>

          <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-8">
            {/* ── KPI Cards ─────────────────────────────────────────────── */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl p-6 bg-gray-200 animate-pulse h-32" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Total Warga"
                  value={stats.totalWarga}
                  sub={`Terdaftar tahun ${activeYear}`}
                  icon="👥"
                  gradient="bg-gradient-to-br from-blue-50 to-blue-100"
                  textColor="text-blue-700"
                  subColor="text-blue-500"
                />
                <KPICard
                  label="Lunas"
                  value={stats.totalLunas}
                  sub={`${stats.persenLunas}% dari total warga`}
                  icon="✅"
                  gradient="bg-gradient-to-br from-emerald-50 to-emerald-100"
                  textColor="text-emerald-700"
                  subColor="text-emerald-500"
                />
                <KPICard
                  label="Belum Bayar"
                  value={stats.totalBelum}
                  sub={`${100 - stats.persenLunas}% perlu ditagih`}
                  icon="⚠️"
                  gradient="bg-gradient-to-br from-red-50 to-red-100"
                  textColor="text-red-700"
                  subColor="text-red-500"
                />
                <KPICard
                  label="Koleksi Tahun Ini"
                  value={`${stats.persenLunas}%`}
                  sub={stats.persenLunas >= 75 ? "🎯 Di atas target" : "📌 Perlu dorongan"}
                  icon="📊"
                  gradient="bg-gradient-to-br from-purple-50 to-purple-100"
                  textColor="text-purple-700"
                  subColor={stats.persenLunas >= 75 ? "text-emerald-600" : "text-amber-600"}
                />
              </div>
            ) : null}

            {/* ── Payment Rate Bar Chart + Unpaid This Month ─────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Tingkat Pembayaran Bulanan</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Persentase warga yang sudah bayar tiap bulan · {activeYear}</p>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-400" />≥80%</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-amber-400" />50–79%</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-400" />&lt;50%</span>
                  </div>
                </div>

                {loading ? (
                  <div className="h-28 bg-gray-100 animate-pulse rounded-lg" />
                ) : stats ? (
                  <div className="flex items-end gap-1.5 h-28 px-1">
                    {stats.monthlyArr.map((m, i) => (
                      <MonthBar
                        key={m.label}
                        label={m.label}
                        pct={m.pct}
                        bayar={m.bayar}
                        belum={m.belum}
                        isCurrentMonth={i === currentMonth}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-gray-400 text-sm">
                    Tidak ada data
                  </div>
                )}

                {/* Progress bar summary */}
                {stats && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                      <span className="font-medium">Keseluruhan Tahun {activeYear}</span>
                      <span className="font-bold text-teal-700">{stats.persenLunas}% lunas</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
                        style={{ width: `${stats.persenLunas}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Belum bayar bulan ini */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Belum Bayar</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{monthsLabel[currentMonth]} {activeYear}</p>
                  </div>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {loading ? "…" : recentUnpaid.length} warga
                  </span>
                </div>

                {loading ? (
                  <div className="space-y-2 flex-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : recentUnpaid.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-4">
                    <span className="text-4xl mb-2">🎉</span>
                    <p className="text-sm font-medium text-gray-600">Semua sudah bayar!</p>
                    <p className="text-xs">Bulan {monthsLabel[currentMonth]} 100% lunas</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {recentUnpaid.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2.5 hover:bg-red-100 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-red-700">
                            {(w.nama || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{w.nama}</p>
                          <p className="text-xs text-gray-500">
                            Blok {w.blok} / No. {w.no} · {w.property_type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href="/pembayaran"
                  className="mt-4 block text-center text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors"
                >
                  Lihat semua pembayaran →
                </Link>
              </div>
            </div>

            {/* ── Quick Access Cards ─────────────────────────────────── */}
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Akses Cepat</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Data Warga */}
                <Link href="/data-warga">
                  <div className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-0.5">Data Warga</h3>
                      <p className="text-xs text-gray-500">Kelola master data pemilik &amp; penghuni rumah</p>
                      <span className="inline-block mt-2 text-xs font-semibold text-teal-700 group-hover:translate-x-1 transition-transform">Kelola →</span>
                    </div>
                  </div>
                </Link>

                {/* Pembayaran */}
                <Link href="/pembayaran">
                  <div className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-0.5">Daftar Pembayaran</h3>
                      <p className="text-xs text-gray-500">Catat &amp; pantau pembayaran iuran per bulan</p>
                      <span className="inline-block mt-2 text-xs font-semibold text-teal-700 group-hover:translate-x-1 transition-transform">Lihat →</span>
                    </div>
                  </div>
                </Link>

                {/* Statistik */}
                <Link href="/statistik">
                  <div className="group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-0.5">Statistik</h3>
                      <p className="text-xs text-gray-500">Analisis data pembayaran &amp; laporan tahunan</p>
                      <span className="inline-block mt-2 text-xs font-semibold text-teal-700 group-hover:translate-x-1 transition-transform">Lihat →</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* ── Info Strip ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-teal-50 border border-teal-100 p-5 flex gap-4 items-start">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-semibold text-teal-800 text-sm mb-1">Tips Penggunaan</p>
                  <p className="text-xs text-teal-700">
                    Mulai dengan menambahkan data warga di menu <strong>Data Warga</strong>, lalu catat pembayaran bulanan di menu <strong>Daftar Pembayaran</strong>.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-green-50 border border-green-100 p-5 flex gap-4 items-start">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-semibold text-green-800 text-sm mb-1">WhatsApp Integration</p>
                  <p className="text-xs text-green-700">
                    Dari halaman <strong>Pembayaran</strong>, Anda bisa langsung kirim tagihan atau pengingat via WhatsApp ke warga yang belum membayar.
                  </p>
                </div>
              </div>
            </div>

            {/* footer */}
            <p className="text-center text-xs text-gray-400 pb-2">
              WargaApp v1.1.0 &copy; {currentYear} Pengelola Perumahan Margasari
            </p>
          </div>
        </div>
      </LayoutWithSidebar>
    </ProtectedRoute>
  );
}
