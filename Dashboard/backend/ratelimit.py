"""Per-user throttle for the endpoints that spend the Gemini API quota.

A leaked GEMINI_API_KEY (or a runaway client loop) shouldn't be able to burn
the whole quota / bill in minutes. This is a plain in-memory token bucket keyed
by Firebase uid — call `check(user_id)` right before an `engine.*` call and it
raises HTTP 429 once a user outruns the sustained rate.

In-memory + per-process: with multiple Cloud Run instances the effective limit
is RATE * instance_count, which is fine for abuse containment. It resets on
deploy. If a hard global cap is ever needed, back this with Firestore/Redis.
"""

import threading
import time

from fastapi import HTTPException

# Sustained calls/minute per user, and the max burst that can accumulate.
RATE_PER_MINUTE = 15
BURST = 15

_REFILL_PER_SEC = RATE_PER_MINUTE / 60.0
_buckets: dict[str, tuple[float, float]] = {}  # uid -> (tokens, last_seen monotonic)
_lock = threading.Lock()


def check(user_id: str) -> None:
    """Consume one token for ``user_id``; raise 429 if the bucket is empty."""
    now = time.monotonic()
    with _lock:
        tokens, last = _buckets.get(user_id, (float(BURST), now))
        tokens = min(float(BURST), tokens + (now - last) * _REFILL_PER_SEC)
        if tokens < 1.0:
            _buckets[user_id] = (tokens, now)
            retry_after = max(1, int((1.0 - tokens) / _REFILL_PER_SEC))
            raise HTTPException(
                status_code=429,
                detail="Too many AI requests. Please wait a moment and try again.",
                headers={"Retry-After": str(retry_after)},
            )
        _buckets[user_id] = (tokens - 1.0, now)
