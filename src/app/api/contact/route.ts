import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { submitContactMessage } from "@/features/admin/content-actions";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for");
    const sourceIp = forwardedFor?.split(",")[0]?.trim() ?? null;
    const userAgent = headerStore.get("user-agent");

    await submitContactMessage(formData, {
      sourceIp,
      userAgent,
    });

    return NextResponse.json({
      ok: true,
      message: "Your message has been received.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit your message.",
      },
      {
        status: 400,
      },
    );
  }
}
