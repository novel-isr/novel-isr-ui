# Upload and Steps

`Upload` is controlled presentation, not an upload client. Pass `value` items with
`id`, `name` and `status` (`uploading`, `done`, `error`). Optional `error` and
`previewUrl` render per-file feedback. `onFilesSelected` receives validated files;
the application owns signing, transport, cancellation and persisted URLs.
`onRetry` and `onRemove` receive the same item. Removing a pending item should
cancel its transport in the application.

Use `accept`, `maxSize` (bytes), `maxCount`, `multiple` and `disabled` to constrain
selection. Enforce those restrictions on the server as well. `busy` blocks new
selection and retry but allows removal/cancellation. Single-file `replace` lets
the user choose a replacement without discarding the persisted file first.
No SDK, storage endpoint, authentication or browser test runner is bundled.

`Steps` accepts `items: { value, label, disabled? }[]`, current `value` and optional
`onValueChange`. It reports navigation only; applications own validation and
workflow transitions. Terminal states must be disabled until real completion.
