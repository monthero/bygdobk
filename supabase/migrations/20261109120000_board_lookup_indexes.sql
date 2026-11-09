create index profiles_email_idx on public.profiles (email);

create index memberships_created_by_idx on public.memberships (created_by);

create index memberships_open_idx on public.memberships (created_at desc) where status <> 'active';
