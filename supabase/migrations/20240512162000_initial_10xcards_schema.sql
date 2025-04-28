/*
 * Migration: Initial 10xCards Schema
 * Description: Creates the initial database schema for the 10xCards application
 * 
 * Tables:
 * - profiles: Extension of auth.users for user profiles
 * - card_sets: Sets/groups of flashcards
 * - cards: Individual flashcards
 * - cards_to_sets: Many-to-many relationship between cards and sets
 * - card_progress: Spaced repetition algorithm data
 * - card_personalizations: User-specific card customizations
 * - generation_logs: AI flashcard generation statistics
 * 
 * Features:
 * - UUID primary keys for better security and distributed systems
 * - Comprehensive Row Level Security (RLS) policies
 * - Soft delete functionality for main entities
 * - Optimized indexes for common query patterns
 * 
 * Author: Database Planning Team
 * Date: 2024-05-12
 */

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create custom enum types for type safety
create type source_type as enum ('ai', 'ai_edited', 'manual');
create type knowledge_status as enum ('new', 'learning', 'review', 'mastered');

-- Create profiles table extending auth.users
create table public.profiles (
    id uuid primary key references auth.users(id),
    username text unique,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    is_deleted boolean default false,
    deleted_at timestamp with time zone
);

comment on table public.profiles is 'User profiles extending Supabase auth.users';

-- Create card sets table
create table public.card_sets (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id),
    name text not null,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    constraint card_sets_name_length check (char_length(name) <= 100)
);

comment on table public.card_sets is 'Sets/groups of flashcards';

-- Create cards table
create table public.cards (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id),
    front_content text not null,
    back_content text not null,
    source_type source_type not null default 'manual',
    readability_score numeric(4,2),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    constraint cards_front_length check (char_length(front_content) <= 200),
    constraint cards_back_length check (char_length(back_content) <= 500)
);

comment on table public.cards is 'Individual flashcards with front and back content';

-- Create cards_to_sets junction table
create table public.cards_to_sets (
    card_id uuid references public.cards(id) on delete cascade,
    set_id uuid references public.card_sets(id) on delete cascade,
    created_at timestamp with time zone default now(),
    primary key (card_id, set_id)
);

comment on table public.cards_to_sets is 'Junction table for many-to-many relationship between cards and sets';

-- Create card_progress table for spaced repetition
create table public.card_progress (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id),
    card_id uuid not null references public.cards(id) on delete cascade,
    status knowledge_status default 'new',
    ease_factor numeric(4,2) default 2.5,
    interval integer default 0,
    next_review timestamp with time zone default now(),
    last_review timestamp with time zone,
    review_count integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique (user_id, card_id)
);

comment on table public.card_progress is 'Tracks learning progress for spaced repetition algorithm';

-- Create card_personalizations table
create table public.card_personalizations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.profiles(id),
    card_id uuid not null references public.cards(id) on delete cascade,
    settings jsonb default '{}',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique (user_id, card_id)
);

comment on table public.card_personalizations is 'User-specific card customizations';

-- Create generation_logs table
create table public.generation_logs (
    id bigserial primary key,
    user_id uuid not null references public.profiles(id),
    model text,
    generated_count integer not null default 0,
    accepted_unedited_count integer not null default 0,
    accepted_edited_count integer not null default 0,
    source_text_hash text,
    source_text_length integer,
    created_at timestamp with time zone default now()
);

comment on table public.generation_logs is 'Statistics for AI-generated flashcards';

-- Create indexes for performance optimization
create index cards_user_id_idx on public.cards(user_id);
create index cards_user_updated_idx on public.cards(user_id, updated_at);
create index cards_readability_idx on public.cards(readability_score);
create index card_sets_user_id_idx on public.card_sets(user_id);
create index card_progress_next_review_idx on public.card_progress(user_id, status, next_review);
create index cards_to_sets_set_id_idx on public.cards_to_sets(set_id);
create index cards_not_deleted_idx on public.cards(is_deleted) where is_deleted = false;
create index card_sets_not_deleted_idx on public.card_sets(is_deleted) where is_deleted = false;

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.card_sets enable row level security;
alter table public.cards enable row level security;
alter table public.cards_to_sets enable row level security;
alter table public.card_progress enable row level security;
alter table public.card_personalizations enable row level security;
alter table public.generation_logs enable row level security;

-- Create RLS policies for profiles table
create policy "anon users cannot select profiles"
    on public.profiles for select
    to anon
    using (false);

create policy "authenticated users can view own profile"
    on public.profiles for select
    to authenticated
    using (auth.uid() = id);

create policy "authenticated users can update own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id);

-- Create RLS policies for card_sets table
create policy "anon users cannot select card_sets"
    on public.card_sets for select
    to anon
    using (false);

create policy "authenticated users can view own card sets"
    on public.card_sets for select
    to authenticated
    using (auth.uid() = user_id and is_deleted = false);

create policy "authenticated users can insert own card sets"
    on public.card_sets for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "authenticated users can update own card sets"
    on public.card_sets for update
    to authenticated
    using (auth.uid() = user_id);

create policy "authenticated users can delete own card sets"
    on public.card_sets for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create RLS policies for cards table
create policy "anon users cannot select cards"
    on public.cards for select
    to anon
    using (false);

create policy "authenticated users can view own cards"
    on public.cards for select
    to authenticated
    using (auth.uid() = user_id and is_deleted = false);

create policy "authenticated users can insert own cards"
    on public.cards for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "authenticated users can update own cards"
    on public.cards for update
    to authenticated
    using (auth.uid() = user_id);

create policy "authenticated users can delete own cards"
    on public.cards for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create RLS policies for cards_to_sets table
create policy "anon users cannot select cards_to_sets"
    on public.cards_to_sets for select
    to anon
    using (false);

create policy "authenticated users can view own cards_to_sets"
    on public.cards_to_sets for select
    to authenticated
    using (exists (
        select 1 from public.cards 
        where id = cards_to_sets.card_id 
        and user_id = auth.uid() 
        and is_deleted = false
    ));

create policy "authenticated users can insert own cards_to_sets"
    on public.cards_to_sets for insert
    to authenticated
    with check (exists (
        select 1 from public.cards 
        where id = cards_to_sets.card_id 
        and user_id = auth.uid() 
        and is_deleted = false
    ));

-- Create RLS policies for card_progress table
create policy "anon users cannot select card_progress"
    on public.card_progress for select
    to anon
    using (false);

create policy "authenticated users can manage own card progress"
    on public.card_progress for all
    to authenticated
    using (auth.uid() = user_id);

-- Create RLS policies for card_personalizations table
create policy "anon users cannot select card_personalizations"
    on public.card_personalizations for select
    to anon
    using (false);

create policy "authenticated users can manage own personalizations"
    on public.card_personalizations for all
    to authenticated
    using (auth.uid() = user_id);

-- Create RLS policies for generation_logs table
create policy "anon users cannot select generation_logs"
    on public.generation_logs for select
    to anon
    using (false);

create policy "authenticated users can view own generation logs"
    on public.generation_logs for select
    to authenticated
    using (auth.uid() = user_id);

create policy "authenticated users can insert own generation logs"
    on public.generation_logs for insert
    to authenticated
    with check (auth.uid() = user_id);
