import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Youtube, UserPlus, LogIn, ArrowRight, LogOut, User as UserIcon, Languages, Subtitles } from 'lucide-react';
import { setLogout } from './features/authSlice';

function App() {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(setLogout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0c1a] text-white font-sans bg-grid overflow-x-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#3B82F6]/25 blur-[130px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#A855F7]/25 blur-[130px] rounded-full animate-pulse delay-1000" />

      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-gradient-to-tr from-[#3B82F6] to-[#A855F7] p-2.5 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-transform duration-300">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-300 uppercase">
                SIGNIFY
              </span>
            </Link>
            
            <div className="flex items-center gap-6">
              {isAuthenticated ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
                    <UserIcon className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-sm font-bold text-gray-100">{user?.fullName || 'User'}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link to="/register" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-white text-black hover:bg-gray-100 rounded-full transition-all shadow-xl shadow-white/10 active:scale-95">
                    <UserPlus className="w-4 h-4" />
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-32 relative z-10">
        <div className="text-center space-y-10 animate-slow-fade">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-[#60A5FA] text-sm font-bold tracking-wide uppercase">
            ✨ Beyond Sound, Into Vision
          </div>
          <h1 className="text-7xl sm:text-8xl font-black tracking-tighter leading-[0.9]">
            Breaking Barriers for <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#A855F7] drop-shadow-sm">
              The Hearing Impaired
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Empowering the deaf community to access any YouTube content through AI-powered speech-to-text, 
            smart translations, and intuitive bilingual subtitles.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            {!isAuthenticated ? (
              <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white font-black rounded-2xl hover:brightness-110 transition-all shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-3 group active:scale-95">
                Join our Mission
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link to="/translate" className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white font-black rounded-2xl hover:brightness-110 transition-all shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-3 group active:scale-95">
                Start Watching
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <button className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors backdrop-blur-md flex items-center justify-center gap-2">
              <Languages className="w-5 h-5" />
              Explore bilingual subs
            </button>
          </div>

          {/* Features Preview */}
          <div className="pt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[2rem] bg-white/10 border border-white/20 text-left hover:bg-white/[0.15] transition-colors backdrop-blur-sm">
              <div className="w-12 h-12 bg-[#3B82F6]/30 rounded-xl flex items-center justify-center mb-6">
                <Subtitles className="text-[#60A5FA] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Speech-to-Text</h3>
              <p className="text-gray-300">Instant, accurate transcription of video narration into localized text.</p>
            </div>
            <div className="p-8 rounded-[2rem] bg-white/10 border border-white/20 text-left hover:bg-white/[0.15] transition-colors backdrop-blur-sm">
              <div className="w-12 h-12 bg-[#6366F1]/30 rounded-xl flex items-center justify-center mb-6">
                <Languages className="text-[#818CF8] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Translation</h3>
              <p className="text-gray-300">Bridge the language gap with AI that understands context and tone.</p>
            </div>
            <div className="p-8 rounded-[2rem] bg-white/10 border border-white/20 text-left hover:bg-white/[0.15] transition-colors backdrop-blur-sm">
              <div className="w-12 h-12 bg-[#A855F7]/30 rounded-xl flex items-center justify-center mb-6">
                <Youtube className="text-[#C084FC] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">YouTube Sync</h3>
              <p className="text-gray-300">Seamless integration with your favorite YouTube content creators.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
