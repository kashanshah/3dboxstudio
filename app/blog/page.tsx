import { createBlogIndexMetadata, BlogIndexJsonLd } from "@/lib/seo/metadata";
import BlogIndexPage from "@/views/BlogIndexPage";

export const metadata = createBlogIndexMetadata();

export default function BlogRoute() {
  return (
    <>
      <BlogIndexJsonLd />
      <BlogIndexPage />
    </>
  );
}
