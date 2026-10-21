"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import { ProtectedRoute } from "../components/ProtectedRoute";

const monthsKey = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agt", "sep", "okt", "nov", "des"];
const monthsLabel = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
const YEARS = ["2026", "2025"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Warna batang/persentase berdasarkan tingkat lunas
function toneFor(pct) {
  if (pct >= 80) return { bar: "bg-emerald-500", text: "text-emerald-700" };
  if (pct >= 50) return { bar: "bg-amber-500", text: "text-amber-700" };
  return { bar: "bg-red-500", text: "text-red-600" };
}

function TypeLabel({ type }) {
  if (type === "rumah") return "🏠 Rumah";
  if (type === "ruko") return "🏬 Ruko";
  return type;
}

// Kartu KPI kecil
function KpiTile({ label, value, sub, tone }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold md:text-3xl ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

// Chip insight satu baris
function InsightChip({ icon, label, value, sub }) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-3">
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="truncate text-sm font-semibold text-gray-900">{value}</p>
        {sub && <p className="truncate text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatistikPage() {
  const [stats, setStats] = useState({
    totalWarga: 0,
    totalLunas: 0,
    totalBelumBayar: 0,
    persentaseLunas: 0,
    persentaseBelum: 0,
    byPropertyType: {},
    lunasByType: {},
    monthlyStats: {},
  });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState("2026");

  async function fetchStatistics() {
    if (!supabaseClient) return;
    setLoading(true);
    try {
      // Get all pembayaran with warga details
      const { data: paymentData } = await supabaseClient
        .from("pembayaran_ipl")
        .select("*, data_warga(property_type)")
        .eq("tahun", parseInt(year));

      const totalWarga = paymentData?.length || 0;
      let totalLunas = 0;
      let totalBelum = 0;
      let propertyTypeCount = {};
      let lunasByType = {};
      let monthlyStats = {};

      // Initialize monthly stats
      monthsKey.forEach((month, idx) => {
        monthlyStats[monthsLabel[idx]] = { bayar: 0, belum: 0, total: 0, persentase: 0 };
      });

      paymentData?.forEach(payment => {
        const propertyType = payment.data_warga?.property_type || 'unknown';
        propertyTypeCount[propertyType] = (propertyTypeCount[propertyType] || 0) + 1;

        let statusLunas = true; // Asumsikan lunas sampai ditemukan yang belum bayar
        let paidCount = 0;

        monthsKey.forEach((month, idx) => {
          const value = payment[month];

          // Jika nilai adalah 0, 'N/A', null, atau undefined = belum bayar
          if (value === 0 || value === '0' || value === 'N/A' || value === null || value === undefined) {
            statusLunas = false;
            monthlyStats[monthsLabel[idx]].belum++;
          } else if (value && value !== 'N/A') {
            // Nilai > 0 berarti sudah bayar
            monthlyStats[monthsLabel[idx]].bayar++;
            paidCount++;
          } else {
            monthlyStats[monthsLabel[idx]].belum++;
            statusLunas = false;
          }
          monthlyStats[monthsLabel[idx]].total++;
        });

        // Jika semua bulan sudah bayar, masuk kategori Lunas
        if (statusLunas && paidCount === 12) {
          totalLunas++;
          lunasByType[propertyType] = (lunasByType[propertyType] || 0) + 1;
        } else {
          totalBelum++;
        }
      });

      // Calculate percentages
      const persenLunas = totalWarga > 0 ? Math.round((totalLunas / totalWarga) * 100) : 0;
      const persenBelum = totalWarga > 0 ? Math.round((totalBelum / totalWarga) * 100) : 0;

      // Calculate monthly percentages
      Object.keys(monthlyStats).forEach(bulan => {
        const total = monthlyStats[bulan].total;
        monthlyStats[bulan].persentase = total > 0 ? Math.round((monthlyStats[bulan].bayar / total) * 100) : 0;
      });

      setStats({
        totalWarga,
        totalLunas,
        totalBelumBayar: totalBelum,
        persentaseLunas: persenLunas,
        persentaseBelum: persenBelum,
        byPropertyType: propertyTypeCount,
        lunasByType,
        monthlyStats,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatistics();
  }, [year]);

  const isCurrentYear = new Date().getFullYear() === parseInt(year);
  const currentMonthLabel = monthsLabel[new Date().getMonth()];

  // Insight turunan dari data bulanan (tidak ada query tambahan)
  const insights = useMemo(() => {
    const months = Object.entries(stats.monthlyStats).filter(([, d]) => d.total > 0);
    const best = months.reduce((a, b) => (b[1].persentase > a[1].persentase ? b : a), months[0]);
    const worst = months.reduce((a, b) => (b[1].persentase < a[1].persentase ? b : a), months[0]);
    const belumBulanIni = isCurrentYear ? stats.monthlyStats[currentMonthLabel]?.belum ?? 0 : null;
    return { best, worst, belumBulanIni };
  }, [stats.monthlyStats, isCurrentYear, currentMonthLabel]);

  const donutStyle = {
    background:
      stats.totalWarga > 0
        ? `conic-gradient(#10b981 0% ${stats.persentaseLunas}%, #f43f5e ${stats.persentaseLunas}% 100%)`
        : "conic-gradient(#e5e7eb 0% 100%)",
  };

  return (
    <ProtectedRoute>
      <LayoutWithSidebar currentPage="statistik">
      <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-5 md:px-8 md:pt-8">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-toska">📊 Statistik Pembayaran</h1>
              <p className="text-sm text-gray-600">Ringkasan iuran {year}</p>
            </div>
            <div className="glass flex shrink-0 rounded-xl p-1">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition active:scale-95 ${
                    year === y ? "bg-toska text-white shadow" : "text-gray-600"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="glass rounded-2xl p-10 text-center text-gray-500">Memuat statistik...</div>
          ) : (
            <div className="space-y-4">
              {/* Hero: donut lunas + legenda */}
              <div className="glass-strong flex flex-col items-center gap-5 rounded-3xl p-5 sm:flex-row md:p-6">
                <div className="relative h-36 w-36 shrink-0 rounded-full md:h-40 md:w-40" style={donutStyle}>
                  <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white/90 shadow-inner">
                    <span className="text-2xl font-extrabold text-gray-900">{stats.persentaseLunas}%</span>
                    <span className="text-[11px] text-gray-500">lunas</span>
                  </div>
                </div>

                <div className="grid w-full grid-cols-3 gap-3 text-center sm:text-left">
                  <div>
                    <p className="text-xs text-gray-500">Total warga</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalWarga}</p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 sm:justify-start">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Lunas
                    </p>
                    <p className="text-xl font-bold text-emerald-700">{stats.totalLunas}</p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 sm:justify-start">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Belum
                    </p>
                    <p className="text-xl font-bold text-rose-600">{stats.totalBelumBayar}</p>
                  </div>
                </div>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <KpiTile label="Total Warga" value={stats.totalWarga} sub={`Tahun ${year}`} tone="text-gray-900" />
                <KpiTile label="Lunas" value={stats.totalLunas} sub={`${stats.persentaseLunas}% warga`} tone="text-emerald-700" />
                <KpiTile label="Belum Bayar" value={stats.totalBelumBayar} sub={`${stats.persentaseBelum}% warga`} tone="text-rose-600" />
                <KpiTile
                  label="Belum Bulan Ini"
                  value={insights.belumBulanIni ?? "—"}
                  sub={isCurrentYear ? currentMonthLabel : "Tahun arsip"}
                  tone="text-amber-700"
                />
              </div>

              {/* Insight */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InsightChip
                  icon="🏆"
                  label="Bulan terbaik"
                  value={insights.best ? `${insights.best[0]} · ${insights.best[1].persentase}%` : "—"}
                  sub={insights.best ? `${insights.best[1].bayar} pembayaran masuk` : null}
                />
                <InsightChip
                  icon="⚠️"
                  label="Bulan terendah"
                  value={insights.worst ? `${insights.worst[0]} · ${insights.worst[1].persentase}%` : "—"}
                  sub={insights.worst ? `${insights.worst[1].belum} belum bayar` : null}
                />
                <InsightChip
                  icon="🏘️"
                  label="Lunas per properti"
                  value={
                    Object.keys(stats.byPropertyType).length
                      ? Object.entries(stats.byPropertyType)
                          .map(([type, count]) => {
                            const pct = count > 0 ? Math.round(((stats.lunasByType[type] || 0) / count) * 100) : 0;
                            return `${type === "ruko" ? "Ruko" : "Rumah"} ${pct}%`;
                          })
                          .join(" · ")
                      : "—"
                  }
                />
              </div>

              {/* Grafik batang per bulan */}
              <div className="glass rounded-2xl p-4 md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Pembayaran per Bulan</h3>
                  <div className="hidden items-center gap-3 text-xs text-gray-500 sm:flex">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />≥80%</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />50–79%</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />&lt;50%</span>
                  </div>
                </div>
                <div className="flex h-44 items-end gap-1.5 md:gap-3">
                  {Object.entries(stats.monthlyStats).map(([bulan, data]) => {
                    const tone = toneFor(data.persentase);
                    const isNow = isCurrentYear && bulan === currentMonthLabel;
                    return (
                      <div
                        key={bulan}
                        className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                        title={`${bulan}: ${data.bayar} bayar, ${data.belum} belum (${data.persentase}%)`}
                      >
                        <span className={`text-[10px] font-semibold md:text-xs ${tone.text}`}>
                          {data.total > 0 ? `${data.persentase}%` : ""}
                        </span>
                        <div className="flex h-full w-full items-end rounded-t-lg bg-white/50">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${tone.bar} ${
                              isNow ? "ring-2 ring-teal-700 ring-offset-1" : ""
                            }`}
                            style={{ height: `${Math.max(data.persentase, data.total > 0 ? 3 : 0)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] md:text-xs ${isNow ? "font-bold text-teal-700" : "text-gray-500"}`}>
                          {bulan}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Jenis properti */}
                <div className="glass rounded-2xl p-4 md:p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">Jenis Properti</h3>
                  <div className="space-y-4">
                    {Object.keys(stats.byPropertyType).length === 0 && (
                      <p className="text-sm text-gray-400">Belum ada data</p>
                    )}
                    {Object.entries(stats.byPropertyType).map(([type, count]) => {
                      const percentage = stats.totalWarga > 0 ? Math.round((count / stats.totalWarga) * 100) : 0;
                      const lunas = stats.lunasByType[type] || 0;
                      const lunasPct = count > 0 ? Math.round((lunas / count) * 100) : 0;
                      return (
                        <div key={type}>
                          <div className="mb-1.5 flex items-baseline justify-between text-sm">
                            <span className="font-medium text-gray-700"><TypeLabel type={type} /></span>
                            <span className="font-semibold text-gray-900">{count} warga · {percentage}%</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/60">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                type === "rumah" ? "bg-blue-500" : "bg-orange-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Lunas {lunas} dari {count} ({lunasPct}%)
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detail per bulan: dilipat supaya halaman tidak panjang */}
                <details className="glass group rounded-2xl p-4 md:p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
                    Detail per Bulan
                    <span className="text-sm font-normal text-teal-700 group-open:hidden">Lihat ▾</span>
                    <span className="hidden text-sm font-normal text-teal-700 group-open:inline">Tutup ▴</span>
                  </summary>
                  <div className="mt-4 overflow-x-auto rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-toska text-white">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Bulan</th>
                          <th className="px-3 py-2 text-center font-medium">Bayar</th>
                          <th className="px-3 py-2 text-center font-medium">Belum</th>
                          <th className="px-3 py-2 text-center font-medium">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stats.monthlyStats).map(([bulan, data], idx) => (
                          <tr key={bulan} className={idx % 2 === 0 ? "bg-white/40" : "bg-white/20"}>
                            <td className="px-3 py-2 font-medium text-gray-900">{bulan}</td>
                            <td className="px-3 py-2 text-center font-semibold text-emerald-700">{data.bayar}</td>
                            <td className="px-3 py-2 text-center font-semibold text-rose-600">{data.belum}</td>
                            <td className={`px-3 py-2 text-center font-semibold ${toneFor(data.persentase).text}`}>
                              {data.persentase}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>

              <p className="glass rounded-2xl p-3 text-center text-xs text-gray-600 md:text-left">
                💡 Gunakan halaman <span className="font-semibold">Pembayaran</span> untuk detail per warga dan kirim reminder WhatsApp.
              </p>
            </div>
          )}
      </div>
    </LayoutWithSidebar>
    </ProtectedRoute>
  );
}
