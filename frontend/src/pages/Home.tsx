import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Zap, Globe, MessageSquare, ArrowRight, Shield, Video, Cpu } from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  const features = [
    {
      icon: <Cpu className="w-6 h-6 text-[#2563EB]" />,
      title: "Real-time AI Translation",
      description: "Advanced neural networks translate sign language to text and speech instantly."
    },
    {
      icon: <Globe className="w-6 h-6 text-[#4F46E5]" />,
      title: "Global Dialect Support",
      description: "Support for ASL, BSL, VSL, and many other regional sign language dialects."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-[#7C3AED]" />,
      title: "Two-way Communication",
      description: "Seamlessly bridge the gap between signers and non-signers in any environment."
    },
    {
      icon: <Shield className="w-6 h-6 text-[#2563EB]" />,
      title: "Privacy First",
      description: "Your video data is processed securely and never stored without your explicit consent."
    }
  ];

  return (
    <div className="flex-grow w-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-8 md:px-16 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="w-3 h-3" />
              <span>Powered by Next-Gen AI</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.1] mb-6">
              Breaking Barriers with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#7C3AED]">AI Translation</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
              Signify uses advanced computer vision and AI to translate sign language in real-time, empowering the deaf community to communicate effortlessly with the world.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {!isAuthenticated ? (
                <Link to="/register" className="w-full sm:w-auto bg-[#2563EB] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#4F46E5] transition-all shadow-xl shadow-[#2563EB]/20 flex items-center justify-center gap-2 group">
                  Start Translating Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link to="/translate" className="w-full sm:w-auto bg-[#2563EB] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#4F46E5] transition-all shadow-xl shadow-[#2563EB]/20 flex items-center justify-center gap-2 group">
                  Open Translator
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link to="/pricing" className="w-full sm:w-auto bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-200 flex items-center justify-center">
                View Pricing
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/20 to-[#7C3AED]/20" />
              <Video className="w-20 h-20 text-white/20" />
              <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <div>
                  <div className="text-white text-xs font-bold uppercase tracking-wider opacity-60">AI Status</div>
                  <div className="text-white font-semibold">Translating ASL...</div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#2563EB]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#7C3AED]/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-8 md:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Empowering Communication</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Our technology is designed to be fast, accurate, and accessible to everyone, everywhere.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
