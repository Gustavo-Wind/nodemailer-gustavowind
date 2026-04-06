import fastify from 'fastify';
import cors from '@fastify/cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const app = fastify();
const resend = new Resend(process.env.RESEND_API_KEY);

app.register(cors, {
  origin: "*"
});

app.post("/send-email", async (request, response) => {
  const { to, subject, text, html } = request.body as any;

  try {
    const data = await resend.emails.send({
      from: 'gustavowinddeveloper@gmail.com',
      to,
      subject,
      html: html || `<p>${text}</p>`
    });

    console.log(data);

    return response.status(200).send({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);

    return response.status(500).send({
      success: false,
      error
    });
  }
});

app.listen({ port: 5000 }, () => {
  console.log("Servidor rodando 🚀");
});