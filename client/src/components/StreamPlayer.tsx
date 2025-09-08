import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

type Props = {
  playlistUrl: string
  title?: string
}

export default function StreamPlayer({ playlistUrl, title }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playlistUrl) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const attachCatchUp = () => {
      const onTimeUpdate = () => {
        const v = videoRef.current
        if (!v) return
        // Keep within ~3-4s of the live edge to avoid drift
        const ranges = v.buffered
        if (!ranges || ranges.length === 0) return
        const end = ranges.end(ranges.length - 1)
        const gap = end - v.currentTime
        // If we are falling >6s behind, jump closer to live edge
        if (gap > 6) {
          try { v.currentTime = Math.max(0, end - 3) } catch {}
        }
      }
      video.addEventListener('timeupdate', onTimeUpdate)
      return () => video.removeEventListener('timeupdate', onTimeUpdate)
    }

    let detachCatchUp: (() => void) | undefined

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playlistUrl
      detachCatchUp = attachCatchUp()
      void video.play()
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        // standard HLS (not LL-HLS) tuned to stay near live edge
        lowLatencyMode: false,
        liveDurationInfinity: true,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 6,
        maxBufferLength: 4,
        backBufferLength: 0.5,
        maxBufferHole: 0.5,
        maxLiveSyncPlaybackRate: 1.15,
        enableWorker: true,
      })
      hlsRef.current = hls
      hls.loadSource(playlistUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play()
      })
      hls.on(Hls.Events.LEVEL_UPDATED, () => {
        // Nudge to live if we somehow drifted far back
        const v = videoRef.current
        if (!v) return
        const details = hls.levels?.[hls.currentLevel]?.details
        const liveEdge = (details && (details as any).live ? hls.liveSyncPosition ?? NaN : NaN)
        if (!Number.isNaN(liveEdge) && v.currentTime < liveEdge - 6) {
          try { v.currentTime = liveEdge - 3 } catch {}
        }
      })
      detachCatchUp = attachCatchUp()
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              hls.destroy()
              hlsRef.current = null
          }
        }
      })
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (detachCatchUp) detachCatchUp()
    }
  }, [playlistUrl])

  return (
    <div className="rounded-lg overflow-hidden bg-black relative">
      <video 
        ref={videoRef} 
        className="block w-full aspect-video"
        controls 
        muted 
        playsInline 
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
      />
      <div className="absolute top-2 right-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-600/90 text-white shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      </div>
      {title ? (
        <div className="absolute top-2 left-2 px-2 py-1 text-xs text-white bg-black/60 rounded">
          {title}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  )
}


