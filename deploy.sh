#!/bin/bash
# Quality Reflections Glasswork — FTP Deploy Script
# Builds the site and uploads dist/ to hosting via FTP

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Validate required vars
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo "Error: FTP_HOST, FTP_USER, and FTP_PASS must be set in .env"
  exit 1
fi

FTP_PATH="${FTP_PATH:-/public_html}"

echo "Building site..."
npm run build

echo "Deploying to $FTP_HOST:$FTP_PATH..."

# Upload dist/ contents via curl FTP
cd dist
find . -type f | while read file; do
  dir=$(dirname "$file")
  echo "  Uploading: $file"
  curl -s --ftp-create-dirs \
    -T "$file" \
    "ftp://$FTP_USER:$FTP_PASS@$FTP_HOST$FTP_PATH/$file"
done
cd ..

echo "Deploy complete!"
