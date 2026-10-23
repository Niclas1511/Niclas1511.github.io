#!/usr/bin/env python3
"""Generate the static website from pages/*.md with Python-Markdown."""

from __future__ import annotations

from datetime import date
from html import escape
from hashlib import sha256
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.error import URLError
from urllib.request import urlopen
import sys
import re

try:
    import markdown
except ImportError:
    sys.exit("Install the build dependency first: python3 -m pip install -r requirements.txt")

ROOT = Path(__file__).resolve().parent
PAGES_DIR = ROOT / "pages"
NAV = [("index.html", "Home"), ("notes.html", "Notes & Theses"), ("teaching.html", "Teaching"), ("cv.html", "CV"), ("memory.html", "Memory"), ("runner.html", "Math Run")]


def download_note() -> None:
    """Validate the external note before atomically replacing the local copy."""
    url = "https://raw.githubusercontent.com/Niclas1511/polynomials-without-positive-roots/main/noposroots.pdf"
    target = ROOT / "documents" / "noposroots.pdf"
    temporary = None
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        with urlopen(url, timeout=30) as response:
            if response.status != 200:
                raise ValueError(f"unexpected HTTP status {response.status}")
            with NamedTemporaryFile(dir=target.parent, suffix=".pdf.tmp", delete=False) as output:
                temporary = Path(output.name)
                header = response.read(1024)
                if not header.startswith(b"%PDF-"):
                    raise ValueError("download is not a PDF (missing PDF header)")
                output.write(header)
                while chunk := response.read(64 * 1024):
                    output.write(chunk)
        with temporary.open("rb") as downloaded:
            downloaded.seek(max(0, temporary.stat().st_size - 1024))
            if b"%%EOF" not in downloaded.read():
                raise ValueError("downloaded PDF appears incomplete (missing EOF marker)")
        temporary.chmod(0o644)
        temporary.replace(target)
    except (OSError, URLError, ValueError) as error:
        sys.exit(f"Could not download mathematical note from {url}: {error}")
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    print("Downloaded documents/noposroots.pdf")


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
    if stem in {"memory", "runner"}:
        return body
    chunks = re.split(r"<h2>(.*?)</h2>", body, flags=re.S)
    sections = []
    if chunks[0].strip():
        sections.append(("Overview", chunks[0]))
    sections.extend(zip(chunks[1::2], chunks[2::2]))
    rendered = []
    for heading, content in sections:
        key = re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", heading).lower()).strip("-")
        if key in {"activities", "conferences-and-summer-schools"}:
            content = re.sub(r"<li>(<a .*?</a>), (.*?) \(([^()]*(?:19|20)\d{2})\)</li>",
                             r'<li><span class="entry-date">\3</span><span class="entry-detail">\1<span class="entry-location">\2</span></span></li>', content, flags=re.S)
        if stem == "teaching":
            content = re.sub(r'<em>(Prof\. .*?)</em>', r'<span class="course-instructor">\1</span>', content)
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
        aliases = {
            "education": ["educational-background", "international-experience"],
            "experience": ["voluntary-service", "work-experience"],
            "skills": ["additional-qualifications"],
        }.get(key, []) if stem == "cv" else []
        alias_html = "".join(f'<span id="{alias}" class="section-anchor" aria-hidden="true"></span>' for alias in aliases)
        rendered.append(f'<section class="content-panel panel-{key}" aria-labelledby="{key}">'
                        f'{alias_html}<h2 id="{key}">{heading}</h2>{content}</section>')
    return "\n".join(rendered)


