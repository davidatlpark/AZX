import { Routes, Route, BrowserRouter } from 'react-router';
import { HomePage } from './pages/Home.page';
import { PortfolioDetailsPage } from './pages/PortfolioDetails.page';
import { RootShell } from './pages/Root.shell';
import { PortfolioImportPage } from './pages/PortfolioImport.page';

export function Router() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<RootShell />}>
      <Route index element={<HomePage />} />
      <Route path='portfolio'>
        <Route path='import' element={<PortfolioImportPage />} />
        <Route path=':portfolioId' element={<PortfolioDetailsPage />} />
      </Route>
    </Route>
  </Routes>
  </BrowserRouter>
}