'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardData {
  totalLicitacoes: number;
  ultimaSincronizacao: string | null;
  estadosMonitorados: string[];
  novasHoje: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const userName = useMemo(() => {
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email.split('@')[0].charAt(0).toUpperCase() + payload.email.split('@')[0].slice(1);
    } catch {
      return 'Usuário';
    }
  }, [token]);

  const fetchDashboard = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch {
      console.error('Erro ao buscar dashboard');
    } finally {
      setLoading(false);
    }
  }, [router]);

   
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard(token);
  }, [router, fetchDashboard, token]);

  const handleSync = useCallback(async () => {
    setSyncLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/sync/manual', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Recarregar dados após sincronização
        setTimeout(() => {
          if (token) fetchDashboard(token);
        }, 2000);
      }
      setSyncLoading(false);
    } catch {
      console.error('Erro ao sincronizar');
      setSyncLoading(false);
    }
  }, [fetchDashboard]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    router.push('/login');
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-900">LicitaFácil</h1>
            <p className="text-gray-600 text-sm">Bem-vindo, {userName}.</p>
          </div>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total de Licitações</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{data?.totalLicitacoes || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Novas Hoje</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{data?.novasHoje || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Estados Monitorados</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{data?.estadosMonitorados.length || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Última Sincronização</p>
            <p className="text-sm font-semibold text-gray-700 mt-2">
              {data?.ultimaSincronizacao
                ? new Date(data.ultimaSincronizacao).toLocaleString('pt-BR')
                : 'Nunca'}
            </p>
          </div>
        </div>

        {/* Estados Monitorados */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estados Monitorados</h2>
          <div className="flex flex-wrap gap-2">
            {data?.estadosMonitorados.map((estado) => (
              <span
                key={estado}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {estado}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={handleSync}
            disabled={syncLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {syncLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sincronizando...
              </>
            ) : (
              'Atualizar Agora'
            )}
          </button>

          <Link
            href="/licitacoes"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition text-center"
          >
            Ver Licitações
          </Link>

          <Link
            href="/favoritos"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition text-center"
          >
            Favoritos
          </Link>
        </div>

        {/* Alerts Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Alertas</h2>
            <Link href="/alertas" className="text-green-600 hover:text-green-700 font-semibold">
              Gerenciar →
            </Link>
          </div>
          <p className="text-gray-600">Configure alertas para receber notificações sobre novas licitações que correspondem aos seus critérios.</p>
        </div>
      </main>
    </div>
  );
}
