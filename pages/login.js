import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import PageHeading from '../components/PageHeading';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }

    setSubmitting(false);
  };

  return (
    <>
      <Head>
        <title>Sign in | Sphere</title>
      </Head>
      <div className="min-h-screen bg-[#F5F4F6] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white shadow rounded-lg p-8 space-y-6">
          <PageHeading className="text-center">Welcome back</PageHeading>
          <p className="text-sm text-center text-gray-600">
            Sign in to access your Sphere dashboard.
          </p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#331D4C] focus:outline-none focus:ring-1 focus:ring-[#331D4C]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#331D4C] focus:outline-none focus:ring-1 focus:ring-[#331D4C]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center rounded-md bg-[#331D4C] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#241447] disabled:opacity-50"
            >
              {submitting ? 'Please wait...' : 'Sign in'}
            </button>
          </form>
          <p className="text-sm text-center text-gray-600">
            Need help? Contact your administrator.
          </p>
        </div>
      </div>
    </>
  );
}

LoginPage.useLayout = false;
LoginPage.public = true;
