import { useEffect, useState } from 'react'
import './App.css'
import { type Camera, createCamera, listCameras, startCamera } from './api'
import StreamPlayer from './components/StreamPlayer'

function App() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [name, setName] = useState('')
  const [rtsp, setRtsp] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const data = await listCameras()
    setCameras(data)
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !rtsp) return
    await createCamera(name, rtsp)
    setName('')
    setRtsp('')
    await refresh()
  }

  function toggleSelected(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="grid">
      <div className="panel">
        <h2>Add camera</h2>
        <form onSubmit={onAdd}>
          <div>
            <label>Name</label><br />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lobby cam" style={{ width: '100%' }} />
          </div>
          <div style={{ marginTop: 8 }}>
            <label>RTSP URL</label><br />
            <input value={rtsp} onChange={(e) => setRtsp(e.target.value)} placeholder="rtsp://user:pass@host:554/stream" style={{ width: '100%' }} />
          </div>
          <button type="submit" style={{ marginTop: 8 }}>Add</button>
        </form>

        <h2 style={{ marginTop: 16 }}>Cameras</h2>
        <ul>
          {cameras.map(c => (
            <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelected(c.id)} />
                <div>
                  <div><strong>{c.name}</strong></div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{c.rtsp}</div>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h2>Players</h2>
        {selectedIds.length === 0 && <div style={{ opacity: 0.6, marginTop: 8 }}>Select cameras to start</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {selectedIds.map(id => {
            const cam = cameras.find(c => c.id === id)
            if (!cam) return null
            return <MultiStream key={id} camera={cam} />
          })}
        </div>
      </div>
    </div>
  )
}

export default App

function MultiStream({ camera }: { camera: Camera }) {
  const [playlistUrl, setPlaylistUrl] = useState<string>('')

  useEffect(() => {
    let active = true
    startCamera(camera.id).then(({ playlistUrl }) => {
      if (active) setPlaylistUrl(playlistUrl)
    })
    return () => { active = false }
  }, [camera.id])

  if (!playlistUrl) return <div className="rounded-md bg-neutral-900 aspect-video grid place-items-center text-sm text-neutral-400">Starting...</div>
  return <StreamPlayer playlistUrl={playlistUrl} title={camera.name} cameraId={camera.id} />
}
