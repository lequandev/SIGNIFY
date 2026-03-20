import { Link } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-12 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4F46E5,transparent_50%)] opacity-10 animate-pulse" />
      
      <div className="relative mb-16 lg:mb-24">
        <img 
          src="/logo_removebg.png" 
          alt="Signify Logo" 
          className="h-40 md:h-64 lg:h-80 w-auto object-contain relative z-10 transition-transform duration-700 hover:scale-110"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute -inset-8 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] blur-3xl opacity-30 -z-10 animate-pulse" />
      </div>

      <Link 
        to="/packages" 
        className="group relative px-12 py-4 bg-white text-black font-black uppercase tracking-[0.3em] overflow-hidden transition-all duration-500 hover:text-white"
      >
        <span className="relative z-10 transition-colors duration-500">View Service Packages</span>
        <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#7C3AED] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
      </Link>
    </div>
  );
}

export default App;
