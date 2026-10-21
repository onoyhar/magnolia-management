"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ModalWargaCostConfig } from "../components/ModalWargaCostConfig";
import { PROPERTY_TYPES, calculateMonthlyCost, getCostDescription } from "../lib/costUtils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Shell modal: bottom sheet di mobile, dialog di desktop
const SHEET_BACKDROP = "fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center";
const SHEET_PANEL =
  "glass-strong w-full max-h-[90vh] overflow-y-auto rounded-t-3xl p-6 sm:max-w-sm sm:rounded-3xl";
const INPUT = "mt-1 w-full rounded-xl border border-white/70 bg-white/70 px-3 py-3 text-base outline-none focus:border-toska focus:ring-2 focus:ring-teal-600/20";
const BTN_PRIMARY = "flex-1 rounded-xl bg-toska px-4 py-3 font-medium text-white shadow-md transition active:scale-95 disabled:opacity-50";
const BTN_GHOST = "flex-1 rounded-xl border border-white/80 bg-white/60 px-4 py-3 font-medium text-gray-700 transition active:scale-95 disabled:opacity-50";

// Modal Bulk Add Year to All Warga
function ModalBulkYear({ onClose, onSave, allWargaData }) {
  const [selectedYears, setSelectedYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const availableYears = Array.from({ length: 2050 - 2025 + 1 }, (_, i) => 2025 + i);

  const handleYearToggle = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleAddToAll = async () => {
    if (selectedYears.length === 0) {
      alert("Pilih minimal 1 tahun");
      return;
    }

    setLoading(true);
    try {
      // Get unique warga from allWargaData
      const uniqueWarga = Array.from(
        new Map(
          (allWargaData || []).map((item) => [`${item.nama}-${item.blok}`, item])
        ).values()
      );

      // For each warga, check which years are missing and add them
      const newRecords = [];
      for (const warga of uniqueWarga) {
        const existingYears = (allWargaData || [])
          .filter((w) => w.nama === warga.nama && w.blok === warga.blok)
          .map((w) => w.tahun);

        const yearsToAdd = selectedYears.filter((y) => !existingYears.includes(y));

        yearsToAdd.forEach((year) => {
          newRecords.push({
            no: warga.no,
            nama: warga.nama,
            blok: warga.blok,
            no_hp: warga.no_hp,
            tahun: year,
            jan: "N/A",
            feb: "N/A",
            mar: "N/A",
            apr: "N/A",
            mei: "N/A",
            jun: "N/A",
            jul: "N/A",
            agt: "N/A",
            sep: "N/A",
            okt: "N/A",
            nov: "N/A",
            des: "N/A",
          });
        });
      }

      if (newRecords.length === 0) {
        alert("Semua warga sudah terdaftar di tahun-tahun yang dipilih");
        return;
      }

      // Call API endpoint with service role key
      const response = await fetch("/api/bulk-add-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: newRecords }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add records");
      }

      alert(
        `✓ ${result.count} record ditambahkan untuk ${uniqueWarga.length} warga di ${selectedYears.length} tahun`
      );
      onSave();
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={SHEET_BACKDROP}>
      <div className={SHEET_PANEL}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 sm:hidden" />
        <h2 className="mb-1 text-xl font-bold text-toska">Add Tahun ke Semua Warga</h2>
        <p className="text-sm text-gray-600 mb-4">
          Pilih tahun untuk ditambahkan ke semua warga sekaligus
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tahun</label>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto rounded-xl border border-white/70 bg-white/50 p-3">
            {availableYears.map((year) => (
              <label key={year} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedYears.includes(year)}
                  onChange={() => handleYearToggle(year)}
                  className="h-4 w-4 rounded accent-teal-700"
                />
                <span className="text-sm text-gray-700">{year}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {selectedYears.length} tahun dipilih: {selectedYears.sort().join(", ") || "-"}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAddToAll}
            disabled={loading}
            className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-medium text-white shadow-md transition active:scale-95 hover:bg-green-700 disabled:opacity-50"
            type="button"
          >
            {loading ? "Proses..." : "Tambahkan ke Semua"}
          </button>
          <button onClick={onClose} disabled={loading} className={BTN_GHOST} type="button">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Tambah/Edit Warga
function ModalWarga({ warga, onClose, onSave, allNos, allWargaData }) {
  const [formData, setFormData] = useState(warga || { no: "", nama: "", blok: "", no_hp: "", property_type: "rumah" });
  const [selectedYears, setSelectedYears] = useState(warga ? [] : [2026]);
  const [loading, setLoading] = useState(false);

  // Get available years for this warga if editing
  const existingYears = warga
    ? (allWargaData || [])
        .filter((w) => w.nama === warga.nama && w.blok === warga.blok)
        .map((w) => w.tahun)
        .sort((a, b) => a - b)
    : [];

  const availableYears = Array.from({ length: 2050 - 2025 + 1 }, (_, i) => 2025 + i);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleYearToggle = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleSave = async () => {
    if (!formData.nama || !formData.blok) {
      alert("Nama dan Blok harus diisi");
      return;
    }

    setLoading(true);
    try {
      if (warga?.id) {
        // Update existing warga in data_warga
        const { error: updateError } = await supabaseClient
          .from("data_warga")
          .update({ nama: formData.nama, blok: formData.blok, no_hp: formData.no_hp, property_type: formData.property_type })
          .eq("id", warga.id);
        if (updateError) throw updateError;

        // Insert new years if selected - use API for RLS bypass
        const yearsToAdd = selectedYears.filter((y) => !existingYears.includes(y));
        if (yearsToAdd.length > 0) {
          const newRecords = yearsToAdd.map((year) => ({
            warga_id: warga.id,
            tahun: year,
            jan: "N/A",
            feb: "N/A",
            mar: "N/A",
            apr: "N/A",
            mei: "N/A",
            jun: "N/A",
            jul: "N/A",
            agt: "N/A",
            sep: "N/A",
            okt: "N/A",
            nov: "N/A",
            des: "N/A",
          }));

          const response = await fetch("/api/bulk-add-payment-year", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records: newRecords }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Failed to add records");
          }

          alert(`Data warga diupdate dan ${yearsToAdd.length} tahun(s) ditambahkan`);
        } else {
          alert("Data warga berhasil diupdate");
        }
      } else {
        // Insert new warga ke data_warga - API will auto-generate the no
        const response = await fetch("/api/add-warga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: formData.nama,
            blok: formData.blok,
            no_hp: formData.no_hp,
            property_type: formData.property_type,
            years: selectedYears
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to add warga");
        }

        alert(`Data warga berhasil ditambahkan untuk ${selectedYears.length} tahun`);
      }
      onSave();
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={SHEET_BACKDROP}>
      <div className={SHEET_PANEL}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300 sm:hidden" />
        <h2 className="mb-4 text-xl font-bold text-toska">
          {warga ? "Edit Data Warga" : "Tambah Data Warga"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama</label>
            <input
              type="text"
              name="nama"
              value={formData.nama || ""}
              onChange={handleChange}
              className={INPUT}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Blok/Rumah</label>
            <input
              type="text"
              name="blok"
              value={formData.blok || ""}
              onChange={handleChange}
              placeholder="Contoh: C1/12, RK/04"
              className={INPUT}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">No. HP</label>
            <input
              type="text"
              name="no_hp"
              value={formData.no_hp || ""}
              onChange={handleChange}
              className={INPUT}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Jenis Properti</label>
            <select
              name="property_type"
              value={formData.property_type || "rumah"}
              onChange={handleChange}
              className={INPUT}
            >
              <option value="rumah">🏠 Rumah (IPL 100k, Sampah 30k)</option>
              <option value="ruko">🏬 Ruko (IPL 120k, Sampah 50k)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {warga ? "Tahun Pembayaran" : "Tahun Pendaftaran"}
            </label>
            {warga && existingYears.length > 0 && (
              <div className="mb-2 rounded-xl border border-blue-200 bg-blue-50/80 p-2 text-xs text-blue-700">
                Sudah ada: {existingYears.join(", ")}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto rounded-xl border border-white/70 bg-white/50 p-2">
              {availableYears.map((year) => {
                const isExisting = existingYears.includes(year);
                return (
                  <label key={year} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year) || isExisting}
                      onChange={() => !isExisting && handleYearToggle(year)}
                      disabled={isExisting}
                      className="h-4 w-4 rounded accent-teal-700 disabled:opacity-50"
                    />
                    <span className={`text-xs ${isExisting ? "text-gray-400 line-through" : "text-gray-700"}`}>
                      {year}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {warga
                ? "Pilih tahun tambahan untuk warga ini (garis bawah = sudah ada)"
                : "Pilih tahun untuk membuat record pembayaran"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} disabled={loading} className={BTN_PRIMARY} type="button">
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
          <button onClick={onClose} disabled={loading} className={BTN_GHOST} type="button">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyBadge({ type }) {
  if (!type) return <span className="text-xs italic text-gray-400">-</span>;
  return (
    <span
      className={`inline-block rounded-lg px-2.5 py-1 text-xs font-medium text-white shadow-sm ${
        type === "ruko" ? "bg-blue-600" : "bg-green-600"
      }`}
    >
      {type === "ruko" ? "🏬 Ruko" : "🏠 Rumah"}
    </span>
  );
}

export default function DataWargaPage() {
  const [wargaList, setWargaList] = useState([]);
  const [allWargaData, setAllWargaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCostConfigModal, setShowCostConfigModal] = useState(false);
  const [editingWarga, setEditingWarga] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [costSettings, setCostSettings] = useState({});
  const [wargaCostConfigs, setWargaCostConfigs] = useState({});

  async function fetchWarga() {
    if (!supabaseClient) {
      setError("Supabase belum dikonfigurasi");
      return;
    }

    setLoading(true);
    try {
      // Query from data_warga table (master data)
      const { data, error: err } = await supabaseClient
        .from("data_warga")
        .select("id, no, nama, blok, no_hp, property_type")
        .order("no", { ascending: true });

      if (err) throw err;

      // Store semua data untuk referensi di modal
      setAllWargaData(data || []);

      // Filter by search
      let filtered = (data || []).filter(
        (item) =>
          item.nama.toLowerCase().includes(search.toLowerCase()) ||
          item.blok.toLowerCase().includes(search.toLowerCase())
      );

      setWargaList(filtered);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Yakin ingin menghapus data warga ini?")) return;

    try {
      const { error: err } = await supabaseClient
        .from("pembayaran_warga")
        .delete()
        .eq("id", id);

      if (err) throw err;
      alert("Data berhasil dihapus");
      fetchWarga();
    } catch (err) {
      alert(`Error: ${err.message}`);
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

  async function fetchWargaCostConfigs(wargaId, tahun) {
    if (!supabaseClient) return [];
    try {
      const { data, error } = await supabaseClient
        .from("warga_cost_config")
        .select("*")
        .eq("warga_id", wargaId)
        .eq("tahun", tahun)
        .order("start_month", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching cost configs:", err);
      return [];
    }
  }

  async function fetchAllWargaCostConfigs(tahun) {
    if (!supabaseClient || !wargaList.length) return;
    try {
      const updates = {};
      for (const warga of wargaList) {
        const configs = await fetchWargaCostConfigs(warga.id, tahun);
        updates[`${warga.id}-${tahun}`] = configs;
      }
      setWargaCostConfigs(updates);
    } catch (err) {
      console.error("Error fetching all cost configs:", err);
    }
  }

  async function openCostConfig(warga) {
    const configs = await fetchWargaCostConfigs(warga.id, selectedYear);
    setWargaCostConfigs(prev => ({
      ...prev,
      [`${warga.id}-${selectedYear}`]: configs
    }));
    setEditingWarga(warga);
    setShowCostConfigModal(true);
  }

  function openEdit(warga) {
    setEditingWarga(warga);
    setShowModal(true);
  }

  useEffect(() => {
    fetchWarga();
    fetchCostSettings();
  }, [search]);

  // Auto-fetch cost configs saat wargaList atau selectedYear berubah
  useEffect(() => {
    if (wargaList.length > 0) {
      fetchAllWargaCostConfigs(selectedYear);
    }
  }, [wargaList, selectedYear]);

  // Ringkasan biaya per warga, dipakai di kartu mobile dan baris tabel desktop
  const getCostInfo = (warga) => {
    const costConfig = wargaCostConfigs[`${warga.id}-${selectedYear}`] || [];
    const monthlyCost = costConfig.length > 0
      ? calculateMonthlyCost(1, selectedYear, costConfig, costSettings)
      : 0;
    const label = costConfig.length > 0
      ? costConfig[0].has_ipl && costConfig[0].has_sampah
        ? "IPL + Sampah"
        : costConfig[0].has_ipl
        ? "IPL"
        : "Sampah"
      : null;
    return { hasConfig: costConfig.length > 0, monthlyCost, label };
  };

  return (
    <ProtectedRoute>
      <LayoutWithSidebar currentPage="data-warga">
      <div className="mx-auto w-full max-w-5xl px-4 pb-6 pt-5 md:px-8 md:pt-8">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-toska">Data Warga</h1>
            <p className="text-sm text-gray-600">Master data warga yang stabil di semua tahun</p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 md:flex md:justify-end">
            <button
              onClick={() => {
                setEditingWarga(null);
                setShowModal(true);
              }}
              className="rounded-xl bg-toska px-4 py-3 text-sm font-medium text-white shadow-md transition active:scale-95 md:py-2"
              type="button"
            >
              + Tambah Warga
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-md transition active:scale-95 hover:opacity-90 md:py-2"
              type="button"
            >
              <span className="md:hidden">📅 Add Tahun</span>
              <span className="hidden md:inline">📅 Add Tahun ke Semua</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700 backdrop-blur">
              {error}
            </div>
          )}

          <div className="glass mb-4 flex flex-col gap-3 rounded-2xl p-3 md:flex-row md:items-end">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari nama atau blok..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/70 bg-white/70 py-3 pl-10 pr-4 text-base outline-none focus:border-toska focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <div className="flex items-center justify-between gap-3 md:block">
              <label className="block text-xs font-medium text-gray-600 md:mb-1 md:text-sm">
                Tahun Konfigurasi Biaya
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 text-base outline-none"
              >
                {Array.from({ length: 26 }, (_, i) => 2025 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile: kartu */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              <p className="glass rounded-2xl p-6 text-center text-gray-500">Memuat...</p>
            ) : wargaList.length === 0 ? (
              <p className="glass rounded-2xl p-6 text-center text-gray-500">Tidak ada data warga</p>
            ) : (
              wargaList.map((warga) => {
                const { hasConfig, monthlyCost, label } = getCostInfo(warga);
                return (
                  <article key={warga.id} className="glass rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">No. {warga.no}</p>
                        <h3 className="truncate text-base font-semibold text-gray-900">{warga.nama}</h3>
                      </div>
                      <span className="shrink-0 rounded-lg bg-white/70 px-2 py-1 font-mono text-xs text-gray-800">
                        {warga.blok}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <PropertyBadge type={warga.property_type} />
                      <span>📞 {warga.no_hp || "-"}</span>
                    </div>

                    <div className="mt-3 rounded-xl bg-white/50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-gray-500">Biaya {selectedYear}</p>
                      {hasConfig ? (
                        <p className="text-sm font-semibold text-gray-900">
                          Rp {monthlyCost.toLocaleString("id-ID")}
                          <span className="ml-1 text-xs font-normal text-gray-500">/ bulan · {label}</span>
                        </p>
                      ) : (
                        <p className="text-sm italic text-gray-400">Belum diatur</p>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => openCostConfig(warga)}
                        className="rounded-xl bg-purple-500 py-2 text-sm font-medium text-white shadow-sm transition active:scale-95"
                        type="button"
                      >
                        💰 Biaya
                      </button>
                      <button
                        onClick={() => openEdit(warga)}
                        className="rounded-xl bg-blue-500 py-2 text-sm font-medium text-white shadow-sm transition active:scale-95"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(warga.id)}
                        className="rounded-xl bg-red-500 py-2 text-sm font-medium text-white shadow-sm transition active:scale-95"
                        type="button"
                      >
                        Hapus
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Desktop: tabel */}
          <div className="glass hidden overflow-hidden rounded-2xl md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-toska text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">No</th>
                    <th className="px-4 py-3 text-left font-medium">Nama</th>
                    <th className="px-4 py-3 text-left font-medium">Blok</th>
                    <th className="px-4 py-3 text-left font-medium">Jenis Properti</th>
                    <th className="px-4 py-3 text-left font-medium">No. HP</th>
                    <th className="px-4 py-3 text-left font-medium">Biaya ({selectedYear})</th>
                    <th className="px-4 py-3 text-center font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-400">
                        Memuat...
                      </td>
                    </tr>
                  ) : wargaList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-400">
                        Tidak ada data warga
                      </td>
                    </tr>
                  ) : (
                    wargaList.map((warga) => {
                      const { hasConfig, monthlyCost, label } = getCostInfo(warga);
                      return (
                        <tr key={warga.id} className="border-b border-white/60 hover:bg-white/40">
                          <td className="px-4 py-3 font-semibold text-gray-900">{warga.no}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{warga.nama}</td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className="inline-block rounded-lg bg-white/70 px-2 py-1 font-mono text-sm text-gray-800">
                              {warga.blok}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <PropertyBadge type={warga.property_type} />
                          </td>
                          <td className="px-4 py-3 text-gray-700">{warga.no_hp || "-"}</td>
                          <td className="px-4 py-3 text-sm">
                            {hasConfig ? (
                              <div className="text-gray-700">
                                <p className="font-medium">{monthlyCost.toLocaleString("id-ID")}</p>
                                <p className="mt-1 text-xs text-gray-500">{label}</p>
                              </div>
                            ) : (
                              <p className="text-gray-400 italic">Belum diatur</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap justify-center gap-2">
                              <button
                                onClick={() => openCostConfig(warga)}
                                className="whitespace-nowrap rounded-lg bg-purple-500 px-3 py-1 text-sm text-white transition hover:bg-purple-600"
                                type="button"
                              >
                                💰 Biaya
                              </button>
                              <button
                                onClick={() => openEdit(warga)}
                                className="whitespace-nowrap rounded-lg bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(warga.id)}
                                className="whitespace-nowrap rounded-lg bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
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
          </div>

          <div className="mt-4 text-center text-sm text-gray-600 md:text-left">
            Total: {wargaList.length} data warga
          </div>
      </div>

      {showModal && (
        <ModalWarga
          warga={editingWarga}
          allNos={wargaList.map((w) => w.no || 0)}
          allWargaData={allWargaData}
          onClose={() => {
            setShowModal(false);
            setEditingWarga(null);
          }}
          onSave={fetchWarga}
        />
      )}

      {showBulkModal && (
        <ModalBulkYear
          allWargaData={allWargaData}
          onClose={() => setShowBulkModal(false)}
          onSave={fetchWarga}
        />
      )}

      {showCostConfigModal && editingWarga && (
        <ModalWargaCostConfig
          warga={editingWarga}
          tahun={selectedYear}
          existingConfigs={wargaCostConfigs[`${editingWarga.id}-${selectedYear}`] || []}
          costSettings={costSettings}
          onClose={() => setShowCostConfigModal(false)}
          onSave={async (configs) => {
            // Update state langsung dengan data baru
            setWargaCostConfigs(prev => ({
              ...prev,
              [`${editingWarga.id}-${selectedYear}`]: configs
            }));
            // Re-fetch all cost configs untuk tahun ini dari database untuk ensure sinkron
            await fetchAllWargaCostConfigs(selectedYear);
          }}
        />
      )}
    </LayoutWithSidebar>
    </ProtectedRoute>
  );
}
