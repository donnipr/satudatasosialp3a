'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 overflow-hidden font-sans text-white select-none">
      {/* Background Layer: Cinematic Deep Emerald & Obsidian Gradient */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none anim-cinematic-bg"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 20% 30%, rgba(6, 78, 59, 0.55) 0%, rgba(4, 47, 46, 0.4) 40%, rgba(2, 6, 23, 0.95) 80%),
            linear-gradient(135deg, #022c22 0%, #064e3b 25%, #042f2e 50%, #021217 75%, #020617 100%)
          `,
        }}
      />

      {/* Atmospheric Cinematic Glows & Vignette */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-[140px] pointer-events-none anim-cinematic-bg" />
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[160px] pointer-events-none anim-cinematic-bg" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-900/30 rounded-full blur-[120px] pointer-events-none anim-cinematic-bg" />
      <div className="absolute inset-0 z-0 bg-black/40 pointer-events-none anim-cinematic-bg" />

      {/* Subtle Noise / Film Grain Simulation Border */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

      {/* Top Minimal Navigation Bar */}
      <header className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-6 md:px-12 py-6 text-xs tracking-widest text-gray-300 font-medium anim-cinematic-header">
        <div className="flex space-x-6 md:space-x-8 items-center">
          {/* Animated Menu Indicator */}
          <div className="flex flex-col space-y-1.5 cursor-pointer group p-1" title="Menu">
            <span className="w-6 h-0.5 bg-emerald-400 group-hover:bg-white transition-colors duration-300"></span>
            <span className="w-4 h-0.5 bg-white group-hover:w-6 transition-all duration-300"></span>
          </div>

          <span className="hidden sm:inline-block font-bold tracking-widest text-emerald-400/90 uppercase text-[11px] border border-emerald-500/30 px-2.5 py-0.5 rounded-full bg-emerald-950/40 backdrop-blur-sm">
            DINSOS P3A GUNUNGKIDUL
          </span>

          <Link
            href="/public-portal/perlinsos"
            className="hover:text-emerald-300 transition-colors border-b border-transparent hover:border-emerald-400 pb-0.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5"
          >
            <span>PORTAL PUBLIK</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4 text-gray-400 text-[11px]">
          <span>DINAS SOSIAL PPPA KAB.GUNUNGKIDUL</span>
          <span className="text-gray-600">•</span>
          <span className="text-emerald-400/80 font-mono">2026</span>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full min-h-screen">

        {/* Left Side: Cinematic Hero Typography & Narrative (approx 65-70%) */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 md:px-20 lg:px-24 pt-28 pb-16 lg:py-24">

          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 mb-6 anim-cinematic-tag">
            <span className="h-px w-8 bg-emerald-400"></span>
            <span className="text-xs uppercase tracking-[0.3em] text-emerald-400 font-semibold drop-shadow">
              SISTEM INFORMASI KESEJAHTERAAN SOSIAL
            </span>
          </div>

          {/* Massive Cinema-Style Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-lg leading-tight anim-cinematic-heading">
            Satu Data
            <br />
            <span className="text-4xl md:text-5xl lg:text-6xl">Dinas Sosial PPPA</span>
            <br />
            <span className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-300">Kab. Gunungkidul</span>
          </h1>

          {/* Descriptive Narrative */}
          <p 
            className="text-gray-300 max-w-xl text-lg md:text-xl leading-relaxed mb-8 anim-cinematic-paragraph"
            style={{ animationDelay: '300ms', animationFillMode: 'both' }}
          >
            Portal Satu Data. Menyatukan informasi kesejahteraan sosial, pemberdayaan perempuan, serta perlindungan anak ke dalam satu ekosistem tunggal untuk mewujudkan kebijakan yang akurat dan intervensi yang tepat sasaran.
          </p>

          {/* Action Links & Key Stats Funnel */}
          <div 
            className="flex flex-wrap items-center gap-6 anim-cinematic-button"
            style={{ animationDelay: '500ms', animationFillMode: 'both' }}
          >
            <Link
              href="/public-portal/perlinsos"
              className="group inline-flex items-center space-x-3 bg-white/5 hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400/70 px-5 py-3 rounded-full backdrop-blur-md transition-all duration-300 text-sm font-semibold tracking-wider uppercase text-emerald-200 hover:text-white shadow-lg"
            >
              <span>Buka Portal Publik</span>
              <svg
                className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </Link>


          </div>
        </div>

        {/* Right Side: The Sidebar Glassmorphism Login Form (approx 30-35%) */}
        <div className="w-full lg:w-[420px] xl:w-[460px] bg-black/45 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between p-8 sm:p-12 shadow-2xl relative z-10 anim-cinematic-sidebar">

          <div className="my-auto pt-8 lg:pt-16">
            {/* Header Info */}
            <div className="mb-8">
              <div className="inline-block text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-1 rounded mb-3">
                AUTENTIKASI PETUGAS
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Masuk ke Sistem
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Silakan masukkan kredensial terdaftar untuk mengelola data perlindungan sosial.
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="bg-red-950/70 border border-red-500/40 text-red-200 p-3.5 rounded-lg text-xs mb-6 backdrop-blur-md flex items-start gap-2.5 shadow-lg">
                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1.5 group">
                <label className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold group-focus-within:text-emerald-400 transition-colors">
                  Alamat Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@dinsos.go.id"
                    className="w-full bg-transparent border-b border-gray-700 focus:border-emerald-400 text-white py-2.5 outline-none transition-colors placeholder:text-gray-600 text-sm focus:bg-white/[0.02]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold group-focus-within:text-emerald-400 transition-colors">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-gray-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                  >
                    {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border-b border-gray-700 focus:border-emerald-400 text-white py-2.5 outline-none transition-colors placeholder:text-gray-600 text-sm focus:bg-white/[0.02]"
                  />
                </div>
              </div>

              {/* Submit Button (Joker/Cinematic Crimson Red) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.45)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] flex items-center justify-center gap-2 uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Memproses Autentikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar Footer Metadata */}
          <div className="pt-8 pb-4 border-t border-white/5 space-y-3 text-xs">
            <div className="flex justify-between items-center text-gray-400">
              <span className="uppercase tracking-widest text-[10px] text-gray-500">Versi Sistem</span>
              <span className="font-mono text-gray-300 text-[11px]">v2.4.0 (Build 2026)</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span className="uppercase tracking-widest text-[10px] text-gray-500">Dukungan Teknis</span>
              <span className="font-medium text-gray-300 text-[11px]">DINAS SOSIAL PPPA KAB. GUNUNGKIDUL</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span className="uppercase tracking-widest text-[10px] text-gray-500">Status Server</span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Aktif & Terenkripsi
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
