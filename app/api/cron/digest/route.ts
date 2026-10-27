import { mailConfigured } from "@/lib/mail";
import { sendDueDigests } from "@/lib/digest";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!mailConfigured()) {
    return Response.json({ error: "SMTP is not configured" }, { status: 503 });
  }

  const result = await sendDueDigests();
  return Response.json(result);
}
