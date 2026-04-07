import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllBlogSlugs, getBlogPost } from "@/lib/mdx";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${slug}`,
      siteName: "Ayropath",
      type: "article",
      locale: "en_IN",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Ayropath" },
    publisher: {
      "@type": "Organization",
      name: "Ayropath",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
    url: `${siteUrl}/blog/${slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/blog/${slug}` },
  };

  // Convert basic markdown to HTML (no remark dependency needed)
  const renderContent = (md: string) => {
    const html = md
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/^(?!<[h|u|l|p])(.+)$/gm, "<p>$1</p>")
      .replace(/<p><\/p>/g, "");
    return html;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-8"
        >
          <ArrowLeft size={14} />
          Back to Health Blog
        </Link>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(post.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.readTimeMinutes} min read
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {post.description}
          </p>
        </header>

        {/* Article Body */}
        <article
          className="prose prose-lg max-w-none prose-headings:font-extrabold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-li:text-gray-700"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        />

        {/* CTA */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-8 border border-blue-100 text-center">
          <h2 className="text-xl font-extrabold text-gray-900 mb-3">
            Ready to Book Your Health Checkup?
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Get tested with Thyrocare&apos;s NABL accredited labs. Free home
            collection across India.
          </p>
          <Link
            href="/profiles"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors"
          >
            Browse Health Packages
          </Link>
        </div>
      </div>
    </>
  );
}
