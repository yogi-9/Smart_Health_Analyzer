-- ================================================================
-- Smart Health Analyzer — Supabase Tables
-- Run this in Supabase SQL Editor (https://supabase.com → SQL Editor)
-- ================================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  age INT,
  gender TEXT,
  height FLOAT,
  weight FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Predictions (health analysis results)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_score FLOAT,
  risk_level TEXT,
  message TEXT,
  tips JSONB,
  age INT,
  bmi FLOAT,
  systolic_bp INT,
  cholesterol INT,
  glucose INT,
  smoking INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Mental Health Records
CREATE TABLE IF NOT EXISTS mental_health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phq9_score INT,
  gad7_score INT,
  depression_level TEXT,
  anxiety_level TEXT,
  mental_health_score FLOAT,
  seek_help BOOLEAN DEFAULT false,
  message TEXT,
  tips JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Health Records (used by diabetes/heart routes)
CREATE TABLE IF NOT EXISTS health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  systolic_bp INT,
  diastolic_bp INT,
  cholesterol INT,
  glucose INT,
  smoking BOOLEAN DEFAULT false,
  bmi FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Water Logs
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  glasses INT DEFAULT 0,
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- 6. Nutrition Logs
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT,
  food_name TEXT,
  calories FLOAT DEFAULT 0,
  protein FLOAT DEFAULT 0,
  carbs FLOAT DEFAULT 0,
  fat FLOAT DEFAULT 0,
  quantity FLOAT DEFAULT 1,
  unit TEXT DEFAULT 'serving',
  log_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Streaks
CREATE TABLE IF NOT EXISTS streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL DEFAULT 'login',
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

-- 8. Streak Logs (for heatmap)
CREATE TABLE IF NOT EXISTS streak_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  activity_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, streak_type, activity_date)
);

-- 9. Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_name)
);

-- 10. Meal Plans (AI-generated)
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  plan_json TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- Row Level Security (RLS) — Users can only access their own data
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Profiles uses 'id' not 'user_id'
CREATE POLICY IF NOT EXISTS "users_own_profiles" ON profiles
  FOR ALL USING (auth.uid() = id);

-- All other tables use 'user_id'
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'predictions', 'mental_health_records', 'health_records',
    'water_logs', 'nutrition_logs', 'streaks',
    'streak_logs', 'badges', 'meal_plans'
  ])
  LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "users_own_%s" ON %I FOR ALL USING (auth.uid() = user_id)',
      tbl, tbl
    );
  END LOOP;
END $$;
