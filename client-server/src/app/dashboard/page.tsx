"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import NewsCard from "@/components/dashboard/NewsCard";
import CategorySidebar from "@/components/dashboard/CategorySidebar";
import LiveMarketPanel from "@/components/dashboard/LiveMarketPanel";
import Navbar from "@/components/dashboard/Navbar";
import NewsOverlay from "@/components/dashboard/NewsOverlay";
import Footer from "@/components/dashboard/Footer";

type NewsItem = {
  _id: string;
  title: string;
  source: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence_score: number;
  stocks: string[];
  imageUrl?: string;
};

export default function DashboardPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    setPage(1);
    setNews([]);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoryRes = await fetch("/api/categories");
        const categoryData = await categoryRes.json();
        setCategories(categoryData.categories || []);

        // Build URL
        const newsUrl = searchQuery.trim()
          ? `/api/news/search?q=${encodeURIComponent(searchQuery)}`
          : selectedCategory === "ALL"
          ? `/api/news?page=${page}&limit=10`
          : `/api/news?page=${page}&limit=10&domain=${encodeURIComponent(
              selectedCategory
            )}`;

        const newsRes = await fetch(newsUrl);
        const newsData = await newsRes.json();

        setNews((prev) => {
          const incoming = newsData.news || newsData.results || [];

          if (page === 1) return incoming;

          const merged = [...prev, ...incoming];

          return merged.filter(
            (item, index, self) =>
              index === self.findIndex((n) => n._id === item._id)
          );
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedCategory, page, searchQuery]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4 md:p-6">
      {/* Navbar */}
      <div className="mb-4 md:mb-6">
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* Sidebar */}
        <Card className="lg:col-span-2 p-4 shadow-md lg:sticky lg:top-4 h-fit">
          <CategorySidebar
            categories={categories}
            selected={selectedCategory}
            onSelect={(category) => {
              setSelectedCategory(category);
              setPage(1);
              setNews([]);
            }}
          />
        </Card>

        {/* News Feed */}
        <div className="lg:col-span-7 space-y-4 max-h-[80vh] overflow-y-auto pr-1 md:pr-2">
          {loading ? (
            <p>Loading news...</p>
          ) : news.length > 0 ? (
            news.map((article) => (
              <div
                key={article._id}
                onClick={() => {
                  setSelectedArticle(article);
                  setIsOverlayOpen(true);
                }}
                className="cursor-pointer"
              >
                <NewsCard
                  title={article.title}
                  source={article.source}
                  signal={article.signal}
                  confidence={article.confidence_score}
                  stocks={article.stocks}
                  imageUrl={article.imageUrl}
                />
              </div>
            ))
          ) : (
            <p className="text-slate-500">No news found</p>
          )}

          {/* Load More (hide in search) */}
          {!searchQuery.trim() && (
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="w-full rounded-lg border border-slate-200 bg-white py-3 font-medium hover:bg-slate-50"
            >
              Load More
            </button>
          )}
        </div>

        {/* Live Market */}
        <div className="lg:col-span-3 lg:sticky lg:top-4 h-fit">
          <LiveMarketPanel />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6">
        <Footer />
      </div>

      {/* Overlay */}
      <NewsOverlay
        open={isOverlayOpen}
        onOpenChange={setIsOverlayOpen}
        article={selectedArticle}
      />
    </main>
  );
}
