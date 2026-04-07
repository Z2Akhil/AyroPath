/**
 * MDX Blog utilities — reads static .mdx files from /content/blog/
 */

import fs from "fs";
import path from "path";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTimeMinutes: number;
  keywords: string[];
  relatedPackageSlug?: string; // e.g. 'thyrocare-aarogyam-c'
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data: Record<string, string> = {};
  match[1].split("\n").forEach((line) => {
    const [key, ...rest] = line.split(":");
    if (key && rest.length > 0) {
      data[key.trim()] = rest.join(":").trim().replace(/^"|"$/g, "");
    }
  });

  return { data, content: match[2] };
}

export function getAllBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(".mdx", ""));
}

export function getBlogPost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = parseFrontmatter(raw);

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date || new Date().toISOString().split("T")[0],
    readTimeMinutes: parseInt(data.readTimeMinutes || "5", 10),
    keywords: data.keywords ? data.keywords.split(",").map((k) => k.trim()) : [],
    relatedPackageSlug: data.relatedPackageSlug,
    content,
  };
}

export function getAllBlogPosts(): BlogPost[] {
  return getAllBlogSlugs()
    .map(getBlogPost)
    .filter(Boolean)
    .sort(
      (a, b) => new Date((b as BlogPost).date).getTime() - new Date((a as BlogPost).date).getTime()
    ) as BlogPost[];
}
