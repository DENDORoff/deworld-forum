import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server-auth";

/** /profile → редирект на профиль текущего пользователя. */
export default function ProfileIndexPage() {
  return (
    <Suspense>
      <ProfileRedirect />
    </Suspense>
  );
}

async function ProfileRedirect() {
  const session = await getServerSession();
  const username = session?.user?.username;
  if (!session?.user) redirect("/signin?callbackUrl=/profile");
  if (!username) redirect("/settings");
  redirect(`/profile/${username}`);
  return null;
}

