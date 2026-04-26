import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({
        success: true,
        simulated: true,
        url: "https://via.placeholder.com/800x800.png?text=Simulated+Image",
        message: "Cloudinary not configured. Using simulated URL.",
      });
    }

    const url = await uploadToCloudinary(file);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
