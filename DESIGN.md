# Goal
---
Build a web application that renders **1,000,000** checkboxes on the screen and allows multiple users to toggle those checkboxes in real time, with all changes synchronized instantly across all connected clients, thereby enabling a collaborative checkbox interface.

## Data management
---
For effective state management, all checkbox values are stored in a bitset-based data structure. Below are the core parameters:

- Checkboxes: **1,048,560**
- Buffer Array Size: **65,535** elements
- Chunk Size: **16** checkboxes (bits) per chunk
- Per-Message Overhead: **4** bytes per toggle (excluding real-time protocol overhead)

## Frontend requirements
---
**Virtualized Rendering**: The UI uses windowed or virtualized rendering for the 1+ million checkboxes, displaying only those within the user’s current viewport.

**4×4 Sub-Chunks**: For more efficient change detection within the viewport, each “chunk” of rendered checkboxes is further divided into sub-chunks of 16 elements (4×4). This lets you compare just two bytes to detect updates (since 16 bits fit in two bytes).

**Flexible Chunk Management(Optional)**: If needed, chunks can be split into smaller parts or merged into larger ones, using masking to handle partial or more granular updates.

**Batching Toggles**: Each checkbox toggle schedules a message to be sent. If no additional toggles occur in the same sub-chunk within a short timeout, the UI sends a batched update over the WebSocket connection. This reduces the number of small messages and network overhead.

## Backend requirements
---
...