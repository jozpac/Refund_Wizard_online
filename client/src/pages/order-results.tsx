import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  Info,
  ArrowLeft,
} from "lucide-react";
import {
  orderLookupRequestSchema,
  type OrderLookupRequest,
  type OrderLookupResponse,
  type FormattedProduct,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  getProductName,
  getProductDescription,
  getProductBenefits,
  getProductRefundabilityStatus,
} from "@/utils/product-utils";
import Navbar from "@/components/Navbar";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CodeBlock } from "@/components/ui/code-block";

type SearchState = "idle" | "loading" | "success" | "error" | "no-orders";

const YEAR_MONEYBACK_GUARANTEE_COPY =
  "Your 365-day money-back guarantee period has expired.";

// Function to check for refunded products
function checkForRefundedProducts(
  orders: any[],
  products: FormattedProduct[],
): FormattedProduct[] {
  return products.map((product) => {
    // Find the order that contains this product
    const order = orders.find((o) => o.id === product.orderId);

    if (!order || !order.refunds || order.refunds.length === 0) {
      return product;
    }

    // Check if any refund matches this product's total
    // Refund total is negative, so we need to convert to positive for comparison
    const hasMatchingRefund = order.refunds.some((refund: any) => {
      const refundAmount = Math.abs(parseFloat(refund.total));
      const productTotal = parseFloat(product.total);
      return Math.abs(refundAmount - productTotal) < 0.01; // Allow for small floating point differences
    });

    return {
      ...product,
      hasRefundRequest: hasMatchingRefund,
    };
  });
}

const NO_REFUND_REASON: Record<string, string> = {
  "Endless Video Ideas":
    "Your 24 Hour Cooldown Period for Endless Video Ideas System has already passed.",
  "Fast-Start": YEAR_MONEYBACK_GUARANTEE_COPY,
  "Copy-paste": YEAR_MONEYBACK_GUARANTEE_COPY,
  "7-Figure Launchpad": "Refunds only avalable within 14 days of purchase.",
  "7-Figure Launchpad + The $10k Launch Formula":
    "Refunds only avalable within 14 days of purchase.",
  "Income Stream Bundle": YEAR_MONEYBACK_GUARANTEE_COPY,
  "Channel Brand Kit": YEAR_MONEYBACK_GUARANTEE_COPY,
  "AI Virality Bot":
    "Refunds for Virality AI are not available after purchase.",
};

