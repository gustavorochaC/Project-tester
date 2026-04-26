import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  try {
    const res = await fetch(
      "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
      { headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" } }
    );
    const data = await res.json();

    const orgs = [];
    for (const item of data.elements || []) {
      const orgId = item.organizationalTarget.split(":").pop();
      const orgRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" },
      });
      const orgData = await orgRes.json();
      orgs.push({ id: orgId, name: orgData.localizedName || orgId });
    }

    return NextResponse.json(orgs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
