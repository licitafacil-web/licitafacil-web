'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Licitacao {
  id: string;
  objeto: string;
  orgao: string;
  uf: string;
  municipio: string;
  modalidade: string;
  valorEstimado: number;
  dataPublicacao: string;
  linkPncp: string;
  numeroControlePncp: string;
}

interface PaginatedResponse {
  licitacoes: Licitacao[];
  total: number;
  page: number;
  limit: number;
}

const ESTADOS = ['RO', 'AC', 'RR', 'PA', 'MT'];

export default function LicitacoesPage() {
  const router = useRouter();
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtros
  const [busca, setBusca] = useState('');
  const [estado, setEstado] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Modal
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null);

  const fetchLicitacoes = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.append('busca', busca);
      if (estado) params.append('estado', estado);
      if (municipio) params.append('municipio', municipio);
      if (modalidade) params.append('modalidade', modalidade);
      if (valorMin) params.append('valorMin', valorMin);
      if (valorMax) params.append('valorMax', valorMax);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/licitacoes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data: PaginatedResponse = await response.json();
      setLicitacoes(data.licitacoes);
      setTotal(data.total);
    } catch {
      console.error('Erro ao buscar licitações');
    } finally {
      setLoading(false);
    }
  }, [busca, estado, municipio, modalidade, valorMin, valorMax, dataInicio, dataFim, page]);

   
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchLicitacoes(token);
  }, [router, fetchLicitacoes]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const token = localStorage.getItem('token');
    if (token) fetchLicitacoes(token);
  }, [fetchLicitacoes]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    router.push('/login');
  }, [router]);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-3xl font-bold text-green-900">
            LicitaFácil
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Buscar por objeto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />

              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="">Todos os Estados</option>
                {ESTADOS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Município..."
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />

              <input
                type="text"
                placeholder="Modalidade..."
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="number"
                placeholder="Valor mínimo..."
                value={valorMin}
                onChange={(e) => setValorMin(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />

              <input
                type="number"
                placeholder="Valor máximo..."
                value={valorMax}
                onChange={(e) => setValorMax(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />

              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />

              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : licitacoes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Nenhuma licitação encontrada.</p>
            </div>
          ) : (
            <>
              {licitacoes.map((lic) => (
                <div key={lic.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{lic.objeto}</h3>
                      <p className="text-gray-600 text-sm mt-1">{lic.orgao}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      PNCP
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">UF</p>
                      <p className="font-semibold text-gray-900">{lic.uf}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Município</p>
                      <p className="font-semibold text-gray-900">{lic.municipio}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Modalidade</p>
                      <p className="font-semibold text-gray-900">{lic.modalidade}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Valor</p>
                      <p className="font-semibold text-gray-900">
                        R$ {lic.valorEstimado.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 text-sm">
                      {new Date(lic.dataPublicacao).toLocaleDateString('pt-BR')}
                    </p>
                    <button
                      onClick={() => setSelectedLicitacao(lic)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Detalhes */}
      {selectedLicitacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Licitação</h2>
                <button
                  onClick={() => setSelectedLicitacao(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Objeto</p>
                  <p className="font-semibold text-gray-900">{selectedLicitacao.objeto}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Órgão</p>
                  <p className="font-semibold text-gray-900">{selectedLicitacao.orgao}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">UF</p>
                    <p className="font-semibold text-gray-900">{selectedLicitacao.uf}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Município</p>
                    <p className="font-semibold text-gray-900">{selectedLicitacao.municipio}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Modalidade</p>
                    <p className="font-semibold text-gray-900">{selectedLicitacao.modalidade}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Valor Estimado</p>
                    <p className="font-semibold text-gray-900">
                      R$ {selectedLicitacao.valorEstimado.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Data de Publicação</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedLicitacao.dataPublicacao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Número de Controle PNCP</p>
                  <p className="font-semibold text-gray-900">{selectedLicitacao.numeroControlePncp}</p>
                </div>
                <a
                  href={selectedLicitacao.linkPncp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Ver no PNCP →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
