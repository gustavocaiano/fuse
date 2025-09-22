import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';

type HlsCtor = any;

declare global {
    interface Window {
        Hls?: HlsCtor;
    }
}

export default function Cameras() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<any | null>(null);
    const [url, setUrl] = useState<string>('http://localhost:8888/cam1/index.m3u8');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Load Hls.js from CDN once
    useEffect(() => {
        let canceled = false;
        if (window.Hls) return;
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.async = true;
        script.onload = () => { /* ready */ };
        script.onerror = () => { /* ignore */ };
        document.body.appendChild(script);
        return () => {
            canceled = true;
            void canceled;
        };
    }, []);

    const destroyPlayer = () => {
        try {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        } catch { /* ignore */ }
        const v = videoRef.current;
        if (v) {
            try {
                v.pause();
                v.removeAttribute('src');
                v.load();
            } catch { /* ignore */ }
        }
    };

    const load = async (nextUrl: string) => {
        setError(null);
        setLoading(true);
        destroyPlayer();

        const video = videoRef.current;
        if (!video) {
            setLoading(false);
            return;
        }

        try {
            // Safari / iOS native HLS
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = nextUrl;
                video.onloadedmetadata = () => {
                    void video.play().catch(() => undefined);
                };
                setLoading(false);
                return;
            }

            // hls.js path
            const Hls: HlsCtor | undefined = window.Hls;
            if (!Hls || !Hls.isSupported?.()) {
                setError('HLS not supported in this browser');
                setLoading(false);
                return;
            }

            const hls = new Hls({
                // Aim for sub-second latency (requires LL-HLS/CMAF on server)
                lowLatencyMode: true,
                liveSyncDuration: 0.5,         // seconds from live edge
                liveMaxLatencyDuration: 1.0,   // cap drift
                maxLiveSyncOnStall: 1,
                backBufferLength: 0,
                maxBufferLength: 1,
                maxBufferSize: 0,
                maxBufferHole: 0.1,
                enableWorker: true
            });
            hlsRef.current = hls;

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(nextUrl);
            });

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const p = video.play();
                if (p) void p.catch(() => undefined);
                setLoading(false);
            });

            hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
                if (data?.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            setError('Fatal HLS error');
                            destroyPlayer();
                    }
                }
            });

            hls.attachMedia(video);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load stream');
            setLoading(false);
        }
    };

    // Auto load on first render
    useEffect(() => {
        load(url);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => destroyPlayer(), []);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    HLS Player
                </h2>
            }
        >
            <Head title="Cameras" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="flex gap-2 mb-4">
                                <input
                                    className="flex-1 rounded border px-3 py-2 text-black"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Enter HLS .m3u8 URL"
                                />
                                <button
                                    className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                                    onClick={() => load(url)}
                                    disabled={loading}
                                >
                                    {loading ? 'Loading…' : 'Load'}
                                </button>
                            </div>

                            {error && (
                                <div className="mb-3 rounded bg-red-600/20 p-2 text-red-200">
                                    {error}
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                id="hls-player"
                                controls
                                muted
                                playsInline
                                style={{ width: '100%', maxHeight: 540 }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
