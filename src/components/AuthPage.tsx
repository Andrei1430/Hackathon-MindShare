import { useState } from 'react';
import { LogIn, UserPlus, Brain, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name');
        }
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;

        setEmail('');
        setPassword('');
        setFullName('');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 bg-gradient-to-br from-[#27A4F6] to-[#F06429] p-8 lg:p-16 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Brain className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-bold">MindShare</h1>
          </div>

          <h2 className="text-3xl font-semibold mb-4">
            Share Knowledge, Grow Together
          </h2>

          <p className="text-xl text-white/90 leading-relaxed">
            Join our community of learners and experts. Share your insights,
            discover new perspectives, and collaborate on ideas that matter.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">10K+</div>
              <div className="text-sm text-white/80">Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">50K+</div>
              <div className="text-sm text-white/80">Insights</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">100+</div>
              <div className="text-sm text-white/80">Topics</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#F6F8FC] p-8 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#1A2633] mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[#AFB6D2]">
                {isLogin
                  ? 'Sign in to continue your learning journey'
                  : 'Join MindShare and start sharing knowledge'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#1A2633] mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F6F8FC] border border-[#AFB6D2]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent transition-all text-[#1A2633]"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1A2633] mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F6F8FC] border border-[#AFB6D2]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent transition-all text-[#1A2633]"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1A2633] mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F6F8FC] border border-[#AFB6D2]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent transition-all text-[#1A2633]"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#27A4F6] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1e8cd4] hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFullName('');
                }}
                className="text-[#27A4F6] hover:text-[#F06429] font-medium transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-[#AFB6D2] mt-6">
            By continuing, you agree to MindShare's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
