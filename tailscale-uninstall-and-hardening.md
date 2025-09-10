## Tailscale — Uninstall/Reset and Hardening (Raspberry Pi)

Use this when you want to reset the Pi’s Tailscale state or deploy with a separate “burner” tailnet and restrict access.

### Uninstalling / resetting Tailscale on the Raspberry Pi

Clean logout and state removal:
```bash
sudo tailscale logout
sudo systemctl stop tailscaled
sudo systemctl disable tailscaled
sudo rm -rf /var/lib/tailscale
```

Optional: remove package:
```bash
sudo apt-get purge -y tailscale
sudo apt-get autoremove -y
```

Optional: revert IP forwarding:
```bash
echo 0 | sudo tee /proc/sys/net/ipv4/ip_forward
sudo sed -i 's/^net.ipv4.ip_forward=.*/net.ipv4.ip_forward=0/' /etc/sysctl.conf
```

---

## Hardening: burner tailnet and forwarder-only Pi

Goal: The Pi only forwards the camera subnet. It cannot initiate connections to your other devices; only you can initiate to the camera subnet.

### Join the Pi to a separate burner tailnet
- Create a new Tailscale account (separate email) just for field devices.
- In Admin → Settings → Keys, create a preauthorized auth key.
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh=false --authkey=tskey-xxxxxxxx
```

### Enable forwarding and advertise only the camera subnet
```bash
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward
sudo sed -i 's/^#\?net.ipv4.ip_forward=.*/net.ipv4.ip_forward=1/' /etc/sysctl.conf
# Replace 192.168.16.0/24 with your camera LAN subnet
sudo tailscale up \
  --ssh=false \
  --accept-routes \
  --advertise-routes=192.168.16.0/24 \
  --accept-dns=false \
  --shields-up

# Ensure tailscaled starts on boot
sudo systemctl enable --now tailscaled

# Verify
tailscale status
tailscale ip -4
```

### Enforce one-way access with ACLs (burner tailnet)
Admin Console → Access controls → set a minimal policy:
```json
{
  "acls": [
    {
      "action": "accept",
      "users": ["user:you@example.com"],
      "ports": ["192.168.16.0/24:*"]
    }
  ]
}
```
- Only your user can initiate to the camera subnet. No rule allows traffic originating from the Pi to your devices.

### Extra: block inbound to the Pi itself (shields up)
```bash
sudo tailscale up --shields-up --accept-routes --advertise-routes=192.168.16.0/24 --ssh=false --accept-dns=false
```
- Subnet routing continues to work; direct access to the Pi over Tailscale is blocked.

### Use
- Approve the advertised route (Machines → Raspberry Pi → approve 192.168.16.0/24).
- From your laptop (joined to the burner tailnet):
  - `ffplay -rtsp_transport tcp rtsp://user:pass@192.168.16.200:554/<path>`
  - Add the same URL in cam-parser.

---

## Linux server (protected client) — commands

Join the same burner tailnet, learn routes, deny inbound to the server over Tailscale.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --accept-routes --ssh=false --shields-up

# Verify you see the Pi and the advertised subnet is "Approved"
tailscale status

# Test reachability to the camera via the Pi (replace IP/path)
ping -c 2 192.168.16.200 || true
ffprobe -v error -rtsp_transport tcp rtsp://user:pass@192.168.16.200:554/<path> || true
```

- Keep `--shields-up` if you don’t want any inbound over Tailscale to the server.
- Your cam-parser on the server can now pull RTSP using the LAN camera IP; traffic goes through the Pi.

---

## macOS laptop (protected client) — commands

Join the same burner tailnet, learn routes, deny inbound to the laptop over Tailscale.

```bash
brew install tailscale
sudo tailscale up --accept-routes --ssh=false --shields-up

# Verify and test
tailscale status
ping -c 2 192.168.16.200 || true
ffplay -rtsp_transport tcp rtsp://user:pass@192.168.16.200:554/<path>
```

You can now add the same RTSP URL in cam-parser running on your Mac for validation.

---

## Optional (stricter) — Device tags + ACL allowlist

For explicit allowlists, tag devices and restrict access to the subnet only from tagged clients.

1) In Admin Console → Settings → Enable device tags.
2) Create two auth keys: one with `tag:subnet-router` for the Pi, one with `tag:trusted-client` for your Mac/server.
3) Join devices with tags:
```bash
# Raspberry Pi
sudo tailscale up --authkey=tskey-pi-with-tag --advertise-tags=tag:subnet-router \
  --ssh=false --accept-routes --advertise-routes=192.168.16.0/24 --shields-up --accept-dns=false

# Linux server (or macOS; mac needs sudo for CLI flags)
sudo tailscale up --authkey=tskey-client-with-tag --accept-routes --advertise-tags=tag:trusted-client --shields-up --ssh=false
```

4) ACL policy (Admin Console → Access controls):
```json
{
  "acls": [
    {
      "action": "accept",
      "users": ["tag:trusted-client"],
      "ports": ["192.168.16.0/24:*"]
    }
  ]
}
```

This allows only devices tagged `tag:trusted-client` to initiate to the camera subnet. The Pi (tagged `tag:subnet-router`) can’t initiate to your clients; and with `--shields-up` your clients don’t accept inbound anyway.


