# Examples Directory

This folder contains sanitized, small-scale samples that mirror the observed structure of the uploaded Tinder and Hinge exports.
They are intended for parser development, automated tests, and documentation so we can discuss schema expectations without storing
personally identifying information.

- `hinge/messages_sample.csv` — Conversations joined with prompt metadata and delivery status flags.
- `hinge/matches_sample.csv` — Match roster with origin context, match type, and demographic snapshots.
- `tinder/messages_sample.json` — Bundle containing both messages and match metadata from a Tinder data download.

Each file keeps the original field names and value formats seen in the exports (ISO timestamps, role labels, nested match
structure) so the normalization layer can be verified locally. When the upstream platforms introduce new columns, add a reduced
sample here to document the change alongside parser updates.
