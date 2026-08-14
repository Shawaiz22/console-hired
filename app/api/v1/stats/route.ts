import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth-helpers";
import { getDashboardStats } from "@/modules/dashboard/utils/get-stats";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats(user.id);
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("[stats-endpoint]", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
