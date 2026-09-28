import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SearchResultsPage from "./pages/SearchResultsPage";
import ListingDetailPage from "./pages/ListingDetailPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fb]">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<SearchResultsPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <p className="font-display text-xl font-bold text-gray-900">Page not found</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
