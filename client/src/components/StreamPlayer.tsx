import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

type Props = {
  playlistUrl: string
  title?: string
  cameraId?: string
}

export default function StreamPlayer({ playlistUrl, title, cameraId }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playlistUrl) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playlistUrl
      void video.play()
    } else if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 10 })
      hlsRef.current = hls
      hls.loadSource(playlistUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play()
      })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [playlistUrl])

  return (
    <div className="rounded-md overflow-hidden bg-black relative">
      <video ref={videoRef} className="w-full aspect-video" controls muted playsInline />
      {title ? <div className="px-2 py-1 text-xs text-white/80 bg-black/60">{title}</div> : null}
      {cameraId ? (
        <div className="absolute bottom-2 left-2 flex gap-1 bg-black/40 p-2 rounded text-white select-none">
          <button onMouseDown={() => import('../api').then(m => m.ptzMove(cameraId, { type: 'continuous', pan: -1, tilt: 0, speed: 0.4 }))} onMouseUp={() => import('../api').then(m => m.ptzStop(cameraId))} className="px-2 py-1 bg-white/10 rounded">◀</button>
          <button onMouseDown={() => import('../api').then(m => m.ptzMove(cameraId, { type: 'continuous', pan: 1, tilt: 0, speed: 0.4 }))} onMouseUp={() => import('../api').then(m => m.ptzStop(cameraId))} className="px-2 py-1 bg-white/10 rounded">▶</button>
          <button onMouseDown={() => import('../api').then(m => m.ptzMove(cameraId, { type: 'continuous', pan: 0, tilt: 1, speed: 0.4 }))} onMouseUp={() => import('../api').then(m => m.ptzStop(cameraId))} className="px-2 py-1 bg-white/10 rounded">▲</button>
          <button onMouseDown={() => import('../api').then(m => m.ptzMove(cameraId, { type: 'continuous', pan: 0, tilt: -1, speed: 0.4 }))} onMouseUp={() => import('../api').then(m => m.ptzStop(cameraId))} className="px-2 py-1 bg-white/10 rounded">▼</button>
          <button onMouseDown={() => import('../api').then(m => m.ptzMove(cameraId, { type: 'continuous', zoom: 1, speed: 0.5 }))} onMouseUp={() => import('../api').then(m => m.ptzStop(cameraId, { zoom: true }))} className="px-2 py-1 bg-white/10 rounded">＋</button>
          <button onMouseDown={() => import('../api').then(m => m.ptzMove(cameraId, { type: 'continuous', zoom: -1, speed: 0.5 }))} onMouseUp={() => import('../api').then(m => m.ptzStop(cameraId, { zoom: true }))} className="px-2 py-1 bg-white/10 rounded">－</button>
        </div>
      ) : null}
    </div>
  )
}


