## Changing the recordings disk

This guide shows how to add a new disk and point the server recordings to it, safely and persistently across reboots. Examples assume Ubuntu/Debian and an NTFS-formatted disk labeled `cam-parser-recordings`. Adjust for your environment as needed.

### 1) Identify the new disk/partition
```bash
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT,LABEL
# Example output:
# sdb
# └─sdb2  894G  ntfs  (label: cam-parser-recordings)
```

If the disk is new/empty, partition and format (WARNING: destroys data):
```bash
sudo parted /dev/sdX --script mklabel gpt mkpart primary ext4 0% 100%
sudo mkfs.ext4 -L cam-parser-recordings /dev/sdX1
```

### 2) Create the mount point and fstab entry
```bash
sudo mkdir -p /mnt/cam-recordings

# NTFS example (uid/gid 33 is www-data). Add nofail to avoid blocking boot if absent.
echo 'LABEL=cam-parser-recordings /mnt/cam-recordings ntfs-3g uid=33,gid=33,umask=0027,windows_names,nofail 0 0' | sudo tee -a /etc/fstab

# For ext4 instead:
# echo 'LABEL=cam-parser-recordings /mnt/cam-recordings ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab

sudo mount -a
df -h | grep cam-recordings
```

### 3) Update the app configuration to use the new path
Set `RECORDINGS_DIR` to the mount point in the server env file and restart the service.
```bash
sudo sed -i '/^RECORDINGS_DIR=/d' /etc/cam-parser.env
echo 'RECORDINGS_DIR=/mnt/cam-recordings' | sudo tee -a /etc/cam-parser.env
sudo systemctl restart cam-parser
```

### 4) (Optional) Migrate existing recordings
```bash
sudo rsync -a /var/lib/cam-parser/recordings/ /mnt/cam-recordings/
```

### 5) Verify
```bash
# Service running
systemctl is-active cam-parser && systemctl status cam-parser --no-pager

# Directory ownership (should be www-data)
ls -ld /mnt/cam-recordings

# Toggle recording for a camera in the UI and confirm files appear
ls -R /mnt/cam-recordings | head -50
```

Notes
- On NTFS, permissions are controlled by the mount options (uid/gid/umask), not chmod/chown.
- Keep ownership as `www-data:www-data` so the service can write. Add your user to `www-data` if you need shell access: `sudo usermod -aG www-data $USER`.

