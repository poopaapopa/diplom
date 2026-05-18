import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import MainMenu from './pages/MainMenu';
import Sandbox from './pages/Sandbox';
import RegexToFsmCourse from './pages/RegexToFsmCourse';
import FsmToRegexCourse from './pages/FsmToRegexCourse';

export default function App() {
  return (
    <Router>
      <ReactFlowProvider>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/regex-to-fsm" element={<RegexToFsmCourse />} />
          <Route path="/fsm-to-regex" element={<FsmToRegexCourse />} />
        </Routes>
      </ReactFlowProvider>
    </Router>
  );
}
