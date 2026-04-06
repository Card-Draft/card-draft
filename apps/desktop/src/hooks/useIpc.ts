/**
 * Typed IPC helpers.
 * The window.api object is already fully typed via ipc-types.ts,
 * so these are thin convenience wrappers that can add error handling.
 */

export function useApi() {
  return window.api
}
