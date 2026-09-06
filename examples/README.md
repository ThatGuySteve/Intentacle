# Quickstart records

These are manually authored walkthroughs, separate from the twelve regression
fixtures. Their task IDs match their filenames.

- `review.task.json`: review broken behavior without editing files. The user has
  delegated report format, but has not supplied the app. The next step is
  `inspect`, so a guarded export refuses with exit code 3.
- `constraints.task.json`: inspect a supplied small function while preserving
  its signature. The source is present, and an optional tone question does not
  block inspection, so a guarded export succeeds.

The CLI tests exercise both paths. These records demonstrate different states;
they are not copies that need to stay synchronized with fixture files. The
literal `init` command does not automatically produce these structured examples.
