import nodemailer from "nodemailer";

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM);
}

export async function sendMail(to: string, subject: string, text: string) {
  if (!mailConfigured()) {
    throw new Error("SMTP is not configured");
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });
}
