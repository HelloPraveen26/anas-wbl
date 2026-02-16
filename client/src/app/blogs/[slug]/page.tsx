import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogBySlug, getAllBlogs } from '@/data/blogsData'; // Assuming this data fetcher is correct
import { Metadata } from 'next';
import { ChevronLeft, Calendar, User, Tag } from 'lucide-react'; // Using lucide-react for modern icons

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// --- Metadata Generation (KEPT AS IS) ---
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getBlogBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: post.metaTitle || `${post.title} | ZenVoice AI Blog`,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords?.join(', ') || post.tags.join(', '),
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: post.image ? [
        {
          url: post.image,
          alt: post.title,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.image ? [post.image] : [],
    },
    alternates: {
      canonical: `https://voice.zenxai.io/blogs/${params.slug}`,
    },
  };
}

// --- Redesigned Blog Post Component ---
export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogBySlug(params.slug);

  if (!post) {
    notFound();
  }


  // Function to render content with proper heading structure
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines, add modern spacing
      if (!line) {
        elements.push(<div key={`spacer-${key++}`} className="h-4" />);
        continue;
      }

      // Skip meta tags from content
      if (line.includes('Meta Title:') || line.includes('Meta Description:')) {
        continue;
      }

      // H2 headings (e.g., "The Power of AI" or "Key Benefits") - Major sections
      if (
        line.match(/^[A-Z][a-zA-Z\s&-]*$/) &&
        line.length < 60 &&
        line.split(' ').length <= 10 &&
        !line.endsWith('.')
      ) {
        elements.push(
          <h2
            key={`h2-${key++}`}
            className="text-3xl font-extrabold text-gray-900 mt-10 mb-5 border-l-4 border-green-500 pl-4 transition-colors duration-300 hover:border-green-700"
          >
            {line}
          </h2>
        );
      }
      // H3 headings (e.g., "1. Improved Efficiency" or "Case Study: XYZ") - Subsections
      else if (
        line.match(/^\d+\./) ||
        (line.length < 70 && line.includes(':') && line.split(':').length === 2 && line.split(':')[0].length < 30)
      ) {
        const parts = line.split(/:\s*(.*)/s);
        elements.push(
          <h3
            key={`h3-${key++}`}
            className="text-2xl font-bold text-gray-900 mt-8 mb-4"
          >
            {parts[0].trim()}
            {parts[1] && <span className="text-gray-600 font-normal ml-2">{parts[1].trim()}</span>}
          </h3>
        );
      }
      // Bold/Key-point paragraphs (e.g., Definition: A brief explanation.)
      else if (line.includes(':') && line.split(':')[0].length < 50 && line.split(' ').length > 4) {
        const [boldPart, ...rest] = line.split(':');
        elements.push(
          <p
            key={`p-bold-${key++}`}
            className="text-gray-700 leading-relaxed mb-4 text-lg"
          >
            <strong className="text-green-700">{boldPart.trim()}:</strong> {rest.join(':').trim()}
          </p>
        );
      }
      // FAQ items (e.g., "1. Question? Answer.")
      else if (line.match(/^\d+\.\s/)) {
        const parts = line.split('? ');
        if (parts.length > 1) {
          elements.push(
            <div key={`faq-${key++}`} className="mb-6">
              <p className="font-bold text-gray-900 text-lg mb-2">{parts[0].trim().replace(/\?$/, '')}</p>
              <p className="text-gray-700 leading-relaxed text-lg font-serif">{parts.slice(1).join('? ').trim()}</p>
            </div>
          );
        } else {
          // Fallback to regular paragraph if no ? found
          elements.push(
            <p
              key={`p-${key++}`}
              className="text-gray-700 leading-relaxed text-lg font-serif mb-6"
            >
              {line}
            </p>
          );
        }
      }
      // Regular paragraphs - uses font-serif for better readability
      else {
        elements.push(
          <p
            key={`p-${key++}`}
            className="text-gray-700 leading-relaxed text-lg font-serif mb-6"
          >
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: `https://voice.zenxai.io${post.image}`,
            datePublished: post.date,
            author: {
              '@type': 'Organization',
              name: post.author,
            },
            publisher: {
              '@type': 'Organization',
              name: 'ZenVoice AI',
              logo: {
                '@type': 'ImageObject',
                url: 'https://voice.zenxai.io/rounded-logo.png'
              }
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://voice.zenxai.io/blogs/${post.slug}`
            },
            keywords: post.keywords?.join(', ') || post.tags.join(', '),
          }),
        }}
      />

      {/* Main Container */}
      <div className="min-h-screen bg-white">

        {/* Header/Hero Section */}
        <header className="pt-10 pb-16 bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-4 max-w-5xl">

            {/* Back Link and Breadcrumb */}
            <div className="flex justify-between items-start mb-6">
              <Link
                href="/blogs"
                className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                aria-label="Back to Blogs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                All Blogs
              </Link>

              <nav aria-label="Breadcrumb" className="hidden sm:block">
                <ol className="flex items-center space-x-1 text-xs text-gray-500">
                  <li><Link href="/" className="hover:text-green-600">Home</Link></li>
                  <li>/</li>
                  <li><Link href="/blogs" className="hover:text-green-600">Blogs</Link></li>
                  <li>/</li>
                  <li className="text-gray-900 truncate max-w-xs" aria-current="page">{post.title}</li>
                </ol>
              </nav>
            </div>


            {/* Post Title and Meta Information */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-6">
              <span className="flex items-center space-x-1 font-medium" itemProp="author">
                <User className="w-4 h-4 text-green-500" />
                <span>{post.author}</span>
              </span>
              <time dateTime={post.date} itemProp="datePublished" className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-green-500" />
                <span>{formattedDate}</span>
              </time>
              <div className="flex items-center space-x-1">
                <Tag className="w-4 h-4 text-green-500" />
                <div className="flex gap-2" role="list" aria-label="Blog tags">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full hover:bg-green-200 transition-colors"
                      role="listitem"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Featured Image - Large and prominent */}
            {post.image && (
              <div className="relative h-64 md:h-[550px] md:w-[990px] mt-8 rounded-xl shadow-xl overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 900px"
                />
              </div>
            )}
          </div>
        </header>


        {/* Blog Content Section (Article) */}
        <main className="container mx-auto px-4 py-16 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Current Blog Content */}
            <article className="lg:col-span-2" itemScope itemType="https://schema.org/Article">
              <div itemProp="articleBody" className="text-gray-900 font-serif leading-relaxed">
                {renderContent(post.content)}
              </div>
            </article>

            {/* Right Column: Suggested Blogs */}
            <aside className="lg:col-span-1">
              <div className="sticky top-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Suggested Blogs</h3>
                <div className="max-h-[800px] overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {getAllBlogs()
                    .filter(suggestedPost => suggestedPost.id !== post.id)
                    .slice(0, 4)
                    .map(suggestedPost => (
                      <Link key={suggestedPost.id} href={`/blogs/${suggestedPost.slug}`} className="block group">
                        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
                          {suggestedPost.image && (
                            <div className="h-32 mb-3 rounded-md overflow-hidden">
                              <Image
                                src={suggestedPost.image}
                                alt={suggestedPost.title}
                                width={300}
                                height={200}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <h4 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300 line-clamp-2">
                            {suggestedPost.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {suggestedPost.excerpt}
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </aside>
          </div>
        </main>


        {/* FAQs Section with Schema (REFINED STYLING) */}
        {post.content.includes('FAQ') && (
          <section className="bg-gray-50 py-12 border-t border-b font-sans" itemScope itemType="https://schema.org/FAQPage">
            <div className="container mx-auto px-4 max-w-3xl">
              {/* Title */}
              <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">
                Frequently Asked Questions
              </h2>

              {/* MODIFIED: Using smaller sizes, bolder question, lighter answer, and a separator */}
              <div className="space-y-4">
                {/* Example FAQ Item 1 */}
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="pb-4 border-b border-gray-200">
                  {/* Question: Increased font-weight, reduced size for clean look */}
                  <h3 itemProp="name" className="text-lg font-bold text-gray-900 mb-1">
                    1. What is the main benefit of using ZenVoice AI?
                  </h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    {/* Answer: text-sm for a tighter, less "thick" appearance, using lighter text-gray-700 */}
                    <p itemProp="text" className="text-gray-700 leading-normal text-sm">
                      The core benefit is **enhanced business automation** through natural, human-like voice communication, drastically reducing operational costs and improving customer satisfaction.
                    </p>
                  </div>
                </div>

                {/* Example FAQ Item 2 */}
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="pb-4 border-b border-gray-200">
                  <h3 itemProp="name" className="text-lg font-bold text-gray-900 mb-1">
                    2. How long does the setup process take?
                  </h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text" className="text-gray-700 leading-normal text-sm">
                      Setup typically takes **less than an hour** for basic integration, thanks to our streamlined API and comprehensive documentation. Custom integrations may take longer depending on complexity.
                    </p>
                  </div>
                </div>

                {/* Example FAQ Item 3 */}
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="pb-4 border-gray-200">
                  <h3 itemProp="name" className="text-lg font-bold text-gray-900 mb-1">
                    3. How does ZenVoice ensure call quality?
                  </h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text" className="text-gray-700 leading-normal text-sm">
                      ZenVoice employs lifelike AI intonation, emotional comprehensibility, and accurate speech processing to ensure every interaction feels natural and professional, maintaining the highest level of call quality.
                    </p>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-500 pt-4">
                  *Note: Actual FAQ content should be dynamically rendered here from a structured data source.*
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer/CTA Section */}
        <footer className="py-16">
          <div className="container mx-auto px-4 max-w-5xl text-center border-t pt-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Ready to Learn More?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Explore more cutting-edge insights about AI voice technology and business automation.
            </p>
            <Link
              href="/blogs"
              className="inline-flex items-center px-8 py-3 bg-green-600 text-white font-semibold text-lg rounded-full shadow-lg hover:bg-green-700 transition-transform duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              aria-label="Explore more blogs from ZenVoice AI"
            >
              Read More Blogs
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}