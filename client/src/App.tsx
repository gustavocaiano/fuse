import { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom'
import { type Camera, createCamera, listCameras, startCamera, deleteCamera, getCamera, setRecording, getMe, setAuthUser, type User, listUsers, createUser, listUsersWithAccess, grantAccess, revokeAccess } from './api'
import StreamPlayer from './components/StreamPlayer'

export default function App() {
  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col">
      <header className="border-b border-slate-700 bg-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <Link to="/" className="text-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
          🎥 cam-parser
        </Link>
        <AuthStatus />
      </header>
      <main className="flex-1 p-6 overflow-auto min-h-0">
        <Routes>
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
          <Route path="/ptz/:id" element={<PTZControl />} />
        </Routes>
      </main>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('userId')
    setAuthUser(saved)
    getMe().then(me => {
      setOk(Boolean(me))
      setChecking(false)
    })
  }, [])
  if (checking) return <div className="text-slate-400">Checking session…</div>
  if (!ok) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AuthStatus() {
  const [me, setMe] = useState<User | null>(null)
  useEffect(() => {
    const saved = localStorage.getItem('userId')
    setAuthUser(saved)
    getMe().then(setMe)
  }, [])
  return (
    <div className="text-sm text-slate-300">
      {me ? (
        <span className="flex items-center gap-3">
          <span>Signed in as <span className="font-semibold">{me.name}</span> ({me.role})</span>
          {me.role === 'admin' ? (
            <Link to="/admin" className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors text-xs">Admin</Link>
          ) : null}
        </span>
      ) : (
        <Link to="/login" className="px-3 py-2 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors">Sign in</Link>
      )}
    </div>
  )
}

function Login() {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthUser(userId || null)
    const me = await getMe()
    if (!me) {
      setError('User not found. Ask an admin to create your user ID.')
      return
    }
    localStorage.setItem('userId', userId)
    navigate('/')
  }
  return (
    <div className="max-w-sm mx-auto mt-20 bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-slate-300 mb-1">User ID</label>
          <input value={userId} onChange={e => setUserId(e.target.value)} className="w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" placeholder="Enter your user ID" />
        </div>
        {error ? <div className="text-sm text-red-400">{error}</div> : null}
        <button className="w-full bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-sm font-medium">Sign in</button>
      </form>
      <div className="text-xs text-slate-400 mt-3">An admin must create your user and share the ID.</div>
    </div>
  )
}

function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [selectedCam, setSelectedCam] = useState<string>('')
  const [accessUserIds, setAccessUserIds] = useState<string[]>([])
  const [name, setName] = useState('')
  const [role, setRole] = useState<'admin' | 'user'>('user')

  useEffect(() => {
    listUsers().then(setUsers).catch(() => setUsers([]))
    listCameras().then(setCameras)
  }, [])

  useEffect(() => {
    if (!selectedCam) return
    listUsersWithAccess(selectedCam).then(rows => setAccessUserIds(rows.map(u => u.id))).catch(() => setAccessUserIds([]))
  }, [selectedCam])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Create User</h2>
        <form className="flex gap-2" onSubmit={async (e) => {
          e.preventDefault()
          if (!name) return
          await createUser(name, role)
          setName('')
          listUsers().then(setUsers)
        }}>
          <input className="flex-1 rounded bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <select className="rounded bg-slate-700 border border-slate-600 px-2 text-sm text-white" value={role} onChange={e => setRole(e.target.value as any)}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm">Add</button>
        </form>
        <h3 className="text-sm font-semibold mt-4 mb-2">Existing Users</h3>
        <ul className="space-y-1">
          {users.map(u => (
            <li key={u.id} className="text-sm text-slate-300 flex items-center justify-between">
              <span>{u.name} <span className="text-slate-500">({u.role})</span></span>
              <span className="text-[10px] text-slate-500 font-mono">{u.id}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Assign Cameras</h2>
        <select className="w-full rounded bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white mb-3" value={selectedCam} onChange={e => setSelectedCam(e.target.value)}>
          <option value="">Select a camera</option>
          {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selectedCam ? (
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {users.map(u => (
              <label key={u.id} className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" className="accent-emerald-500" checked={accessUserIds.includes(u.id)} onChange={async (e) => {
                  if (e.target.checked) await grantAccess(u.id, selectedCam)
                  else await revokeAccess(u.id, selectedCam)
                  listUsersWithAccess(selectedCam).then(rows => setAccessUserIds(rows.map(x => x.id)))
                }} />
                <span>{u.name} <span className="text-slate-500">({u.role})</span></span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 text-sm">Select a camera to manage access</div>
        )}
      </div>
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
                    <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="flex items-center gap-1 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(c.recordEnabled)}
                          onChange={async (e) => {
                            const enabled = e.target.checked
                            await setRecording(c.id, enabled)
                            await refresh()
                          }}
                          className="accent-red-500"
                          title="Toggle recording"
                        />
                        <span>Record</span>
                      </label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 h-full overflow-y-auto p-0.5 items-start">
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
    <div className="group rounded-xl overflow-hidden border border-slate-700 bg-slate-800/40 backdrop-blur-sm hover:border-slate-500 transition-colors">
      <StreamPlayer playlistUrl={playlistUrl} title={camera.name} />
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/70 border-t border-slate-700">
        <div className="min-w-0">
          <div className="text-xs text-slate-300 truncate">{camera.name}</div>
          <div className="text-[10px] text-slate-500 font-mono truncate">{camera.rtsp}</div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => window.open(playlistUrl, '_blank')}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
          >Open HLS</button>
          <button 
            onClick={() => navigator.clipboard.writeText(camera.rtsp!)}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
          >Copy RTSP</button>
        </div>
      </div>
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
