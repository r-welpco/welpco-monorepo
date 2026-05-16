/** Bump when copy or campaign changes so a new auto-show can run. */
export const WELPER_LAUNCH_ANNOUNCEMENT_STORAGE_KEY =
  "welpco-welper-launch-announcement-v1";

const NEVER_VALUE = "never";

export function isWelperLaunchAnnouncementSuppressed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem(WELPER_LAUNCH_ANNOUNCEMENT_STORAGE_KEY) === NEVER_VALUE
    );
  } catch {
    return false;
  }
}

export function suppressWelperLaunchAnnouncementAutoShow(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WELPER_LAUNCH_ANNOUNCEMENT_STORAGE_KEY, NEVER_VALUE);
  } catch {
    // Ignore private mode / quota errors.
  }
}
