'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllBlogs, BlogPost } from '@/data/blogsData';

// --- Redesigned BlogCard Component ---
interface BlogCardProps {
  post: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <Link href={`/blogs/${post.slug}`} className="group block h-full">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full border border-gray-100 hover:shadow-4xl hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1">
        {/* Image Section */}
        <div className="w-full h-68 sm:h-86 overflow-hidden">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              width={600}
              height={500}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-green-100 flex items-center justify-center">
              <span className="text-green-500 font-semibold">Blog Image</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-grow">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full border border-green-400"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-xl font-extrabold mb-3 text-gray-900 group-hover:text-green-600 transition-colors duration-300 line-clamp-2">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="text-gray-600 mb-4 flex-grow line-clamp-3">
            {post.excerpt}
          </p>

          {/* Read More Button/Indicator */}
          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-green-600 group-hover:underline">
              Read Blog
            </span>
            <svg className="w-4 h-4 text-green-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};


// --- Blogs Page Component ---
const Blogs: React.FC = () => {
  const allBlogs = getAllBlogs();
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 6; // Increased to 6 for a better grid look

  const totalPages = Math.ceil(allBlogs.length / blogsPerPage);
  const startIndex = (currentPage - 1) * blogsPerPage;
  const currentBlogs = allBlogs.slice(startIndex, startIndex + blogsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Redesigned Hero Section */}
<div className="bg-gradient-to-b from-white to-green-300 py-20 px-8 text-center rounded-b-3xl shadow-md relative overflow-hidden mb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          
          {/* Confetti-like Green Dots (for visual flair) */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dotPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#4ade80" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dotPattern)" />
            </svg>
          </div>
          
          <h1 className="tex  t-5xl md:text-7xl font-extrabold text-gray-900 mb-6 relative">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-500">
Our Latest Insights            </span>
          </h1>

          <p className="text-xl md:text-2xl text-black mb-10 max-w-3xl mx-auto font-light">
Explore our ZenVoice product blog for detailed blogs.         </p>

          <Link href="#blog-list">
             <button className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-xl hover:bg-green-600 transition-colors duration-300 transform hover:scale-105">
                Start Reading
             </button>
          </Link>
        </div>
      </div>

      {/* Blog List Container (Grid Layout) */}
      <div id="blog-list" className="max-w-7xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-gray-800 mb-10 border-b-2 border-green-200 pb-3">Latest Blogs</h2>
        
        {/* Grid Layout for Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentBlogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* Redesigned Pagination */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-16">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-3 border rounded-full text-gray-600 hover:bg-green-100 disabled:opacity-50 transition-colors duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>

                {[currentPage].map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
                            currentPage === page
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-300'
                        }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-3 border rounded-full text-gray-600 hover:bg-green-100 disabled:opacity-50 transition-colors duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;