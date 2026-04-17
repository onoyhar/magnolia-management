"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { calculateMonthlyCost } from "../lib/costUtils";

const monthsKey = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agt", "sep", "okt", "nov", "des"];
const monthsLabel = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

function calculateTotal(row, monthIdx, costConfigs, costSettings) {
  // DEBUG: log for problematic warga
  if (row.nama && row.nama.includes('Prasindo')) {
    console.log(`[DEBUG] ${row.nama} - costConfigs:`, costConfigs, 'costSettings:', costSettings);
  }
  
  // If there's a cost config for this warga+tahun, use it
  if (costConfigs && costConfigs.length > 0) {
    // For the next months, calculate using the cost config
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const cost = calculateMonthlyCost(m + 1, row.tahun, costConfigs, costSettings);
      const monthStatus = String(row?.[monthsKey[m]]);
      if (row.nama && row.nama.includes('Prasindo')) {
        console.log(`[DEBUG] ${monthsKey[m]} (m=${m}): status=${monthStatus}, cost=${cost}, tahun=${row.tahun}`);
      }
      if (monthStatus === "0") {
        total += cost;
      }
    }
    if (row.nama && row.nama.includes('Prasindo')) {
      console.log(`[DEBUG] ${row.nama} TOTAL: ${total}`);
    }
    return total;
  }
  
  // Fallback to old logic if no cost config
  if (row.nama && row.nama.includes('Prasindo')) {
    console.log(`[DEBUG] ${row.nama} using FALLBACK (no configs)`);
  }
  return monthsKey.reduce((acc, month) => {
    if (String(row?.[month]) === "0") {
      return acc + 100000;
    }
    return acc;
  }, 0);
}

function formatCurrencyInput(value) {
  if (value === "N/A" || !value) return "";
  const num = parseInt(value) || 0;
  return num.toLocaleString('id-ID');
}

function parseCurrencyInput(value) {
  if (!value || value === "N/A") return "N/A";
  const num = parseInt(value.replace(/\D/g, "")) || 0;
  return num.toString();
}

// Helper function untuk generate WA message
function generateWAMessage(warga, totalDue, year, months) {
  const months_unpaid = months
    .map((m, idx) => {
      const status = warga[m];
      return String(status) === "0" ? monthsLabel[idx] : null;
    })
    .filter(m => m !== null)
    .join(", ");

  const message = `Halo ${warga.nama}, kami ingin mengingatkan bahwa ada tagihan IPL yang belum dibayar untuk tahun ${year}.\n\n📌 Detail:\n- Lokasi: Blok ${warga.blok}\n- Bulan: ${months_unpaid}\n- Total: Rp${totalDue.toLocaleString('id-ID')}\n\n💳 Silakan transfer ke:\nRekening: BSI 7309005826\na.n. CLUSTER MAGNOLIA BURADEN\n\nMohon segera melakukan pembayaran. Terima kasih.`;
  
  return message;
}

