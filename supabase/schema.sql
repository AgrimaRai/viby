-- ════════════════════════════════════════════════════════════════════
--  Viby — Postgres schema for Supabase (run in the SQL editor)
--  Tables, enums, indexes, and Row Level Security policies.
-- ════════════════════════════════════════════════════════════════════

-- ── Profiles ─────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text unique not null,
  display_name  text not null,
  bio           text,
  avatar_url    text,
  photos        text[] default '{}',
  interests     text[] default '{}',   -- denormalized for fast discovery scoring
  prompts       jsonb  default '[]',   -- [{ q, a }]
  vibe_tags     text[] default '{}',
  lifestyle     jsonb default '{}',
  city          text,
  lat           double precision,
  lng           double precision,
  radius_km     int default 25,
  onboarded     boolean default false,
  created_at    timestamptz default now()
);

-- ── Interests taxonomy + join ────────────────────────────
create table if not exists interests (
  id       serial primary key,
  slug     text unique not null,
  label    text not null,
  emoji    text,
  category text
);

create table if not exists profile_interests (
  profile_id uuid references profiles on delete cascade,
  interest_id int references interests on delete cascade,
  weight     int default 1,
  primary key (profile_id, interest_id)
);

-- ── Discovery / Swipes / Matches ─────────────────────────
do $$ begin
  create type swipe_dir as enum ('save','pass');
exception when duplicate_object then null; end $$;

create table if not exists swipes (
  id         uuid primary key default gen_random_uuid(),
  swiper_id  uuid references profiles on delete cascade,
  target_id  uuid references profiles on delete cascade,
  direction  swipe_dir not null,
  created_at timestamptz default now(),
  unique (swiper_id, target_id)
);

create table if not exists matches (
  id            uuid primary key default gen_random_uuid(),
  a_id          uuid references profiles on delete cascade,
  b_id          uuid references profiles on delete cascade,
  compatibility int,
  created_at    timestamptz default now(),
  unique (a_id, b_id)
);

-- ── Activity feed ────────────────────────────────────────
create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references profiles on delete cascade,
  caption      text,
  image_url    text,
  activity_tag text,
  created_at   timestamptz default now()
);
create index if not exists posts_created_idx on posts (created_at desc);

create table if not exists reactions (
  post_id    uuid references posts on delete cascade,
  profile_id uuid references profiles on delete cascade,
  emoji      text default '💜',
  primary key (post_id, profile_id)
);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts on delete cascade,
  author_id  uuid references profiles on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);

-- ── Communities ──────────────────────────────────────────
create table if not exists communities (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text,
  cover_url    text,
  emoji        text,
  member_count int default 0,
  created_by   uuid references profiles,
  created_at   timestamptz default now()
);

create table if not exists community_members (
  community_id uuid references communities on delete cascade,
  profile_id   uuid references profiles on delete cascade,
  role         text default 'member',
  joined_at    timestamptz default now(),
  primary key (community_id, profile_id)
);

-- ── Events / Meetups ─────────────────────────────────────
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  cover_url    text,
  activity_tag text,
  location     text,
  starts_at    timestamptz not null,
  host_id      uuid references profiles,
  community_id uuid references communities,
  capacity     int,
  created_at   timestamptz default now()
);

do $$ begin
  create type rsvp_status as enum ('going','interested','cant');
exception when duplicate_object then null; end $$;

create table if not exists event_rsvps (
  event_id   uuid references events on delete cascade,
  profile_id uuid references profiles on delete cascade,
  status     rsvp_status default 'going',
  primary key (event_id, profile_id)
);

-- ── Chat ─────────────────────────────────────────────────
create table if not exists conversations (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references matches on delete set null,
  created_at timestamptz default now()
);

create table if not exists conversation_members (
  conversation_id uuid references conversations on delete cascade,
  profile_id      uuid references profiles on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, profile_id)
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade,
  sender_id       uuid references profiles on delete cascade,
  body            text not null,
  created_at      timestamptz default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);

-- ════════════════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table profiles            enable row level security;
alter table swipes              enable row level security;
alter table matches             enable row level security;
alter table posts               enable row level security;
alter table reactions           enable row level security;
alter table comments            enable row level security;
alter table messages            enable row level security;
alter table event_rsvps         enable row level security;
alter table community_members   enable row level security;

