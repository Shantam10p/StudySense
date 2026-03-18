from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import json
import secrets

from app.core.config import get_settings


def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    derived_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${derived_key.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, stored_hash = password_hash.split("$", 1)
    except ValueError:
        return False

    derived_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return hmac.compare_digest(derived_key.hex(), stored_hash)


def create_access_token(user_id: int, email: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": int(expires_at.timestamp()),
    }
    payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_encoded = urlsafe_b64encode(payload_json).decode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), payload_encoded.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload_encoded}.{signature}"


def decode_token(token: str) -> dict | None:
    settings = get_settings()
    try:
        payload_encoded, provided_signature = token.split(".", 1)
    except ValueError:
        return None

    expected_signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        payload_encoded.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(provided_signature, expected_signature):
        return None

    try:
        payload_json = urlsafe_b64decode(payload_encoded.encode("utf-8"))
        payload = json.loads(payload_json.decode("utf-8"))
    except (ValueError, json.JSONDecodeError):
        return None

    exp = payload.get("exp")
    sub = payload.get("sub")
    email = payload.get("email")
    if not isinstance(exp, int) or not isinstance(sub, str) or not isinstance(email, str):
        return None

    if exp <= int(datetime.now(UTC).timestamp()):
        return None

    return payload


def verify_token(token: str) -> bool:
    return decode_token(token) is not None
