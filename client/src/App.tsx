import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            {/* These routes will be implemented in future */}
            <Route path="/chat" element={<div className="container-custom py-16 text-center">Consultation page coming soon</div>} />
            <Route path="/chat/:id" element={<div className="container-custom py-16 text-center">Specific consultation page coming soon</div>} />
            <Route path="/summary" element={<div className="container-custom py-16 text-center">Patient history page coming soon</div>} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;