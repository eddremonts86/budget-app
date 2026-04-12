-- ============================================================
-- STRESS TEST SEED: ~800K-1M rows per major table
-- Run inside the Postgres container:
--   docker exec -i <container> psql -U postgres -d tanstack_template < scripts/db/seed-stress-test.sql
-- ============================================================

-- Speed up bulk inserts
SET work_mem = '512MB';
SET maintenance_work_mem = '1GB';
SET synchronous_commit = OFF;

BEGIN;

-- ── 0. Ensure master data exists ──────────────────────────────
INSERT INTO roles (id, name, description) VALUES
  ('role_1', 'Admin', 'Administrator'),
  ('role_2', 'Member', 'Regular member'),
  ('role_3', 'Viewer', 'Read-only')
ON CONFLICT (id) DO NOTHING;

-- Ensure at least 20 categories exist for FK diversity
INSERT INTO categories (id, name, color)
SELECT 'cat_stress_' || i, 'Stress Category ' || i, '#' || lpad(to_hex((i * 123456) % 16777215), 6, '0')
FROM generate_series(1, 20) AS i
ON CONFLICT (id) DO NOTHING;

-- Ensure at least 15 departments exist
INSERT INTO departments (id, name)
SELECT 'dept_stress_' || i, 'Department Stress ' || i
FROM generate_series(1, 15) AS i
ON CONFLICT (id) DO NOTHING;

-- ── 1. USERS (800,000) ──────────────────────────────────────

INSERT INTO users (id, name, email, role_id, department_id, salary, created_at, updated_at)
SELECT
  'stress_user_' || i,
  'StressUser ' || i || ' ' || (ARRAY['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez'])[1 + (i % 10)],
  'stress.user.' || i || '@microsoft-demo.local',
  (ARRAY['role_1','role_2','role_3'])[1 + (i % 3)],
  'dept_stress_' || (1 + (i % 15)),
  30000 + (i % 120000),
  NOW() - (i % 1095 || ' days')::interval,
  NOW() - (i % 365 || ' days')::interval
FROM generate_series(1, 800000) AS i
ON CONFLICT (id) DO NOTHING;


-- ── 2. PROJECTS (800,000) ─────────────────────────────────────

INSERT INTO projects (id, name, description, status, type, priority, budget, department_id, created_at, updated_at)
SELECT
  'stress_proj_' || i,
  (ARRAY['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa'])[1 + (i % 10)]
    || ' ' || (ARRAY['Platform','Engine','Portal','Dashboard','Pipeline','API','Service','Module','Framework','Tool'])[1 + ((i/10) % 10)]
    || ' ' || i,
  'Stress test project #' || i,
  (ARRAY['planning','active','completed','on_hold','cancelled'])[1 + (i % 5)]::project_status,
  (ARRAY['internal','external','research','maintenance'])[1 + (i % 4)]::project_type,
  (ARRAY['low','medium','high'])[1 + (i % 3)],
  (i % 50) * 10000,
  'dept_stress_' || (1 + (i % 15)),
  NOW() - (i % 730 || ' days')::interval,
  NOW() - (i % 365 || ' days')::interval
FROM generate_series(1, 800000) AS i
ON CONFLICT (id) DO NOTHING;


-- ── 3. TODOS / TASKS (1,000,000) ──────────────────────────────

INSERT INTO todos (id, title, description, status, priority, complexity, estimated_time, actual_time, due_date, created_by, assigned_to, project_id, category_id, created_at, updated_at)
SELECT
  'stress_todo_' || i,
  (ARRAY['Implement','Fix','Review','Test','Deploy','Refactor','Optimize','Document','Design','Research'])[1 + (i % 10)]
    || ' ' || (ARRAY['feature','bug','component','module','service','endpoint','migration','integration','report','alert'])[1 + ((i/10) % 10)]
    || ' #' || i,
  'Stress test task description for item ' || i || '. This is a detailed description with enough text to be realistic.',
  (ARRAY['pending','in_progress','completed','blocked','cancelled','on_hold','testing'])[1 + (i % 7)]::todo_status,
  (ARRAY['low','medium','high'])[1 + (i % 3)]::todo_priority,
  1 + (i % 5),
  (i % 40) + 1,
  CASE WHEN i % 3 = 0 THEN (i % 40) + 1 ELSE NULL END,
  NOW() + ((i % 180) - 90 || ' days')::interval,
  'stress_user_' || (1 + (i % 800000)),
  'stress_user_' || (1 + ((i * 7) % 800000)),
  'stress_proj_' || (1 + (i % 800000)),
  'cat_stress_' || (1 + (i % 20)),
  NOW() - (i % 365 || ' days')::interval,
  NOW() - (i % 180 || ' days')::interval
