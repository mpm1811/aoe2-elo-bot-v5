from app.db.pg_client import execute_query
from typing import Dict, Any, Optional, Tuple
import logging
import uuid
import hashlib
import secrets
import time
import jwt
import os

logger = logging.getLogger(__name__)

# JWT configuration - Load from environment or use sensible defaults
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRY = int(os.environ.get('JWT_EXPIRY', '86400'))  # 24 hours in seconds

class AuthService:
    @staticmethod
    def sign_up(email: str, password: str, user_data: Dict[str, Any] = None) -> Tuple[Dict, Optional[str]]:
        """Register a new user with email and password"""
        try:
            logger.info(f"Attempting to sign up user: {email}")
            
            # Check if user already exists
            existing_user = execute_query("SELECT * FROM users WHERE email = %s", (email,), fetchall=False)
            if existing_user:
                logger.warning(f"User already exists: {email}")
                return {}, "User with this email already exists"
            
            # Generate user ID
            user_id = str(uuid.uuid4())
            
            # Hash password
            password_hash = AuthService._hash_password(password)
            
            # Create user in the users table
            user = {
                "id": user_id,
                "email": email,
                "password_hash": password_hash,
                "role": user_data.get("role", "user") if user_data else "user",
                "created_at": "NOW()"
            }
            
            # Execute INSERT query
            execute_query(
                """
                INSERT INTO users (id, email, password_hash, role, created_at)
                VALUES (%s, %s, %s, %s, NOW())
                """,
                (user_id, email, password_hash, user.get("role"))
            )
            
            # Insert additional user data if provided
            if user_data:
                # Remove fields that are already in the users table
                user_data_copy = user_data.copy()
                for field in ["id", "email", "password", "role", "created_at"]:
                    user_data_copy.pop(field, None)
                
                if user_data_copy:
                    # For simplicity, using a separate user_profiles table for additional data
                    # This should be adapted to your schema
                    fields = ["user_id"] + list(user_data_copy.keys())
                    placeholders = ["%s"] * len(fields)
                    values = [user_id] + list(user_data_copy.values())
                    
                    execute_query(
                        f"""
                        INSERT INTO user_profiles ({', '.join(fields)})
                        VALUES ({', '.join(placeholders)})
                        """,
                        tuple(values)
                    )
            
            # Generate session token
            token = AuthService._generate_token(user_id, email, user.get("role"))
            
            return {
                "user": {
                    "id": user_id,
                    "email": email,
                    "role": user.get("role")
                },
                "session": {
                    "access_token": token
                }
            }, None
            
        except Exception as e:
            logger.error(f"Sign up failed: {str(e)}")
            return {}, f"Sign up failed: {str(e)}"
    
    @staticmethod
    def sign_in(email: str, password: str) -> Tuple[Dict, Optional[str]]:
        """Sign in an existing user with email and password"""
        try:
            logger.info(f"Attempting to sign in user: {email}")
            
            # Get user from database
            user = execute_query(
                "SELECT id, email, password_hash, role FROM users WHERE email = %s",
                (email,),
                fetchall=False
            )
            
            if not user:
                logger.warning(f"User not found: {email}")
                return {}, "Invalid email or password"
            
            # Verify password
            if not AuthService._verify_password(password, user["password_hash"]):
                logger.warning(f"Invalid password for user: {email}")
                return {}, "Invalid email or password"
            
            # Generate session token
            token = AuthService._generate_token(user["id"], user["email"], user["role"])
            
            return {
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "role": user["role"]
                },
                "session": {
                    "access_token": token
                },
                "role": user["role"]
            }, None
            
        except Exception as e:
            logger.error(f"Sign in failed: {str(e)}")
            return {}, f"Authentication failed: {str(e)}"
    
    @staticmethod
    def sign_out(access_token: str) -> Tuple[Dict, Optional[str]]:
        """Sign out a user"""
        try:
            logger.info("Signing out user")
            
            # For pure PostgreSQL approach, we don't need to do anything special for sign out
            # JWT tokens can't be invalidated without maintaining a blacklist
            # Consider implementing a token blacklist in production
            
            return {"success": True}, None
        except Exception as e:
            logger.error(f"Sign out failed: {str(e)}")
            return {}, f"Sign out failed: {str(e)}"
            
    @staticmethod
    def get_user(access_token: str) -> Tuple[Dict, Optional[str]]:
        """Get user information from token"""
        try:
            logger.info("Getting user information from token")
            
            # Verify and decode token
            try:
                payload = jwt.decode(access_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_id = payload.get("sub")
                
                if not user_id:
                    return {}, "Invalid token"
                
                # Get user from database
                user = execute_query(
                    "SELECT id, email, role FROM users WHERE id = %s",
                    (user_id,),
                    fetchall=False
                )
                
                if not user:
                    return {}, "User not found"
                
                return {"user": user}, None
                
            except jwt.PyJWTError as e:
                logger.error(f"Token validation failed: {e}")
                return {}, "Invalid or expired token"
            
        except Exception as e:
            logger.error(f"Get user failed: {str(e)}")
            return {}, f"Failed to get user: {str(e)}"
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash a password using secure methods"""
        salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
        pwd_hash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
        pwd_hash = hashlib.sha256(pwd_hash).hexdigest()
        return (salt + pwd_hash.encode('ascii')).decode('ascii')
    
    @staticmethod
    def _verify_password(password: str, stored_password: str) -> bool:
        """Verify a password against its hash"""
        salt = stored_password[:64]
        stored_hash = stored_password[64:]
        pwd_hash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt.encode('ascii'), 100000)
        pwd_hash = hashlib.sha256(pwd_hash).hexdigest()
        return pwd_hash == stored_hash
    
    @staticmethod
    def _generate_token(user_id: str, email: str, role: str) -> str:
        """Generate a JWT token for user authentication"""
        payload = {
            "sub": user_id,
            "email": email,
            "role": role,
            "iat": int(time.time()),
            "exp": int(time.time()) + JWT_EXPIRY
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)