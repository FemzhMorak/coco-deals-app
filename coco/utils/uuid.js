// Lightweight local UUID v4 generator — no network call, no extra native
// dependency. Not cryptographically secure, which is fine here: it's only
// ever used as a locally-generated anonymous member id / handle suffix.
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
