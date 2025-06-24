#!/bin/sh
# Minimal entrypoint for hardened NGINX container
set -eu

# Ensure permissions are correct (defense-in-depth)
chown -R appuser:appgroup /usr/share/nginx/html
chmod -R 0755 /usr/share/nginx/html

exec "$@"
