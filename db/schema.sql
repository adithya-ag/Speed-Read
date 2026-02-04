-- USERS TABLE (Handled by Supabase Auth, but we can extend public.users if needed)
-- We will use a public profile table that references auth.users

create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- DOCUMENTS TABLE (Uploaded texts)
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text not null, -- Storing full text for now. For large PDFs, consider Storage + extraction.
  created_at timestamp with time zone default now(),
  last_read_at timestamp with time zone default now(),
  bookmark_index integer default 0, -- Word index where they left off
  total_words integer default 0
);

-- RLS POLICIES (Row Level Security)
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- Profiles: Public read, Self update
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Documents: Self read/write only
create policy "Individuals can view their own documents."
  on documents for select
  using ( auth.uid() = user_id );

create policy "Individuals can insert their own documents."
  on documents for insert
  with check ( auth.uid() = user_id );

create policy "Individuals can update their own documents."
  on documents for update
  using ( auth.uid() = user_id );

create policy "Individuals can delete their own documents."
  on documents for delete
  using ( auth.uid() = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
