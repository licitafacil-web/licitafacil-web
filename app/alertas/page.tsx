'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Alerta {
  id: string;
  palavraChave: string;
  estado: string;
  modalidade: string | null;
  ativo: boolean;
  criadoEm: string;
}

const ESTADOS = ['RO', 'AC', 'RR', 'PA', 'MT'];

export default function AlertasPage() {
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [palavraChave, setPalavraChave] = useState('');
  const [estado, setEstado] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAlertas = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/alertas', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setAlertas(data);
    } catch {
      console.error('Erro ao buscar alertas');
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
    fetchAlertas(token);
  }, [router, fetchAlertas]);

  const handleCreateAlerta = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/alertas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          palavraChave,
          estado,
          modalidade: modalidade || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setFormError(data.error || 'Erro ao criar alerta');
        return;
      }

      // Recarregar alertas
      fetchAlertas(token);
      setPalavraChave('');
      setEstado('');
      setModalidade('');
      setShowForm(false);
    } catch {
      setFormError('Erro ao conectar ao servidor');
    } finally {
      setFormLoading(false);
    }
  }, [fetchAlertas]);

  const handleDeleteAlerta = useCallback(async (alertaId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/alertas/${alertaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setAlertas(alertas.filter((a) => a.id !== alertaId));
      }
    } catch {
      console.error('Erro ao deletar alerta');
    }
  }, [alertas]);

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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
            <p className="text-gray-600 mt-2">Configure alertas para novas licitações</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            {showForm ? 'Cancelar' : '+ Novo Alerta'}
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <form onSubmit={handleCreateAlerta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Palavra-chave *
                </label>
                <input
                  type="text"
                  value={palavraChave}
                  onChange={(e) => setPalavraChave(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Ex: construção, consultoria..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  >
                    <option value="">Selecione um estado</option>
                    {ESTADOS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modalidade (opcional)
                  </label>
                  <input
                    type="text"
                    value={modalidade}
                    onChange={(e) => setModalidade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Ex: licitação aberta..."
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {formLoading ? 'Criando...' : 'Criar Alerta'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de Alertas */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : alertas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Você ainda não tem alertas configurados.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              Criar primeiro alerta →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{alerta.palavraChave}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Estado: <span className="font-semibold">{alerta.estado}</span>
                      {alerta.modalidade && (
                        <>
                          {' '}
                          | Modalidade: <span className="font-semibold">{alerta.modalidade}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      alerta.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {alerta.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-600 text-sm">
                    Criado em {new Date(alerta.criadoEm).toLocaleDateString('pt-BR')}
                  </p>
                  <button
                    onClick={() => handleDeleteAlerta(alerta.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