// Helper untuk generate WA link
function generateWALink(phoneNumber, message) {
  // Remove +62 dan ganti dengan 0, atau pastikan format benar
  let phone = phoneNumber.replace(/\D/g, ''); // hapus non-digit
  if (phone.startsWith('62')) {
    phone = phone.substring(2); // hapus 62, jadi '8xxx'
  }
  if (!phone.startsWith('0')) {
    phone = '0' + phone; // tambah 0 jika belum ada
  }
  phone = '62' + phone.substring(1); // rubah 0 jadi 62
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

// Modal Edit Pembayaran
function ModalEditPembayaran({ row, onClose, onSave }) {
  const [formData, setFormData] = useState(row || {});
  const [displayValues, setDisplayValues] = useState(
    Object.keys(row || {}).reduce((acc, key) => {
      acc[key] = formatCurrencyInput(row[key]);
      return acc;
    }, {})
  );

  const handleChange = (field, value) => {
    // Only allow digits or N/A
    if (value === "N/A" || /^\d*$/.test(value)) {
      setDisplayValues((prev) => ({ ...prev, [field]: value }));
      setFormData((prev) => ({ ...prev, [field]: value || "N/A" }));
    }
  };

  const handleSave = async () => {
    try {
      // Use API endpoint with service role key to bypass RLS
      const response = await fetch("/api/update-pembayaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, data: formData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update data");
      }

      alert("Data berhasil diupdate");
      onSave();
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-toska">💳 Edit Pembayaran - {formData.nama}</h2>
        <p className="text-xs text-gray-500 mb-4">Masukkan angka (otomatis format) atau N/A</p>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {monthsKey.map((month, idx) => (
            <div key={month}>
              <label className="block text-sm font-medium text-gray-700">{monthsLabel[idx]}</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">Rp</span>
                <input
                  type="text"
                  value={displayValues[month] || ""}
                  onChange={(e) => handleChange(month, e.target.value)}
                  placeholder="0 atau N/A"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-toska px-4 py-2 text-white font-medium hover:opacity-80"
            type="button"
          >
            Simpan
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-50"
            type="button"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PembayaranPage() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("2026");
  const [editingRow, setEditingRow] = useState(null);
  const [costSettings, setCostSettings] = useState({});
  const [wargaCostConfigs, setWargaCostConfigs] = useState({});

  async function fetchData() {
    if (!supabaseClient) {
      setError("Supabase belum dikonfigurasi");
      return;
    }

    setLoading(true);
    try {
      // Query from pembayaran_ipl with join to data_warga
      const { data, err } = await supabaseClient
        .from("pembayaran_ipl")
        .select("*, data_warga(no, nama, blok, property_type, no_hp)")
        .eq("tahun", parseInt(year))
        .order("data_warga(no)", { ascending: true });

      if (err) throw err;
      
      // Flatten the response to match expected structure
      const flatData = (data || []).map(row => ({
        id: row.warga_id,
        no: row.data_warga?.no,
        nama: row.data_warga?.nama,
        blok: row.data_warga?.blok,
        property_type: row.data_warga?.property_type,
        no_hp: row.data_warga?.no_hp,
        tahun: row.tahun,
        jan: row.jan,
        feb: row.feb,
        mar: row.mar,
        apr: row.apr,
        mei: row.mei,
        jun: row.jun,
        jul: row.jul,
        agt: row.agt,
        sep: row.sep,
        okt: row.okt,
        nov: row.nov,
        des: row.des,
      }));
      
      setAllData(flatData);
      
      // Fetch cost configs in ONE query instead of per-warga (PERFORMANCE FIX)
      if (flatData && flatData.length > 0) {
        const configsMap = {};
        
        // Get all unique warga IDs
        const wargaIds = flatData.map(r => r.id);
        
        // Fetch ALL cost configs in one query
        const { data: allConfigs, error: configErr } = await supabaseClient
          .from("warga_cost_config")
          .select("*")
          .in("warga_id", wargaIds)
          .eq("tahun", parseInt(year))
          .order("warga_id, start_month", { ascending: true });

        if (!configErr && allConfigs) {
          // Map configs by warga_id-year key
          allConfigs.forEach(config => {
            const key = `${config.warga_id}-${year}`;
            if (!configsMap[key]) {
              configsMap[key] = [];
            }
            configsMap[key].push(config);
          });
        }
        
        setWargaCostConfigs(configsMap);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCostSettings() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from("ipl_settings")
        .select("setting_key, amount")
        .order("setting_key", { ascending: true });

      if (error) throw error;
      if (data) {
        const settings = {};
        data.forEach(item => {
          settings[item.setting_key] = item.amount;
        });
        setCostSettings(settings);
      }
    } catch (err) {
      console.error("Error fetching cost settings:", err);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Yakin ingin menghapus data pembayaran ini?")) return;

    try {
      const { error: err } = await supabaseClient.from("pembayaran_warga").delete().eq("id", id);

      if (err) throw err;
      alert("Data berhasil dihapus");
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  useEffect(() => {
    fetchData();
    fetchCostSettings();
  }, [year]);

  const filteredData = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    return allData.filter((item) => {
      const byYear = String(item?.tahun ?? "") === String(year);
      const bySearch =
        String(item?.nama ?? "").toLowerCase().includes(lowerSearch) ||
        String(item?.blok ?? "").toLowerCase().includes(lowerSearch);

      return byYear && bySearch;
    });
  }, [allData, search, year]);

  return (
    <ProtectedRoute>
      <LayoutWithSidebar currentPage="pembayaran">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-full">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-toska">Daftar Pembayaran Iuran</h1>
              <p className="text-gray-600">Manajemen pembayaran iuran per tahun</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('Refreshing pembayaran data...');
                  fetchData();
                }}
                className="rounded-lg bg-green-500 px-4 py-2 text-white cursor-pointer hover:bg-green-600 text-sm font-medium"
                title="Refresh data & biaya (untuk sync dengan Data Warga)"
                type="button"
              >
                🔄 Refresh
              </button>
              
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 bg-white cursor-pointer"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama atau blok..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 pl-10"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">{error}</div>}

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-toska text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-medium min-w-[120px]">Nama</th>
                  <th className="px-3 py-2 text-left font-medium">Blok</th>
                  {monthsKey.map((m, i) => (
                    <th key={m} className="px-2 py-2 text-center font-medium text-xs">
                      {monthsLabel[i].slice(0, 3)}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-bold bg-amber-500 text-white">TOTAL<br/>TAGIHAN</th>
                  <th className="px-3 py-2 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={monthsKey.length + 5} className="py-8 text-center text-gray-400">
                      Memuat...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={monthsKey.length + 5} className="py-8 text-center text-gray-400">
                      Tidak ada data tahun {year}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => {
                    const costKey = `${row.id}-${year}`;
                    const costConfigs = wargaCostConfigs[costKey] || [];
                    const totalDue = calculateTotal(row, 0, costConfigs, costSettings);
                    return (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-semibold text-gray-900">{row.nama}</td>
                        <td className="px-3 py-2 text-gray-700">
                          <span className="inline-block rounded bg-gray-200 px-2 py-1 font-mono text-xs text-gray-800">
                            {row.blok}
                          </span>
                        </td>
                        {monthsKey.map((month) => {
                          const status = row[month];
                          return (
                            <td key={`${row.id}-${month}`} className="px-2 py-2 text-center text-xs">
                              {status === "N/A" || !status ? (
                                <span className="text-gray-400 italic">N/A</span>
                              ) : String(status) === "0" ? (
                                <span className="font-bold text-red-600 text-xs">Belum</span>
                              ) : (
                                <span className="text-green-600 font-semibold text-xs">
                                  {parseInt(status).toLocaleString('id-ID')}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center font-bold bg-amber-100 border-l-4 border-amber-500">
                          {totalDue > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-amber-700 font-medium">Rp</span>
                              <span className="text-lg text-amber-900 font-bold">{totalDue.toLocaleString('id-ID')}</span>
                              {totalDue === 0 && <span className="text-xs text-green-600">Lunas</span>}
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-green-600">✓ Lunas</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {totalDue > 0 && row.no_hp && (
                              <a
                                href={generateWALink(row.no_hp, generateWAMessage(row, totalDue, year, monthsKey))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600 whitespace-nowrap"
                                title="Kirim reminder WA"
                              >
                                💬 WA
                              </a>
                            )}
                            <button
                              onClick={() => setEditingRow(row)}
                              className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                              type="button"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Menampilkan {filteredData.length} data | Total warga: {allData.length}
          </div>
        </div>
      </div>

      {editingRow && (
        <ModalEditPembayaran
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSave={fetchData}
        />
      )}
    </LayoutWithSidebar>
    </ProtectedRoute>
  );
}
