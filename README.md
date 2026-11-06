# Task Manager

A browser-based task manager for the Vistula University team assignment. The application uses the Supabase REST API and supports public create, read, update and delete operations on the `tasks` table.

## Student

- Student ID: `79841`
- GitHub repository: https://github.com/vistula-team-project-79841/vistula-task-manager
- Live application: https://vistula-team-project-79841.github.io/vistula-task-manager/
- Supabase project: https://supabase.com/dashboard/project/vuqcmmgozrcangvfeilb

## Files

- `index.html` contains the responsive user interface.
- `app.js` calls the Supabase REST API and implements CRUD operations.
- `config.json` contains the project URL, publishable key and required `tasks` table name.
- `README.md` documents the project and collaboration workflow.

## Data model

The public `tasks` table contains:

- `id` as an auto-generated `int8` primary key
- `title` as `text`
- `description` as `text`
- `completed` as `bool`

Row Level Security is enabled. Separate `anon` policies allow `SELECT`, `INSERT`, `UPDATE` and `DELETE` for this coursework demo. No secret key or legacy `service_role` key is stored in this repository.

## REST API

The application sends requests to:

```text
GET    /rest/v1/tasks?select=*
POST   /rest/v1/tasks
PATCH  /rest/v1/tasks?id=eq.<id>
DELETE /rest/v1/tasks?id=eq.<id>
```

Every request uses the publishable key from `config.json` in the `apikey` header. Supabase RLS policies remain the actual authorization boundary.

## Team workflow

Each student keeps a separate `vistula-task-manager` repository and a separate Supabase project. To complete the collaboration part of the assignment:

1. Student A forks or branches from Student B's repository, makes a small useful change and opens a pull request.
2. Student B reviews and merges that pull request.
3. Student B then makes a different useful change in Student A's repository through a second pull request.
4. Student A reviews and merges the second pull request.

This repository belongs only to student `79841`. A partner must sign in to their own GitHub and Supabase accounts before any work is done in their repository.

The two collaboration Pull Request links will be added here after both students complete and merge the required contributions. The repository owner must not create `contribution.html` or `contribution.json` directly.

## Local use

Serve the folder through a local web server because browsers can block `fetch()` from `file://` pages:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
