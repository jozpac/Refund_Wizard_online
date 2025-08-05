import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";

declare global {
  interface Window {
    grecaptcha: any;
  }
}

// Special products that should redirect to Google Form
const GOOGLE_FORM_PRODUCTS = ['Copy-paste', 'Income Stream Bundle', 'Channel Brand Kit'];
const GOOGLE_FORM_URLS = {
  'Copy-paste': 'https://forms.gle/HxESU3ZCKJFSeAN3A',
  'Income Stream Bundle': 'https://forms.gle/CEUTscFjiLBmaMgK7',
  'Channel Brand Kit': 'https://forms.gle/ov2Z8iART9o68Fco9'
};

export default function FullRefundRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [isRecaptchaLoaded, setIsRecaptchaLoaded] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string>("");

  // Parse isFullRefund from URL params and manage as state
  const [isFullRefund, setIsFullRefund] = useState(() => 
    new URLSearchParams(window.location.search).get("isFullRefund") === "true"
  );

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Custom back button handler for special products
  const handleBackNavigation = () => {
    // For Fast Start and special products that came directly from refund-options, go back there
    if (selectedProduct?.name === "Fast-Start" || (selectedProduct && GOOGLE_FORM_PRODUCTS.includes(selectedProduct.name))) {
      setLocation("/refund-options");
    } else {
      // For regular products, go to refund-request (50% refund page)
      setLocation("/refund-request");
    }
  };

  // Load reCAPTCHA script
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;

    // Define global callback
    (window as any).onRecaptchaLoad = () => {
      setIsRecaptchaLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      delete (window as any).onRecaptchaLoad;
    };
  }, []);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedFirstName = localStorage.getItem("firstName") || "Customer";
    const storedProduct = localStorage.getItem("selectedProduct");
    const storedCustomerEmail = localStorage.getItem("customerEmail") || "";

    setFirstName(storedFirstName);
    setCustomerEmail(storedCustomerEmail);

    if (storedProduct) {
      try {
        setSelectedProduct(JSON.parse(storedProduct));
      } catch (error) {
        console.error("Error parsing selected product:", error);
      }
    }
  }, []);

  // Check if this product should use Google Form
  const shouldUseGoogleForm = selectedProduct && GOOGLE_FORM_PRODUCTS.includes(selectedProduct.name);

  // Handle Google Form redirect for special products
  const handleGoogleFormRedirect = () => {
    const productName = selectedProduct?.name;
    const formUrl = GOOGLE_FORM_URLS[productName as keyof typeof GOOGLE_FORM_URLS];
    if (formUrl) {
      window.open(formUrl, '_blank');
    }
  };

  // Handle reCAPTCHA verification
  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token || "");
  };

  // Submit refund request mutation
  const submitRefundRequest = useMutation({
    mutationFn: async (data: {
      firstName: string;
      productName: string;
      feedback: string;
      recaptchaToken: string;
      isFullRefund: boolean;
      selectedProduct: any;
      customerEmail: string;
    }) => {
      const response = await fetch("/api/refund/submit", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Navigate to success page instead of showing toast
      setLocation("/refund-success");
    },
    onError: (error: any) => {
      // Navigate to failure page instead of showing toast
      setLocation("/refund-failure");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Feedback is now optional for all products
    // Removed feedback validation requirement

    submitRefundRequest.mutate({
      firstName,
      productName: selectedProduct?.name || "Product",
      feedback: feedback || "", // Use empty string if no feedback provided
      recaptchaToken: "test-token", // Temporary for testing
      isFullRefund,
      selectedProduct,
      customerEmail,
    });
  };

  // Render reCAPTCHA widget
  useEffect(() => {
    if (isRecaptchaLoaded && window.grecaptcha && window.grecaptcha.render) {
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer && !recaptchaContainer.hasChildNodes()) {
        try {
          window.grecaptcha.render("recaptcha-container", {
            sitekey: "6LdSL2QrAAAAACvzXuuWx-12-y69Da-5Wv-8wZxg",
            callback: handleRecaptchaChange,
            "expired-callback": () => setRecaptchaToken(""),
          });
        } catch (error) {
          console.error("Error rendering reCAPTCHA:", error);
        }
      }
    }
  }, [isRecaptchaLoaded]);

  // If this product should use Google Form, show redirect interface
  if (shouldUseGoogleForm) {
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
          <Button
            variant="ghost"
            onClick={handleBackNavigation}
            className="mb-6 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="max-w-lg mx-auto">
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <h2 className="text-xl font-bold text-slate-800">
                    {isFullRefund ? "Cancel your access" : "Get 50% Refund"}
                  </h2>
                  
                  <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                    <p>
                      {selectedProduct?.name === 'Channel Brand Kit' && 
                        <>To qualify for a refund of <strong>Channel Brand Kit</strong>, you must fully complete the program, implement the materials provided, and submit proof of your use of the resources. Please complete our specialized refund form if you have done all these steps and we will refund your purchase.</>
                      }
                      {selectedProduct?.name === 'Income Stream Bundle' && 
                        <>To be eligible for a refund of <strong>Income Stream Bundle</strong>, you must complete the program in full, implement the materials as instructed, and provide proof of your efforts. Please complete our specialized refund form if you have done all these steps and we will refund your purchase.</>
                      }
                      {selectedProduct?.name === 'Copy-paste' && 
                        <>To be eligible for a refund of <strong>The Copy Paste Channel</strong>, you must complete the system in full, including the 6-Figure Checklist, and implement the materials as directed. Please complete our specialized refund form if you have done all these steps and we will refund your purchase.</>
                      }
                    </p>
                    <p>
                      Our team will process your request within 48 hours.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleGoogleFormRedirect}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                    size="lg"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Complete Refund Request Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

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
          onClick={handleBackNavigation}
          className="mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-lg mx-auto">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    {isFullRefund ? "Cancel your access" : "Get 50% Refund"}
                  </h2>
                </div>

                {/* Description */}
                <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                  <p>
                    We understand that our program may not be the right fit for
                    everyone at this time.
                  </p>
                  <p>
                    To proceed with your {isFullRefund ? "full" : "50%"} refund
                    request for{" "}
                    <span className="font-medium text-slate-800">
                      {selectedProduct?.name || "your product"}
                    </span>
                    , please complete the verification below.
                  </p>
                  {isFullRefund ? (
                    <p>
                      Our team will review your request and respond within 48
                      hours.
                    </p>
                  ) : (
                    <p>
                      Our team will process your request and respond within 48
                      hours.
                    </p>
                  )}
                </div>

                {/* Banner Section - Hide for Fast Start */}
                {selectedProduct?.name !== "Fast-Start" && (
                  <>
                    {isFullRefund ? (
                      <div className="bg-white border border-gray-200 rounded-md p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Keep in mind</h4>
                        <p className="text-sm text-gray-700 mb-3">
                          You are losing access to {selectedProduct?.name || "your product"} by requesting a full-refund, while you could keep lifetime access with only 50% refund.
                        </p>
                        <Button
                          type="button"
                          onClick={() => {
                            setIsFullRefund(false);
                            const newUrl = new URL(window.location);
                            newUrl.searchParams.set("isFullRefund", "false");
                            window.history.pushState({}, '', newUrl);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          I want lifetime access with 50% refund
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          <h4 className="font-semibold text-green-800">50% refund</h4>
                        </div>
                        <p className="text-sm text-green-700">
                          You are keeping lifetime access to {selectedProduct?.name || "your product"}.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Feedback Section */}
                <div className="space-y-2">
                  <Label
                    htmlFor="feedback"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Please share your feedback
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="Your feedback will help future students succeed (optional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[120px] resize-none border border-slate-300 rounded-lg px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* reCAPTCHA */}
                <div className="flex justify-center">
                  <div id="recaptcha-container"></div>
                </div>

                {/* Closing Message */}
                <div className="text-center -mb-3">
                  <p className="text-sm text-slate-600">
                    We're sorry to see you go. We wish you all the success!
                  </p>
                </div>

                {/* Submit Button */}
                <div>
                  <Button
                    type="submit"
                    disabled={submitRefundRequest.isPending}
                    className="w-full px-6 py-4 rounded-lg font-normal inline-flex items-center justify-center space-x-2 border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 bg-white text-sm border"
                  >
                    <span>
                      {submitRefundRequest.isPending
                        ? "Submitting..."
                        : isFullRefund
                          ? "Cancel and request refund"
                          : "Request 50% refund and keep lifetime access"}
                    </span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
