import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const response = await fetch('http://localhost:3000/api/dashboard', {
      headers: { Authorization: token },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao buscar dashboard' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar dashboard' }, { status: 500 });
  }
}
