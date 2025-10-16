Queue setup (dev)

This project uses Laravel queues for background jobs (emails are queued).

1) Database driver (simple, no extra deps):

- Create the jobs table migration (already added):
  php artisan migrate

- Start a worker locally:
  # Run from project root (PowerShell)
  php artisan queue:work --tries=3

2) Quick notes:
- In .env set QUEUE_CONNECTION=database
- For production prefer redis and a supervisor to run `php artisan queue:work`

3) Testing
- The test suite uses Mail::fake() and Mail::assertQueued(), so you don't need a running queue when running tests.

4) Troubleshooting
- If jobs are not processed, check php artisan queue:failed-list and the logs.
