import os
from supabase import create_client, Client
from dotenv import load_dotenv

from pathlib import Path

load_dotenv()
# Si load_dotenv() par défaut ne trouve rien, on force le chemin
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be set in environment variables.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)
