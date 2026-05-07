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

interface Favorito {
  id: string;
  licitacao: Licitacao;
}

export default function FavoritosPage() {
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null);

  const fetchFavoritos = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/favoritos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setFavoritos(data);
    } catch {
      console.error('Erro ao buscar favoritos');
    } finally {
      setLoading(false);
    }
  }, [router]);

   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFavoritos(token);
  }, [router, fetchFavoritos]);

  const handleRemoveFavorito = useCallback(async (favoritoId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/favoritos/${favoritoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setFavoritos(favoritos.filter((f) => f.id !== favoritoId));
      }
    } catch {
      console.error('Erro ao remover favorito');
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    router.push('/login');
  }, [router]);

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Favoritos</h1>
          <p className="text-gray-600 mt-2">Licitações que você salvou</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : favoritos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Você ainda não tem favoritos.</p>
            <Link href="/licitacoes" className="text-green-600 hover:text-green-700 font-semibold">
              Ir para Licitações →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favoritos.map((favorito) => (
              <div key={favorito.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{favorito.licitacao.objeto}</h3>
                    <p className="text-gray-600 text-sm mt-1">{favorito.licitacao.orgao}</p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                    ★ FAVORITO
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">UF</p>
                    <p className="font-semibold text-gray-900">{favorito.licitacao.uf}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Município</p>
                    <p className="font-semibold text-gray-900">{favorito.licitacao.municipio}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Modalidade</p>
                    <p className="font-semibold text-gray-900">{favorito.licitacao.modalidade}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor</p>
                    <p className="font-semibold text-gray-900">
                      R$ {favorito.licitacao.valorEstimado.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-600 text-sm">
                    {new Date(favorito.licitacao.dataPublicacao).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLicitacao(favorito.licitacao)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                      Detalhes
                    </button>
                    <button
                      onClick={() => handleRemoveFavorito(favorito.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
