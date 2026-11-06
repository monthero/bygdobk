alter table public.profiles
  drop constraint profiles_locale_check,
  add constraint profiles_locale_check check (locale in ('nb', 'en', 'sv', 'da', 'fi', 'is', 'zh'));
