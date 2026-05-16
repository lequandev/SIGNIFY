import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans relative">
      <Header />
      <Home />
      <Footer />
    </div>
  );
}

export default App;
