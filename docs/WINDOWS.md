# Run the learning platform on Windows

1. Download/clone the **develop** branch and extract the entire project to a local folder (not inside the ZIP).
2. Double-click **start-windows.bat** in that folder.
3. Allow Windows installation prompts if prerequisites are missing. Complete Docker Desktop's first-run screen if shown. If setup requests a restart, restart Windows and double-click the same file again.
4. Wait for the browser to open, register, and open the verification email in the local inbox.

| Action | File / address |
| --- | --- |
| Install/check prerequisites and start | `start-windows.bat` |
| Stop without deleting data | `stop-windows.bat` |
| English interface | <http://localhost:3000/en/register> |
| Persian interface | <http://localhost:3000/fa/register> |
| Local verification, recovery and invitation emails | <http://localhost:8025> |

Windows PowerShell is already included in Windows. The launcher uses WinGet to install Docker Desktop when missing, requests WSL setup when necessary, and waits for the Linux container engine. Docker installs the pinned Node/pnpm dependencies, PostgreSQL and Mailpit inside containers; no host Node, pnpm, Git or database installation is needed. First launch requires internet and can take several minutes. Later launches reuse cached images and installed packages; changing code triggers an incremental rebuild.

Use a currently supported Windows desktop version meeting [Docker Desktop's requirements](https://docs.docker.com/desktop/setup/install/windows-install/), with hardware virtualization enabled. Administrator approval or a Windows restart can be necessary for installation/WSL. The launcher does not reboot automatically, change system-wide PowerShell policy, or modify BIOS settings. If WinGet is missing, it opens the Microsoft App Installer page and explains how to continue. Installation agreements are accepted by the WinGet command; Docker Desktop may still display its own first-run setup.

## What is stored

`.env.windows` is created only on the first launch with cryptographically random authentication and mail encryption keys. It is excluded from Git and Docker build contexts. Preserve this file: resetting the keys invalidates sessions and can make pending email unreadable. An existing malformed file produces an error rather than being overwritten. The normal `.env` and normal `compose.yaml` setup are independent.

The Windows stack uses the named Docker volumes `learning-platform-windows_windows-postgres-data` and `learning-platform-windows_windows-content-data`. Stopping, closing the launcher window, restarting Windows or rebuilding containers preserves accounts, workspaces, content versions and private attachments. Preserve both volumes together: the database stores attachment bindings and the content volume stores their bytes. Keep this project folder and configuration when upgrading the source; only one Windows stack runs at a time on these ports.

## Troubleshooting

- Docker never becomes ready: open Docker Desktop, follow its WSL/update/restart instructions, check hardware virtualization, then rerun the launcher. Docker must use Linux containers.
- Ports 3000 or 8025 are busy: stop the other program or the original development stack, then rerun. The launcher does not terminate unrelated processes.
- Image/package download fails: check connectivity to Docker Hub and npm, then rerun. Partial installation and existing data are retained.
- Build/migration/health check fails: read the console output; it remains open. Inspect logs with `docker compose --env-file .env.windows -f compose.windows.yaml logs --tail 100` from the project folder.
- The page loads but your email is missing: inspect the worker logs and the local inbox. Mailpit captures local mail; nothing is sent to your real mailbox.

## Execution boundary and validation

This is the local **Foundation and Content engine** development stack, accessible through loopback ports. Web and worker use development mode so HTTP localhost and local SMTP work; production HTTPS/SMTP guards remain enabled in production. It includes the bilingual editor, reviewed imports, immutable publication and ZIP export; see [Content](CONTENT.md). Application, identity and email worker use separate database roles; migrations run before the web/worker start. Runtime containers run as the ordinary `node` user.

CI checks PowerShell syntax using Windows PowerShell 5.1 and boots the actual Docker stack on Linux, exercising real registration, verification mail, login, content import/publication/export and repeated startup against the same persisted database and private attachment volume. Full Docker Desktop installation, UAC, WSL and reboot behavior must be confirmed on an actual Windows PC; hosted Windows CI cannot validate that desktop setup flow.
