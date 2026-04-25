import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { phone, message } = body;

    const profile = await prisma.companyProfile.findUnique({
      where: { userId: user.id },
    });

    const targetPhone = phone || profile?.whatsapp;

    if (!targetPhone) {
      return NextResponse.json(
        { error: "Numero de WhatsApp nao configurado" },
        { status: 400 }
      );
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_WHATSAPP_NUMBER;

    // If real Twilio credentials exist, send real message
    if (twilioSid && twilioToken && twilioPhone) {
      try {
        // @ts-ignore
        const twilio = require("twilio").default;
        const client = twilio(twilioSid, twilioToken);

        await client.messages.create({
          body: message,
          from: `whatsapp:${twilioPhone}`,
          to: `whatsapp:${targetPhone}`,
        });

        return NextResponse.json({ success: true, sent: true });
      } catch (err: any) {
        return NextResponse.json(
          { error: "Erro Twilio: " + err.message },
          { status: 500 }
        );
      }
    }

    // Fallback: simulated
    console.log(`[SIMULATED WHATSAPP] To: ${targetPhone} | Message: ${message}`);

    return NextResponse.json({
      success: true,
      sent: false,
      simulated: true,
      message: `Mensagem simulada para ${targetPhone}. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_NUMBER no .env para envio real.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao enviar WhatsApp" },
      { status: 500 }
    );
  }
}
