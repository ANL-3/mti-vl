#!/bin/bash

# This script removes Firebase SDK references from all HTML files

# List of HTML files to update
FILES=(
  "pages/admin.html"
  "pages/ads.html"
  "pages/settings.html"
  "pages/trade-calculator.html"
  "pages/value-list.html"
  "pages/verify-email.html"
)

# The pattern to remove
PATTERN='<!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>'

# Loop through each file and remove the pattern
for file in "${FILES[@]}"; do
  echo "Updating $file..."
  sed -i "s#${PATTERN}##g" "$file"
  # Check if successful
  if [ $? -eq 0 ]; then
    echo "✓ Updated $file successfully"
  else
    echo "✗ Failed to update $file"
  fi
done

echo "All files updated!"