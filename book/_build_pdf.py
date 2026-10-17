"""Combine the Build Viby book Markdown into one styled HTML for PDF printing."""
import os, re, glob, html, markdown

BOOK = os.path.dirname(os.path.abspath(__file__))
OUT_HTML = os.path.join(BOOK, "build-viby.html")

SECTIONS = [
    ("Fundamentals", range(1, 6)),
    ("Modern Frontend", range(6, 11)),
    ("UI / UX Design", range(11, 14)),
    ("Backend Development", range(14, 19)),
    ("Building Viby", range(19, 28)),
    ("Advanced Concepts", range(28, 32)),
    ("Production Deployment", range(32, 35)),
    ("Startup & Product Thinking", range(35, 37)),
]

md = markdown.Markdown(extensions=["extra", "sane_lists", "admonition"])

def render(text):
    md.reset()
    return md.convert(text)

# --- read chapters -------------------------------------------------------
chapter_files = sorted(glob.glob(os.path.join(BOOK, "[0-9][0-9]-*.md")))
chapters = []  # (num, title, html)
for f in chapter_files:
    raw = open(f, encoding="utf-8").read()
    first = raw.splitlines()[0].lstrip("# ").strip()
    num = int(os.path.basename(f)[:2])
    # display title without the leading "Chapter N — "
    disp = re.sub(r"^Chapter\s+\d+\s*[—-]\s*", "", first)
    chapters.append((num, disp, render(raw)))

by_num = {n: (t, h) for n, t, h in chapters}

# --- README front matter (strip its own broken TOC section) --------------
readme = open(os.path.join(BOOK, "README.md"), encoding="utf-8").read()
parts = readme.split("## Table of contents")
readme_clean = parts[0]
if len(parts) > 1:
    nxt = parts[1].find("\n## ")
    if nxt != -1:
        readme_clean += parts[1][nxt:]
front_html = render(readme_clean)

# --- build TOC -----------------------------------------------------------
toc_rows = []
for stitle, rng in SECTIONS:
    nums = [n for n in rng if n in by_num]
    toc_rows.append(f'<li class="toc-sec">{html.escape(stitle)}</li>')
    for n in nums:
        toc_rows.append(
            f'<li class="toc-ch"><span class="toc-n">{n:02d}</span>'
            f'<span class="toc-t">{html.escape(by_num[n][0])}</span></li>'
        )
toc_html = "<ul class='toc'>" + "".join(toc_rows) + "</ul>"

# --- chapter bodies ------------------------------------------------------
chapter_sections = []
for n, t, h in chapters:
    chapter_sections.append(f'<section class="chapter">{h}</section>')

