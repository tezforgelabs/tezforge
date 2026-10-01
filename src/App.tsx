import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./AppLayout";
import BetaUnavailable from "./pages/beta-unavailable";
import AdminDashboard from "./pages/admin/page";
import AdminPresales from "./pages/admin/presales/page";
import AdminWhitelist from "./pages/admin/whitelist/page";
import CreateHubPage from "./pages/dashboard/create/page";
import CreatePresalePage from "./pages/dashboard/create/presale/page";
import CreateProjectPage from "./pages/dashboard/create/project/page";
import CreateTokenPage from "./pages/dashboard/create/token/page";
import ManagePresalePage from "./pages/dashboard/presales/manage/page";
import PresalesListPage from "./pages/dashboard/presales/page";
import UserDashboardPage from "./pages/dashboard/user/page";
import TokenDetailPage from "./pages/dashboard/user/tokens/[address]/page";
import Home from "./pages/page";
import ProjectDetailPage from "./pages/projects/[id]/page";
import ProjectsPage from "./pages/projects/page";
import RootLayout from "./RootLayout";

function App() {
  return (
    <RootLayout>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard/create" element={<CreateHubPage />} />
            <Route path="/dashboard/create/nft" element={<BetaUnavailable />} />
            <Route
              path="/dashboard/create/presale"
              element={<CreatePresalePage />}
            />
            <Route
              path="/dashboard/create/project"
              element={<CreateProjectPage />}
            />
            <Route
              path="/dashboard/create/token"
              element={<CreateTokenPage />}
            />
            <Route path="/dashboard/presales" element={<PresalesListPage />} />
            <Route
              path="/dashboard/presales/manage/:address"
              element={<ManagePresalePage />}
            />
            <Route path="/dashboard/staking" element={<BetaUnavailable />} />
            <Route
              path="/dashboard/tools/airdrop"
              element={<BetaUnavailable />}
            />
            <Route
              path="/dashboard/tools/token-locker"
              element={<BetaUnavailable />}
            />
            <Route path="/dashboard/user" element={<UserDashboardPage />} />
            <Route
              path="/dashboard/user/tokens/:address"
              element={<TokenDetailPage />}
            />
            <Route path="/nfts" element={<BetaUnavailable />} />
            <Route path="/nfts/:id" element={<BetaUnavailable />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/locks" element={<BetaUnavailable />} />
            <Route path="/locks/:id" element={<BetaUnavailable />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/presales" element={<AdminPresales />} />
            <Route path="/admin/whitelist" element={<AdminWhitelist />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RootLayout>
  );
}

export default App;
