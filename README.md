# Niclas Niederdrenk

Source for my personal website, https://niederdrenk.de, hosted via GitHub Pages.

## Edit content

All page content lives in Markdown files:

- `pages/index.md`: profile, travels/conferences (Activities), and contact details.
- `pages/teaching.md`: teaching activities.
- `pages/legal.md`: legal notice and operator contact details, linked in the footer of every page.
- `pages/masters-thesis.md`: permanent thesis landing page at `/masters-thesis/`, with summary, bibliographic details, PDF download, and citation.
- `pages/notes.md`: notes and documents, with descriptions and links to PDFs in `documents/`.
- `pages/cv.md`: curriculum vitae. Use `##` for sections and
  `### Period: Position or degree` for individual entries, followed by the
  institution and optional bullet points. Entries appear in the order written;
  keep the most recent first within each section. Update the “Last updated” date
  when changing the CV.

`sources/cv-full.md` preserves the complete CV before the website was shortened.
It is a reference document and is not converted into a website page.

Use standard Markdown for headings, lists, links, emphasis, and tables. Optional
frontmatter at the start of each file sets the page title, subtitle, and language:

```md
---
title: Teaching
lang: en
---

## Summer Semester 2026

- Geometry
- [Course website](https://example.com)
```

Frontmatter uses plain `key: value` lines; quotes are unnecessary. The supported
keys are `title`, `subtitle`, and `lang`. Without frontmatter, the title defaults
to the filename and the language to English.

## Generate the website

Install Python 3 and the Markdown dependency once:

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

After editing Markdown, regenerate the HTML:

```sh
python3 build.py
```

The build discovers every `pages/*.md` file and writes its corresponding HTML
file at the repository root. For example, `pages/teaching.md` becomes
`teaching.html`. The permanent thesis page is the exception: `pages/masters-thesis.md`
becomes `masters-thesis/index.html`, served at `/masters-thesis/`. Add navigation entries to `NAV` in `build.py` for new pages.
Styling is defined in `style.css`. Typst is no longer required.

Commit the Markdown sources and generated HTML together, then push to publish
through the existing GitHub Pages setup. Do not edit generated HTML directly.
The build also downloads the current mathematical note to `documents/noposroots.pdf`.
Commit this PDF together with the generated pages so GitHub Pages can serve it.
When deleting a Markdown page, also delete its generated HTML and navigation
entry.

To preview locally, run `python3 -m http.server 8000` and open
http://localhost:8000.

## Preserve the thesis URL

Keep `https://niederdrenk.de/masters-thesis/` available when redesigning the site.
If the PDF moves, update its link in `pages/masters-thesis.md` and the
`citation_pdf_url` metadata in `build.py`. Preserve the old PDF path as well:
it may already have been cited directly.

Keep the landing page at its current path whenever possible. GitHub Pages does
not support custom HTTP 301 rules; if the page must move, configure a permanent
redirect at a hosting/proxy layer that supports HTTP redirects. Do not simply
delete `masters-thesis/index.html`. The canonical URL and citation examples should
continue to identify the permanent address.
