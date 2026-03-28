import { notFound } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import type { Product as ProductType } from "@/lib/types";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductInfo } from "@/components/products/product-info";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

function transformProduct(p: Record<string, unknown>): ProductType {
  return {
    id: p.productId as string,
    name: p.name as string,
    brand: p.brand as string,
    category: p.category as ProductType["category"],
    price: p.price as number,
    originalPrice: p.originalPrice as number | undefined,
    discount: p.discount as number | undefined,
    rating: p.rating as number,
    reviewCount: p.reviewCount as number,
    image: p.image as string,
    images: p.images as string[] | undefined,
    description: p.description as string,
    specifications: p.specifications instanceof Map
      ? Object.fromEntries(p.specifications)
      : (p.specifications as Record<string, string>),
    inStock: p.inStock as boolean,
    featured: p.featured as boolean | undefined,
    bestDeal: p.bestDeal as boolean | undefined,
  };
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  await dbConnect();
  const product = await Product.findOne({ productId: id }).lean();

  if (!product) {
    return { title: "Product Not Found | ElectroStore" };
  }

  return {
    title: `${(product as Record<string, unknown>).name} | ElectroStore`,
    description: (product as Record<string, unknown>).description as string,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  await dbConnect();
  const productDoc = await Product.findOne({ productId: id }).lean();

  if (!productDoc) {
    notFound();
  }

  const product = transformProduct(productDoc as Record<string, unknown>);

  // Get related products from the same category
  const relatedDocs = await Product.find({
    category: product.category,
    productId: { $ne: id },
  })
    .limit(4)
    .lean();

  const relatedProducts = (relatedDocs as Record<string, unknown>[]).map(transformProduct);

  return (
    <div className="bg-background py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-1 px-0">
            <Link href="/products">
              <ChevronLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>

        {/* Product details */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-foreground">
              Related Products
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
