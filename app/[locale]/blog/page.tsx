import { createBlogIndexMetadata, BlogIndexJsonLd } from "@/lib/seo/metadata";
import BlogIndexPage from "@/views/BlogIndexPage";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return createBlogIndexMetadata(locale);
}

export default async function BlogRoute({ params }: PageProps) {
  const { locale } = await params;
  return (
    <>
      <BlogIndexJsonLd locale={locale} />
      <BlogIndexPage />
    </>
  );
}
