# LicitaFácil - Plataforma de Monitoramento de Licitações PNCP

Plataforma web profissional para monitoramento de licitações reais do PNCP (Portal Nacional de Contratações Públicas) dos estados RO, AC, RR, PA e MT.

## Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: JWT + bcrypt
- **Sincronização**: Node Cron (08:00 e 18:00 diariamente)

## Requisitos

- Node.js 18+
- PostgreSQL 12+
- pnpm (gerenciador de pacotes)

## Instalação

1. Clone o repositório:
```bash
cd /home/ubuntu/licitafacil-web
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente no arquivo `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/licitafacil"
JWT_SECRET="your-secret-key-change-in-production"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

4. Configure o banco de dados:
```bash
pnpm run db:push
```

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
# Terminal 1: Inicie o backend Express
pnpm run server

# Terminal 2: Inicie o frontend Next.js
pnpm run dev
```

O frontend estará disponível em `http://localhost:3001` e o backend em `http://localhost:3000`.

## Credenciais de Acesso

- **Email**: jbkjoao2003@gmail.com
- **Senha**: Admin@2025

## Funcionalidades

### Autenticação
- Login com usuário único e fixo
- Sessão persistente com JWT
- Proteção de rotas autenticadas
- Rate limiting (máximo 10 tentativas por minuto)

### Dashboard
- Total de licitações cadastradas
- Data e hora da última sincronização
- Estados monitorados (RO, AC, RR, PA, MT)
- Quantidade de licitações novas nas últimas 24 horas
- Botão para sincronização manual

### Licitações
- Busca por palavra-chave no objeto
- Filtros por: estado, município, modalidade, valor e data
- Listagem com paginação
- Modal com detalhes completos
- Link direto para o PNCP

### Favoritos
- Salvar licitações como favoritas
- Visualizar lista de favoritos
- Remover favoritos

### Alertas
- Criar alertas com palavra-chave, estado e modalidade
- Verificação automática a cada sincronização
- Gerenciamento de alertas ativos/inativos

### Sincronização PNCP
- Sincronização automática às 08:00 e 18:00
- Sincronização ao iniciar o servidor
- Sincronização manual via botão no dashboard
- Deduplicação por número de controle PNCP
- Retry automático com 3 tentativas
- Timeout de 30 segundos por requisição
- Logs de cada execução

## Segurança

- Senhas com hash bcrypt
- Sessões JWT seguras
- Proteção de rotas autenticadas
- Sanitização de inputs com Zod
- Rate limiting em rotas de autenticação

## Build e Deploy

### Build para produção:
```bash
pnpm run build
```

### Validações antes de publicar:
```bash
pnpm run type-check
pnpm run lint
pnpm run build
```

## Estrutura do Projeto

```
licitafacil-web/
├── app/
│   ├── api/              # Rotas API (proxy para Express)
│   ├── dashboard/        # Página do dashboard
│   ├── licitacoes/       # Página de licitações
│   ├── favoritos/        # Página de favoritos
│   ├── alertas/          # Página de alertas
│   ├── login/            # Página de login
│   └── layout.tsx        # Layout principal
├── server/
│   └── index.ts          # Servidor Express
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
├── middleware.ts         # Middleware de autenticação
└── package.json
```

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/licitafacil` |
| `JWT_SECRET` | Chave secreta para JWT | `your-secret-key` |
| `NEXT_PUBLIC_API_URL` | URL da API backend | `http://localhost:3000` |
| `NODE_ENV` | Ambiente de execução | `development` ou `production` |

## Troubleshooting

### Erro de conexão com banco de dados
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais em `DATABASE_URL`
- Execute `pnpm run db:push` para criar as tabelas

### Erro ao sincronizar PNCP
- Verifique a conexão com a internet
- Confirme que a API do PNCP está acessível
- Verifique os logs no servidor Express

### Erro de autenticação
- Limpe os cookies do navegador
- Verifique o token JWT em `localStorage`
- Confirme que o `JWT_SECRET` está correto

## Suporte

Para reportar problemas ou sugerir melhorias, entre em contato.

## Licença

Propriedade privada. Uso restrito.
