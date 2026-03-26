import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (!scriptUrl) {
      console.warn("[unsubscribe] GOOGLE_APPS_SCRIPT_URL not configured");
      return NextResponse.json({ success: true });
    }

    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "0",
      },
      body: JSON.stringify({
        action: "add_unsubscribe",
        email: email.toLowerCase().trim(),
        source: "email_link",
      }),
      redirect: "follow",
    });

    if (!res.ok) {
      console.error("[unsubscribe] Apps Script error:", res.status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[unsubscribe] Error:", error);
    return NextResponse.json({ success: true });
  }
}
