# Roteiro de QA pré-lançamento

Rodar no ambiente de produção real — plataforma em
**https://app.coworkingsocial.com.br** e landing em
**https://coworkingsocial.com.br** — de preferência na véspera do lançamento e
depois de qualquer deploy grande. Marcar cada item com ✅/❌, quem testou e a
data. O que falhar vira issue antes do dia D.

Os testes automatizados (`npm test` e `npm run test:e2e`) cobrem os fluxos em
`localhost`; este roteiro valida o que só aparece no ambiente real: DNS/TLS,
e-mail chegando na caixa de entrada, vídeo transcodificado, celular de verdade.

## 1. Landing e inscrição (domínio principal)

| Item | Como testar | Status / quem / quando |
|---|---|---|
| Landing abre com HTTPS válido | `https://coworkingsocial.com.br` (cadeado, sem aviso) | |
| Rotas da plataforma bloqueadas | `/login` e `/painel` no domínio principal voltam pra landing (pré-lançamento) | |
| Inscrição real completa | Inscrever com um CPF/e-mail reais de teste da equipe; ver "Inscrição recebida!" e a matrícula | |
| E-mail de confirmação chega | Caixa de entrada (e spam) do e-mail usado acima | |
| Inscrição aparece no painel | `/relatorios`: total +1, origem correta se usou UTM | |
| Aviso de privacidade | Aparece na primeira visita, some no "Entendi" e não volta | |
| Link com UTM conta certo | Visitar com `?utm_source=teste-qa&utm_campaign=ensaio` e conferir em `/relatorios` (coluna Visitas) | |
| Preview no WhatsApp | Colar o link num chat: título, descrição e imagem da Roda aparecem | |

## 2. Plataforma (app.coworkingsocial.com.br)

| Item | Como testar | Status / quem / quando |
|---|---|---|
| Primeiro acesso | Com a matrícula da inscrição de teste: criar senha e cair no `/painel` | |
| Login e logout | Sair e entrar de novo com a senha criada | |
| Aula com vídeo hospedado (R2) | Abrir a aula com vídeo enviado: thumbnail de capa, play, seek, fullscreen | |
| Marcar como assistida | Botão vira "Aula concluída" e o progresso da disciplina sobe | |
| Avaliação aprovada e reprovada | Responder certo (aprovado) e errado (abaixo da nota mínima), refazer | |
| Tour guiado | Botão do tour roda os passos com narração (aluno e master) | |
| Assistente de IA | Perguntar algo do material dentro da disciplina e no modo geral (flutuante) | |
| Master: criar/editar aula | Subir um vídeo, salvar a aula depois (o vídeo NÃO pode sumir), excluir aula de teste | |
| Dark mode | Toggle claro/escuro nas duas áreas, sem flash ao recarregar | |
| Celular de verdade | Jornada inteira (inscrição → aula) num Android e num iPhone | |

## 3. Operação

| Item | Como testar | Status / quem / quando |
|---|---|---|
| `/relatorios` completo | Senha, filtros 7/30/90, tabela de origens com visitas e conversão | |
| Vizinho intacto | `https://capacitaportos.com.br` abre normal | |
| Renovação do certificado | `certbot renew --dry-run` no servidor sem erro | |
| Serviço reinicia sozinho | `systemctl restart coworking` e o site volta em segundos | |
| **Ensaio do flip de lançamento** | Em horário calmo: `PLATAFORMA_LIBERADA=sim` no `.env.local` + `systemctl restart coworking`, conferir `/login` abrindo no domínio principal, e **voltar** pra `nao` | |
| Limpeza pós-QA | Excluir a inscrição/conta de teste criadas neste roteiro | |

## Dia do lançamento (operação)

1. Rodar este roteiro inteiro na véspera.
2. No dia: `PLATAFORMA_LIBERADA=sim` em `/home/projetos/Coworking/.env.local`
   e `systemctl restart coworking` (1 minuto, sem rebuild).
3. Smoke manual: landing, login de um aluno real, `/relatorios`.
