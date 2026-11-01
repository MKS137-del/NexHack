-- ==============================================================================
-- NexHack Database Schema & Row Level Security (RLS) Policies
-- PostgreSQL 15+ compatible for Supabase
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Tables Definitions
-- ==============================================================================

-- 2.1 Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    last_active_date DATE,
    total_study_time INTEGER NOT NULL DEFAULT 0 CHECK (total_study_time >= 0), -- in seconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_study_time ON public.profiles(total_study_time DESC);

-- 2.2 Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_playlist_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    channel_title TEXT,
    category TEXT DEFAULT 'Web Development',
    total_lessons INTEGER NOT NULL DEFAULT 0,
    total_duration_seconds INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_playlist_id ON public.courses(youtube_playlist_id);

-- 2.3 Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    youtube_video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 1200,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, position),
    UNIQUE(course_id, youtube_video_id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_pos ON public.lessons(course_id, position ASC);

-- 2.4 Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);

-- 2.5 Lesson Completions
CREATE TABLE IF NOT EXISTS public.lesson_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_user ON public.lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_lesson ON public.lesson_completions(lesson_id);

-- 2.6 Study Sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    course_title TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    timer_mode TEXT NOT NULL CHECK (timer_mode IN ('manual', 'pomodoro')),
    xp_earned INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, created_at DESC);

-- 2.7 XP Transactions Ledger
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    description TEXT,
    related_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    related_session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_user_date ON public.xp_transactions(user_id, created_at DESC);

-- 2.8 Study Groups
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    category TEXT DEFAULT 'General',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    invite_code TEXT UNIQUE,
    weekly_target_hours INTEGER NOT NULL DEFAULT 10,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_invite_code ON public.study_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_study_groups_public ON public.study_groups(is_private) WHERE is_private = FALSE;

-- 2.9 Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

-- 2.10 Achievements (System Milestones)
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-seed core achievement milestone definitions
INSERT INTO public.achievements (id, title, description, icon_name, xp_reward)
VALUES
    ('first_step', 'First Step', 'Complete your first lesson.', 'Award', 50),
    ('pomodoro_starter', 'Focus Initiate', 'Complete your first Pomodoro study session.', 'Clock', 50),
    ('streak_3', '3-Day Momentum', 'Maintain a 3-day learning streak.', 'Flame', 100),
    ('streak_7', 'Week Warrior', 'Maintain a 7-day learning streak.', 'Zap', 200),
    ('century_club', 'Century Club', 'Accumulate 500 total XP.', 'ShieldCheck', 150),
    ('course_finisher', 'Course Finisher', 'Complete 100% of any enrolled course.', 'GraduationCap', 300)
ON CONFLICT (id) DO NOTHING;

-- 2.11 User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- ==============================================================================
-- 3. Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 3.1 Profiles RLS
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3.2 Courses RLS
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses are viewable by everyone"
    ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create courses" ON public.courses;
CREATE POLICY "Authenticated users can create courses"
    ON public.courses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3.3 Lessons RLS
DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON public.lessons;
CREATE POLICY "Lessons are viewable by everyone"
    ON public.lessons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert lessons" ON public.lessons;
CREATE POLICY "Authenticated users can insert lessons"
    ON public.lessons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3.4 Enrollments RLS
DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
CREATE POLICY "Users view own enrollments"
    ON public.enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own enrollments" ON public.enrollments;
CREATE POLICY "Users insert own enrollments"
    ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own enrollments" ON public.enrollments;
CREATE POLICY "Users update own enrollments"
    ON public.enrollments FOR UPDATE USING (auth.uid() = user_id);

-- 3.5 Lesson Completions RLS
DROP POLICY IF EXISTS "Users view own completions" ON public.lesson_completions;
CREATE POLICY "Users view own completions"
    ON public.lesson_completions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own completions" ON public.lesson_completions;
CREATE POLICY "Users insert own completions"
    ON public.lesson_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own completions" ON public.lesson_completions;
CREATE POLICY "Users delete own completions"
    ON public.lesson_completions FOR DELETE USING (auth.uid() = user_id);

-- 3.6 Study Sessions RLS
DROP POLICY IF EXISTS "Users view own sessions" ON public.study_sessions;
CREATE POLICY "Users view own sessions"
    ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own sessions" ON public.study_sessions;
CREATE POLICY "Users insert own sessions"
    ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3.7 XP Transactions RLS
DROP POLICY IF EXISTS "Users view own XP ledger" ON public.xp_transactions;
CREATE POLICY "Users view own XP ledger"
    ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own XP records" ON public.xp_transactions;
CREATE POLICY "Users insert own XP records"
    ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3.8 Study Groups RLS
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.study_groups;
CREATE POLICY "Public groups are viewable by everyone"
    ON public.study_groups FOR SELECT
    USING (is_private = false OR auth.uid() IN (
        SELECT user_id FROM public.group_members WHERE group_members.group_id = study_groups.id
    ));

DROP POLICY IF EXISTS "Authenticated users create groups" ON public.study_groups;
CREATE POLICY "Authenticated users create groups"
    ON public.study_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3.9 Group Members RLS
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;
CREATE POLICY "Members can view group membership"
    ON public.group_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users join groups" ON public.group_members;
CREATE POLICY "Users join groups"
    ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users leave groups" ON public.group_members;
CREATE POLICY "Users leave groups"
    ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- 3.10 Achievements RLS
DROP POLICY IF EXISTS "Achievements viewable by all" ON public.achievements;
CREATE POLICY "Achievements viewable by all"
    ON public.achievements FOR SELECT USING (true);

-- 3.11 User Achievements RLS
DROP POLICY IF EXISTS "Users view own achievements" ON public.user_achievements;
CREATE POLICY "Users view own achievements"
    ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own achievements" ON public.user_achievements;
CREATE POLICY "Users insert own achievements"
    ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 4. Auth User Created Trigger (Zero-State Defaults for New Users)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    xp,
    level,
    current_streak,
    longest_streak,
    total_study_time
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id),
    0,  -- Strictly 0 XP for fresh users
    1,  -- Level 1
    0,  -- 0 streak
    0,  -- 0 longest streak
    0   -- 0 study seconds
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
