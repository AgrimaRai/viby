"use client";

import { use } from "react";
import { ImmersiveProfile } from "@/components/discover/ImmersiveProfile";

export default function DiscoverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ImmersiveProfile profileId={id} />;
}