FROM generate_series(1, 1000000) AS i
ON CONFLICT (id) DO NOTHING;


-- ── 4. TRANSACTIONS (1,000,000) ────────────────────────────────

INSERT INTO transactions (id, customer_name, customer_email, status, date, amount, payment_method, description, user_id, project_id, category_id, created_at, updated_at)
SELECT
  'stress_txn_' || i,
  'Customer ' || (i % 50000),
  'customer' || (i % 50000) || '@example.com',
  (ARRAY['Approved','Pending','Rejected'])[1 + (i % 3)]::transaction_status,
  NOW() - (i % 730 || ' days')::interval,
  CASE WHEN i % 4 = 0 THEN -(((i % 9000) + 100) * 100) ELSE ((i % 9000) + 100) * 100 END,
  (ARRAY['Credit Card','Bank Transfer','Cash','PayPal','Wire Transfer','Crypto'])[1 + (i % 6)],
  'Stress transaction #' || i || ' for performance testing',
  'stress_user_' || (1 + (i % 800000)),
  'stress_proj_' || (1 + (i % 800000)),
  'cat_stress_' || (1 + (i % 20)),
  NOW() - (i % 730 || ' days')::interval,
  NOW() - (i % 365 || ' days')::interval
FROM generate_series(1, 1000000) AS i
ON CONFLICT (id) DO NOTHING;


-- ── 5. TEAMS (700,000) ─────────────────────────────────────────

INSERT INTO teams (id, name, description, specialization, lead_id, created_at, updated_at)
SELECT
  'stress_team_' || i,
  (ARRAY['Frontend','Backend','DevOps','QA','Design','Data','ML','Security','Mobile','Infra'])[1 + (i % 10)]
    || ' ' || (ARRAY['Squad','Team','Group','Unit','Division','Cell','Pod','Crew','Force','Lab'])[1 + ((i/10) % 10)]
    || ' ' || i,
  'Stress test team #' || i,
  (ARRAY['Frontend','Backend','Full-Stack','DevOps','QA','Design','Data Science','Machine Learning','Security','Infrastructure'])[1 + (i % 10)],
  'stress_user_' || (1 + (i % 800000)),
  NOW() - (i % 730 || ' days')::interval,
  NOW() - (i % 365 || ' days')::interval
FROM generate_series(1, 700000) AS i
ON CONFLICT (id) DO NOTHING;


-- ── 6. BUDGETS (700,000) ───────────────────────────────────────

INSERT INTO budgets (id, name, description, scope, owner_id, target_amount, period_type, start_date, status, is_active, created_at, updated_at)
SELECT
  'stress_budget_' || i,
  (ARRAY['Marketing','Engineering','Sales','Operations','HR','Research','IT','Legal','Finance','Support'])[1 + (i % 10)]
    || ' Budget ' || i,
  'Stress budget #' || i || ' for extreme load testing',
  (ARRAY['personal','project','department','company'])[1 + (i % 4)]::budget_scope,
  'stress_user_' || (1 + (i % 800000)),
  ((i % 100) + 1) * 10000,
  (ARRAY['monthly','quarterly','semiannual','annual','one_time'])[1 + (i % 5)]::budget_period_type,
  NOW() - (i % 365 || ' days')::interval,
  (ARRAY['active','closed','archived'])[1 + (i % 3)]::budget_status,
  i % 3 != 2,
  NOW() - (i % 730 || ' days')::interval,
  NOW() - (i % 180 || ' days')::interval
FROM generate_series(1, 700000) AS i
ON CONFLICT (id) DO NOTHING;


-- ── 7. Refresh indexes ────────────────────────────────────────
ANALYZE users;
ANALYZE projects;
ANALYZE todos;
ANALYZE transactions;
ANALYZE teams;
ANALYZE budgets;

COMMIT;

-- Final counts
SELECT 'users' as tbl, count(*) FROM users
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'todos', count(*) FROM todos
UNION ALL SELECT 'transactions', count(*) FROM transactions
UNION ALL SELECT 'teams', count(*) FROM teams
UNION ALL SELECT 'budgets', count(*) FROM budgets
ORDER BY 1;