CSS = """
:root { --pink:#FF6FB5; --pink-deep:#E0388A; --pink-soft:#FFC7E7; --ink:#2E2A3A; --soft:#6B6580; }
* { box-sizing:border-box; }
@page { size:A4; margin:18mm 16mm 20mm 16mm; }
html { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { font-family:'Inter','Segoe UI',system-ui,sans-serif; color:var(--ink); line-height:1.6; font-size:10.5pt; margin:0; }

/* Cover */
.cover { height:262mm; display:flex; flex-direction:column; justify-content:center; align-items:flex-start;
  padding:0 4mm; page-break-after:always;
  background:radial-gradient(120% 90% at 15% 0%,#ffe1f0 0,transparent 55%),
             radial-gradient(120% 90% at 95% 20%,#ffd0e8 0,transparent 50%),
             linear-gradient(160deg,#fff 0%,#fff6fb 100%); }
.cover .badge { display:inline-block; background:linear-gradient(135deg,#ff8fc6,#ff6fb5); color:#fff;
  font-weight:700; letter-spacing:.12em; font-size:9pt; padding:7px 16px; border-radius:999px;
  box-shadow:0 14px 30px -12px rgba(255,111,181,.7); text-transform:uppercase; }
.cover h1 { font-size:62pt; line-height:.98; margin:18px 0 6px; letter-spacing:-.02em;
  background:linear-gradient(120deg,#ff4fa3,#ff8fc6); -webkit-background-clip:text; background-clip:text; color:transparent; }
.cover .sub { font-size:17pt; color:var(--ink); font-weight:600; margin:6px 0 0; max-width:150mm; }
.cover .desc { font-size:11.5pt; color:var(--soft); margin-top:14px; max-width:150mm; }
.cover .meta { margin-top:40px; font-size:9.5pt; color:var(--soft); }
.cover .meta b { color:var(--pink-deep); }
.cover .dot { width:70px; height:70px; border-radius:40% 40% 40% 14%; background:linear-gradient(135deg,#ff8fc6,#ff4fa3);
  box-shadow:0 18px 40px -12px rgba(255,111,181,.8); margin-bottom:8px; }

/* Front matter + TOC */
.front, .toc-page { page-break-after:always; }
.toc-page h2 { font-size:26pt; color:var(--pink-deep); border:none; margin:0 0 10px; }
ul.toc { list-style:none; padding:0; margin:0; }
.toc-sec { font-weight:800; color:var(--pink-deep); margin:16px 0 6px; font-size:11pt; letter-spacing:.04em;
  text-transform:uppercase; border-bottom:2px solid var(--pink-soft); padding-bottom:4px; }
.toc-ch { display:flex; gap:10px; padding:3px 0; align-items:baseline; }
.toc-n { color:var(--pink); font-weight:700; font-variant-numeric:tabular-nums; width:22px; }
.toc-t { color:var(--ink); }

/* Chapters */
.chapter { page-break-before:always; }
h1 { font-size:24pt; color:var(--pink-deep); margin:0 0 4px; letter-spacing:-.01em; line-height:1.1;
  border-bottom:3px solid var(--pink-soft); padding-bottom:8px; }
h2 { font-size:15pt; color:var(--pink-deep); margin:22px 0 6px; }
h3 { font-size:12pt; color:var(--ink); margin:16px 0 4px; }
p { margin:8px 0; }
a { color:var(--pink-deep); text-decoration:none; }
strong { color:#3a3450; }
blockquote { border-left:4px solid var(--pink); background:#fff4fa; margin:12px 0; padding:8px 14px;
  border-radius:0 12px 12px 0; color:var(--soft); }
ul,ol { margin:8px 0; padding-left:22px; }
li { margin:3px 0; }
code { font-family:'JetBrains Mono','Consolas',monospace; background:#fff0f6; color:var(--pink-deep);
  padding:1px 5px; border-radius:5px; font-size:9pt; }
pre { background:#fdf2f8; border:1px solid #ffd9ec; border-radius:12px; padding:12px 14px; overflow:hidden;
  white-space:pre-wrap; word-break:break-word; page-break-inside:avoid; margin:12px 0; }
pre code { background:none; color:#3a3450; padding:0; font-size:8.5pt; line-height:1.45; }
table { border-collapse:collapse; width:100%; margin:12px 0; font-size:9pt; page-break-inside:avoid; }
th,td { border:1px solid #ffd9ec; padding:6px 9px; text-align:left; }
th { background:#fff0f6; color:var(--pink-deep); }
.admonition { background:#fff4fa; border:1px solid #ffd9ec; border-radius:12px; padding:10px 14px; margin:12px 0; }
.admonition-title { font-weight:700; color:var(--pink-deep); margin:0 0 4px; }
hr { border:none; border-top:2px solid var(--pink-soft); margin:18px 0; }
"""

DOC = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Build Viby — The Full-Stack Social Platform Masterclass</title>
<style>{CSS}</style></head><body>
<div class="cover">
  <div class="dot"></div>
  <span class="badge">Full-Stack Masterclass</span>
  <h1>Build&nbsp;Viby</h1>
  <p class="sub">The Full-Stack Social Platform Masterclass</p>
  <p class="desc">From absolute beginner to professional full-stack developer — by building a real, premium social-discovery app with Next.js, TypeScript, Tailwind, Supabase, and Vercel.</p>
  <p class="meta"><b>{len(chapters)} chapters</b> · 8 sections · beginner → production · bubblegum pink Gen-Z aesthetic</p>
</div>
<div class="front">{front_html}</div>
<div class="toc-page"><h2>Table of Contents</h2>{toc_html}</div>
{''.join(chapter_sections)}
</body></html>"""

open(OUT_HTML, "w", encoding="utf-8").write(DOC)
print("Wrote", OUT_HTML, f"({len(DOC)//1024} KB, {len(chapters)} chapters)")
