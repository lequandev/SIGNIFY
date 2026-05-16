import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans relative">
      <Header />
      <LandingPage />
      <Footer />
    </div>
  );
}

export default App;
