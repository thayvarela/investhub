import React from 'react';

interface LandingPageProps {
  onLogin: (email: string, pass: string) => Promise<void>;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [email, setEmail] = React.useState('testuser@example.com');
  const [password, setPassword] = React.useState('password123');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(email, password);
    } catch (err) {
      setError('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-dark-bg">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full px-6 text-center">
        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center font-bold text-3xl text-white shadow-2xl shadow-brand-500/30">
            AF
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
          AssetFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Intelligence</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Consolide ações, criptomoedas e renda fixa em um só lugar.
          Nossa IA categoriza automaticamente seus ativos, oferecendo uma visão clara da sua liberdade financeira.
        </p>

        <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border p-8 rounded-2xl shadow-2xl max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-white mb-6">Acesse sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded">{error}</div>}

            <input
              type="email"
              placeholder="Email"
              className="w-full bg-dark-bg border border-slate-600 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                className="w-full bg-dark-bg border border-slate-600 rounded-xl p-3 text-white focus:border-brand-500 outline-none pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.44 0 .87-.03 1.28-.09" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs text-center">Credenciais de Teste Preenchidas</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>

        </div>
      </div>
    </div>
  );
};
