'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Star, Package, Search, Shield, CheckCircle2, TrendingUp, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useCart } from '../CartContext';
import DepositForm from './DepositForm';
import ProductDetails from './ProductDetails';
import { Badge, Button, Container, Input, PageHeader } from './ui';

/* -------------------- Types -------------------- */
interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  specifications: Record<string, any>;
  created_at: string;
  is_package?: boolean;
  package_products?: Array<{
    product_id: string;
    quantity: number;
    product: ShopProduct;
  }>;
}

/* -------------------- Component -------------------- */
export default function Shop() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch regular products
      const { data: productsData, error: productsError } = await supabase
        .from('shop_products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('product_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      // If the packages table doesn't exist yet or errors, continue with only products
      if (packagesError) {
        console.warn('Packages fetch failed or table missing:', packagesError.message || packagesError);
      }

      // Fetch package products for each package
      const packagesWithProducts = packagesData ? await Promise.all(
        (packagesData || []).map(async (pkg) => {
          const { data: pkgProducts, error: pkgError } = await supabase
            .from('package_products')
            .select(`
              product_id,
              quantity,
              product:shop_products(*)
            `)
            .eq('package_id', pkg.id);

          if (pkgError) {
            console.warn('Error fetching package products:', pkgError.message || pkgError);
            return { ...pkg, is_package: true, package_products: [], stock_quantity: 999 };
          }

          return {
            ...pkg,
            is_package: true,
            package_products: pkgProducts || [],
            stock_quantity: 999, // Packages always available
          };
        })
      ) : [];

      // Combine products and packages
      const allItems = [
        ...(productsData || []).map(p => ({ ...p, is_package: false })),
        ...packagesWithProducts
      ];

      setProducts(allItems);

      // Get featured items (products + packages)
      const featured = allItems
        .filter(p => p.is_featured)
        .slice(0, 6);
      setFeaturedProducts(featured);
    } catch (err) {
      console.error('Products fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product: ShopProduct) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleBuyNow = (product: ShopProduct) => {
    // Add product to cart using CartContext
    const cartItem = {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_image: product.image_url,
      quantity: 1,
      category: product.category,
    };

    addToCart(cartItem);

    // Navigate to checkout
    router.push('/checkout');
  };

  const handleMakeDeposit = (product: ShopProduct) => {
    setSelectedProduct(product);
    setShowDepositForm(true);
  };

  const handleDepositSuccess = () => {
    // Optionally refresh products or show success message
    fetchProducts();
  };

  if (loading) {
    return (
      <section id="shop" className="bg-paper py-24">
        <Container>
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-ink"></div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section id="shop" className="bg-paper pb-24">
      <PageHeader
        eyebrow="Computer Shop"
        title="Computers & accessories"
        description="Quality computers, laptops, and accessories for your business and personal needs."
      />

      <Container className="py-12">
        <div className="mb-10 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-muted">
            <Shield className="text-gold" size={18} />
            <span className="text-sm font-medium">Warranty Included</span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <CheckCircle2 className="text-gold" size={18} />
            <span className="text-sm font-medium">Quality Assured</span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <TrendingUp className="text-gold" size={18} />
            <span className="text-sm font-medium">Best Prices</span>
          </div>
        </div>

        <div className="mb-12 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule bg-surface text-ink hover:border-ink'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {featuredProducts.length > 0 && (
          <div className="mb-16">
            <h3 className="mb-8 flex items-center gap-2 font-serif text-2xl font-medium text-ink-deep">
              <Star className="text-gold" size={22} />
              Featured Products
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="h-full"
                >
                  <div
                    className="hover-lift group h-full cursor-pointer overflow-hidden rounded-2xl border border-rule bg-surface shadow-[0_1px_2px_rgb(14_36_54/0.04)]"
                    onClick={() => handleProductClick(product)}
                  >
                  <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-rule">
                        <Package size={48} />
                      </div>
                    )}
                    {product.is_package && (
                      <div className="absolute left-4 top-4">
                        <Badge><Package size={12} /> Package</Badge>
                      </div>
                    )}
                    {product.is_featured && (
                      <div className="absolute right-4 top-4">
                        <Badge><Star size={12} /> Featured</Badge>
                      </div>
                    )}
                    {!product.is_package && product.stock_quantity === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-ink-deep/60">
                        <span className="text-lg font-medium text-paper">Out of Stock</span>
                      </div>
                    )}
                    {!product.is_package && product.stock_quantity > 0 && (
                      <div className="absolute left-4 top-4">
                        <Badge>In Stock</Badge>
                      </div>
                    )}
                  </div>
                  <div className="bg-surface p-6">
                    <div className="mb-3">
                      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">
                        {product.category}
                      </span>
                    </div>
                    <h4 className="mb-2 font-serif text-xl font-medium text-ink-deep line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted">
                      {product.description}
                    </p>
                    <div className="mb-5 flex items-center justify-between border-b border-rule pb-4">
                      <span className="font-serif text-2xl text-ink-deep">
                        {formatPrice(product.price)}
                      </span>
                      {product.is_package ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-muted">
                          <Package size={14} />
                          {product.package_products?.length || 0} items
                        </span>
                      ) : product.stock_quantity > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-muted">
                          <CheckCircle2 size={14} className="text-gold" />
                          {product.stock_quantity} available
                        </span>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMakeDeposit(product);
                        }}
                      >
                        <CreditCard size={16} />
                        Deposit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(product);
                        }}
                      >
                        <ShoppingCart size={16} />
                        Buy Now
                      </Button>
                    </div>
                  </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-8 font-serif text-2xl font-medium text-ink-deep">
            All Products {filteredProducts.length > 0 && `(${filteredProducts.length})`}
          </h3>

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="mx-auto mb-4 text-rule" size={48} />
              <p className="text-lg text-muted">No products found</p>
              <p className="mt-2 text-sm text-muted">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  className="h-full"
                >
                  <div
                    className="hover-lift group h-full cursor-pointer overflow-hidden rounded-2xl border border-rule bg-surface shadow-[0_1px_2px_rgb(14_36_54/0.04)]"
                    onClick={() => handleProductClick(product)}
                  >
                  <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-rule">
                        <Package size={48} />
                      </div>
                    )}
                    {product.is_package && (
                      <div className="absolute left-3 top-3">
                        <Badge><Package size={12} /> Package</Badge>
                      </div>
                    )}
                    {!product.is_package && product.stock_quantity === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-ink-deep/60">
                        <span className="font-medium text-paper">Out of Stock</span>
                      </div>
                    )}
                    {!product.is_package && product.stock_quantity > 0 && (
                      <div className="absolute left-3 top-3">
                        <Badge>In Stock</Badge>
                      </div>
                    )}
                  </div>
                  <div className="bg-surface p-5">
                    <div className="mb-2">
                      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">
                        {product.category}
                      </span>
                    </div>
                    <h4 className="mb-2 font-serif text-lg font-medium text-ink-deep line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted">
                      {product.description}
                    </p>
                    <div className="mb-3 flex items-center justify-between border-b border-rule pb-3">
                      <span className="font-serif text-xl text-ink-deep">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMakeDeposit(product);
                        }}
                      >
                        <CreditCard size={14} />
                        Deposit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(product);
                        }}
                      >
                        <ShoppingCart size={14} />
                        Buy Now
                      </Button>
                    </div>
                  </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Container>

      <ProductDetails
        product={selectedProduct}
        isOpen={showProductDetails}
        onClose={() => {
          setShowProductDetails(false);
          setSelectedProduct(null);
        }}
      />

      <DepositForm
        product={selectedProduct}
        isOpen={showDepositForm}
        onClose={() => {
          setShowDepositForm(false);
          setSelectedProduct(null);
        }}
        onSuccess={handleDepositSuccess}
      />
    </section>
  );
}
