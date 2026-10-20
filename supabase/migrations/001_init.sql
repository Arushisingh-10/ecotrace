-- EchoTrace database setup
-- Run this in the Supabase SQL Editor on a fresh project.

-- ===== Tables =====
create type node_type as enum (
  'feedback', 'evidence', 'problem', 'assumption',
  'alternative', 'decision', 'prototype', 'verification'
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

create table graph_nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type node_type not null,
  content jsonb not null,
  is_human_authored boolean default false,
  created_at timestamptz default now(),
  created_by uuid
);

create table graph_edges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_id uuid references graph_nodes(id) on delete cascade,
  target_id uuid references graph_nodes(id) on delete cascade,
  relationship text not null,
  unique (source_id, target_id, relationship)
);

create table prototype_versions (
  id uuid primary key default gen_random_uuid(),
  decision_node_id uuid references graph_nodes(id) on delete cascade,
  component_schema jsonb not null,
  status text default 'pending_verification'
);

-- ===== Row Level Security =====
alter table projects enable row level security;
alter table graph_nodes enable row level security;
alter table graph_edges enable row level security;
alter table prototype_versions enable row level security;

create policy "projects_select_own" on projects
  for select using (auth.uid() = owner_id);
create policy "projects_insert_own" on projects
  for insert with check (auth.uid() = owner_id);
create policy "projects_update_own" on projects
  for update using (auth.uid() = owner_id);
create policy "projects_delete_own" on projects
  for delete using (auth.uid() = owner_id);

create policy "nodes_all_own" on graph_nodes
  for all
  using (exists (select 1 from projects p where p.id = graph_nodes.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = graph_nodes.project_id and p.owner_id = auth.uid()));

create policy "edges_all_own" on graph_edges
  for all
  using (exists (select 1 from projects p where p.id = graph_edges.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = graph_edges.project_id and p.owner_id = auth.uid()));

create policy "protos_all_own" on prototype_versions
  for all
  using (exists (
    select 1 from graph_nodes n join projects p on p.id = n.project_id
    where n.id = prototype_versions.decision_node_id and p.owner_id = auth.uid()))
  with check (exists (
    select 1 from graph_nodes n join projects p on p.id = n.project_id
    where n.id = prototype_versions.decision_node_id and p.owner_id = auth.uid()));

-- ===== Storage (private bucket: PNG/JPEG, max 5 MB) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback-images', 'feedback-images', false, 5242880, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "feedback_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'feedback-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "feedback_images_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'feedback-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "feedback_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'feedback-images' and (storage.foldername(name))[1] = auth.uid()::text);