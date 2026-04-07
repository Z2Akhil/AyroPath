import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/mdx";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayropath.com";

export const metadata: Metadata = {
  title: "Health Blog – Diagnostic Tips, Test Guides & Preventive Care | Ayropath",
  description:
    "Expert articles on full body checkup, HbA1c, Vitamin D deficiency, thyroid tests, and preventive healthcare. Learn which lab tests you need and why — from Ayropath's health team.",
  keywords: [
    "health blog india",
    "what does HbA1c measure",
    "Vitamin D deficiency symptoms",
    "full body checkup guide",
    "thyroid test explained",
    "preventive health tips",
    "blood test guide India",
    "Aarogyam packages explained",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Health Blog – Diagnostic Tips & Preventive Care | Ayropath",
    description:
      "Expert articles on lab tests, full body checkups, and preventive healthcare in India.",
    url: `${siteUrl}/blog`,
    siteName: "Ayropath",
    type: "website",
    locale: "en_IN",
  },
};

export default function BlogListPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Health Blog</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Health Blog — Lab Tests &amp; Preventive Care
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Practical guides on understanding your blood tests, preparing for a full
          body checkup, and staying ahead of common health conditions.
        </p>
      </div>

      {/* Post Grid */}
      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-20">
          Articles coming soon — check back shortly.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group border border-gray-100 rounded-2xl p-8 hover:border-blue-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(post.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {post.readTimeMinutes} min read
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {post.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:underline">
                Read Article <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
