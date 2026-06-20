// Skala status risiko pemutihan karang, berdasarkan DHW (Degree Heating Weeks).
// Dipakai konsisten di seluruh dashboard: peta, KPI card, grafik, tabel.

export const STATUS_SCALE = [
  {
    key: 'normal',
    label: 'Normal',
    labelPublik: 'Aman',
    min: 0,
    max: 4,
    color: 'var(--c-coral-healthy)',
    bg: 'var(--c-coral-healthy-bg)',
    desc: 'Suhu laut dalam rentang normal, risiko pemutihan karang rendah.',
  },
  {
    key: 'watch',
    label: 'Watch',
    labelPublik: 'Mulai waspada',
    min: 4,
    max: 8,
    color: 'var(--c-coral-watch)',
    bg: 'var(--c-coral-watch-bg)',
    desc: 'Tekanan panas mulai terakumulasi, perlu dipantau.',
  },
  {
    key: 'warning',
    label: 'Warning',
    labelPublik: 'Waspada',
    min: 8,
    max: 12,
    color: 'var(--c-coral-warning)',
    bg: 'var(--c-coral-warning-bg)',
    desc: 'Tekanan panas signifikan, pemutihan karang mulai mungkin terjadi.',
  },
  {
    key: 'alert1',
    label: 'Alert Level 1',
    labelPublik: 'Waspada tinggi',
    min: 12,
    max: 16,
    color: 'var(--c-coral-alert)',
    bg: 'var(--c-coral-alert-bg)',
    desc: 'Risiko tinggi pemutihan karang meluas di area ini.',
  },
  {
    key: 'alert2',
    label: 'Alert Level 2',
    labelPublik: 'Kritis',
    min: 16,
    max: Infinity,
    color: 'var(--c-coral-critical)',
    bg: 'var(--c-coral-critical-bg)',
    desc: 'Risiko sangat tinggi, berpotensi pemutihan parah dan kematian karang.',
  },
]

export function getStatusByDHW(dhw) {
  return STATUS_SCALE.find(s => dhw >= s.min && dhw < s.max) || STATUS_SCALE[0]
}

export function getStatusByKey(key) {
  return STATUS_SCALE.find(s => s.key === key) || STATUS_SCALE[0]
}

// Normalisasi label status (dari data) -> entry skala
export function getStatusByLabel(label) {
  return STATUS_SCALE.find(s => s.label === label) || STATUS_SCALE[0]
}
