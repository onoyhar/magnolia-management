"use client";

import { useState, useEffect } from "react";
import {
  COST_TYPES,
  PROPERTY_TYPES,
  DEFAULT_COSTS,
  getCostDescription,
  formatCostHistory,
} from "../lib/costUtils";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function ModalWargaCostConfig({
  warga,
  tahun,
  existingConfigs,
  costSettings,
  onClose,
  onSave,
}) {
  const [configs, setConfigs] = useState(existingConfigs || []);
  const [newMonth, setNewMonth] = useState(1);
  const [newHasIPL, setNewHasIPL] = useState(true);
  const [newHasSampah, setNewHasSampah] = useState(false);
  const [newPropertyType, setNewPropertyType] = useState(
    warga?.property_type || PROPERTY_TYPES.RUMAH
  );
  const [loading, setLoading] = useState(false);
  const [propertyType, setPropertyType] = useState(
    warga?.property_type || PROPERTY_TYPES.RUMAH
  );

  const mergedCostSettings = { ...DEFAULT_COSTS, ...costSettings };

  const addConfig = () => {
    if (configs.some((c) => c.start_month === newMonth)) {
      alert("Konfigurasi untuk bulan ini sudah ada");
      return;
    }

    const newConfig = {
      start_month: newMonth,
      has_ipl: newHasIPL,
      has_sampah: newHasSampah,
      property_type: newPropertyType,
    };

    const sorted = [...configs, newConfig].sort(
      (a, b) => a.start_month - b.start_month
    );
    setConfigs(sorted);
    setNewMonth((newMonth % 12) + 1);
  };

  const removeConfig = (index) => {
    setConfigs(configs.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (configs.length === 0) {
      alert("Minimal ada satu konfigurasi biaya");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/update-warga-cost-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wargaId: warga.id,
          tahun: tahun,
          costConfigs: configs,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save cost config");
      }

      alert("✓ Konfigurasi biaya berhasil disimpan");
      onSave(configs);
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold text-toska">
          🏠 Konfigurasi Biaya IPL - {MONTHS[newMonth - 1]}
        </h2>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📋 Riwayat Biaya:</strong>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {formatCostHistory(configs)}
          </p>
        </div>

        {/* Add Cost Config Section */}
        <div className="border-b pb-4 mb-4">
          <h3 className="font-semibold text-gray-700 mb-3">Tambah Konfigurasi</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Bulan Efektif
              </label>
              <select
                value={newMonth}
                onChange={(e) => setNewMonth(parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {MONTHS.map((month, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Jenis Properti
              </label>
              <select
                value={newPropertyType}
                onChange={(e) => setNewPropertyType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={PROPERTY_TYPES.RUMAH}>🏠 Rumah</option>
                <option value={PROPERTY_TYPES.RUKO}>🏬 Ruko</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHasIPL}
                  onChange={(e) => setNewHasIPL(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  IPL {newPropertyType === PROPERTY_TYPES.RUKO ? "Ruko" : "Rumah"} (
                  {mergedCostSettings[
                    newPropertyType === PROPERTY_TYPES.RUKO
                      ? COST_TYPES.IPL_RUKO
                      : COST_TYPES.IPL_RUMAH
                  ]?.toLocaleString("id-ID")}
                  )
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHasSampah}
                  onChange={(e) => setNewHasSampah(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  Sampah{" "}
                  {newPropertyType === PROPERTY_TYPES.RUKO ? "Ruko" : "Rumah"} (
                  {mergedCostSettings[
                    newPropertyType === PROPERTY_TYPES.RUKO
                      ? COST_TYPES.SAMPAH_RUKO
                      : COST_TYPES.SAMPAH_RUMAH
                  ]?.toLocaleString("id-ID")}
                  )
                </span>
              </label>
            </div>

            <button
              onClick={addConfig}
              className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white font-medium hover:bg-blue-700"
            >
              + Tambah Bulan
            </button>
          </div>
        </div>

        {/* Existing Configs */}
        {configs.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Konfigurasi Saat Ini</h3>
            <div className="space-y-2">
              {configs.map((config, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {MONTHS[config.start_month - 1]}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getCostDescription(config, mergedCostSettings)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeConfig(idx)}
                    className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm font-medium"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading || configs.length === 0}
            className="flex-1 rounded-lg bg-toska px-4 py-2 text-white font-medium hover:opacity-80 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
