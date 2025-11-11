import '../styles/globals.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function AppInner({ Component, pageProps }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(router.pathname);
  const useLayout = Component.useLayout !== false;

  if (!isPublicRoute && loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F5F4F6] text-gray-600">
        Checking your session...
      </div>
    );
  }

  if (!isPublicRoute && !user && !loading) {
    return null;
  }

  const content = <Component {...pageProps} />;

  if (useLayout && !isPublicRoute) {
    return <Layout>{content}</Layout>;
  }

  return content;
}

function MyApp(props) {
  return (
    <AuthProvider>
      <AppInner {...props} />
    </AuthProvider>
  );
}

export default MyApp;
