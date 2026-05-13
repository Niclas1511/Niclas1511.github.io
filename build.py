#!/usr/bin/env python3
"""Build the website from typst sources.

- ``pages/*.typ``  → static pages (one HTML output each at site root).
                    Every .typ file is auto-discovered. Title and language
                    can be set via optional frontmatter comments at the top
                    of the file, e.g.::

                        // title: My Page
                        // lang: en

                    Defaults: title = filename stem (capitalized), lang = en.

- ``posts/*.typ``  → aggregated into ``blog.html`` (sorted newest first).

The site's top navigation is controlled by the ``NAV`` list below.

Math (``$...$``) is rendered as inline SVG via typst, because typst's HTML
export does not yet support equations natively
(see github.com/typst/typst/issues/5512).

Requires typst >= 0.13 on ``$PATH`` (HTML export via ``--features html``).
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES_DIR = ROOT / "pages"
POSTS_DIR = ROOT / "posts"

# Aggregated blog page built from posts/*.typ
BLOG = {"title": "Blog", "lang": "de"}

# Top navigation (shown on every page). Order matters; pages not listed here
# still get built but won't appear in the menu.
NAV = [
    ("index.html", "Home"),
    ("teaching.html", "Teaching"),
    ("blog.html", "Blog"),
]

FILENAME_RE = re.compile(r"^(\d{2})(\d{2})(\d{2})(?:-([a-z0-9-]+))?\.typ$")
BODY_RE = re.compile(r"<body[^>]*>(.*)</body>", re.DOTALL | re.IGNORECASE)
MATH_RE = re.compile(r"(?<!\\)\$(.+?)(?<!\\)\$", re.DOTALL)
SVG_RE = re.compile(r"<svg[^>]*>.*?</svg>", re.DOTALL)
METADATA_RE = re.compile(r"^//\s*([a-z]+)\s*:\s*(.+?)\s*$")


# ─── filename / math helpers ─────────────────────────────────────────────────

def parse_filename(name: str) -> tuple[date, str] | None:
    m = FILENAME_RE.match(name)
    if not m:
        return None
    yy, mm, dd, slug = m.groups()
    return date(2000 + int(yy), int(mm), int(dd)), slug or f"post-{yy}{mm}{dd}"


def is_display_math(content: str) -> bool:
    return bool(content) and content[0].isspace() and content[-1].isspace()


def compile_math_to_svg(content: str, work_dir: Path) -> str:
    snippet_typ = work_dir / "snippet.typ"
    snippet_svg = work_dir / "snippet.svg"
    snippet_typ.write_text(
        "#set page(width: auto, height: auto, margin: 2pt, fill: none)\n"
        f"${content}$\n",
        encoding="utf-8",
    )
    result = subprocess.run(
        ["typst", "compile", "--root", str(ROOT),
         str(snippet_typ), str(snippet_svg)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(f"\nFailed to render math snippet:\n  ${content}$\n")
        sys.stderr.write(result.stderr)
        sys.exit(1)
    svg = snippet_svg.read_text(encoding="utf-8")
    m = SVG_RE.search(svg)
    return m.group(0) if m else svg


def preprocess_math(source: str, work_dir: Path) -> tuple[str, list[tuple[bool, str]]]:
    svgs: list[tuple[bool, str]] = []

    def replace(m: re.Match[str]) -> str:
        content = m.group(1)
        display = is_display_math(content)
        svg = compile_math_to_svg(content, work_dir)
        idx = len(svgs)
        svgs.append((display, svg))
        placeholder = f"XMATHPLACEHOLDER{idx}XEND"
        return f"\n\n{placeholder}\n\n" if display else placeholder

    return MATH_RE.sub(replace, source), svgs


def inject_svgs(html: str, svgs: list[tuple[bool, str]]) -> str:
    for idx, (display, svg) in enumerate(svgs):
        ph = f"XMATHPLACEHOLDER{idx}XEND"
        if display:
            wrap = f'<div class="math-display">{svg}</div>'
            pat = re.compile(r"<p[^>]*>\s*" + re.escape(ph) + r"\s*</p>", re.DOTALL)
            new_html, count = pat.subn(wrap, html)
            html = new_html if count else html.replace(ph, wrap)
        else:
            html = html.replace(ph, f'<span class="math-inline">{svg}</span>')
    return html


def extract_body(html: str) -> str:
    m = BODY_RE.search(html)
    return (m.group(1) if m else html).strip()


def compile_to_body(typ_path: Path, work_dir: Path, out_html: Path) -> str:
    """Compile a typst file (with math preprocessing) and return body HTML."""
    source = typ_path.read_text(encoding="utf-8")
    modified, svgs = preprocess_math(source, work_dir)

    tmp_typ = typ_path.with_name(f".tmp-{typ_path.name}")
    tmp_typ.write_text(modified, encoding="utf-8")
    try:
        result = subprocess.run(
            ["typst", "compile", "--root", str(ROOT), "--features", "html",
             str(tmp_typ), str(out_html)],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            sys.stderr.write(f"\nFailed to compile {typ_path.relative_to(ROOT)}:\n")
            sys.stderr.write(result.stderr)
            sys.exit(1)
    finally:
        tmp_typ.unlink(missing_ok=True)

    html = out_html.read_text(encoding="utf-8")
    return extract_body(inject_svgs(html, svgs))


# ─── output rendering ────────────────────────────────────────────────────────

def render_nav(current_href: str) -> str:
    return "\n        ".join(
        f'<a href="{href}" class="current">{label}</a>'
        if href == current_href
        else f'<a href="{href}">{label}</a>'
        for href, label in NAV
    )


def render_page(title: str, lang: str, current_href: str, body: str,
                subtitle: str = "") -> str:
    subtitle_html = f'\n        <p class="subtitle">{subtitle}</p>' if subtitle else ""
    year = date.today().year
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<div class="container">
    <nav class="site-nav">
        {render_nav(current_href)}
    </nav>
    <header>
        <h1>{title}</h1>{subtitle_html}
    </header>

{body}

    <footer>
        <p>© {year} Niclas Niederdrenk</p>
    </footer>
</div>

</body>
</html>
"""


