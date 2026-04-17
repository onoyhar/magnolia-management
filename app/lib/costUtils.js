// Utility functions for IPL cost management

export const COST_TYPES = {
  IPL_RUMAH: 'ipl_rumah',
  SAMPAH_RUMAH: 'sampah_rumah',
  IPL_RUKO: 'ipl_ruko',
  SAMPAH_RUKO: 'sampah_ruko',
};

export const PROPERTY_TYPES = {
  RUMAH: 'rumah',
  RUKO: 'ruko',
};

// Get default cost settings
export const DEFAULT_COSTS = {
  [COST_TYPES.IPL_RUMAH]: 100000,
  [COST_TYPES.SAMPAH_RUMAH]: 30000,
  [COST_TYPES.IPL_RUKO]: 120000,
  [COST_TYPES.SAMPAH_RUKO]: 50000,
};

// Get label for cost type
export function getCostLabel(settingKey) {
  const labels = {
    [COST_TYPES.IPL_RUMAH]: 'IPL Rumah',
    [COST_TYPES.SAMPAH_RUMAH]: 'Sampah Rumah',
    [COST_TYPES.IPL_RUKO]: 'IPL Ruko',
    [COST_TYPES.SAMPAH_RUKO]: 'Sampah Ruko',
  };
  return labels[settingKey] || settingKey;
}

// Calculate monthly cost for a warga based on their cost config
export function calculateMonthlyCost(month, year, costConfigs, costSettings) {
  if (!costConfigs || costConfigs.length === 0) return 0;

  // Sort configs by start_month in descending order to get the latest applicable config
  const applicableConfigs = costConfigs
    .filter(c => c.tahun === year && c.start_month <= month)
    .sort((a, b) => b.start_month - a.start_month);

  if (applicableConfigs.length === 0) return 0;

  const config = applicableConfigs[0];
  let total = 0;

  if (config.has_ipl) {
    const iplKey = config.property_type === PROPERTY_TYPES.RUKO 
      ? COST_TYPES.IPL_RUKO 
      : COST_TYPES.IPL_RUMAH;
    total += costSettings?.[iplKey] || DEFAULT_COSTS[iplKey];
  }

  if (config.has_sampah) {
    const sampahKey = config.property_type === PROPERTY_TYPES.RUKO 
      ? COST_TYPES.SAMPAH_RUKO 
      : COST_TYPES.SAMPAH_RUMAH;
    total += costSettings?.[sampahKey] || DEFAULT_COSTS[sampahKey];
  }

  return total;
}

// Get cost description for display
export function getCostDescription(config, costSettings) {
  const parts = [];
  const propertyLabel = config.property_type === PROPERTY_TYPES.RUKO ? 'Ruko' : 'Rumah';
  
  if (config.has_ipl) {
    const iplKey = config.property_type === PROPERTY_TYPES.RUKO 
      ? COST_TYPES.IPL_RUKO 
      : COST_TYPES.IPL_RUMAH;
    const amount = costSettings?.[iplKey] || DEFAULT_COSTS[iplKey];
    parts.push(`IPL ${amount.toLocaleString('id-ID')}`);
  }

  if (config.has_sampah) {
    const sampahKey = config.property_type === PROPERTY_TYPES.RUKO 
      ? COST_TYPES.SAMPAH_RUKO 
      : COST_TYPES.SAMPAH_RUMAH;
    const amount = costSettings?.[sampahKey] || DEFAULT_COSTS[sampahKey];
    parts.push(`Sampah ${amount.toLocaleString('id-ID')}`);
  }

  return parts.length > 0 ? parts.join(' + ') : 'Tidak ada biaya';
}

// Format display for cost history
export function formatCostHistory(configs) {
  if (!configs || configs.length === 0) return 'Belum ada konfigurasi';
  
  const sorted = [...configs].sort((a, b) => a.start_month - b.start_month);
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  return sorted.map(c => {
    const desc = c.has_ipl && c.has_sampah 
      ? 'IPL + Sampah' 
      : c.has_ipl 
      ? 'IPL' 
      : 'Sampah';
    return `${monthNames[c.start_month]}: ${desc}`;
  }).join(' → ');
}
