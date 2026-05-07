import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = new URLSearchParams();

    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    const response = await fetch(`http://localhost:3000/api/licitacoes?${params}`, {
      headers: { Authorization: token },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao buscar licitações' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar licitações' }, { status: 500 });
  }
}
