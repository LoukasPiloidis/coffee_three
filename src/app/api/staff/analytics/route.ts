import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsByDateRange } from "@/lib/analytics";
import { isStaffAuthorized } from "@/lib/staff-auth";

export async function GET(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to query params required" },
      { status: 400 }
    );
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays =
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

  if (isNaN(diffDays) || diffDays < 0 || diffDays > 31) {
    return NextResponse.json(
      { error: "Range must be 0-31 days, from <= to" },
      { status: 400 }
    );
  }

  const data = await getAnalyticsByDateRange(from, to);
  return NextResponse.json({ data });
}
