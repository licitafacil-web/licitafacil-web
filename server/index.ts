import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import axios from 'axios';

dotenv.config({ path: '.env.local' });

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 tentativas
  message: 'Muitas tentativas de login. Tente novamente mais tarde.',
});

// Tipos
interface AuthRequest extends Request {
  user?: { email: string };
}

// Schemas Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const alertaSchema = z.object({
  palavraChave: z.string().min(1),
  estado: z.string().min(2),
  modalidade: z.string().optional(),
});

// Middleware de autenticação
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido' });
  }
};

// PASSO 2: Autenticação
app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Usuário fixo
    const VALID_EMAIL = 'jbkjoao2003@gmail.com';
    const VALID_PASSWORD_HASH = await bcryptjs.hash('Admin@2025', 10);

    if (email !== VALID_EMAIL) {
      return res.status(401).json({ error: 'Acesso não autorizado.' });
    }

    const passwordMatch = await bcryptjs.compare(password, VALID_PASSWORD_HASH);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Acesso não autorizado.' });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Bem-vindo, João.' });
  } catch {
    res.status(400).json({ error: 'Erro ao fazer login' });
  }
});

// PASSO 3 & 4: Sincronização PNCP
const PNCP_API_URL = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao';
const ESTADOS = ['RO', 'AC', 'RR', 'PA', 'MT'];

async function sincronizarPNCP() {
  let totalImportado = 0;
  const erros: string[] = [];

  try {
    for (const estado of ESTADOS) {
      try {
        const response = await axios.get(PNCP_API_URL, {
          params: { uf: estado },
          timeout: 30000,
        });

        const licitacoes = response.data?.data || [];

        for (const lic of licitacoes) {
          try {
            // Verificar duplicação
            const existe = await prisma.licitacao.findUnique({
              where: { numeroControlePncp: lic.numeroControlePncp },
            });

            if (!existe) {
              await prisma.licitacao.create({
                data: {
                  objeto: lic.objeto || '',
                  orgao: lic.orgao || '',
                  uf: lic.uf || estado,
                  municipio: lic.municipio || '',
                  modalidade: lic.modalidade || '',
                  valorEstimado: parseFloat(lic.valorEstimado) || 0,
                  dataPublicacao: new Date(lic.dataPublicacao) || new Date(),
                  linkPncp: lic.linkPncp || '',
                  numeroControlePncp: lic.numeroControlePncp,
                },
              });
              totalImportado++;
            }
          } catch {
            erros.push(`Erro ao processar licitação ${lic.numeroControlePncp}`);
          }
        }
      } catch {
        erros.push(`Erro ao sincronizar estado ${estado}`);
      }
    }

    // Registrar sincronização
    await prisma.syncLog.create({
      data: {
        status: 'sucesso',
        quantidade: totalImportado,
        erros: erros.length > 0 ? erros.join('; ') : null,
      },
    });

    console.log(`Sincronização concluída: ${totalImportado} licitações importadas`);
  } catch {
    console.error('Erro na sincronização PNCP');
    await prisma.syncLog.create({
      data: {
        status: 'erro',
        quantidade: totalImportado,
        erros: 'Erro geral na sincronização',
      },
    });
  }
}

// PASSO 4: Cron jobs para sincronização automática
cron.schedule('0 8 * * *', () => {
  console.log('Executando sincronização automática às 08:00');
  sincronizarPNCP();
});

cron.schedule('0 18 * * *', () => {
  console.log('Executando sincronização automática às 18:00');
  sincronizarPNCP();
});

// Sincronização manual
app.post('/api/sync/manual', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await sincronizarPNCP();
    res.json({ message: 'Sincronização iniciada' });
  } catch {
    res.status(500).json({ error: 'Erro ao sincronizar' });
  }
});

// PASSO 5: Dashboard
app.get('/api/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const totalLicitacoes = await prisma.licitacao.count();
    const ultimaSincronizacao = await prisma.syncLog.findFirst({
      orderBy: { executadoEm: 'desc' },
    });

    const agora = new Date();
    const ontemMeia = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    const novasHoje = await prisma.licitacao.count({
      where: { criadoEm: { gte: ontemMeia } },
    });

    res.json({
      totalLicitacoes,
      ultimaSincronizacao: ultimaSincronizacao?.executadoEm || null,
      estadosMonitorados: ESTADOS,
      novasHoje,
    });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

// PASSO 6: Licitações com filtros
app.get('/api/licitacoes', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { busca, estado, municipio, modalidade, valorMin, valorMax, dataInicio, dataFim, page = 1, limit = 20 } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (busca) where.objeto = { contains: String(busca), mode: 'insensitive' };
    if (estado) where.uf = String(estado);
    if (municipio) where.municipio = { contains: String(municipio), mode: 'insensitive' };
    if (modalidade) where.modalidade = String(modalidade);

    if (valorMin || valorMax) {
      where.valorEstimado = {};
      if (valorMin) where.valorEstimado.gte = parseFloat(String(valorMin));
      if (valorMax) where.valorEstimado.lte = parseFloat(String(valorMax));
    }

    if (dataInicio || dataFim) {
      where.dataPublicacao = {};
      if (dataInicio) where.dataPublicacao.gte = new Date(String(dataInicio));
      if (dataFim) where.dataPublicacao.lte = new Date(String(dataFim));
    }

    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

    const licitacoes = await prisma.licitacao.findMany({
      where,
      skip,
      take: parseInt(String(limit)),
      orderBy: { dataPublicacao: 'desc' },
    });

    const total = await prisma.licitacao.count({ where });

    res.json({ licitacoes, total, page: parseInt(String(page)), limit: parseInt(String(limit)) });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar licitações' });
  }
});

// PASSO 6: Detalhes da licitação
app.get('/api/licitacoes/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const licitacao = await prisma.licitacao.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!licitacao) {
      return res.status(404).json({ error: 'Licitação não encontrada' });
    }

    res.json(licitacao);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar licitação' });
  }
});

// PASSO 7: Favoritos
app.post('/api/favoritos', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { licitacaoId } = req.body;

    const favorito = await prisma.favorito.create({
      data: { licitacaoId },
    });

    res.json(favorito);
  } catch {
    res.status(500).json({ error: 'Erro ao adicionar favorito' });
  }
});

app.get('/api/favoritos', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const favoritos = await prisma.favorito.findMany({
      include: { licitacao: true },
      orderBy: { criadoEm: 'desc' },
    });

    res.json(favoritos);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

app.delete('/api/favoritos/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.favorito.delete({
      where: { id: String(req.params.id) },
    });

    res.json({ message: 'Favorito removido' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

// PASSO 8: Alertas
app.post('/api/alertas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { palavraChave, estado, modalidade } = alertaSchema.parse(req.body);

    const alerta = await prisma.alerta.create({
      data: { palavraChave, estado, modalidade },
    });

    res.json(alerta);
  } catch {
    res.status(400).json({ error: 'Erro ao criar alerta' });
  }
});

app.get('/api/alertas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const alertas = await prisma.alerta.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: 'desc' },
    });

    res.json(alertas);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

app.delete('/api/alertas/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.alerta.update({
      where: { id: String(req.params.id) },
      data: { ativo: false },
    });

    res.json({ message: 'Alerta desativado' });
  } catch {
    res.status(500).json({ error: 'Erro ao desativar alerta' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Iniciar sincronização ao ligar o servidor
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  
  // Sincronizar ao iniciar
  console.log('Executando sincronização inicial...');
  await sincronizarPNCP();
});

export default app;
