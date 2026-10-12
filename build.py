#!/usr/bin/env python3
"""Generate the static website from pages/*.md with Python-Markdown."""

from __future__ import annotations

from datetime import date
from html import escape
from hashlib import sha256
from pathlib import Path
import sys
import re

try:
    import markdown
except ImportError:
    sys.exit("Install the build dependency first: python3 -m pip install -r requirements.txt")

ROOT = Path(__file__).resolve().parent
PAGES_DIR = ROOT / "pages"
NAV = [("index.html", "Home"), ("teaching.html", "Teaching"), ("cv.html", "CV")]


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


def monomial_lattice() -> str:
    """The Hasse diagram of squarefree monomials in three variables."""
    nodes = {
        0: (135, 238, "1"),
        1: (40, 166, "x"), 2: (135, 166, "y"), 4: (230, 166, "z"),
        3: (40, 94, "xy"), 5: (135, 94, "xz"), 6: (230, 94, "yz"),
        7: (135, 22, "xyz"),
    }
    parts = ['<svg viewBox="0 0 270 260" role="img" aria-labelledby="lattice-title lattice-description">',
             '<title id="lattice-title">The Boolean lattice B₃</title>',
             '<desc id="lattice-description">A Hasse diagram with 1 at the bottom; x, y, z above it; '
             'xy, xz, yz next; and xyz at the top. Each upward edge multiplies a monomial by one variable.</desc>']
    for mask, (x, y, _) in nodes.items():
        for bit in (1, 2, 4):
            if not mask & bit:
                target_x, target_y, _ = nodes[mask | bit]
                parts.append(f'<line class="lattice-edge" x1="{x}" y1="{y}" x2="{target_x}" y2="{target_y}"/>')
    for mask, (x, y, label) in nodes.items():
        endpoint = ' lattice-endpoint' if mask in (0, 7) else ''
        parts.append(f'<g class="lattice-node{endpoint}"><circle cx="{x}" cy="{y}" r="20"/>'
                     f'<text x="{x}" y="{y}" dy=".35em" text-anchor="middle">{label}</text></g>')
    return "".join(parts) + '</svg>'


def render_sections(body: str, stem: str) -> str:
    chunks = re.split(r"<h2>(.*?)</h2>", body, flags=re.S)
    sections = []
    if chunks[0].strip():
        sections.append(("Overview", chunks[0]))
    sections.extend(zip(chunks[1::2], chunks[2::2]))
    rendered = []
    for heading, content in sections:
        key = re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", heading).lower()).strip("-")
        if key in {"activities", "conferences-and-summer-schools"}:
            content = re.sub(r"<li>(.*?) \(([^()]*(?:19|20)\d{2})\)</li>",
                             r'<li><span class="entry-date">\2</span><span class="entry-detail">\1</span></li>', content, flags=re.S)
        if stem == "cv":
            def cv_entry(match: re.Match) -> str:
                period, separator, heading = match[1].partition(": ")
                if not separator:
                    return match[0]
                return (f'<article class="cv-entry"><p class="entry-date">{period}</p>'
                        f'<div class="cv-entry-detail"><h3>{heading}</h3>{match[2]}</div></article>')
            content = re.sub(r"<h3>(.*?)</h3>(.*?)(?=<h3>|$)", cv_entry, content, flags=re.S)
        if key == "overview" and stem in {"cv", "teaching"}:
            rendered.append(f'<div class="page-introduction">{content}</div>')
            continue
        section_number = sum('<section ' in item for item in rendered) + 1
        rendered.append(f'<section class="content-panel panel-{key}" aria-labelledby="{key}">'
                        f'<h2 id="{key}"><span class="section-number">{section_number:02d} — </span>{heading}</h2>{content}</section>')
    return "\n".join(rendered)


def render_page(metadata: dict[str, str], stem: str, body: str) -> str:
    css_version = sha256((ROOT / "style.css").read_bytes()).hexdigest()[:12]
    theme_version = sha256((ROOT / "theme.js").read_bytes()).hexdigest()[:12]
    title = escape(metadata.get("title", stem.replace("-", " ").capitalize()))
    lang = escape(metadata.get("lang", "en"), quote=True)
    subtitle = escape(metadata.get("subtitle", "Teaching · OvGU Magdeburg" if stem == "teaching" else ""))
    title_html = title.replace("Niclas Niederdrenk", "Niclas<br>Niederdrenk")
    nav = "\n".join(
        f'<a href="{href}"' + (' class="current" aria-current="page"' if href == f"{stem}.html" else "")
        + f'>{escape(label)}</a>' for href, label in NAV
    )
    intro = {
        "index": "Commutative algebra, computational algebra, and combinatorics.",
        "teaching": "Teaching activities and courses at Otto von Guericke University Magdeburg.",
        "cv": "Education, experience, and qualifications.",
        "legal": "Website operator and contact information.",
    }.get(stem, "")
    hero_figure = '''<figure class="monomial-art">
            <img src="figures/ilovemonomialideals.png" alt="I love monomial ideals — with a glowing red heart." width="1536" height="1024">
        </figure>''' if stem == "index" else f'''<figure class="monomial-lattice">
            {monomial_lattice()}
            <figcaption>The Boolean lattice B₃.<br>Squarefree monomials, ordered by divisibility.</figcaption>
        </figure>''' if stem == "teaching" else ""
    hero_contact = '<a class="hero-contact" href="mailto:niclas.niederdrenk@ovgu.de">niclas.niederdrenk@ovgu.de</a>' if stem == "index" else ""
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="theme.js?v={theme_version}"></script>
    <link rel="stylesheet" href="style.css?v={css_version}">
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
            <p class="hero-description">{intro}</p>{hero_contact}
        </div>
        {hero_figure}
    </header>
    <main id="content" class="content-grid">
{render_sections(body, stem)}
    </main>
    <footer>
        <p>© {date.today().year} Niclas Niederdrenk</p>
        <a href="legal.html"{' aria-current="page"' if stem == 'legal' else ''}>Legal notice</a>
        <button class="theme-toggle" type="button" role="switch" aria-label="Dark mode" aria-checked="false" hidden>
            <span>Dark mode</span><span class="theme-track" aria-hidden="true"></span>
        </button>
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
