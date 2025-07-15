import { Routes, Route, BrowserRouter } from 'react-router';
import { HomePage } from './pages/Home.page';
import { RootShell } from './pages/Root.shell';
import { PortfolioImportPage } from './pages/PortfolioImport.page';
import { PortfolioMappingPage } from './pages/PortfolioMapping.page';
import { PortfolioReviewPage } from './pages/PortfolioReview.page';
import { PortfolioDetailsPage } from './pages/PortfolioDetails.page';
import { PortfolioDetailsInputPage } from './pages/PortfolioDetailsInput.page';
import { PortfolioFinalReviewPage } from './pages/PortfolioFinalReview.page';

export function Router() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<RootShell />}>
      <Route index element={<HomePage />} />
      <Route path='portfolio'>
        <Route path='import' element={<PortfolioImportPage />} />
        <Route path='import/mapping' element={<PortfolioMappingPage />} />
        <Route path='import/review' element={<PortfolioReviewPage />} />
        <Route path='import/details' element={<PortfolioDetailsInputPage />} />
        <Route path='import/final-review' element={<PortfolioFinalReviewPage />} />
        <Route path=':portfolioId' element={<PortfolioDetailsPage />} />
      </Route>
    </Route>
  </Routes>
  </BrowserRouter>
}