import { fetchPublicWelperProfileByHandle } from "../../welper/_shared/profile-data";
import {
  OG_IMAGE_ALT,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderWelperOgImage,
} from "../../welper/_shared/profile-og";

/**
 * SHARE-002/003 — same dynamic OG card as `/welper/[id]`, resolved by
 * handle. Unresolvable handle → static branded fallback card (never a 500).
 */

export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await fetchPublicWelperProfileByHandle(handle);
  return renderWelperOgImage(profile);
}
