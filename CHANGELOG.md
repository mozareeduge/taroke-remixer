# TAROKE RIMIXER v07 route-pass

Function-first repair pass after user screenshots.

## Changed

- Replaced cramped one-line route template input with a large textarea.
- Added clickable/tappable slot chips for route templates. A user can write static text and insert variables such as `{above:literal}` or `{above:plural}` at the cursor.
- Added route Move up / Move down buttons. Drag/drop remains available, but route ordering no longer depends on drag/drop.
- Changed draft storage key to avoid restoring the broken previous local draft automatically.
- Cleaned generated line text when a route references a missing slot. A missing `{2:literal}` no longer leaves doubled punctuation such as `PIECE,, maybe`.
- Cleaned migrated note surfaces so old repair cards do not keep doubled punctuation as a display artifact.
- Improved device layout proportions: device list stays narrow; editor receives the larger area; input lanes and route lanes wrap on smaller screens.

## Kept

- Black/white pixel-like monospace interface.
- Editable sample banks, forms, devices, stanza patterns, flow, triggers, surface, run, notes, and export.
- Drag/drop for samples, routes, slots, and scenes where supported.
- JSON and standalone HTML export/import.
