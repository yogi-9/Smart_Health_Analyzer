from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Warning: Supabase credentials not found in .env")
    supabase_client = None
else:
    supabase_client: Client = create_client(url, key)
    print("Supabase client connected")