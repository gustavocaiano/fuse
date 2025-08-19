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
    <div className="rounded-lg overflow-hidden bg-black relative">
      <video ref={videoRef} className="w-full aspect-video" controls muted playsInline />
      {title ? (
        <div className="absolute top-2 left-2 px-2 py-1 text-xs text-white bg-black/60 rounded">
          {title}
        </div>
      ) : null}
    </div>
  )
}


