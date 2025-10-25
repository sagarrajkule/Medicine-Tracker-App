import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@/App.css';
import Dashboard from '@/pages/Dashboard';
import AddMedicine from '@/pages/AddMedicine';
import EditMedicine from '@/pages/EditMedicine';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddMedicine />} />
          <Route path="/edit/:id" element={<EditMedicine />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;