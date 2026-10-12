#!/usr/bin/env python3
"""Generate the static website from pages/*.md with Python-Markdown."""

from __future__ import annotations

from datetime import date
from html import escape
from pathlib import Path
import sys
import re

try:
    import markdown
except ImportError:
    sys.exit("Install the build dependency first: python3 -m pip install -r requirements.txt")

ROOT = Path(__file__).resolve().parent
PAGES_DIR = ROOT / "pages"
NAV = [("index.html", "Home"), ("teaching.html", "Teaching")]


def read_page(path: Path) -> tuple[dict[str, str], str]:
    """Read optional frontmatter containing one key: value pair per line."""
    source = path.read_text(encoding="utf-8")
    lines = source.splitlines()
    if not lines or lines[0] != "---":
        return {}, source
    try:
        end = lines.index("---", 1)
    except ValueError:
        raise ValueError(f"{path.name}: missing closing frontmatter delimiter") from None
    metadata = {}
    for line in lines[1:end]:
        if not line.strip():
            continue
        key, separator, value = line.partition(":")
        if not separator or key.strip() not in {"title", "subtitle", "lang"}:
            raise ValueError(f"{path.name}: invalid metadata line: {line}")
        metadata[key.strip()] = value.strip()
    return metadata, "\n".join(lines[end + 1:])


def staircase() -> str:
    """A decorative staircase of standard monomials, drawn as a small SVG."""
    cells = []
    for row in range(6):
        for column in range(6):
            boundary = column == row - 1
            fill = "#101e30" if boundary else "#293fc4" if column >= row else "#ffffff"
            cells.append(f'<rect x="{column * 37}" y="{row * 37}" width="35" height="35" fill="{fill}" stroke="#dce0eb" stroke-width=".6"/>')
    return '<svg viewBox="0 0 222 222" aria-hidden="true">' + "".join(cells) + '</svg>'


def render_sections(body: str, stem: str) -> str:
    chunks = re.split(r"<h2>(.*?)</h2>", body, flags=re.S)
    sections = []
    if chunks[0].strip():
        sections.append(("Courses" if stem == "teaching" else "Overview", chunks[0]))
    sections.extend(zip(chunks[1::2], chunks[2::2]))
    rendered = []
    for number, (heading, content) in enumerate(sections, 1):
        key = re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", heading).lower()).strip("-")
        if key == "activities":
            content = re.sub(r"<li>(.*?) \(([^()]*(?:19|20)\d{2})\)</li>",
                             r'<li><span class="entry-date">\2</span><span class="entry-detail">\1</span></li>', content, flags=re.S)
        if stem == "teaching":
            content = re.sub(r"<li>([^<:]+): (.*?)</li>",
                             r'<li><span class="entry-date">\1</span><span class="entry-detail">\2</span></li>', content, flags=re.S)
        rendered.append(f'<section class="content-panel panel-{key}" aria-labelledby="{key}">'
                        f'<h2 id="{key}"><span class="section-number">{number:02d} — </span>{heading}</h2>{content}</section>')
    return "\n".join(rendered)


def render_page(metadata: dict[str, str], stem: str, body: str) -> str:
    title = escape(metadata.get("title", stem.replace("-", " ").capitalize()))
    lang = escape(metadata.get("lang", "en"), quote=True)
    subtitle = escape(metadata.get("subtitle", "Teaching · OvGU Magdeburg" if stem == "teaching" else ""))
    title_html = title.replace("Niclas Niederdrenk", "Niclas<br>Niederdrenk")
    nav = "\n".join(
        f'<a href="{href}"' + (' class="current" aria-current="page"' if href == f"{stem}.html" else "")
        + f'>{escape(label)}</a>' for href, label in NAV
    )
    intro = "Commutative algebra, computational algebra, and combinatorics." if stem == "index" else "Teaching activities and courses at Otto von Guericke University Magdeburg."
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body class="page-{escape(stem)}">
<a class="skip-link" href="#content">Skip to content</a>
<div class="container">
    <nav class="site-nav" aria-label="Main navigation">
        <a class="wordmark" href="index.html">n.niederdrenk<span> / </span></a>
        <div class="nav-links">{nav}</div>
    </nav>
    <header class="hero">
        <div class="hero-copy">
            <p class="eyebrow">{subtitle}</p>
            <h1>{title_html}</h1>
            <p class="hero-description">{intro}</p>
        </div>
        <figure class="staircase">
            {staircase()}
            <figcaption>Combinatorial structure.<br>A staircase of monomials.</figcaption>
        </figure>
    </header>
    <main id="content" class="content-grid">
{render_sections(body, stem)}
    </main>
    <footer>
        <p>© {date.today().year} Niclas Niederdrenk</p>
        <a href="#">Back to top <span aria-hidden="true">↗</span></a>
    </footer>
</div>
</body>
</html>
'''


def main() -> int:
    # Render all sources before writing so invalid metadata leaves outputs intact.
    outputs = []
    for path in sorted(PAGES_DIR.glob("*.md")):
        metadata, source = read_page(path)
        body = markdown.markdown(source, extensions=["extra", "sane_lists"], output_format="html")
        outputs.append((ROOT / f"{path.stem}.html", render_page(metadata, path.stem, body)))
    if not outputs:
        sys.exit("No Markdown pages found in pages/.")
    for target, html in outputs:
        target.write_text(html, encoding="utf-8")
        print(f"Wrote {target.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
