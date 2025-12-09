import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
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
          
          <div className="space-y-4">
            <button 
              onClick={onLogin}
              className="w-full flex items-center justify-center bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>

            <button 
              onClick={onLogin}
              className="w-full flex items-center justify-center bg-black hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-xl transition-all border border-gray-700"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.56-2.09-.48-3.08.35 1.04 1.37 4.96 2.22 6.16-2.19.87-3.17 3.6-4.99 3.56-5.02-.09-.05-2.14-1.23-2.17-4.73.04-3.01 2.45-4.38 2.54-4.44-.08-.06-1.92-2.18-5.34-2.18-2.24.03-4.04 1.31-5.09 1.31-1.07 0-2.66-1.25-4.37-1.21-2.22.03-4.28 1.29-5.4 3.25-2.29 3.97-.58 9.87 1.66 13.09.9.1.3 2.13 1.95 2.85 3.38zM14.77 3.49c1.23-1.49 1.05-3.56 1.05-3.56s-2.08.13-3.23 1.48c-1.11 1.28-1.04 3.28-1.04 3.28s1.95.14 3.22-1.2z"/>
              </svg>
              Continuar com Apple
            </button>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">OU ENTRE COM EMAIL</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <button 
              onClick={onLogin}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-4 rounded-xl transition-all"
            >
              Entrar
            </button>
            <p className="text-xs text-slate-500 mt-4">
              Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
