import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Rotas públicas
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.next();
  }

  // Rotas protegidas
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/licitacoes') || pathname.startsWith('/favoritos') || pathname.startsWith('/alertas')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
