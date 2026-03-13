import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Board from './pages/Board';
import Submit from './pages/Submit';
import PostDetail from './pages/PostDetail';
import AdminKanban from './pages/AdminKanban';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/admin" element={<AdminKanban />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
