from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.database import get_connection
from app.schemas.auth import LoginRequest, SignupRequest


class AuthService:
    def signup(self, payload: SignupRequest) -> dict:
        email = payload.email.strip().lower()
        name = payload.name.strip()
        if not name:
            raise ValueError("Name is required")

        conn = get_connection()
        try:
            existing_user = self._get_user_by_email(conn, email)
            if existing_user is not None:
                raise ValueError("Email already registered")

            password_hash = get_password_hash(payload.password)
            user_id = self._create_user(conn, name, email, password_hash)
            user = self._get_user_by_id(conn, user_id)
            if user is None:
                raise ValueError("Failed to create user")

            return {
                "access_token": create_access_token(user["id"], user["email"]),
                "user": self._sanitize_user(user),
            }
        finally:
            conn.close()

    def login(self, payload: LoginRequest) -> dict:
        email = payload.email.strip().lower()

        conn = get_connection()
        try:
            user = self._get_user_by_email(conn, email)
            if user is None or not verify_password(payload.password, user["password_hash"]):
                raise ValueError("Invalid email or password")

            if not user["is_active"]:
                raise ValueError("User account is inactive")

            return {
                "access_token": create_access_token(user["id"], user["email"]),
                "user": self._sanitize_user(user),
            }
        finally:
            conn.close()

    def _create_user(self, conn, name: str, email: str, password_hash: str) -> int:
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash)
                VALUES (%s, %s, %s)
                """,
                (name, email, password_hash),
            )
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()

    def _get_user_by_email(self, conn, email: str) -> dict | None:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            return cursor.fetchone()
        finally:
            cursor.close()

    def _get_user_by_id(self, conn, user_id: int) -> dict | None:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            return cursor.fetchone()
        finally:
            cursor.close()

    def _sanitize_user(self, user: dict | None) -> dict | None:
        if user is None:
            return None

        return {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "is_active": user["is_active"],
            "created_at": user["created_at"],
        }
