import { fetchPublicWelperProfile } from "../_shared/profile-data";
import {
  OG_IMAGE_ALT,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderWelperOgImage,
} from "../_shared/profile-og";

/**
 * SHARE-003 — dynamic 1200×630 OG card for `/welper/[id]`.
 * Never 500s: unknown welper or any render failure falls back to the static
 * branded card (see `renderWelperOgImage`).
 */

export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await fetchPublicWelperProfile(id);
  return renderWelperOgImage(profile);
}
