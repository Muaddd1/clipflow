// Client-side assembly of a faceless short: AI-generated background images +
// burned-in captions + narration audio, rendered via Canvas + Web Audio +
// MediaRecorder into a real downloadable video file. Runs entirely in the
// browser — no server-side rendering, no ffmpeg, no cost.
//
// Recording happens in real time: this promise resolves only after roughly
// as long as the finished video is long, since MediaRecorder captures a
// live canvas + audio stream rather than encoding frames instantly.

export interface ShortsSceneAsset {
  narration: string
  imageUrl: string // data: URL
  audioUrl: string // data: URL
}

export interface RenderShortsOptions {
  width?: number
  height?: number
  fps?: number
  onProgress?: (fraction: number) => void
}

const SCENE_GAP = 0.35 // seconds of padding after each scene's narration

function pickMimeType(): string {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type
  }
  return 'video/webm'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load scene image'))
    img.src = src
  })
}

async function decodeAudio(ctx: AudioContext, dataUrl: string): Promise<AudioBuffer> {
  const buf = await fetch(dataUrl).then(r => r.arrayBuffer())
  return ctx.decodeAudioData(buf.slice(0))
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function renderShortsVideo(
  scenes: ShortsSceneAsset[],
  opts: RenderShortsOptions = {}
): Promise<Blob> {
  if (!scenes.length) throw new Error('No scenes to render')

  const width = opts.width ?? 720
  const height = opts.height ?? 1280
  const fps = opts.fps ?? 30

  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const audioCtx = new AudioContextCtor()

  // Preload everything up front so playback/recording is glitch-free.
  const images = await Promise.all(scenes.map(s => loadImage(s.imageUrl)))
  const audioBuffers = await Promise.all(scenes.map(s => decodeAudio(audioCtx, s.audioUrl)))

  const durations = audioBuffers.map(b => b.duration + SCENE_GAP)
  const totalDuration = durations.reduce((a, b) => a + b, 0)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // Schedule all narration audio up front against the AudioContext clock.
  const dest = audioCtx.createMediaStreamDestination()
  const startAt = audioCtx.currentTime + 0.15
  let cursor = startAt
  for (let i = 0; i < audioBuffers.length; i++) {
    const src = audioCtx.createBufferSource()
    src.buffer = audioBuffers[i]
    src.connect(dest)
    src.start(cursor)
    cursor += durations[i]
  }

  const canvasWithCapture = canvas as HTMLCanvasElement & { captureStream(fps?: number): MediaStream }
  const videoTrack = canvasWithCapture.captureStream(fps).getVideoTracks()[0]
  const combined = new MediaStream([videoTrack, ...dest.stream.getAudioTracks()])

  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(combined, { mimeType })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const recordingDone = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
    recorder.onerror = e => reject(e)
  })

  recorder.start()
  const renderStart = performance.now()

  await new Promise<void>(resolve => {
    let sceneIndex = 0
    let sceneStart = 0

    const draw = () => {
      const elapsed = (performance.now() - renderStart) / 1000

      while (sceneIndex < durations.length - 1 && elapsed - sceneStart >= durations[sceneIndex]) {
        sceneStart += durations[sceneIndex]
        sceneIndex++
      }
      const sceneDuration = durations[sceneIndex]
      const t = Math.min((elapsed - sceneStart) / sceneDuration, 1)

      // Ken Burns: slow zoom-in over the scene, image cover-fit to the frame.
      const scale = 1 + 0.08 * t
      const img = images[sceneIndex]
      const canvasRatio = width / height
      const imgRatio = img.width / img.height
      let drawW: number, drawH: number
      if (imgRatio > canvasRatio) {
        drawH = height * scale
        drawW = drawH * imgRatio
      } else {
        drawW = width * scale
        drawH = drawW / imgRatio
      }
      const dx = (width - drawW) / 2
      const dy = (height - drawH) / 2

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, dx, dy, drawW, drawH)

      // Bottom gradient so captions stay legible over any image.
      const gradient = ctx.createLinearGradient(0, height * 0.6, 0, height)
      gradient.addColorStop(0, 'rgba(0,0,0,0)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.75)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, height * 0.6, width, height * 0.4)

      // Burned-in caption.
      ctx.font = `bold ${Math.round(width * 0.055)}px system-ui, -apple-system, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      const lines = wrapText(ctx, scenes[sceneIndex].narration, width * 0.86)
      const lineHeight = width * 0.07
      let y = height - height * 0.12 - lines.length * lineHeight
      for (const line of lines) {
        ctx.lineWidth = 4
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'
        ctx.strokeText(line, width / 2, y)
        ctx.fillStyle = '#fff'
        ctx.fillText(line, width / 2, y)
        y += lineHeight
      }

      // Scene progress segments, TikTok/Stories style.
      const segGap = 6
      const segW = (width - segGap * (durations.length - 1) - 24) / durations.length
      for (let i = 0; i < durations.length; i++) {
        const x = 12 + i * (segW + segGap)
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.fillRect(x, 18, segW, 4)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        if (i < sceneIndex) ctx.fillRect(x, 18, segW, 4)
        else if (i === sceneIndex) ctx.fillRect(x, 18, segW * t, 4)
      }

      opts.onProgress?.(Math.min(elapsed / totalDuration, 1))

      if (elapsed < totalDuration) requestAnimationFrame(draw)
      else resolve()
    }
    requestAnimationFrame(draw)
  })

  // Let the final audio tail flush before cutting the recording.
  await new Promise(r => setTimeout(r, 300))
  recorder.stop()
  const blob = await recordingDone
  audioCtx.close().catch(() => {})
  return blob
}
