import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

type Props = {
  playlistUrl: string
  title?: string
}

export default function StreamPlayer({ playlistUrl, title }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isMuted, setIsMuted] = useState(true)

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
        // Ultra-low latency: keep within ~0.5-1s of the live edge
        const ranges = v.buffered
        if (!ranges || ranges.length === 0) return
        const end = ranges.end(ranges.length - 1)
        const gap = end - v.currentTime
        // If we are falling >2s behind, jump closer to live edge immediately
        if (gap > 2) {
          try { v.currentTime = Math.max(0, end - 0.5) } catch {}
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
        // Ultra-low latency HLS settings
        lowLatencyMode: true,
        liveDurationInfinity: true,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 2,
        // Minimal buffering for lowest latency
        maxBufferLength: 1,
        maxMaxBufferLength: 2,
        backBufferLength: 0,
        maxBufferHole: 0.1,
        maxFragLookUpTolerance: 0,
        // Aggressive live sync
        maxLiveSyncPlaybackRate: 1.5,
        liveSyncOnStallIncrease: 1,
        // Fast loading and parsing
        enableWorker: true,
        progressive: true,
        // Minimal startup delay
        startFragPrefetch: true,
        manifestLoadingTimeOut: 2000,
        manifestLoadingMaxRetry: 1,
        levelLoadingTimeOut: 2000,
        levelLoadingMaxRetry: 1,
        fragLoadingTimeOut: 2000,
        fragLoadingMaxRetry: 1,
      })
      hlsRef.current = hls
      hls.loadSource(playlistUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play()
      })
      hls.on(Hls.Events.LEVEL_UPDATED, () => {
        // Ultra-low latency: nudge to live if we drift >1s back
        const v = videoRef.current
        if (!v) return
        const details = hls.levels?.[hls.currentLevel]?.details
        const liveEdge = (details && (details as any).live ? hls.liveSyncPosition ?? NaN : NaN)
        if (!Number.isNaN(liveEdge) && v.currentTime < liveEdge - 1) {
          try { v.currentTime = liveEdge - 0.2 } catch {}
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
    <div className="rounded-lg overflow-hidden bg-black relative group">
      {/* Clean video display - no controls */}
      <video 
        ref={videoRef} 
        className="block w-full aspect-video object-cover"
        muted 
        disablePictureInPicture
        style={{ background: 'black' }}
      />
      
      {/* Live indicator */}
      <div className="absolute top-2 right-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-600/90 text-white shadow backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </span>
      </div>
      
      {/* Camera title */}
      {title ? (
        <div className="absolute top-2 left-2 px-2 py-1 text-xs text-white bg-black/60 rounded backdrop-blur-sm">
          {title}
        </div>
      ) : null}
      
      {/* Hover controls overlay - Touch-friendly on mobile */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 lg:transition-opacity lg:duration-200 flex items-center justify-center touch-manipulation">
        <div className="flex items-center gap-4 lg:gap-3">
          {/* Mute/Unmute toggle */}
          <button 
            onClick={() => {
              if (videoRef.current) {
                const newMuted = !videoRef.current.muted
                videoRef.current.muted = newMuted
                setIsMuted(newMuted)
              }
            }}
            className="p-3 lg:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm touch-manipulation"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-5 h-5 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          {/* Fullscreen toggle */}
          <button 
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen()
              } else {
                videoRef.current?.parentElement?.requestFullscreen()
              }
            }}
            className="p-3 lg:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm touch-manipulation"
            title="Fullscreen"
          >
            <svg className="w-5 h-5 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 01-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Subtle bottom gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  )
}


