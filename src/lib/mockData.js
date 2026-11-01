/**
 * Curated seed fixtures for offline / local-first demonstration.
 * These represent real high-quality YouTube educational courses.
 */

export const INITIAL_ACHIEVEMENTS = [
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first lesson.',
    icon_name: 'Award',
    xp_reward: 50,
  },
  {
    id: 'pomodoro_starter',
    title: 'Focus Initiate',
    description: 'Complete your first Pomodoro study session.',
    icon_name: 'Clock',
    xp_reward: 50,
  },
  {
    id: 'streak_3',
    title: '3-Day Momentum',
    description: 'Maintain a 3-day learning streak.',
    icon_name: 'Flame',
    xp_reward: 100,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak.',
    icon_name: 'Zap',
    xp_reward: 200,
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Accumulate 500 total XP.',
    icon_name: 'ShieldCheck',
    xp_reward: 150,
  },
  {
    id: 'course_finisher',
    title: 'Course Finisher',
    description: 'Complete 100% of any enrolled course.',
    icon_name: 'GraduationCap',
    xp_reward: 300,
  },
];

export const INITIAL_COURSES = [
  {
    id: 'c-webdev-101',
    youtube_playlist_id: 'PLillGF-RfqbZTASqS_R3eTU69tP06yb48',
    title: 'Web Development Crash Course',
    description: 'Comprehensive beginner-to-intermediate web development fundamentals.',
    thumbnail_url: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=600&q=80',
    channel_title: 'Traversy Media',
    total_lessons: 5,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    lessons: [
      {
        id: 'l-101',
        course_id: 'c-webdev-101',
        youtube_video_id: 'UB1O30fR-EE',
        title: 'HTML5 Crash Course for Beginners',
        duration_seconds: 3600,
        position: 1,
      },
      {
        id: 'l-102',
        course_id: 'c-webdev-101',
        youtube_video_id: 'yfoY53QXEnI',
        title: 'CSS3 Full Tutorial & Modern Flexbox',
        duration_seconds: 4200,
        position: 2,
      },
      {
        id: 'l-103',
        course_id: 'c-webdev-101',
        youtube_video_id: 'W6NZfCO5SIk',
        title: 'JavaScript Essentials for Web Developers',
        duration_seconds: 4800,
        position: 3,
      },
      {
        id: 'l-104',
        course_id: 'c-webdev-101',
        youtube_video_id: 'w7ejDZ8SWv8',
        title: 'React JS Full Modern Course',
        duration_seconds: 5400,
        position: 4,
      },
      {
        id: 'l-105',
        course_id: 'c-webdev-101',
        youtube_video_id: 'fBNz5xF-Kx4',
        title: 'Node.js & Express REST API Backend',
        duration_seconds: 4500,
        position: 5,
      },
    ],
  },
  {
    id: 'c-python-dsa',
    youtube_playlist_id: 'PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ',
    title: 'Data Structures & Algorithms in Python',
    description: 'Master algorithmic problem solving, time complexities, and recursion.',
    thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    channel_title: 'CS Dojo & Kunal',
    total_lessons: 4,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    lessons: [
      {
        id: 'l-201',
        course_id: 'c-python-dsa',
        youtube_video_id: '8hly31xKli0',
        title: 'Algorithmic Complexity & Big-O Notation',
        duration_seconds: 2400,
        position: 1,
      },
      {
        id: 'l-202',
        course_id: 'c-python-dsa',
        youtube_video_id: 'ZG2Zp1Yx9Hk',
        title: 'Arrays, Lists & Two-Pointer Strategies',
        duration_seconds: 3100,
        position: 2,
      },
      {
        id: 'l-203',
        course_id: 'c-python-dsa',
        youtube_video_id: 'M2bO7G5N_28',
        title: 'Linked Lists & Reversal Algorithms',
        duration_seconds: 2900,
        position: 3,
      },
      {
        id: 'l-204',
        course_id: 'c-python-dsa',
        youtube_video_id: 'W_2m5dE7qYg',
        title: 'Binary Search & Divide and Conquer',
        duration_seconds: 3800,
        position: 4,
      },
    ],
  },
];

export const INITIAL_GROUPS = [
  {
    id: 'grp-night-owls',
    name: 'Midnight Hackers Club',
    description: 'Late night college students committed to studying 2+ hours every day.',
    avatar_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=150&q=80',
    is_private: false,
    member_count: 14,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'grp-interview-prep',
    name: 'FAANG DSA Sprint',
    description: 'Cracking technical interviews through dedicated daily problem sessions.',
    avatar_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80',
    is_private: false,
    member_count: 28,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'grp-study-syndicate',
    name: 'The Study Syndicate (Private)',
    description: 'Exclusive cohort for university capstone accountability.',
    avatar_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=150&q=80',
    is_private: true,
    invite_code: 'SYND88',
    member_count: 5,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];
