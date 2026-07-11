import type { Metadata } from "next";
import {
  buildWelperMetadata,
  fetchPublicWelperProfile,
} from "../_shared/profile-data";
import WelperProfilePageClient from "./welper-profile-client";

/**
 * SHARE-003 — server wrapper for the public welper profile.
 *
 * The interactive page stays a client component
 * (`welper-profile-client.tsx`, fetches via React Query); this thin server
 * shell exists so pasted links unfurl with per-welper metadata + the
 * `opengraph-image` card. Unknown/failed profile fetch → generic metadata;
 * the client page renders its own error state.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchPublicWelperProfile(id);
  return buildWelperMetadata(profile);
}

export default async function WelperProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WelperProfilePageClient welperId={id} />;
}
