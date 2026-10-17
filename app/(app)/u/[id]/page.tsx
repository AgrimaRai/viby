"use client";

import { use } from "react";
import { ProfileView } from "@/components/profile/ProfileView";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProfileView profileId={id} />;
}
