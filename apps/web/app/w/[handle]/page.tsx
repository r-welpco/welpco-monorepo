import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildWelperMetadata,
  fetchPublicWelperProfileByHandle,
} from "../../welper/_shared/profile-data";
import WelperProfilePageClient from "../../welper/[id]/welper-profile-client";

/**
 * SHARE-002 (web half) — vanity handle route `welpco.com/w/{handle}`.
 *
 * Resolves the handle via the BFF (`/api/search/welpers/by-handle/:handle`)
 * and renders the same client profile page as `/welper/[id]`. The resolve
 * endpoint ships from the BFF separately — until it exists (or on any
 * 404/error) this route is a clean `notFound()`. The canonical URL is the
 * handle URL itself (SHARE-002 acceptance criteria); the UUID route keeps
 * working independently.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await fetchPublicWelperProfileByHandle(handle);
  return buildWelperMetadata(profile, { canonicalPath: `/w/${handle}` });
}

export default async function WelperHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await fetchPublicWelperProfileByHandle(handle);
  if (!profile) notFound();
  return <WelperProfilePageClient welperId={profile.welperId} />;
}
