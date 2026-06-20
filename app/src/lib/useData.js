import { useEffect, useState } from 'react'

const base = import.meta.env.BASE_URL

const cache = {}

function useJsonData(filename) {
  const [data, setData] = useState(cache[filename] || null)
  const [loading, setLoading] = useState(!cache[filename])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cache[filename]) {
      setData(cache[filename])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`${base}data/${filename}`)
      .then(res => {
        if (!res.ok) throw new Error(`Gagal memuat ${filename}`)
        return res.json()
      })
      .then(json => {
        if (cancelled) return
        cache[filename] = json
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [filename])

  return { data, loading, error }
}

export function useSummary() {
  return useJsonData('summary.json')
}

export function useLocations() {
  return useJsonData('locations.json')
}

export function useMonthlyTimeseries() {
  return useJsonData('monthly_timeseries.json')
}

export function useDailyTimeseries() {
  return useJsonData('daily_timeseries.json')
}
