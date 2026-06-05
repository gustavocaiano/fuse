# Repository Agent Notes

## Work areas
- `thesis/` is the LaTeX dissertation. Build from that directory with `make`; `main.tex` includes `ch1`, `ch2`, `ch3`, `ch4`, `ch5`, `ch9`, and appendices.
- `project/` is the Laravel/Filament FUSE app. It has its own `project/AGENTS.md`; follow it for all Laravel, Sail, Pest, Pint, Filament, Inertia, and Tailwind work.
- `detector-project/` is the external detector service (`jollymonkey`). It has its own `detector-project/AGENTS.md`; follow it before Python/FastAPI/Celery/detector edits.

## Thesis guardrails
- **Default thesis-writing workflow (mandatory for substantive thesis sections):** do not jump directly into prose. First discuss the section with the user until the intended message, boundaries, and academic relevance are clear. Then draft concise bullet points for the section/subsections describing exactly what will be covered. Before writing the final text, use the `question` tool to ask the user, one section/subsection at a time, whether the proposed content is right, should change, or should be removed. Only after the user confirms the bullet points should implementation proceed section by section in the `.tex` files.
- This workflow is preferred because it preserves the user's intended thesis narrative. Use it by default in new conversations whenever the user asks to write, continue, restructure, or substantially revise thesis content. Avoid one-shot section generation unless the user explicitly asks for it.
- During this workflow, actively challenge weak or low-relevance material: identify possible "palha", suggest tighter academic alternatives, and keep listings/text only when they support an implementation decision, traceability point, or architectural trade-off.
- Before changing Chapter 4, read `thesis/ch3/chapter3.tex`; Chapter 3 already explains MVP scope, domain model, component roles, infrastructure/connectivity, and streaming/PTZ/detection sequence diagrams.
- Do not re-explain in Chapter 4 what each architectural component does; Chapter 4 should map Chapter 3 concepts to concrete implementation details.
- Chapter 4 is implementation only: concrete stack, configs, code mechanisms, and implementation trade-offs. Avoid metrics, screenshots, validation evidence, and measured results.
- Chapter 5 (`thesis/ch5/chapter5.tex`) is for validation/evaluation/results: SCA findings, latency, detector metrics, screenshots, access-control evidence, and discussion.
- Current Chapter 4 boundaries: environment maps concept→implementation; orchestration covers domain concretization, app-level access control, Filament resources, services/config/DI, and jobs; streaming covers MediaMTX paths, segments/files, FFmpeg/HLS, playback, and PTZ; security covers Nginx stream cookie validation, Tailscale, Cloudflare Tunnel, callback HMAC, audit/rastreabilidade, and SCA method; detector covers jollymonkey pipeline; persistence covers callbacks→segments/events/objects/metadata.
- Chapter 4 environment section: keep `Tecnologias Utilizadas` factual and `Fundamentação de Escolhas` separate; detector stack/YOLO details belong in `sec:detetor_automatico`; do not mention go2rtc unless a formal comparison is added.
- Docker Compose listings in Chapter 4 should stay simplified: omit secrets, `depends_on`, and repetitive options; use `fuse` build `./docker/8.4`, public `bluenviron/mediamtx:1.17.0`, and `ptz` build `./docker/ptz`.
- In Chapter 4, keep Portuguese domain names in prose (`Processo`, `Câmara`, `Segmento de Gravação`, `Evento de Deteção`, `Objeto Detetado`, `Utilizador`, `Auditoria`); use class/resource names only when referring to implementation artefacts or code blocks.
- The Chapter 4 orchestration section should not repeat Chapter 3's domain model. It currently explains: Eloquent/migrations as implementation, `process_user` and process filtering, roles/permissions as permission-driven not role-name-driven, Filament resources as the operational UI, and `CameraResource` as the operational axis for recordings/detections.
- App-level access control belongs in Chapter 4 orchestration: `process_user`, `HasProcessFiltering`, `relatedToUser`, `whereUserIsOperator`, `bypass-process-filtering`, role/permission setup, and Filament query/action visibility. Security section should not re-explain these; it focuses on stream/callback/network protection and audit.
- For Filament resources, avoid tutorial-style descriptions of `form/table/infolist`; show operational purpose. `RecordingSegment`, `DetectionEvent`, and `DetectionObject` are not top-level resources in the thesis narrative; they are accessed in the camera context via `CameraResource` pages (`recordings`, `detections`).
- Streaming section decision: describe functional HLS delivery and show only the Nginx HLS/proxy part there; explain the Laravel-issued `stream_auth` cookie and Nginx `secure_link` validation in the security section.
- Use `lstlisting` for code/config excerpts with captions/labels; global listing caption is `Código`. Keep excerpts simplified and omit secrets/auxiliary details. When prose discusses something shown in a code excerpt, include the listing line reference, e.g. `relatedToUser` (linha 4).
- When thesis sections contain inline LaTeX comments with bullet guidance, treat those comments as the agreed writing plan: work one subsection at a time, ask/confirm before writing final prose, and do not remove the guidance comments until that subsection has been written and confirmed.
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
