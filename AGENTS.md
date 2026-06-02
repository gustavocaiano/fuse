# Repository Agent Notes

## Work areas
- `thesis/` is the LaTeX dissertation. Build from that directory with `make`; `main.tex` includes `ch1`, `ch2`, `ch3`, `ch4`, `ch5`, `ch9`, and appendices.
- `project/` is the Laravel/Filament FUSE app. It has its own `project/AGENTS.md`; follow it for all Laravel, Sail, Pest, Pint, Filament, Inertia, and Tailwind work.
- `detector-project/` is the external detector service (`jollymonkey`). It has its own `detector-project/AGENTS.md`; follow it before Python/FastAPI/Celery/detector edits.

## Thesis guardrails
- Before changing Chapter 4, read `thesis/ch3/chapter3.tex`; Chapter 3 already explains MVP scope, domain model, component roles, infrastructure/connectivity, and streaming/PTZ/detection sequence diagrams.
- Do not re-explain in Chapter 4 what each architectural component does; Chapter 4 should map Chapter 3 concepts to concrete implementation details.
- Chapter 4 is implementation only: concrete stack, configs, code mechanisms, and implementation trade-offs. Avoid metrics, screenshots, validation evidence, and measured results.
- Chapter 5 (`thesis/ch5/chapter5.tex`) is for validation/evaluation/results: SCA findings, latency, detector metrics, screenshots, access-control evidence, and discussion.
- Current Chapter 4 boundaries: environment maps concept→implementation; orchestration covers clients/config/DI/modularity briefly; streaming covers MediaMTX/segments/files/FFmpeg/HLS/PTZ; security covers Nginx cookie/Tailscale/Cloudflare Tunnel/HMAC/SCA method; detector covers jollymonkey pipeline; persistence covers callbacks→segments/events/objects/metadata.
- Use existing labels: `chap:introducao`, `chap:estado_da_arte`, `chap:analise_e_desenho`, `chap:implementacao`, `chap:resultados`, `chap:conclusoes`.
- The thesis uses numeric `biblatex` with `bibtex`; `thesis/Makefile` runs `latexmk -r latexmk.rc -outdir=build -auxdir=build` and moves `build/main.pdf` to `thesis/main.pdf`.

## Laravel app commands (`project/`)
- Run project commands through Sail, not directly: `vendor/bin/sail up -d`, `vendor/bin/sail stop`, `vendor/bin/sail artisan ...`, `vendor/bin/sail composer ...`, `vendor/bin/sail npm ...`.
- Tests: `vendor/bin/sail artisan test --compact`; focused test: `vendor/bin/sail artisan test --compact --filter=TestName`.
- PHP format before finishing code edits: `vendor/bin/sail bin pint --dirty --format agent`.
- Static analysis: `vendor/bin/sail composer analyse`.
- Frontend build/test: `vendor/bin/sail npm run build`; JS unit test is `vendor/bin/sail npm test`.

## Laravel app implementation facts
- `project/docker-compose.yml` runs `fuse`, `mediamtx`, `nginx`, `mysql`, and `ptz` on `fuse-network`; MediaMTX mounts `./storage/app/recordings:/recordings`.
- Configured endpoints live in `project/config/fuse.php`; do not hardcode URLs, ports, paths, secrets, detector endpoints, or FFmpeg settings in application code.
- MediaMTX integration is via `MediaParserClient`/`MediaParserService`; `Camera` model hooks add/update/delete MediaMTX paths and dispatch ONVIF port discovery on create.
- MediaMTX `runOnRecordSegmentComplete` posts to `internal/hooks/mediamtx/segment-complete`; `RecordingSegmentIngestService` normalizes/dedupes the path, creates `RecordingSegment`, and dispatches `AnalyzeRecordingSegmentJob` when detection is enabled.
- Stream protection depends on `CookieHelper` and `docker/nginx/nginx.conf` sharing the same formula: `MD5(expires + camera_slug + STREAM_SECRET)` stored in the `stream_auth` cookie and validated by Nginx `secure_link`.
- Detector callback flow: `AnalyzeRecordingSegmentJob` sends a signed segment URL and callback URL; `EventResultRequest` verifies `X-Detector-Key`, timestamp, and HMAC; `EventDetectorResultController` persists segment status, events, objects, and metadata.
- Recording interval playback uses `RecordingIntervalPlaybackSessionService` and `RecordingIntervalHlsRenderer`; FFmpeg concat generates temporary HLS sessions. Treat this as streaming/gravação, not analysis results.

## Detector service facts (`detector-project/`)
- Pipeline is `enqueue -> download video -> motion gate -> object detection -> store/preview -> callback`; there is no post-detection characteristics/VLM stage implemented.
- Settings are read through `app.core.config.settings`; preserve `JOLLYMONKEY_*` env vars and legacy `EVENT_DETECTOR_*` aliases when adding settings.
- No dedicated linter is configured. Use syntax checks and pytest: `python3 -m compileall app tests`, then `.venv/bin/python -m pytest`.
- Focused detector tests: `.venv/bin/python -m pytest tests/test_pipeline_motion_gating.py tests/test_yolo11_pipeline.py`.
- GPU deploy requires `./scripts/setup_yolo11_model.sh` first; it generates `docker-compose.yolo.override.yml` used with `docker compose -f docker-compose.gpu.yml -f docker-compose.yolo.override.yml up -d --build`.
