"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import { ProtectedRoute } from "../components/ProtectedRoute";

const monthsKey = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agt", "sep", "okt", "nov", "des"];
const monthsLabel = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function StatistikPage() {
  const [stats, setStats] = useState({
    totalWarga: 0,
    totalLunas: 0,
    totalBelumBayar: 0,
    persentaseLunas: 0,
    persentaseBelum: 0,
    byPropertyType: {},
    monthlyStats: {},
  });
  const [loading, setLoading] = useState(false);
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
      let monthlyStats = {};

      // Initialize monthly stats
      monthsKey.forEach((month, idx) => {
        monthlyStats[monthsLabel[idx]] = { bayar: 0, belum: 0, total: 0, persentase: 0 };
      });

      paymentData?.forEach(payment => {
        const propertyType = payment.data_warga?.property_type || 'unknown';
        propertyTypeCount[propertyType] = (propertyTypeCount[propertyType] || 0) + 1;
        
        let hasUnpaid = false;
        let paidMonthCount = 0;

        monthsKey.forEach((month, idx) => {
          const status = String(payment[month]);
          if (status === '0') {
            hasUnpaid = true;
            monthlyStats[monthsLabel[idx]].belum++;
          } else if (status !== 'N/A' && status) {
            monthlyStats[monthsLabel[idx]].bayar++;
            paidMonthCount++;
          }
          monthlyStats[monthsLabel[idx]].total++;
        });

        if (hasUnpaid) {
          totalBelum++;
        } else if (paidMonthCount === 12) {
          totalLunas++;
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
        totalBelum,
        persentaseLunas: persenLunas,
        persentaseBelum: persenBelum,
        byPropertyType: propertyTypeCount,
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

  return (
    <ProtectedRoute>
      <LayoutWithSidebar currentPage="statistik">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-toska">📊 Statistik Pembayaran</h1>
                <p className="text-gray-600 mt-2">Dashboard overview iuran pemeliharaan lingkungan</p>
              </div>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 bg-white cursor-pointer"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Memuat statistik...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Warga */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Warga</p>
                      <p className="text-4xl font-bold text-blue-700 mt-2">{stats.totalWarga}</p>
                    </div>
                    <div className="text-4xl opacity-20">👥</div>
                  </div>
                </div>

                {/* Lunas */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Lunas</p>
                      <p className="text-4xl font-bold text-green-700 mt-2">{stats.totalLunas}</p>
                      <p className="text-xs text-green-600 mt-1">{stats.persentaseLunas}% warga</p>
                    </div>
                    <div className="text-4xl opacity-20">✓</div>
                  </div>
                </div>

                {/* Belum Bayar */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm border border-red-200 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Belum Bayar</p>
                      <p className="text-4xl font-bold text-red-700 mt-2">{stats.totalBelum}</p>
                      <p className="text-xs text-red-600 mt-1">{stats.persentaseBelum}% warga</p>
                    </div>
                    <div className="text-4xl opacity-20">⚠️</div>
                  </div>
                </div>

                {/* Tahun */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Tahun Aktif</p>
                      <p className="text-4xl font-bold text-purple-700 mt-2">{year}</p>
                      <p className="text-xs text-purple-600 mt-1">{new Date().getFullYear() === parseInt(year) ? 'Berjalan' : 'Arsip'}</p>
                    </div>
                    <div className="text-4xl opacity-20">📅</div>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Target Pembayaran</h3>
                <div className="space-y-5">
                  {/* Lunas */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Lunas</span>
                      <span className="font-bold text-green-600">{stats.persentaseLunas}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stats.persentaseLunas}%` }}
                      />
                    </div>
                  </div>

                  {/* Belum Bayar */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-700">Belum Bayar</span>
                      <span className="font-bold text-red-600">{stats.persentaseBelum}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stats.persentaseBelum}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Type & Monthly Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Property Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">🏘️ Jenis Properti</h3>
                  <div className="space-y-4">
                    {Object.entries(stats.byPropertyType).map(([type, count]) => {
                      const percentage = stats.totalWarga > 0 ? Math.round((count / stats.totalWarga) * 100) : 0;
                      const typeLabel = type === 'rumah' ? '🏠 Rumah' : type === 'ruko' ? '🏬 Ruko' : type;
                      return (
                        <div key={type}>
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-gray-700">{typeLabel}</span>
                            <span className="font-bold text-gray-900">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                type === 'rumah' ? 'bg-blue-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">📋 Ringkasan</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100">
                      <span className="text-gray-700 font-medium">Total Warga</span>
                      <span className="text-3xl font-bold text-blue-600">{stats.totalWarga}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100">
                      <span className="text-gray-700 font-medium">Sudah Lunas</span>
                      <span className="text-3xl font-bold text-green-600">{stats.totalLunas}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b-2 border-gray-100">
                      <span className="text-gray-700 font-medium">Belum Bayar</span>
                      <span className="text-3xl font-bold text-red-600">{stats.totalBelum}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-toska text-white px-6 py-4">
                  <h3 className="text-lg font-semibold">📊 Statistik Per Bulan</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Bulan</th>
                        <th className="px-4 py-3 text-center font-semibold text-green-600">Bayar</th>
                        <th className="px-4 py-3 text-center font-semibold text-red-600">Belum</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Total</th>
                        <th className="px-4 py-3 text-center font-semibold text-blue-600">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.monthlyStats).map(([bulan, data], idx) => (
                        <tr key={bulan} className={idx % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-100'}>
                          <td className="px-4 py-3 font-medium text-gray-900">{bulan}</td>
                          <td className="px-4 py-3 text-center text-green-600 font-semibold">{data.bayar}</td>
                          <td className="px-4 py-3 text-center text-red-600 font-semibold">{data.belum}</td>
                          <td className="px-4 py-3 text-center text-gray-700 font-semibold">{data.total}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block rounded-full bg-blue-100 text-blue-700 px-3 py-1 font-semibold text-xs">
                              {data.persentase}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">💡 Tips:</span> Gunakan halaman "Pembayaran" untuk melihat detail per warga dan mengirim reminder via WhatsApp.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutWithSidebar>
    </ProtectedRoute>
  );
}
