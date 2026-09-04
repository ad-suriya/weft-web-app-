"""Data-minimization guardrails.

WEFT only ever stores *metadata about* the work a user does — task/goal text
they typed, workflow progress, and the title + URL (plus, optionally, a short
snippet the user explicitly selected) of pages they deliberately capture.

It must never store raw page HTML, full page text, or a browsing-history dump.
The functions here are the single chokepoint that enforces that: every payload
field that could conceivably carry page-derived content is run through
``enforce_metadata_only`` at the API boundary (see ``main.py`` validators).

When dedicated ``references`` / ``work_state`` collections are added later, their
create/update paths MUST call ``enforce_metadata_only`` too.
"""

from __future__ import annotations

from fastapi import HTTPException

# A short user-selected snippet is fine; a page's worth of text is not.
MAX_SNIPPET_LEN = 2_000
# "Next step" notes the user types — generous, but not a document.
MAX_NOTE_LEN = 4_000
MAX_URL_LEN = 2_048

# Markers that indicate raw page content / markup rather than a typed note.
_HTML_MARKERS = (
    "<!doctype", "<html", "<head", "<body", "<script", "<style",
    "<div", "<span", "<table", "<article", "</p>", "</a>", "&nbsp;",
)


def looks_like_page_content(value: str) -> bool:
    """True if the string looks like scraped HTML / full page text rather than
    something a person typed."""
    low = value.lower()
    if any(marker in low for marker in _HTML_MARKERS):
        return True
    # A wall of text with lots of newlines is almost certainly a page dump,
    # not a "next micro-step" note.
    if len(value) > MAX_NOTE_LEN and value.count("\n") > 40:
        return True
    return False


def enforce_metadata_only(value, *, field: str, max_len: int = MAX_SNIPPET_LEN):
    """Return ``value`` unchanged if it is acceptable metadata, otherwise raise
    HTTP 422. ``None`` / empty pass straight through."""
    if value is None or value == "":
        return value
    if not isinstance(value, str):
        return value
    if looks_like_page_content(value):
        raise HTTPException(
            status_code=422,
            detail=(
                f"'{field}' looks like raw page content. WEFT only stores the "
                f"page title, URL, and a short snippet you explicitly select — "
                f"never full page HTML or text."
            ),
        )
    if len(value) > max_len:
        raise HTTPException(
            status_code=422,
            detail=f"'{field}' is too long ({len(value)} chars, max {max_len}). "
                   f"Store a reference, not the page.",
        )
    return value


def clean_url(value):
    """A captured reference URL: must be an http(s) URL and length-bounded.
    Anything with embedded markup is rejected."""
    if value is None or value == "":
        return value
    if not isinstance(value, str):
        return value
    if len(value) > MAX_URL_LEN or "<" in value or "\n" in value:
        raise HTTPException(status_code=422, detail="'url' is not a valid page URL.")
    if not (value.startswith("http://") or value.startswith("https://")):
        raise HTTPException(status_code=422, detail="'url' must be an http(s) URL.")
    return value
