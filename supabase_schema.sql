-- 1. Create Users Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  weight_kg NUMERIC DEFAULT 70.0,
  activity_level TEXT DEFAULT 'moderate',
  daily_protein_goal INTEGER DEFAULT 150,
  daily_calorie_goal INTEGER DEFAULT 2500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Daily Logs Table
CREATE TABLE public.daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL,
  total_protein INTEGER DEFAULT 0,
  total_calories INTEGER DEFAULT 0,
  meals_array JSONB DEFAULT '[]'::jsonb,
  goal_met BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date) -- Ensure only one log entry per user per day
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies manually in dashboard to allow authenticated users to view/edit their own data.
-- (Or run these:)

CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can read own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own daily logs." ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily logs." ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can read own daily logs." ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
