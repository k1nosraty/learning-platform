import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DomainError } from "../../domain/src/workspaces/permissions";

// Private mounted storage. Application services resolve authorized DB bindings
// before reading; user filenames never become object keys or filesystem paths.
export interface ContentStorage {
  put(workspaceId: string, bytes: Buffer): Promise<string>;
  get(key: string): Promise<Buffer>;
}
const validKey = /^[a-f0-9-]{36}\/[a-f0-9-]{36}$/;
export const contentStorage: ContentStorage = {
  async put(workspaceId, bytes) {
    const key = `${workspaceId}/${randomUUID()}`;
    if (!validKey.test(key)) throw new Error("Invalid storage key");
    const root = resolve(
      /*turbopackIgnore: true*/ process.env.CONTENT_STORAGE_DIR ??
        ".content-storage",
    );
    await mkdir(resolve(root, workspaceId), { recursive: true, mode: 0o700 });
    await writeFile(resolve(root, key), bytes, { flag: "wx", mode: 0o600 });
    return key;
  },
  async get(key) {
    if (!validKey.test(key)) throw new Error("Invalid storage key");
    try {
      return await readFile(
        /*turbopackIgnore: true*/ resolve(
          /*turbopackIgnore: true*/ process.env.CONTENT_STORAGE_DIR ??
            ".content-storage",
          key,
        ),
      );
    } catch {
      throw new DomainError("FILE_UNAVAILABLE", 503);
    }
  },
};
