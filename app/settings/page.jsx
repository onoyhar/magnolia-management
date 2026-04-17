"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import LayoutWithSidebar from "../components/LayoutWithSidebar";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { 
  COST_TYPES, 
  getCostLabel, 
  DEFAULT_COSTS,
  PROPERTY_TYPES 
} from "../lib/costUtils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Cost Settings Editor Modal
function ModalCostSettings({ onClose, onSave, initialSettings }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Use API endpoint to save settings (with service role for insert/update)
      const response = await fetch("/api/update-cost-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings");
      }

      alert("✓ Pengaturan biaya berhasil disimpan");
      onSave(settings);
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
        <h2 className="mb-4 text-xl font-bold text-toska">Atur Biaya IPL & Sampah</h2>

        <div className="space-y-4">
          {/* Rumah Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-700 mb-3">🏠 Rumah</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">IPL Rumah</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={settings[COST_TYPES.IPL_RUMAH] || 0}
                    onChange={(e) => handleChange(COST_TYPES.IPL_RUMAH, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <span className="text-gray-500">/ bulan</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Sampah Rumah</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={settings[COST_TYPES.SAMPAH_RUMAH] || 0}
                    onChange={(e) => handleChange(COST_TYPES.SAMPAH_RUMAH, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <span className="text-gray-500">/ bulan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ruko Section */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">🏬 Ruko</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">IPL Ruko</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={settings[COST_TYPES.IPL_RUKO] || 0}
                    onChange={(e) => handleChange(COST_TYPES.IPL_RUKO, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <span className="text-gray-500">/ bulan</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Sampah Ruko</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={settings[COST_TYPES.SAMPAH_RUKO] || 0}
                    onChange={(e) => handleChange(COST_TYPES.SAMPAH_RUKO, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <span className="text-gray-500">/ bulan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-lg bg-toska px-4 py-2 text-white font-medium hover:opacity-80 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
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

export default function SettingsPage() {
  const [costSettings, setCostSettings] = useState(DEFAULT_COSTS);
  const [loading, setLoading] = useState(true);
  const [showCostModal, setShowCostModal] = useState(false);

  async function fetchCostSettings() {
    if (!supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from("ipl_settings")
        .select("setting_key, amount")
        .order("setting_key", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const settings = {};
        data.forEach(item => {
          settings[item.setting_key] = item.amount;
        });
        setCostSettings({ ...DEFAULT_COSTS, ...settings });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCostSettings();
  }, []);

  if (!supabaseClient) {
    return (
      <LayoutWithSidebar currentPage="settings">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="text-center text-red-500">Supabase belum dikonfigurasi</div>
        </div>
      </LayoutWithSidebar>
    );
  }

  return (
    <ProtectedRoute>
      <LayoutWithSidebar currentPage="settings">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-3xl font-bold text-toska">⚙️ Pengaturan</h1>

          {/* Cost Settings Card */}
          <div className="rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">💰 Biaya IPL & Sampah</h2>
              <button
                onClick={() => setShowCostModal(true)}
                className="rounded-lg bg-toska px-4 py-2 text-white font-medium hover:opacity-80"
              >
                ✏️ Ubah
              </button>
            </div>

            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Rumah */}
                <div className="border-r pr-4">
                  <h3 className="font-semibold text-gray-700 mb-3 text-lg">🏠 Rumah</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">IPL Rumah</span>
                      <span className="font-semibold text-gray-800">
                        {costSettings[COST_TYPES.IPL_RUMAH]?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sampah Rumah</span>
                      <span className="font-semibold text-gray-800">
                        {costSettings[COST_TYPES.SAMPAH_RUMAH]?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between bg-blue-50 p-2 rounded">
                      <span className="text-gray-700 font-medium">Total (IPL + Sampah)</span>
                      <span className="font-bold text-toska">
                        {(costSettings[COST_TYPES.IPL_RUMAH] + costSettings[COST_TYPES.SAMPAH_RUMAH])?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ruko */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 text-lg">🏬 Ruko</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">IPL Ruko</span>
                      <span className="font-semibold text-gray-800">
                        {costSettings[COST_TYPES.IPL_RUKO]?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sampah Ruko</span>
                      <span className="font-semibold text-gray-800">
                        {costSettings[COST_TYPES.SAMPAH_RUKO]?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between bg-blue-50 p-2 rounded">
                      <span className="text-gray-700 font-medium">Total (IPL + Sampah)</span>
                      <span className="font-bold text-toska">
                        {(costSettings[COST_TYPES.IPL_RUKO] + costSettings[COST_TYPES.SAMPAH_RUKO])?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Catatan:</strong> Biaya yang diatur di sini akan digunakan sebagai nilai default untuk setiap warga. 
              Anda dapat mengubah biaya per warga di halaman Data Warga dengan menambahkan atau menghapus komponen biaya kapan saja.
            </p>
          </div>
        </div>
      </div>

      {showCostModal && (
        <ModalCostSettings
          onClose={() => setShowCostModal(false)}
          onSave={(newSettings) => setCostSettings(newSettings)}
          initialSettings={costSettings}
        />
      )}
    </LayoutWithSidebar>
    </ProtectedRoute>
  );
}
