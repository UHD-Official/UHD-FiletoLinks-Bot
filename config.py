from os import environ as env
from dotenv import load_dotenv

load_dotenv()

def str_to_bool(value: str) -> bool:
    return value.lower() in ("1", "true", "t", "yes", "y") if value else False

def get_env(var_name: str, default=None, required: bool = False, cast_type=str):
    value = env.get(var_name, default)
    if required and value is None:
        raise EnvironmentError(f"⚠️ Missing required environment variable: {var_name}")
    return cast_type(value) if value else value


class Telegram:
    API_ID = get_env("API_ID", required=True, cast_type=int)
    API_HASH = get_env("API_HASH", required=True)
    BOT_TOKEN = get_env("BOT_TOKEN", required=True)
    OWNER_ID = get_env("OWNER_ID", "7978482443", cast_type=int)
    WORKERS = get_env("WORKERS", "6", cast_type=int)
    DATABASE_URL = get_env("DATABASE_URL", required=True)
    UPDATES_CHANNEL = get_env("UPDATES_CHANNEL", "Telegram")
    SESSION_NAME = get_env("SESSION_NAME", "FileStream")
    
    # Force subscribe
    FORCE_SUB_ID = get_env("FORCE_SUB_ID", None)
    FORCE_SUB = str_to_bool(get_env("FORCE_UPDATES_CHANNEL", "False"))

    # Pictures
    FILE_PIC = get_env("FILE_PIC", "https://graph.org/file/5bb9935be0229adf98b73.jpg")
    START_PIC = get_env("START_PIC", "https://graph.org/file/290af25276fa34fa8f0aa.jpg")
    VERIFY_PIC = get_env("VERIFY_PIC", "https://graph.org/file/736e21cc0efa4d8c2a0e4.jpg")

    # Logging channels
    FLOG_CHANNEL = get_env("FLOG_CHANNEL", None, cast_type=int)
    ULOG_CHANNEL = get_env("ULOG_CHANNEL", None, cast_type=int)

    # Mode
    MODE = get_env("MODE", "primary").lower()
    SECONDARY = MODE == "secondary"

    # Auth Users
    AUTH_USERS = list(set(int(x) for x in str(get_env("AUTH_USERS", "")).split())) if get_env("AUTH_USERS") else []

    # Streaming Threshold
    SLEEP_THRESHOLD = get_env("SLEEP_THRESHOLD", "60", cast_type=int)

    # Multi-client support (reserved)
    MULTI_CLIENT = str_to_bool(get_env("MULTI_CLIENT", "False"))


class Server:
    PORT = get_env("PORT", 8080, cast_type=int)
    BIND_ADDRESS = get_env("BIND_ADDRESS", "0.0.0.0")
    PING_INTERVAL = get_env("PING_INTERVAL", 1200, cast_type=int)
    HAS_SSL = str_to_bool(get_env("HAS_SSL", "0"))
    NO_PORT = str_to_bool(get_env("NO_PORT", "0"))
    FQDN = get_env("FQDN", BIND_ADDRESS)
    
    URL = "http{}://{}{}/".format(
        "s" if HAS_SSL else "",
        FQDN,
        "" if NO_PORT else ":" + str(PORT)
  )