export default function OrderResults() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [orderData, setOrderData] = useState<
    (OrderLookupResponse & { products: FormattedProduct[] }) | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { toast } = useToast();

  // Get email from URL params
  const email = decodeURIComponent(params.userId || "");

  const lookupMutation = useMutation({
    mutationFn: async (data: OrderLookupRequest) => {
      const response = await apiRequest("POST", "/api/orders/lookup", data);
      return response.json() as Promise<OrderLookupResponse>;
    },
    onMutate: () => {
      setSearchState("loading");
      setErrorMessage("");
    },
    onSuccess: async (data) => {
      console.log("API Response Data:", data);
      
      // The backend now returns products with data_source property
      // Separate WooCommerce and Stripe/GHL products
      const allProducts = data.products || [];
      
      // Separate products by data source
      const WPinitialFormattedProducts: FormattedProduct[] = allProducts
        .filter((product: any) => product.data_source === 'woocommerce')
        .map((product: any): FormattedProduct => {
          const mappedName = getProductName(product.name);
          return {
            id: product.id,
            orderId: product.order_id,
            price: product.price,
            name: mappedName,
            description: getProductDescription(mappedName),
            benefits: getProductBenefits(mappedName),
            purchaseDate: product.order_date,
            isRefundable: getProductRefundabilityStatus(
              product.name,
              product.order_date,
            ),
            hasRefundRequest: false, // Will be set by checkForRefundedProducts
            quantity: product.quantity,
            total: product.total,
            order_number: product.order_number,
            order_status: product.order_status,
            sku: product.sku,
            data_source: "woocommerce",
          };
        });

      let GHLinitialFormattedProducts: FormattedProduct[] = allProducts
        .filter((product: any) => product.data_source === 'stripe' || product.data_source === 'gohighlevel')
        .map((product: any): FormattedProduct => {
          const mappedName = getProductName(product.name);
          console.log('Processing Stripe product:', { 
            original_name: product.name, 
            mapped_name: mappedName,
            price: product.price,
            total: product.total
          });
          
          return {
            id: product.id,
            orderId: product.order_id,
            price: product.price,
            name: mappedName,
            description: getProductDescription(mappedName),
            benefits: getProductBenefits(mappedName),
            purchaseDate: product.order_date,
            isRefundable: getProductRefundabilityStatus(
              product.name,
              product.order_date,
            ),
            hasRefundRequest: product.has_refunds || false,
            quantity: product.quantity,
            total: product.total,
            order_number: product.order_number,
            order_status: product.order_status,
            sku: product.sku,
            data_source: "stripe",
          };
        });

      // Check for "Fast-Start + Endless Video Ideas" in ALL products and split into two products
      // This applies to both WP and GHL orders that have this combination
      const fastStartEndlessProductGHL = GHLinitialFormattedProducts.find(
        (product: FormattedProduct) => product.name === "Fast-Start + Endless Video Ideas"
      );
      
      const fastStartEndlessProductWP = WPinitialFormattedProducts.find(
        (product: FormattedProduct) => product.name === "Fast-Start + Endless Video Ideas"
      );
      
      // Handle GHL Fast-Start + Endless Video Ideas splitting
      if (fastStartEndlessProductGHL) {
        // Remove the combined product
        GHLinitialFormattedProducts = GHLinitialFormattedProducts.filter(
          (product: FormattedProduct) => product.name !== "Fast-Start + Endless Video Ideas"
        );
        
        // Create Fast-Start product ($27)
        const fastStartProduct: FormattedProduct = {
          ...fastStartEndlessProductGHL,
          id: fastStartEndlessProductGHL.id * 10 + 1, // Ensure unique ID
          orderId: fastStartEndlessProductGHL.orderId * 10 + 1,
          name: "Fast-Start",
          description: getProductDescription("Fast-Start"),
          benefits: getProductBenefits("Fast-Start"),
          price: "27",
          total: "27",
          isRefundable: getProductRefundabilityStatus(
            "Faceless Income 5-day Fast Start",
            fastStartEndlessProductGHL.purchaseDate,
          ),
          hasRefundRequest: fastStartEndlessProductGHL.hasRefundRequest, // Inherit refund status
          data_source: "stripe",
        };
        
        // Create Endless Video Ideas product ($47)
        const endlessVideoProduct: FormattedProduct = {
          ...fastStartEndlessProductGHL,
          id: fastStartEndlessProductGHL.id * 10 + 2, // Ensure unique ID
          orderId: fastStartEndlessProductGHL.orderId * 10 + 2,
          name: "Endless Video Ideas",
          description: getProductDescription("Endless Video Ideas"),
          benefits: getProductBenefits("Endless Video Ideas"),
          price: "47",
          total: "47",
          isRefundable: getProductRefundabilityStatus(
            "Endless Video Ideas System",
            fastStartEndlessProductGHL.purchaseDate,
          ),
          hasRefundRequest: fastStartEndlessProductGHL.hasRefundRequest, // Inherit refund status
          data_source: "stripe",
        };
        
        // Add both products to the GHL array
        GHLinitialFormattedProducts.push(fastStartProduct, endlessVideoProduct);
      }

      // Handle WP Fast-Start + Endless Video Ideas splitting
      let WPformattedProducts = [...WPinitialFormattedProducts]; // Create mutable copy
      if (fastStartEndlessProductWP) {
        // Remove the combined product
        WPformattedProducts = WPformattedProducts.filter(
          (product: FormattedProduct) => product.name !== "Fast-Start + Endless Video Ideas"
        );
        
        // Create Fast-Start product ($27)
        const fastStartProduct: FormattedProduct = {
          ...fastStartEndlessProductWP,
          id: fastStartEndlessProductWP.id * 10 + 1, // Ensure unique ID
          orderId: fastStartEndlessProductWP.orderId * 10 + 1,
          name: "Fast-Start",
          description: getProductDescription("Fast-Start"),
          benefits: getProductBenefits("Fast-Start"),
          price: "27",
          total: "27",
          isRefundable: getProductRefundabilityStatus(
            "Faceless Income 5-day Fast Start",
            fastStartEndlessProductWP.purchaseDate,
          ),
          hasRefundRequest: fastStartEndlessProductWP.hasRefundRequest, // Inherit refund status
          data_source: "woocommerce",
        };
        
        // Create Endless Video Ideas product ($47)
        const endlessVideoProduct: FormattedProduct = {
          ...fastStartEndlessProductWP,
          id: fastStartEndlessProductWP.id * 10 + 2, // Ensure unique ID
          orderId: fastStartEndlessProductWP.orderId * 10 + 2,
          name: "Endless Video Ideas",
          description: getProductDescription("Endless Video Ideas"),
          benefits: getProductBenefits("Endless Video Ideas"),
          price: "47",
          total: "47",
          isRefundable: getProductRefundabilityStatus(
            "Endless Video Ideas System",
            fastStartEndlessProductWP.purchaseDate,
          ),
          hasRefundRequest: fastStartEndlessProductWP.hasRefundRequest, // Inherit refund status
          data_source: "woocommerce",
        };
        
        // Add both products to the WP array
        WPformattedProducts.push(fastStartProduct, endlessVideoProduct);
      }

      // Apply refund detection to WooCommerce products (use WPformattedProducts which includes splits)
      const WPproductsWithRefundStatus = checkForRefundedProducts(
        data.orders,
        WPformattedProducts,
      );

      // Combine all products (WooCommerce first, then GHL/Stripe)
      const allFormattedProducts = [...WPproductsWithRefundStatus, ...GHLinitialFormattedProducts];

      const formattedData: OrderLookupResponse & {
        products: FormattedProduct[];
      } = {
        ...data,
        products: allFormattedProducts,
      };

      console.log("Formatted data with both sources:", formattedData);
      console.log("WP products:", WPproductsWithRefundStatus.length);
      console.log("GHL products:", GHLinitialFormattedProducts.length);

      if (allFormattedProducts.length === 0) {
        setSearchState("no-orders");
      } else {
        setSearchState("success");
      }
      setOrderData(formattedData);
    },
    onError: (error: any) => {
      setSearchState("error");
      const errorMsg =
        error?.message ||
        "Failed to fetch order data. Please check your API configuration.";
      setErrorMessage(errorMsg);
    },
  });

  // Auto-fetch orders when component mounts
  useEffect(() => {
    if (email) {
      lookupMutation.mutate({ email });
    } else {
      setLocation("/");
    }
  }, [email]);

  // Save customer data to localStorage when order data is loaded
  useEffect(() => {
    if (
      orderData &&
      orderData.success &&
      orderData.products &&
      orderData.products.length > 0
    ) {
      let firstName = "";

      // Debug logging to see what data we have
      console.log("Products data:", orderData.products?.[0]);

      // Check if we have WooCommerce orders with billing data
      if (orderData.orders && orderData.orders.length > 0) {
        const firstOrder = orderData.orders[0];
        const billing = firstOrder.billing;
        console.log("Billing data:", billing);

        if (billing && billing.first_name) {
          firstName = billing.first_name;
          console.log("Using billing first name:", firstName);
        }
      }

      // If no billing first name, try to extract from customer_name in product data
      if (!firstName && orderData.products && orderData.products.length > 0) {
        const firstProduct = orderData.products[0];
        if (firstProduct.customer_name) {
          firstName = firstProduct.customer_name.split(" ")[0];
          console.log("Using customer_name split:", firstName);
        }
      }

      // Final fallback to email if no name is available
      if (!firstName) {
        firstName = orderData.customer_email.split("@")[0];
        console.log("Using email fallback:", firstName);
      }

      console.log("Final firstName to store:", firstName);
      localStorage.setItem("firstName", firstName);
      localStorage.setItem("customerEmail", orderData.customer_email);
    }
  }, [orderData]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url('https://viralprofits.yt/wp-content/uploads/2025/02/Mask-group-1.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Navbar title="Viral Profits | Order Management" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/search")}
          className="mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>

        {/* Customer Info Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Manage Your Orders
          </h2>
          <p className="text-slate-600">
            Showing orders for:{" "}
            <span className="font-small text-slate-800">{email}</span>
          </p>
        </div>

        {/* Loading State */}
        {searchState === "loading" && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-600">Loading your orders...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {searchState === "error" && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Error:</strong> {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* No Orders State */}
        {searchState === "no-orders" && orderData && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No Orders Found
                </h3>
                <p className="text-slate-600">
                  No orders were found for the email address:{" "}
                  <strong>{orderData.customer_email}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {searchState === "success" && orderData && (
          <div className="space-y-6">
            {/* Products Purchased */}
            <Card>
              <CardContent>
                <div className="space-y-4">
                  {orderData.products.map((product) => (
                    <div
                      key={`${product.orderId}-${product.id}`}
                      className={`border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors ${!product.hasRefundRequest && product.isRefundable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                      onClick={() => {
                        if (product.hasRefundRequest) {
                          toast({
                            title:
                              "This product already has a refund requested",
                            description:
                              "You can only request refund once per product. Please contact support for further information about your refund status.",
                            variant: "destructive",
                          });
                          return;
                        }

                        if (!product.isRefundable) {
                          toast({
                            title: "Product is non-refundable",
                            description:
                              (NO_REFUND_REASON[product.name] || "") +
                              "\n\n Please check Terms of Service for details.",
                            variant: "destructive",
                          });
                          return;
                        }
                      }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-slate-800 text-lg">
                              {product.name}
                            </h4>
                            <div className="text-right ml-4">
                              <div className="font-semibold text-slate-800">
                                ${product.total}
                              </div>
                              {product.quantity > 1 && (
                                <div className="text-xs text-slate-500">
                                  ${product.price} each
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-slate-600 mb-2">
                              {product.description}
                            </p>

                            {(product.hasRefundRequest ||
                              !product.isRefundable) && (
                              <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                                <div className="flex items-center space-x-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                  <span className="text-xs font-medium text-red-800">
                                    {product.hasRefundRequest
                                      ? "This product has already been refunded"
                                      : "Product is not eligible for refund"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* {product.benefits &&
                              product.benefits.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs font-medium text-green-800">
                                      What's Included
                                    </span>
                                  </div>
                                  <ul className="text-xs text-green-700 space-y-1">
                                    {product.benefits.map((benefit, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start"
                                      >
                                        <span className="mr-2">•</span>
                                        <span>{benefit}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )} */}

                            {product.is_split_payment &&
                              product.split_payments && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-800">
                                      Split Payment Product
                                    </span>
                                  </div>
                                  <div className="text-xs text-blue-700 space-y-1">
                                    {product.split_payments.map(
                                      (payment, idx) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between"
                                        >
                                          <span>
                                            Payment {idx + 1} (#
                                            {payment.order_number}):
                                          </span>
                                          <span>
                                            ${payment.amount} on{" "}
                                            {new Date(
                                              payment.date,
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col items-start">
                              <div className="flex items-center space-x-4 text-xs text-slate-600 mb-2">
                                <span className="flex items-center space-x-1">
                                  <span className="text-xs text-slate-500">
                                    Qty: {product.quantity}
                                  </span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <span className="text-xs text-slate-500">
                                    Purchase Date:{" "}
                                    {new Date(
                                      product.purchaseDate,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    at{" "}
                                    {new Date(
                                      product.purchaseDate,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-slate-500">
                                <span>Order #{product.order_number}</span>
                                <span className="text-xs font-medium ml-2">
                                  {product.data_source === 'woocommerce' ? 'Ref: WP' : 'Ref: GHL'}
                                </span>
                              </div>
                            </div>

                            {product.isRefundable &&
                            !product.hasRefundRequest ? (
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  className={`${
                                    product.order_status === "pending"
                                      ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                                      : "bg-green-600 hover:bg-green-700"
                                  } text-white font-medium`}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click event

                                    if (product.order_status === "pending") {
                                      return; // Don't allow navigation for pending orders
                                    }

                                    // Save selected product to localStorage and navigate
                                    localStorage.setItem(
                                      "selectedProduct",
                                      JSON.stringify(product),
                                    );
                                    setLocation("/refund-options");
                                  }}
                                  disabled={product.order_status === "pending"}
                                >
                                  Manage
                                </Button>
                                {product.order_status === "pending" && (
                                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                    Pending
                                  </span>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
