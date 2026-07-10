// Routing. Every route lives under the shared Layout and assumes an active
// anonymous session (gated by SessionGate in main.jsx). No public/protected split.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import NewJournal from './pages/NewJournal';
import History from './pages/History';
import JournalView from './pages/JournalView';
import AIChat from './pages/AIChat';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewJournal />} />
          <Route path="/history" element={<History />} />
          <Route path="/journal/:id" element={<JournalView />} />
          <Route path="/ai/:journalId" element={<AIChat />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
