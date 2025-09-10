## Tailscale subnet routing: RPi + Camera + 4G router

This guide lets your laptop (running cam-parser) reach an IP camera behind a 4G router without any port forwarding, using Tailscale subnet routing via a Raspberry Pi on-site.

### What you’ll need
- **Raspberry Pi** on the same LAN as the camera
- **IP camera** reachable on the local LAN (e.g., 192.168.16.200:554)
- **Laptop/desktop** where you run cam-parser (macOS assumed below)
- A free Tailscale account

### High-level
- Both the laptop and the RPi log into the same Tailscale account (tailnet).
- The RPi advertises the camera’s LAN subnet (e.g., 192.168.16.0/24).
- You approve that route in the Tailscale admin panel.
- Your laptop can then reach the camera’s LAN IP directly. No public IPs or port forwarding.

## Step-by-step

### 1) Create your tailnet
- Visit `https://tailscale.com`, sign up, and log in (Google/Microsoft/GitHub).
- Optional: In Admin Console, enable MagicDNS (not required for this guide).

### 2) Install and log in on your laptop
macOS:
```bash
brew install tailscale
sudo tailscale up --accept-routes --ssh
```
- A browser window will open; log into the same Tailscale account.

Verify:
```bash
tailscale status
tailscale ip -4
```

### 3) Install and log in on the Raspberry Pi
On the RPi (same LAN as the camera):
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh
```
- This prints a login URL; open it on any device and approve the Pi with your Tailscale account.

Headless alternative (no browser on the Pi): create an Auth Key in the Tailscale Admin Console, then:
```bash
sudo tailscale up --ssh --authkey=tskey-xxxxxxxx
```

### 4) Enable IP forwarding on the RPi
```bash
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward
sudo sed -i 's/^#\?net.ipv4.ip_forward=.*/net.ipv4.ip_forward=1/' /etc/sysctl.conf
```

### 5) Identify the camera LAN subnet
Typical subnets: 192.168.0.0/24, 192.168.1.0/24, 192.168.16.0/24.
```bash
ip -4 addr
ip route
```
- Example: camera = 192.168.16.200 → subnet is 192.168.16.0/24.

### 6) Advertise the subnet from the RPi
Replace the subnet below with yours:
```bash
sudo tailscale up --advertise-routes=192.168.16.0/24 --accept-routes --ssh
```

### 7) Approve the route in Tailscale Admin
- Go to the Admin Console → Machines → click the Raspberry Pi → approve the advertised route (e.g., 192.168.16.0/24).

### 8) Test from your laptop
Your laptop now learns that 192.168.16.0/24 is reachable via the Pi.
```bash
ping 192.168.16.200
ffplay -rtsp_transport tcp rtsp://user:pass@192.168.16.200:554/<exact_rtsp_path>
```

### 9) Use with cam-parser (running on your laptop)
- In the UI, add the camera using its LAN RTSP URL, for example:
  - `rtsp://user:pass@192.168.16.200:554/Streaming/Channels/101`
- Start the stream. The server already uses `-rtsp_transport tcp`, so no extra changes.
- The player will load HLS from your local backend as usual.

## Troubleshooting
- **Route not working**:
  - Ensure the RPi command includes `--advertise-routes=...` and you approved the route in Admin.
  - Confirm IP forwarding is enabled (`sysctl net.ipv4.ip_forward` → 1).
  - Restart tailscaled if needed: `sudo systemctl restart tailscaled`.
- **Wrong RTSP path**:
  - Vendor-specific paths are common, e.g. `Streaming/Channels/101`, `h264Preview_01_main`, `live/ch00_0`.
  - Test with: `ffplay -rtsp_transport tcp rtsp://user:pass@<ip>:554/<path>`.
- **Multiple sites / cameras**:
  - Repeat with more RPis, each advertising its own subnet; approve all routes.
- **Persistence**:
  - Tailscale keeps settings across reboots; `tailscaled` runs as a service by default.
  - The `sysctl.conf` change keeps IP forwarding enabled across reboots.
- **Security**:
  - Tailscale links only devices in your tailnet; no Internet exposure.
  - Use strong camera credentials; don’t expose RTSP publicly.

## Quick reference
- Show Pi’s Tailscale IP: `tailscale ip -4`
- Show status: `tailscale status`
- Re-run with routes: `sudo tailscale up --advertise-routes=<SUBNET> --accept-routes --ssh`

That’s it — with subnet routing approved, your laptop can connect to the camera’s LAN IP through the Raspberry Pi over Tailscale, with no port forwarding.

