-- Public read-only access for the public plant catalog.
-- This does not grant public insert/update/delete.
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Public can read available products" on public.products;
create policy "Public can read available products"
on public.products for select
to anon, authenticated
using (is_available = true);
