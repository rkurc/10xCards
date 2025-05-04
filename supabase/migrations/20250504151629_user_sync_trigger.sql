/*
 * Migration: Auth.Users to Profiles Sync Trigger
 * Description: Creates triggers to automatically sync data from auth.users to public.profiles
 * 
 * This migration:
 * 1. Creates a function to sync user data from auth.users to profiles
 * 2. Creates triggers for INSERT and UPDATE events on auth.users
 * 3. Syncs existing auth.users to profiles if they don't already exist
 */

-- Create trigger function that ensures profiles rows exist for all auth.users
create or replace function public.handle_auth_user_sync()
returns trigger as $$
begin
  -- If a user is created or updated in auth.users, 
  -- ensure corresponding profile exists in public.profiles
  insert into public.profiles (id, username, created_at, updated_at)
  values (
    new.id, 
    new.email, 
    new.created_at,
    new.updated_at
  )
  on conflict (id) do update set
    -- Only update username if it's null
    username = coalesce(public.profiles.username, new.email),
    updated_at = new.updated_at;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_sync();

-- Create trigger for user updates
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_auth_user_sync();

-- Sync existing users
insert into public.profiles (id, username, created_at, updated_at)
select id, email, created_at, updated_at
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do update set
  -- Only update username if it's null
  username = coalesce(public.profiles.username, excluded.username),
  updated_at = excluded.updated_at;

comment on function public.handle_auth_user_sync is 'Automatically creates or updates a user profile when an auth.user is created or updated';
