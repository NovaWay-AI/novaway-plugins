#!/usr/bin/env python3
"""Build a deterministic release archive for a first-party plugin."""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from datetime import datetime
from pathlib import Path

root = Path(__file__).resolve().parents[1]
package_name = sys.argv[1] if len(sys.argv) >= 2 else ""
if len(sys.argv) not in (2, 3) or (len(sys.argv) == 3 and sys.argv[2] != "--stored"):
    raise SystemExit("usage: build_plugin.py <package-directory-name> [--stored]")
use_stored = len(sys.argv) == 3
package_dir = root / "plugins" / package_name
manifest_path = package_dir / "plugin.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
version = manifest.get("version")
if not isinstance(version, str) or not version:
    raise SystemExit("plugin manifest must contain version")
if not package_dir.is_dir():
    raise SystemExit(f"plugin directory does not exist: {package_dir}")

out = root / "dist"
out.mkdir(exist_ok=True)
archive = out / f"{package_name}-{version}.zip"
files = sorted(
    (path for path in package_dir.rglob("*") if path.is_file()),
    key=lambda path: path.relative_to(package_dir).as_posix(),
)
compression = zipfile.ZIP_STORED if use_stored else zipfile.ZIP_DEFLATED
with zipfile.ZipFile(archive, "w", compression) as handle:
    for path in files:
        relative = path.relative_to(package_dir).as_posix()
        info = zipfile.ZipInfo(relative, date_time=(2020, 1, 1, 0, 0, 0))
        info.create_system = 3
        info.compress_type = compression
        info.external_attr = 0o100644 << 16
        payload = path.read_bytes()
        # Keep release bytes identical on Windows and Linux checkouts. Git may
        # materialize text files with different newline conventions, but the
        # catalog digest must describe one immutable archive independent of the
        # machine that built it. Text files (no NUL bytes) get CRLF->LF regardless
        # of extension (covers .dot, extensionless shell scripts, etc.); binary
        # assets are left untouched.
        if b"\0" not in payload:
            payload = payload.replace(b"\r\n", b"\n")
        handle.writestr(info, payload)

digest = hashlib.sha256(archive.read_bytes()).hexdigest()
size = archive.stat().st_size
print(json.dumps({"packageId": sys.argv[1], "version": version, "asset": archive.name, "sha256": digest, "size": size}, indent=2))
