#!/usr/bin/env python3
"""Post-build: ASCII-escape all non-ASCII chars in dist/content.js.

markdown-it bundles Uint16Array literals with Unicode chars that trigger
Chrome Web Store false-positive UTF-8 encoding errors. Converting to
\\uXXXX escapes keeps content.js functionally identical but pure ASCII.
"""
import sys
import os

path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist", "content.js")
data = open(path, "rb").read()
text = data.decode("utf-8")

result = []
for ch in text:
    cp = ord(ch)
    if cp > 127:
        result.append(f"\\u{cp:04X}")
    else:
        result.append(ch)

new_text = "".join(result)
new_bytes = new_text.encode("ascii")
open(path, "wb").write(new_bytes)
print(f"ascii-escape-content: {len(data)//1024}KB -> {len(new_bytes)//1024}KB (pure ASCII)")
