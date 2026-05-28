import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = (os.getenv("SUPABASE_URL") or "").strip()
# For backend operations, we prefer the Service Role key to bypass RLS
# if it's not available, we fall back to the Anon key.
key: str = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or "").strip()

if not url or "your-project-id" in url:
    print("\n[WARNING] Supabase URL is not configured. Database operations will fail.")
    print("Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.\n")

if not key or "your-anon-key-here" in key:
    print("\n[WARNING] Supabase API Key is not configured. Database operations will fail.\n")

class MissingSupabaseClient:
    def __getattr__(self, name):
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY "
            "or SUPABASE_SERVICE_ROLE_KEY in backend/.env."
        )


if url and key and "your-project-id" not in url and "your-anon-key-here" not in key:
    supabase: Client | MissingSupabaseClient = create_client(url, key)
else:
    supabase = MissingSupabaseClient()

def get_supabase():
    return supabase
