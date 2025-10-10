-- Documents uploaded by users
create table if not exists public.documents (
  id bigserial primary key,
  user_id text not null,
  file_name text not null,
  file_url text not null,
  text_content text,
  created_at timestamptz not null default now()
);

-- Chats tied to a document
create table if not exists public.chats (
  id bigserial primary key,
  user_id text not null,
  document_id bigint not null references public.documents(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  response text,
  created_at timestamptz not null default now()
);

-- Quizzes generated from a document
create table if not exists public.quizzes (
  id bigserial primary key,
  user_id text not null,
  document_id bigint not null references public.documents(id) on delete cascade,
  quiz_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Quiz attempts per user
create table if not exists public.quiz_attempts (
  id bigserial primary key,
  user_id text not null,
  quiz_id bigint not null references public.quizzes(id) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  score integer not null,
  created_at timestamptz not null default now()
);

-- Optional indexes
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists chats_user_id_idx on public.chats(user_id);
create index if not exists quizzes_user_id_idx on public.quizzes(user_id);
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);
