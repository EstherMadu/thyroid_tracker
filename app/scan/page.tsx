'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ScanResult {
  food: string
  calories_estimate: string
  gluten_status: string
  gluten_detail: string
  key_ingredients: string[]
  thyroid_notes: string
  triggers: string[]
}

const GLUTEN_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  'Gluten-free':         { bg: '#f0fdfa', text: '#0f766e', icon: '✅' },
  'Contains gluten':     { bg: '#fff1f2', text: '#be123c', icon: '🚫' },
  'May contain gluten':  { bg: '#fffbeb', text: '#92400e', icon: '⚠️' },
}

export default function ScanPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('image/jpeg')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setMimeType(file.type as string)
    setResult(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      // Strip the data URL prefix to get raw base64
      setImageBase64(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function handleAnalyse() {
    if (!imageBase64) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Analysis failed')
      } else {
        setResult(data as ScanResult)
      }
    } catch {
      setError('Network error — check your connection')
    } finally {
      setLoading(false)
    }
  }

  function handleAddToMeal() {
    if (!result) return
    const params = new URLSearchParams()
    params.set('food', result.food)
    if (result.triggers?.length) params.set('triggers', result.triggers.join(','))
    router.push(`/meals?${params.toString()}`)
  }

  function reset() {
    setPreview(null)
    setImageBase64(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const glutenStyle = result
    ? (GLUTEN_STYLE[result.gluten_status] ?? GLUTEN_STYLE['May contain gluten'])
    : null

  return (
    <div className="px-4 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Food Scanner</h1>
          <p className="text-sm text-gray-500 mt-0.5">Check gluten, calories & thyroid impact</p>
        </div>
        {preview && (
          <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-600 font-medium">
            Clear
          </button>
        )}
      </div>

      {/* Image capture / upload */}
      {!preview ? (
        <div className="space-y-3">
          {/* Camera (mobile opens camera directly) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center gap-3 active:scale-95 transition-transform border-2 border-dashed border-gray-200"
          >
            <span className="text-5xl">📷</span>
            <div className="text-center">
              <p className="font-semibold text-gray-800">Take a Photo</p>
              <p className="text-sm text-gray-500 mt-0.5">or tap to upload from gallery</p>
            </div>
          </button>

          {/* Hidden file input — capture="environment" opens rear camera on mobile */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />

          <p className="text-center text-xs text-gray-400">
            Point your camera at any food or meal
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image preview */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Food preview"
              className="w-full max-h-64 object-cover"
            />
          </div>

          {/* Analyse button */}
          {!result && (
            <button
              onClick={handleAnalyse}
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#0d9488' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analysing...
                </>
              ) : (
                '🔍 Analyse Food'
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-700 font-medium">Error</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
              {error.includes('ANTHROPIC_API_KEY') && (
                <p className="text-xs text-red-500 mt-2">
                  Add ANTHROPIC_API_KEY to your .env.local file and restart the server.
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Food name & calories */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xl font-bold text-gray-900">{result.food}</p>
                <p className="text-sm text-gray-500 mt-0.5">{result.calories_estimate}</p>

                {result.key_ingredients?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {result.key_ingredients.map(ing => (
                      <span key={ing} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Gluten status */}
              {glutenStyle && (
                <div
                  className="rounded-2xl p-4 border"
                  style={{ backgroundColor: glutenStyle.bg, borderColor: glutenStyle.text + '33' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{glutenStyle.icon}</span>
                    <div>
                      <p className="font-semibold" style={{ color: glutenStyle.text }}>{result.gluten_status}</p>
                      {result.gluten_detail && (
                        <p className="text-xs mt-0.5" style={{ color: glutenStyle.text }}>{result.gluten_detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Thyroid notes */}
              {result.thyroid_notes && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    🦋 Thyroid notes
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.thyroid_notes}</p>
                </div>
              )}

              {/* Triggers detected */}
              {result.triggers?.length > 0 && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                    ⚠️ Potential triggers detected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.triggers.map(t => (
                      <span key={t} className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToMeal}
                  className="py-3 rounded-xl text-white font-semibold text-sm"
                  style={{ backgroundColor: '#0d9488' }}
                >
                  + Add to Meal Log
                </button>
                <button
                  onClick={reset}
                  className="py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm"
                >
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-400 text-center pb-2">
        Powered by AI vision · Estimates only, not medical advice
      </p>
    </div>
  )
}