def render_page(metadata: dict[str, str], stem: str, body: str) -> str:
    css_version = sha256((ROOT / "style.css").read_bytes()).hexdigest()[:12]
    theme_version = sha256((ROOT / "theme.js").read_bytes()).hexdigest()[:12]
    title = escape(metadata.get("title", stem.replace("-", " ").capitalize()))
    lang = escape(metadata.get("lang", "en"), quote=True)
    subtitle = escape(metadata.get("subtitle", "Teaching · OvGU Magdeburg" if stem == "teaching" else ""))
    title_html = title.replace("Niclas Niederdrenk", "Niclas<br>Niederdrenk")
    prefix = "../" if stem == "masters-thesis" else ""
    nav = "\n".join(
        f'<a href="{prefix}{href}"' + (' class="current" aria-current="page"' if href == f"{stem}.html" else "")
        + f'>{escape(label)}</a>' for href, label in NAV
    )
    intro = {
        "index": "Commutative algebra, computational algebra, and combinatorics.",
        "teaching": "Teaching activities and courses at Otto von Guericke University Magdeburg.",
        "cv": "Education, experience, and qualifications.",
        "legal": "Website operator and contact information.",
    }.get(stem, "")
    hero_figure = '''<figure class="monomial-art">
            <img class="monomial-art-light" src="figures/ilovemonomialideals.png" alt="I love monomial ideals — with a glowing red heart." width="1536" height="1024">
            <img class="monomial-art-dark" src="figures/ilovemonomialideals-dark.svg" alt="I love monomial ideals — with a glowing red heart." width="1536" height="1024">
        </figure>''' if stem == "index" else f'''<figure class="monomial-lattice">
            {monomial_lattice()}
            <figcaption>The Boolean lattice B₃.<br>Squarefree monomials, ordered by divisibility.</figcaption>
        </figure>''' if stem == "teaching" else ""
    hero_contact = '''<div class="hero-links">
                <a class="hero-contact" href="mailto:niclas.niederdrenk@ovgu.de">niclas.niederdrenk@ovgu.de</a>
                <a class="github-link" href="https://github.com/Niclas1511" rel="me">
                    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
                    <span>GitHub</span>
                </a>
            </div>''' if stem == "index" else ""
    eyebrow = f'<p class="eyebrow">{subtitle}</p>' if subtitle else ""
    hero_description = f'<p class="hero-description">{intro}</p>' if intro else ""
    scholarly_metadata = ""
    if stem == "masters-thesis":
        scholarly_metadata = '''
    <link rel="canonical" href="https://niederdrenk.de/masters-thesis/">
    <meta name="description" content="Gemischte Binomkantenideale: Master's thesis by Niclas Niederdrenk, Otto von Guericke University Magdeburg, 2025. Summary, citation and PDF.">
    <meta name="citation_title" content="Gemischte Binomkantenideale">
    <meta name="citation_author" content="Niederdrenk, Niclas">
    <meta name="citation_publication_date" content="2025/02/20">
    <meta name="citation_dissertation_institution" content="Otto-von-Guericke-Universität Magdeburg">
    <meta name="citation_pdf_url" content="https://niederdrenk.de/documents/2025-Niederdrenk-Gemischte-Binomkantenideale.pdf">
    <meta name="citation_language" content="de">'''
    memory_assets = ''
    if stem == "memory":
        memory_version = sha256((ROOT / "memory.js").read_bytes()).hexdigest()[:12]
        memory_css_version = sha256((ROOT / "memory.css").read_bytes()).hexdigest()[:12]
        memory_assets = ('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.19.0/dist/katex.min.css" '
                         'integrity="sha384-3rdsX6e5mueWyoweR9NIVmtEsUkokpBT/0ALqKKIBMr9j4qhHkaIkAcGgsE6uVlp" crossorigin="anonymous">'
                         '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.19.0/dist/katex.min.js" '
                         'integrity="sha384-QFFtAGzvvj+bfgCGxXJlNZZR1nXEZgvG8tDLCCY1F19xl20WlfTYgguB4VcNdxYk" crossorigin="anonymous"></script>'
                         f'<link rel="stylesheet" href="memory.css?v={memory_css_version}">'
                         f'<script src="memory.js?v={memory_version}" defer></script>')
    if stem == "runner":
        memory_assets = "\n".join(
            f'<link rel="stylesheet" href="runner.css?v={sha256((ROOT / "runner.css").read_bytes()).hexdigest()[:12]}">'
            if asset == "runner.css" else
            f'<script defer src="{asset}?v={sha256((ROOT / asset).read_bytes()).hexdigest()[:12]}"></script>'
            for asset in ("runner.css", "runner-engine.js", "runner-music.js", "runner-sound.js", "runner.js")
        )
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>{scholarly_metadata}
    <script src="{prefix}theme.js?v={theme_version}"></script>
    <link rel="stylesheet" href="{prefix}style.css?v={css_version}">
{memory_assets}
</head>
<body class="page-{escape(stem)}">
<a class="skip-link" href="#content">Skip to content</a>
<div class="container">
    <nav class="site-nav" aria-label="Main navigation">
        <a class="wordmark" href="{prefix}index.html">Niclas Niederdrenk</a>
        <div class="nav-links">{nav}</div>
    </nav>
    <header class="hero">
        <div class="hero-copy">
{('            ' + eyebrow) if eyebrow else ''}
            <h1>{title_html}</h1>
{hero_description}{hero_contact}
        </div>
{('        ' + hero_figure) if hero_figure else ''}
    </header>
    <main id="content" class="content-grid">
{render_sections(body, stem)}
    </main>
    <footer>
        <p>© {date.today().year} Niclas Niederdrenk</p>
        <a href="{prefix}legal.html"{' aria-current="page"' if stem == 'legal' else ''}>Legal notice</a>
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
        body = markdown.markdown(source, extensions=["extra", "sane_lists", "attr_list"], output_format="html")
        target = ROOT / "masters-thesis" / "index.html" if path.stem == "masters-thesis" else ROOT / f"{path.stem}.html"
        outputs.append((target, render_page(metadata, path.stem, body)))
    if not outputs:
        sys.exit("No Markdown pages found in pages/.")
    # Download before publishing HTML; the remaining steps only write HTML files.
    download_note()
    for target, html in outputs:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(html, encoding="utf-8")
        print(f"Wrote {target.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
