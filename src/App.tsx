import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";

// Lazy load components for better performance
const PlayerList = lazy(() => import("./components/players/PlayerList"));
const PlayerForm = lazy(() => import("./components/players/PlayerForm"));
const LoginForm = lazy(() => import("./components/Auth/LoginForm"));
const MatchList = lazy(() => import("./components/Matches/MatchList"));
const MatchEditForm = lazy(() => import("./components/Matches/MatchEditForm"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/players" element={<PlayerList />} />
          <Route path="/players/new" element={<PlayerForm />} />
          <Route path="/players/edit/:id" element={<PlayerForm />} />
          <Route path="/matches" element={<MatchList />} />
          <Route path="/matches/new" element={<MatchEditForm />} />
          <Route path="/matches/edit/:id" element={<MatchEditForm />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
