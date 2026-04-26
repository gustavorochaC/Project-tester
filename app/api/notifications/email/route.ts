import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, html, text } = body;

    const profile = await prisma.companyProfile.findUnique({ where: { userId: user.id } });
    const targetEmail = to || profile?.notificationEmail || user.email;

    if (!targetEmail || !subject) {
      return NextResponse.json(
        { error: "Destinatario e assunto sao obrigatorios" },
        { status: 400 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

    // If real Resend API key exists, send real email
    if (resendKey) {
      try {
        // @ts-ignore
        const Resend = require("resend").default;
        const resend = new Resend(resendKey);

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: targetEmail,
          subject,
          html: html || text,
        });

        if (error) {
          return NextResponse.json(
            { error: "Erro Resend: " + error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, sent: true, id: data?.id });
      } catch (err: any) {
        return NextResponse.json(
          { error: "Erro Resend: " + err.message },
          { status: 500 }
        );
      }
    }

    // Fallback: simulated
    console.log(`[SIMULATED EMAIL] To: ${targetEmail} | Subject: ${subject}`);
    if (text) console.log(`Body: ${text}`);

    return NextResponse.json({
      success: true,
      sent: false,
      simulated: true,
      message: `Email simulado para ${targetEmail}. Configure RESEND_API_KEY e FROM_EMAIL no .env para envio real.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao enviar email" },
      { status: 500 }
    );
  }
}
