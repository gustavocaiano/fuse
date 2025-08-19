import { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import { type Camera, createCamera, listCameras, startCamera, deleteCamera, getCamera } from './api'
import StreamPlayer from './components/StreamPlayer'

export default function App() {
  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col">
      <header className="border-b border-slate-700 bg-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <Link to="/" className="text-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
          🎥 cam-parser
        </Link>
        <nav>
          <Link to="/" className="px-3 py-2 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-6 overflow-hidden min-h-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ptz/:id" element={<PTZControl />} />
        </Routes>
      </main>
    </div>
  )
}

function Home() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [name, setName] = useState('')
  const [rtsp, setRtsp] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const navigate = useNavigate()

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
    <div className="h-full flex gap-6">
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
        {/* Add Camera Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">Add Camera</h2>
          <form onSubmit={onAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Camera Name</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., Lobby Camera" 
                className="w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">RTSP Stream URL</label>
              <input 
                value={rtsp} 
                onChange={(e) => setRtsp(e.target.value)} 
                placeholder="rtsp://user:pass@ip:554/stream" 
                className="w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              + Add Camera
            </button>
          </form>
        </div>

        {/* Cameras List */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">Cameras</h2>
            <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-400">
              {cameras.length} total
            </span>
          </div>
          
          {cameras.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">📹</div>
              <p className="text-sm">No cameras added yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cameras.map(c => (
                <div key={c.id} className="group p-3 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <div className="flex items-start gap-3">
                    <label className="flex items-start gap-2 flex-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(c.id)} 
                        onChange={() => toggleSelected(c.id)} 
                        className="mt-1 accent-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white truncate">{c.name}</div>
                        <div className="text-xs text-slate-400 font-mono break-all">{c.rtsp}</div>
                      </div>
                    </label>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/ptz/${c.id}`)} 
                        className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors"
                      >
                        Control
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete camera "${c.name}" and all its data?`)) return
                          await deleteCamera(c.id)
                          setSelectedIds(prev => prev.filter(x => x !== c.id))
                          await refresh()
                        }}
                        className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-purple-400">Live Streams</h2>
            <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-400">
              {selectedIds.length} active
            </span>
          </div>
          
          <div className="flex-1 min-h-0">
            {selectedIds.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📺</div>
                  <p className="text-lg mb-2">No cameras selected</p>
                  <p className="text-sm">Check cameras from the list to start streaming</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full auto-rows-fr overflow-y-auto">
                {selectedIds.map(id => {
                  const cam = cameras.find(c => c.id === id)
                  if (!cam) return null
                  return <MultiStream key={id} camera={cam} />
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MultiStream({ camera }: { camera: Camera }) {
  const [playlistUrl, setPlaylistUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    startCamera(camera.id).then(({ playlistUrl }) => {
      if (active) {
        setPlaylistUrl(playlistUrl)
        setIsLoading(false)
      }
    }).catch(() => {
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [camera.id])

  if (isLoading) {
    return (
      <div className="rounded-lg bg-slate-700 aspect-video flex items-center justify-center border border-slate-600">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-sm text-slate-400">Starting...</div>
          <div className="text-xs text-slate-500">{camera.name}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border border-slate-600 hover:border-slate-500 transition-colors">
      <StreamPlayer playlistUrl={playlistUrl} title={camera.name} />
    </div>
  )
}

function PTZControl() {
  const { id } = useParams()
  const [camera, setCamera] = useState<Camera | null>(null)
  const [playlistUrl, setPlaylistUrl] = useState<string>('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    let active = true
    ;(async () => {
      const cam = await getCamera(id)
      if (!active) return
      setCamera(cam)
      const { playlistUrl } = await startCamera(cam.id)
      if (!active) return
      setPlaylistUrl(playlistUrl)
    })()
    return () => { active = false }
  }, [id])

  function hold(action: () => void, stop: () => void) {
    return {
      onMouseDown: action,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); action() },
      onTouchEnd: stop,
      onTouchCancel: stop,
    }
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors"
        >
          ← Back to Dashboard
        </button>
        <div className="text-right">
          <div className="text-lg font-semibold text-emerald-400">
            {camera ? camera.name : 'Loading...'}
          </div>
          <div className="text-xs text-slate-500">PTZ Control Panel</div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Video Stream */}
        <div className="flex-1">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-red-400 mb-4">Live Stream</h3>
            <div className="flex-1">
              {playlistUrl ? (
                <StreamPlayer playlistUrl={playlistUrl} title={camera?.name} />
              ) : (
                <div className="rounded-lg bg-slate-700 aspect-video flex items-center justify-center border border-slate-600 h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <div className="text-lg text-slate-400 mb-1">Connecting...</div>
                    <div className="text-xs text-slate-500">Please wait</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* PTZ Controls */}
        <div className="w-80">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-full">
            <h3 className="text-lg font-semibold text-indigo-400 mb-6">PTZ Controls</h3>
            {camera ? (
              <div className="space-y-6">
                {/* Pan/Tilt Controls */}
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-3 font-medium">PAN & TILT</div>
                  <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                    <div />
                    <button 
                      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center" 
                      {...hold(() => import('./api').then(m => m.ptzMove(camera.id, { type: 'continuous', pan: 0, tilt: 1, speed: 0.5 })), () => import('./api').then(m => m.ptzStop(camera.id)))}
                    >
                      ▲
                    </button>
                    <div />
                    <button 
                      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center" 
                      {...hold(() => import('./api').then(m => m.ptzMove(camera.id, { type: 'continuous', pan: -1, tilt: 0, speed: 0.5 })), () => import('./api').then(m => m.ptzStop(camera.id)))}
                    >
                      ◀
                    </button>
                    <div className="w-8 h-8 rounded bg-slate-600 border border-slate-500 flex items-center justify-center">
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    </div>
                    <button 
                      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center" 
                      {...hold(() => import('./api').then(m => m.ptzMove(camera.id, { type: 'continuous', pan: 1, tilt: 0, speed: 0.5 })), () => import('./api').then(m => m.ptzStop(camera.id)))}
                    >
                      ▶
                    </button>
                    <div />
                    <button 
                      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center" 
                      {...hold(() => import('./api').then(m => m.ptzMove(camera.id, { type: 'continuous', pan: 0, tilt: -1, speed: 0.5 })), () => import('./api').then(m => m.ptzStop(camera.id)))}
                    >
                      ▼
                    </button>
                    <div />
                  </div>
                </div>
                
                {/* Zoom Controls */}
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-3 font-medium">ZOOM</div>
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 transition-colors font-bold" 
                      {...hold(() => import('./api').then(m => m.ptzMove(camera.id, { type: 'continuous', zoom: -1, speed: 0.6 })), () => import('./api').then(m => m.ptzStop(camera.id, { zoom: true })))}
                    >
                      －
                    </button>
                    <button 
                      className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 transition-colors font-bold" 
                      {...hold(() => import('./api').then(m => m.ptzMove(camera.id, { type: 'continuous', zoom: 1, speed: 0.6 })), () => import('./api').then(m => m.ptzStop(camera.id, { zoom: true })))}
                    >
                      ＋
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <div className="text-xs text-slate-500 text-center">
                    Hold buttons to move camera<br />
                    Release to stop movement
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
                <div className="text-sm text-slate-400">Loading controls...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
