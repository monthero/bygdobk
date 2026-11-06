alter table public.memberships
  drop constraint memberships_note_check,
  add constraint memberships_note_check check (char_length(note) <= 280);
