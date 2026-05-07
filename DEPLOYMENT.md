# Guia de Deployment - LicitaFácil

Este documento descreve como fazer o deploy do LicitaFácil em produção.

## Arquitetura

- **Frontend**: Next.js 14 → Vercel
- **Backend**: Express.js + Node.js → Render ou Railway
- **Banco de Dados**: PostgreSQL → Neon, Supabase ou Railway

## Pré-requisitos

1. Conta no GitHub (para versionamento)
2. Conta na Vercel (para frontend)
3. Conta no Render ou Railway (para backend)
4. Conta em um serviço de banco PostgreSQL (Neon, Supabase, Railway)

## Passo 1: Preparar o Repositório GitHub

```bash
# Inicializar git (se não estiver)
git init
git add .
git commit -m "Initial commit: LicitaFácil web app"

# Criar repositório no GitHub e fazer push
git remote add origin https://github.com/seu-usuario/licitafacil-web.git
git branch -M main
git push -u origin main
```

## Passo 2: Deploy do Backend no Render

### 2.1 Criar serviço no Render

1. Acesse [render.com](https://render.com)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `licitafacil-backend`
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free (ou pago conforme necessário)

### 2.2 Configurar variáveis de ambiente

No Render, vá para "Environment" e adicione:

```
DATABASE_URL=postgresql://user:password@host:5432/licitafacil
JWT_SECRET=sua-chave-secreta-muito-segura-aqui
NODE_ENV=production
```

### 2.3 Criar banco PostgreSQL

Opção 1: Usar Render PostgreSQL
- No Render, crie um novo "PostgreSQL" database
- Copie a `DATABASE_URL` fornecida

Opção 2: Usar Neon
- Acesse [neon.tech](https://neon.tech)
- Crie um novo projeto
- Copie a connection string

Opção 3: Usar Supabase
- Acesse [supabase.com](https://supabase.com)
- Crie um novo projeto
- Copie a connection string PostgreSQL

### 2.4 Executar migrações

Após o deploy, execute as migrações:

```bash
# No seu ambiente local
DATABASE_URL="postgresql://..." pnpm run db:push
```

## Passo 3: Deploy do Frontend na Vercel

### 3.1 Criar projeto na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New..." → "Project"
3. Selecione seu repositório GitHub
4. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `.next`

### 3.2 Configurar variáveis de ambiente

Na Vercel, vá para "Settings" → "Environment Variables" e adicione:

```
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com
```

Substitua `seu-backend.onrender.com` pela URL do seu backend no Render.

### 3.3 Deploy

Clique em "Deploy" e aguarde a conclusão.

## Passo 4: Testar o Sistema

1. Acesse a URL do frontend (fornecida pela Vercel)
2. Faça login com:
   - Email: `jbkjoao2003@gmail.com`
   - Senha: `Admin@2025`
3. Verifique se o dashboard carrega dados
4. Teste a sincronização manual
5. Teste os filtros de licitações
6. Teste favoritos e alertas

## Passo 5: Configurar Domínio Personalizado (Opcional)

### Frontend (Vercel)

1. No Vercel, vá para "Settings" → "Domains"
2. Adicione seu domínio
3. Configure os DNS records conforme indicado

### Backend (Render)

1. No Render, vá para "Settings" → "Custom Domain"
2. Adicione seu domínio
3. Configure os DNS records

## Troubleshooting

### Erro de conexão com banco de dados

- Verifique se a `DATABASE_URL` está correta
- Confirme que o IP do Render está na whitelist do banco (se aplicável)
- Teste a conexão localmente: `psql $DATABASE_URL`

### Erro de CORS

- Verifique se o `NEXT_PUBLIC_API_URL` está correto no Vercel
- Confirme que o backend permite requisições do domínio do frontend

### Sincronização PNCP não funciona

- Verifique se a API do PNCP está acessível: `curl https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao`
- Confirme que o backend tem acesso à internet

### Erro de autenticação

- Verifique se o `JWT_SECRET` é o mesmo no backend
- Confirme que o token está sendo enviado corretamente no header `Authorization: Bearer <token>`

## Monitoramento

### Logs do Backend (Render)

1. No Render, vá para "Logs"
2. Monitore os logs em tempo real

### Logs do Frontend (Vercel)

1. No Vercel, vá para "Analytics"
2. Visualize métricas de performance

### Banco de Dados

- Use ferramentas como DBeaver ou pgAdmin para monitorar o banco
- Verifique o tamanho das tabelas regularmente

## Backup e Recuperação

### Backup do Banco

```bash
# Fazer backup
pg_dump $DATABASE_URL > backup.sql

# Restaurar
psql $DATABASE_URL < backup.sql
```

### Rollback de Deploy

- **Vercel**: Clique em "Deployments" e selecione uma versão anterior
- **Render**: Clique em "Deployments" e selecione uma versão anterior

## Atualizações Futuras

1. Faça as alterações no código local
2. Commit e push para GitHub: `git push origin main`
3. Vercel e Render farão deploy automaticamente

## Suporte

Para problemas, verifique:
- Logs do Render (backend)
- Logs do Vercel (frontend)
- Logs do banco de dados
- Documentação do LICITAFACIL_README.md

---

**Última atualização**: 2026-05-07
