import "server-only";

import nodemailer from "nodemailer";
import { urlDaPlataforma } from "@/lib/urls";

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

/** Aviso curto do fórum (aprovação, resposta nova) com link pro post. */
export async function enviarEmailForum(dados: {
  nome: string;
  email: string;
  assunto: string;
  corpo: string;
  link: string;
}) {
  const remetente = process.env.GMAIL_USER;

  await getTransporter().sendMail({
    from: `"Coworking Social" <${remetente}>`,
    to: dados.email,
    subject: `${dados.assunto} — Fórum CSMG`,
    html: `
      <p>Olá, ${dados.nome}!</p>
      <p>${dados.corpo}</p>
      <p><a href="${dados.link}">Abrir no fórum</a></p>
    `,
  });
}

/** Convite de aluno cadastrado manualmente: matrícula + link do 1º acesso. */
export async function enviarEmailConviteAluno(dados: {
  nome: string;
  email: string;
  matricula: string;
}) {
  const remetente = process.env.GMAIL_USER;
  const app = urlDaPlataforma();

  await getTransporter().sendMail({
    from: `"Coworking Social" <${remetente}>`,
    to: dados.email,
    subject: "Chegou a hora! Seu acesso à plataforma CSMG está liberado",
    html: `
      <p>Olá, ${dados.nome}!</p>
      <p>A 1ª turma do curso de mentoria do <strong>Coworking Social de
      Mudanças Globais</strong> começou — e o seu acesso está liberado.
      <strong>As primeiras aulas já estão disponíveis</strong> na plataforma:
      a apresentação do curso e as mentorias de Empreendedorismo com Legado
      Cultural, Empreender com Organização e Contabilidade e Noções
      Financeiras. Os demais módulos serão liberados ao longo das próximas
      semanas.</p>
      <p><strong>Para entrar (leva 1 minuto):</strong></p>
      <ol>
        <li>Acesse <a href="${app}/primeiro-acesso">${app}/primeiro-acesso</a></li>
        <li>Informe este e-mail e sua matrícula: <strong>${dados.matricula}</strong></li>
        <li>Crie sua senha — e pronto, você cai direto nas aulas.</li>
      </ol>
      <p>Depois disso, seu acesso é sempre por
      <a href="${app}/login">${app}/login</a> (guarde este e-mail: a matrícula
      é o seu número de identificação no curso).</p>
      <p><strong>O que te espera lá dentro:</strong> videoaulas dos
      professores, e-books pra baixar, avaliações pra acompanhar seu
      progresso, um fórum de dúvidas com a turma e um assistente de IA
      disponível a qualquer hora pra te ajudar com o conteúdo. E nas manhãs
      de aula (9h às 12h), os monitores do curso respondem ao vivo pelo
      fórum.</p>
      <p>Qualquer dificuldade pra entrar, é só responder este e-mail.</p>
      <p>Bons estudos!<br/>Equipe CSMG · Coworking Social de Mudanças
      Globais</p>
    `,
  });
}

/**
 * Convite de membro da equipe (monitor/admin): link único pra definir a
 * senha — nenhuma credencial viaja no corpo do e-mail.
 */
export async function enviarEmailConviteMonitor(dados: {
  nome: string;
  email: string;
  linkConvite: string;
}) {
  const remetente = process.env.GMAIL_USER;

  await getTransporter().sendMail({
    from: `"Coworking Social" <${remetente}>`,
    to: dados.email,
    subject: "Convite pra equipe da plataforma CSMG",
    html: `
      <p>Olá, ${dados.nome}!</p>
      <p>Você foi convidado pra equipe da plataforma do Coworking Social de
      Mudanças Globais.</p>
      <p>Para ativar sua conta e escolher sua senha, use este link (válido
      por 24 horas e de uso único):</p>
      <p><a href="${dados.linkConvite}">Ativar minha conta</a></p>
      <p>Depois disso, seu acesso à plataforma é sempre por
      <a href="${urlDaPlataforma()}/login">${urlDaPlataforma()}/login</a>.</p>
      <p>Se você não esperava este convite, ignore este e-mail.</p>
    `,
  });
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
