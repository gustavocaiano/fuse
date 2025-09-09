git pull

cd /opt/cam-parser/client
npm ci
npm run build
sudo rsync -a dist/ /var/www/cam-parser/
sudo systemctl reload nginx

cd /opt/cam-parser/server
npm ci
npm run build
sudo systemctl restart cam-parser
journalctl -u cam-parser -n 50 --no-pager | cat