'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show limited pages with ellipsis for better UX
  const getVisiblePages = () => {
    if (totalPages <= 7) return pages;
    
    if (currentPage <= 4) {
      return [...pages.slice(0, 5), '...', totalPages];
    }
    
    if (currentPage >= totalPages - 3) {
      return [1, '...', ...pages.slice(totalPages - 5)];
    }
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Page info */}
      <div className="text-sm font-medium bg-white/80 dark:bg-purple-600/30 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-200 dark:border-purple-400/30 text-gray-700 dark:text-gray-200 shadow-sm">
        Page <span className="font-bold text-blue-600 dark:text-yellow-400">{currentPage}</span> of <span className="font-bold text-purple-600 dark:text-white">{totalPages}</span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transform transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        
        {/* Page numbers - hidden on small mobile, shown on larger screens */}
        <div className="hidden xs:flex items-center gap-2">
          {visiblePages.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className={`min-w-[46px] h-11 text-sm font-bold rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
                page === currentPage
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-lg shadow-pink-500/30 scale-110'
                  : 'bg-white/90 dark:bg-purple-600/40 border-blue-200 dark:border-purple-400/50 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-purple-500/60 hover:border-blue-300 dark:hover:border-purple-300 hover:shadow-md hover:scale-105'
              } ${typeof page !== 'number' ? 'cursor-default hover:bg-white/90 dark:hover:bg-purple-600/40 hover:scale-100 hover:shadow-none border-dashed' : ''}`}
              disabled={typeof page !== 'number'}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Mobile page indicator */}
        <div className="xs:hidden px-4 py-3 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold rounded-2xl shadow-lg">
          {currentPage} / {totalPages}
        </div>
        
        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-pink-500/30 hover:scale-105 transform transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}