#!/bin/bash
# Render every page in jobs.txt to brand/ads/<name>.png and print each page's layout report.
set -uo pipefail
cd "$(dirname "$0")"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
python3 build.py
fail=0
while read -r name w h; do
  [ -z "$name" ] && continue
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=$w,$h \
    --screenshot="../$name.png" "file://$PWD/$name.html" >/dev/null 2>&1 || { echo "RENDER FAIL $name"; fail=1; }
  rep=$("$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=$w,$h --dump-dom "file://$PWD/$name.html" 2>/dev/null | grep -o 'data-report="[^"]*"')
  echo "$name $rep"
  case "$rep" in *issues=none*) ;; *) fail=1;; esac
done < jobs.txt
exit $fail
