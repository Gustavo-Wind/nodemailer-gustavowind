import "dotenv/config";
import fastify from "fastify";
import cors from "@fastify/cors";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY não definida.");
}

const app = fastify({ logger: true });
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmailSchema = {
  body: {
    type: "object",
    required: ["to", "subject"],
    properties: {
      to: {
        oneOf: [
          { type: "string", format: "email" },
          { type: "array", items: { type: "string", format: "email" }, minItems: 1 },
        ],
      },
      subject: { type: "string", minLength: 1, maxLength: 200 },
      text:    { type: "string", maxLength: 50000 },
      html:    { type: "string", maxLength: 50000 },
    },
    additionalProperties: false,
  },
};

interface SendEmailBody {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

app.post<{ Body: SendEmailBody }>(
  "/send-email",
  { schema: sendEmailSchema },
  async (request, reply) => {
    const { to, subject, text, html } = request.body;

    try {
      const data = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "noreply@seudominio.com.br",
        to,
        subject,
        html: html ?? `<p>${text ?? ""}</p>`,
      });

      if (data.error) {
        app.log.warn(data.error, "Resend retornou erro");
        return reply.status(400).send({ success: false, message: data.error.message });
      }

      return reply.status(200).send({ success: true, id: data.data?.id });

    } catch (error) {
      app.log.error(error, "Erro ao enviar e-mail");
      return reply.status(500).send({
        success: false,
        message: "Erro interno ao enviar e-mail.",
      });
    }
  }
);


async function start() {
  try {
    await app.register(cors, {
      origin: [
        "http://localhost:3000",
        process.env.FRONTEND_URL ?? "http://localhost:3000",
      ],
      methods: ["POST"],
    });

    await app.listen({
      port: Number(process.env.PORT) || 5000,
      host: "0.0.0.0",
    });

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();