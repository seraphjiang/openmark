#!/usr/bin/env python3
"""Post-build: ASCII-escape all non-ASCII chars in dist JS bundles.

markdown-it and mermaid bundle Uint16Array literals with Unicode chars that
trigger Chrome Web Store false-positive UTF-8 encoding errors. Converting to
\\uXXXX escapes keeps files functionally identical but pure ASCII.
"""
import os

dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")

for filename in ["content.js"]:
    path = os.path.join(dist, filename)
    if not os.path.exists(path):
        print(f"ascii-escape: {filename} not found, skipping")
        continue
    data = open(path, "rb").read()
    text = data.decode("utf-8")
    result = []
    for ch in text:
        cp = ord(ch)
        if cp > 127:
            result.append(f"\\u{cp:04X}")
        else:
            result.append(ch)
    new_bytes = "".join(result).encode("ascii")
    open(path, "wb").write(new_bytes)
    print(f"ascii-escape: {filename} {len(data)//1024}KB -> {len(new_bytes)//1024}KB (pure ASCII)")
