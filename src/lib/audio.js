// Original synthesized sci-fi startup sound via Web Audio — no external assets.
// Browsers may keep the context suspended until a user gesture happens; in that
// case this resolves silently and the sequence simply plays without audio.
let ctx

export async function playStartupSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = ctx || new AC()
    if (ctx.state === 'suspended') await ctx.resume()
    if (ctx.state !== 'running') return

    const t0 = ctx.currentTime

    // rising power-up sweep
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1500
    const gain = ctx.createGain()
    osc.frequency.setValueAtTime(70, t0)
    osc.frequency.exponentialRampToValueAtTime(520, t0 + 1.1)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.18)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3)
    osc.connect(filter).connect(gain).connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + 1.35)

    // online chime
    ;[880, 1174.66].forEach((freq, i) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = freq
      const g = ctx.createGain()
      const ts = t0 + 0.9 + i * 0.18
      g.gain.setValueAtTime(0.0001, ts)
      g.gain.exponentialRampToValueAtTime(0.1, ts + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, ts + 0.9)
      o.connect(g).connect(ctx.destination)
      o.start(ts)
      o.stop(ts + 1)
    })
  } catch {
    /* audio unavailable — silent fallback */
  }
}
