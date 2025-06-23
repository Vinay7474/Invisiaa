import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home'; 
import CreateSession from './CreateSession'; 
import JoinSession from './JoinSession';
import Chat from './ChatPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateSession />} />
        <Route path="/join" element={<JoinSession />} />
        <Route path="/chat/:sessionId" element={<Chat />} />

      </Routes>
    </Router>
  );
}
