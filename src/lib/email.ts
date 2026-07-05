import "server-only";

import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Variáveis GMAIL_USER e GMAIL_APP_PASSWORD são obrigatórias para enviar e-mails.",
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }

  return transporter;
}

export async function enviarEmailConfirmacaoInscricao(dados: {
  nome: string;
  email: string;
  matricula: string;
}) {
  const remetente = process.env.GMAIL_USER;

  await getTransporter().sendMail({
    from: `"Coworking Social" <${remetente}>`,
    to: dados.email,
    subject: "Inscrição confirmada",
    html: `
      <p>Olá, ${dados.nome}!</p>
      <p>Sua inscrição foi recebida com sucesso.</p>
      <p>Seu número de matrícula é: <strong>${dados.matricula}</strong></p>
      <p>Guarde este número: ele identifica você na plataforma. Em breve
      enviaremos os próximos passos para acessar os cursos.</p>
    `,
  });
}
