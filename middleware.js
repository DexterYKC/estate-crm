import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {},
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith('/admin')) return token?.role === 'admin';
        if (path.startsWith('/agent')) return token?.role === 'agent' || token?.role === 'admin';
        if (path.startsWith('/mon-compte')) return !!token;
        return true;
      },
    },
    pages: { signIn: '/login' },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/agent/:path*', '/mon-compte/:path*'],
};
