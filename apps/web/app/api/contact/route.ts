import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSmtpTransport,
  getContactAckHtml,
  getContactAckSubject,
  getContactNotificationHtml,
  getContactNotificationSubject,
  sendMail,
} from "@welpco/email";

const ContactSchema = z.object({
  role: z.string().min(1, "Role is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().min(1, "Message is required").max(5000),
  locale: z.enum(["en", "fr"]).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { role, name, email, phone, message, locale: localeInput } = parsed.data;
  const locale = localeInput ?? "en";
  const publicAppUrl = process.env.PUBLIC_APP_URL;
  const inbox = process.env.CONTACT_INBOX ?? "support@welpco.com";

  const formData = { role, name, email, phone, message };

  try {
    const transport = createSmtpTransport();
    await sendMail(
      {
        to: inbox,
        subject: getContactNotificationSubject(formData),
        html: getContactNotificationHtml(formData, locale, publicAppUrl),
      },
      transport,
    );
    await sendMail(
      {
        to: email,
        subject: getContactAckSubject(locale),
        html: getContactAckHtml(name, locale, publicAppUrl),
      },
      transport,
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] send failed", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 },
    );
  }
}
