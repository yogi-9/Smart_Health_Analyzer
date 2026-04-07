from database import supabase_client
from datetime import date

# Get a user_id from existing data
r = supabase_client.table("nutrition_logs").select("*").limit(1).execute()
if r.data:
    uid = r.data[0]["user_id"]
    print(f"user_id: {uid}")
    
    # Query today's logs using the fixed order column
    today = str(date.today())
    print(f"today: {today}")
    
    r2 = (
        supabase_client.table("nutrition_logs")
        .select("*")
        .eq("user_id", uid)
        .eq("log_date", today)
        .order("logged_at", desc=False)
        .execute()
    )
    print(f"today count: {len(r2.data)}")
    for x in r2.data:
        print(f"  - {x['food_name']} ({x['calories']} kcal)")
    
    # Also check all dates to see where the data is
    r3 = (
        supabase_client.table("nutrition_logs")
        .select("*")
        .eq("user_id", uid)
        .order("logged_at", desc=True)
        .limit(5)
        .execute()
    )
    print(f"\nAll recent logs:")
    for x in r3.data:
        print(f"  - [{x['log_date']}] {x['food_name']} ({x['calories']} kcal)")
else:
    print("No data in nutrition_logs table")
