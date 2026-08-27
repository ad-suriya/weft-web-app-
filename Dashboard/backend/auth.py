"""Authentication: verify Firebase ID tokens.

Sign-in happens entirely on the client via the Firebase JS SDK (Google
provider). The client (dashboard, and the extension via the dashboard relay)
sends the resulting Firebase ID token as `Authorization: Bearer <token>`; we
verify it here on every request with the Firebase Admin SDK rather than
trusting a client-supplied user id, which would be trivially spoofable.
"""

import os
from pathlib import Path

import firebase_admin
from dotenv import load_dotenv
from fastapi import Header, HTTPException
from firebase_admin import auth as fb_auth, credentials

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Still consumed by main.py's CORS allowlist. Defaults to the local dev origin.
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

# Login no longer uses these — kept only so calendar_sync.py (dormant: there's
# currently no UI to connect a Google Calendar account) still imports. Unset by
# default, which makes calendar_sync.configured() return False.
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "")


def _ensure_firebase_app() -> None:
    """Initialise the Firebase Admin app if nothing else has yet.

    Mirrors db.py's credential resolution so token verification works even when
    the DB layer is the in-memory mock. verify_id_token only needs the project
    id (checked against the token's aud/iss) plus Google's public certs.
    """
    if firebase_admin._apps:
        return
    cred_path = os.environ.get("FIREBASE_CREDENTIALS") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    project = os.environ.get("FIREBASE_PROJECT_ID")
    options = {"projectId": project} if project else None
    if cred_path:
        p = Path(cred_path)
        if not p.is_absolute():
            p = Path(__file__).resolve().parent.parent / p
        firebase_admin.initialize_app(credentials.Certificate(str(p)), options)
    else:
        # Application Default Credentials (e.g. the Cloud Run service account).
        firebase_admin.initialize_app(options=options)


def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        _ensure_firebase_app()
        claims = fb_auth.verify_id_token(token)
    except Exception as exc:  # noqa: BLE001 — any verification failure is a 401
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {exc}")

    return {
        "id": claims["uid"],
        "email": claims.get("email", ""),
        "name": claims.get("name") or claims.get("email", ""),
        "picture": claims.get("picture"),
    }