def format_date(d: date) -> str:
    return d.strftime("%B %-d, %Y")


# ─── build steps ─────────────────────────────────────────────────────────────

def read_metadata(typ_path: Path) -> dict[str, str]:
    """Parse leading ``// key: value`` lines from a typst file."""
    metadata: dict[str, str] = {}
    for line in typ_path.read_text(encoding="utf-8").splitlines():
        m = METADATA_RE.match(line)
        if m:
            metadata[m.group(1)] = m.group(2)
        elif line.strip():
            break
    return metadata


def build_pages(tmp_path: Path, math_dir: Path) -> None:
    if not PAGES_DIR.is_dir():
        return
    for typ_path in sorted(PAGES_DIR.glob("*.typ")):
        meta = read_metadata(typ_path)
        stem = typ_path.stem
        title = meta.get("title", stem.replace("-", " ").capitalize())
        lang = meta.get("lang", "en")
        subtitle = meta.get("subtitle", "")
        out_html = tmp_path / f"page-{stem}.html"
        body = compile_to_body(typ_path, math_dir, out_html)
        target = ROOT / f"{stem}.html"
        target.write_text(
            render_page(title, lang, target.name, body, subtitle=subtitle),
            encoding="utf-8",
        )
        print(f"Wrote {target.relative_to(ROOT)}")


def build_blog(tmp_path: Path, math_dir: Path) -> None:
    posts: list[tuple[date, str, str]] = []
    skipped: list[str] = []
    for typ in sorted(POSTS_DIR.glob("*.typ")):
        parsed = parse_filename(typ.name)
        if parsed is None:
            skipped.append(typ.name)
            continue
        post_date, slug = parsed
        out_html = tmp_path / f"post-{slug}.html"
        article_body = compile_to_body(typ, math_dir, out_html)
        posts.append((post_date, slug, article_body))

    posts.sort(key=lambda p: p[0], reverse=True)

    articles = "\n".join(
        f'    <article id="{slug}">\n'
        f'        <p class="post-date">{format_date(d)}</p>\n'
        f'        {ab}\n'
        f'    </article>'
        for d, slug, ab in posts
    )

    target = ROOT / "blog.html"
    target.write_text(
        render_page(BLOG["title"], BLOG["lang"], target.name, articles),
        encoding="utf-8",
    )
    print(f"Wrote {target.relative_to(ROOT)} with {len(posts)} post(s).")
    for n in skipped:
        print(f"  Skipped (bad filename): {n}")


def main() -> int:
    if shutil.which("typst") is None:
        sys.stderr.write(
            "typst not found in $PATH. Install it (e.g. `sudo snap install typst`) "
            "and try again.\n"
        )
        return 1

    with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
        tmp_path = Path(tmp)
        math_dir = tmp_path / "math"
        math_dir.mkdir()
        build_pages(tmp_path, math_dir)
        build_blog(tmp_path, math_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