-- Profiles: anyone authenticated can read; you can only write your own row.
create policy "profiles readable" on profiles for select to authenticated using (true);
create policy "edit own profile" on profiles for update to authenticated using (auth.uid() = id);
create policy "insert own profile" on profiles for insert to authenticated with check (auth.uid() = id);

-- Swipes: only the swiper can read/write their swipes.
create policy "own swipes" on swipes for all to authenticated
  using (auth.uid() = swiper_id) with check (auth.uid() = swiper_id);

-- Matches: visible to participants.
create policy "see own matches" on matches for select to authenticated
  using (auth.uid() = a_id or auth.uid() = b_id);

-- Posts: readable by all authed; authored by self.
create policy "posts readable" on posts for select to authenticated using (true);
create policy "author own posts" on posts for insert to authenticated with check (auth.uid() = author_id);
create policy "delete own posts" on posts for delete to authenticated using (auth.uid() = author_id);

-- Reactions / comments: self-write.
create policy "react readable" on reactions for select to authenticated using (true);
create policy "react self" on reactions for all to authenticated
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Messages: only conversation members can read/send.
create policy "conv messages readable" on messages for select to authenticated using (
  exists (select 1 from conversation_members m
          where m.conversation_id = messages.conversation_id and m.profile_id = auth.uid())
);
create policy "send as self" on messages for insert to authenticated with check (auth.uid() = sender_id);

-- RSVPs / memberships: self-write.
create policy "rsvp self" on event_rsvps for all to authenticated
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "membership self" on community_members for all to authenticated
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- ── Realtime: add tables to the supabase_realtime publication ──
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table matches;

-- ── Auto-create a profile row on signup ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, split_part(new.email, '@', 1), coalesce(new.raw_user_meta_data->>'name', 'New member'));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════
--  Trust & Safety — blocks, reports, notifications
-- ════════════════════════════════════════════════════════════════════

-- ── Blocking ─────────────────────────────────────────────
create table if not exists blocks (
  blocker_id uuid references profiles on delete cascade,
  blocked_id uuid references profiles on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);
create index if not exists blocks_blocked_idx on blocks (blocked_id);

-- ── Reporting ────────────────────────────────────────────
do $$ begin
  create type report_target as enum ('profile','post','message','group','comment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open','reviewing','actioned','dismissed');
exception when duplicate_object then null; end $$;

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles on delete set null,
  target_type report_target not null,
  target_id   text not null,                 -- id of the reported entity
  reason      text not null,                 -- harassment | hate | nudity | threat | minor_safety | spam | fake | other
  note        text,
  status      report_status default 'open',
  created_at  timestamptz default now()
);
create index if not exists reports_status_idx on reports (status, created_at desc);

-- ── Notifications ────────────────────────────────────────
do $$ begin
  create type notif_type as enum ('connection','message','comment','reaction','group_invite');
exception when duplicate_object then null; end $$;

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles on delete cascade,
  type       notif_type not null,
  actor_id   uuid references profiles on delete set null,
  entity_id  text,
  read       boolean default false,
  created_at timestamptz default now()
);
create index if not exists notifications_user_idx on notifications (user_id, read, created_at desc);

-- ── RLS ──────────────────────────────────────────────────
alter table blocks        enable row level security;
alter table reports       enable row level security;
alter table notifications enable row level security;

-- Blocks: you manage only your own block list.
create policy "manage own blocks" on blocks for all to authenticated
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- Reports: a user can file reports (as themselves) and read their own. Moderation
-- review happens via the service role (bypasses RLS), not the client.
create policy "file own reports" on reports for insert to authenticated
  with check (auth.uid() = reporter_id);
create policy "read own reports" on reports for select to authenticated
  using (auth.uid() = reporter_id);

-- Notifications: you can only read/update your own.
create policy "read own notifications" on notifications for select to authenticated
  using (auth.uid() = user_id);
create policy "update own notifications" on notifications for update to authenticated
  using (auth.uid() = user_id);

alter publication supabase_realtime add table notifications;

-- NOTE: enforce blocking in your read queries AND in RLS for posts/messages/profiles,
-- e.g. add "and not exists (select 1 from blocks b where (b.blocker_id = auth.uid() and b.blocked_id = author_id) or (b.blocker_id = author_id and b.blocked_id = auth.uid()))"
-- to the relevant SELECT policies so blocked users are mutually invisible.
