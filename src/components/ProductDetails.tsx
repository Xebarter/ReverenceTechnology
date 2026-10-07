'use client';

import { useState } from 'react';
import { X, ShoppingCart, CreditCard, Package, CheckCircle2, Star, TrendingUp, Shield, Truck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCart } from '../CartContext';
import DepositForm from './DepositForm';
import { Badge, Button, FieldLabel } from './ui';

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url: string | null;
    stock_quantity: number;
    is_featured: boolean;
    specifications: Record<string, any>;
    is_package?: boolean;
    package_products?: Array<{
      product_id: string;
      quantity: number;
      product: {
        id: string;
        name: string;
        price: number;
        image_url: string | null;
      };
    }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetails({ product, isOpen, onClose }: ProductDetailsProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleBuyNow = () => {
    const cartItem = {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_image: product.image_url,
      quantity: quantity,
      category: product.category,
    };

    addToCart(cartItem);
    router.push('/checkout');
    onClose();
  };

  const handleMakeDeposit = () => {
    setShowDepositForm(true);
  };

  const handleDepositClose = () => {
    setShowDepositForm(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-deep/50 p-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="relative my-8 w-full max-w-5xl overflow-hidden rounded-2xl border border-rule bg-surface shadow-[0_30px_60px_-36px_rgb(14_36_54/0.55)]"
            >
              <button
                onClick={onClose}
                className="absolute right-6 top-6 z-10 rounded-full p-2 text-muted transition-colors hover:bg-paper"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                <div className="relative aspect-square overflow-hidden bg-paper-2 lg:aspect-auto lg:h-[600px]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-rule">
                      <Package size={80} />
                    </div>
                  )}
                  {product.is_package && (
                    <div className="absolute left-4 top-4">
                      <Badge><Package size={14} /> Package Deal</Badge>
                    </div>
                  )}
                  {product.is_featured && (
                    <div className="absolute right-4 top-4">
                      <Badge><Star size={14} /> Featured</Badge>
                    </div>
                  )}
                  {!product.is_package && product.stock_quantity > 0 ? (
                    <div className="absolute bottom-4 right-4">
                      <Badge><CheckCircle2 size={14} /> {product.stock_quantity} in Stock</Badge>
                    </div>
                  ) : !product.is_package ? (
                    <div className="absolute bottom-4 right-4">
                      <Badge>Out of Stock</Badge>
                    </div>
                  ) : null}
                </div>

                <div className="max-h-[600px] overflow-y-auto p-8 lg:p-10">
                  <div className="mb-6">
                    <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">
                      {product.category}
                    </p>
                    <h1 className="mb-4 font-serif text-3xl font-medium leading-tight text-ink-deep lg:text-4xl">
                      {product.name}
                    </h1>
                    <div className="flex items-center gap-4">
                      <div className="font-serif text-3xl text-ink-deep">
                        {formatPrice(product.price)}
                      </div>
                      {product.is_package ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted">
                          <Package size={16} />
                          {product.package_products?.length || 0} Items Included
                        </div>
                      ) : product.stock_quantity > 0 ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted">
                          <CheckCircle2 size={16} className="text-gold" />
                          Available
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="mb-3 font-serif text-lg font-medium text-ink-deep">Description</h2>
                    <p className="leading-relaxed text-muted">
                      {product.description}
                    </p>
                  </div>

                  {product.is_package && product.package_products && product.package_products.length > 0 && (
                    <div className="mb-6">
                      <h2 className="mb-3 font-serif text-lg font-medium text-ink-deep">Package Includes</h2>
                      <div className="space-y-2">
                        {product.package_products.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 rounded-md border border-rule bg-paper p-3">
                            {item.product?.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-paper-2">
                                <Package size={20} className="text-gold" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-ink">{item.product?.name}</p>
                              <p className="text-xs text-muted">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-sm font-medium text-ink">
                              {formatPrice((item.product?.price || 0) * item.quantity)}
                            </div>
                          </div>
                        ))}
                        <div className="mt-3 rounded-md border border-rule bg-paper p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted">Total Individual Price:</span>
                            <span className="text-sm text-muted line-through">
                              {formatPrice(product.package_products.reduce((sum, item) =>
                                sum + ((item.product?.price || 0) * item.quantity), 0))}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-medium text-ink">Package Price:</span>
                            <span className="font-serif text-lg text-ink-deep">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <div className="mt-2 text-center">
                            <Badge>
                              Save {formatPrice(product.package_products.reduce((sum, item) =>
                                sum + ((item.product?.price || 0) * item.quantity), 0) - product.price)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="mb-6">
                      <h2 className="mb-3 font-serif text-lg font-medium text-ink-deep">Specifications</h2>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="rounded-md border border-rule bg-paper p-3">
                            <div className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
                              {key}
                            </div>
                            <div className="text-sm font-medium text-ink">
                              {String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-3 py-2">
                      <Shield className="text-gold" size={16} />
                      <span className="text-xs font-medium text-ink">Warranty Included</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-3 py-2">
                      <Truck className="text-gold" size={16} />
                      <span className="text-xs font-medium text-ink">Fast Delivery</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-rule bg-paper px-3 py-2">
                      <TrendingUp className="text-gold" size={16} />
                      <span className="text-xs font-medium text-ink">Best Price</span>
                    </div>
                  </div>

                  {(product.is_package || product.stock_quantity > 0) && (
                    <div className="mb-6">
                      <FieldLabel>Quantity</FieldLabel>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 rounded-md border border-rule">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-4 py-3 hover:bg-paper"
                          >
                            -
                          </button>
                          <span className="min-w-[60px] px-6 py-3 text-center font-medium text-ink">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(product.is_package ? quantity + 1 : Math.min(product.stock_quantity, quantity + 1))}
                            className="px-4 py-3 hover:bg-paper"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-sm text-muted">
                          <span className="font-medium">Total:</span>{' '}
                          <span className="font-serif text-lg text-ink-deep">
                            {formatPrice(product.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(product.is_package || product.stock_quantity > 0) ? (
                    <div className="space-y-3">
                      <Button
                        onClick={handleBuyNow}
                        size="lg"
                        className="w-full"
                      >
                        <ShoppingCart size={20} />
                        Buy Now
                        <ArrowRight size={20} />
                      </Button>
                      <Button
                        onClick={handleMakeDeposit}
                        variant="secondary"
                        size="lg"
                        className="w-full"
                      >
                        <CreditCard size={20} />
                        Make a Deposit
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
                      <p className="font-medium text-red-700">This product is currently out of stock</p>
                      <p className="mt-1 text-sm text-red-600">Please check back later or contact us for availability</p>
                    </div>
                  )}

                  <div className="mt-6 border-t border-rule pt-6">
                    <div className="space-y-1 text-xs text-muted">
                      <p className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-gold" />
                        Secure payment processing
                      </p>
                      <p className="flex items-center gap-2">
                        <Truck size={14} className="text-gold" />
                        Free delivery on orders over 500,000 UGX
                      </p>
                      <p className="flex items-center gap-2">
                        <Shield size={14} className="text-gold" />
                        1-year warranty on all products
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DepositForm
        product={product}
        isOpen={showDepositForm}
        onClose={handleDepositClose}
        onSuccess={() => {
          handleDepositClose();
          onClose();
        }}
      />
    </>
  );
}
