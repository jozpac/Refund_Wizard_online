import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowRight, X, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function RefundRequest() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedFirstName = localStorage.getItem("firstName") || "Customer";
    const storedProduct = localStorage.getItem("selectedProduct");

    setFirstName(storedFirstName);

    if (storedProduct) {
      try {
        setSelectedProduct(JSON.parse(storedProduct));
      } catch (error) {
        console.error("Error parsing selected product:", error);
      }
    }
  }, []);

  // Calculate 50% refund amount
  const calculateRefundAmount = () => {
    if (!selectedProduct || !selectedProduct.price) return "0";
    const price = parseFloat(selectedProduct.price);
    const refundAmount = (price * 0.5).toFixed(0);
    return refundAmount;
  };

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
          onClick={() => setLocation("/refund-options")}
          className="mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-lg mx-auto">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    We understand your decision, {firstName}... But before you
                    go —
                  </h2>
                </div>

                {/* Main Offer */}
                <div className="text-center">
                  <h3 className="text-base font-semibold text-slate-800 mb-4">
                    Let's get you a 50% refund, and KEEP your lifetime access!
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Yes, you read that right.
                  </p>
                </div>

                {/* Personal Message */}
                <div className="space-y-4">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {firstName}, you're not someone who gives up easily. You
                    made a decision most people never do: you took action on
                    your dreams. You raised your hand and said, "I want more
                    from life." That says everything about the kind of person
                    you are.
                  </p>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    But here's the truth most people never hear:
                  </p>

                  <p className="text-sm font-medium text-slate-800 text-center py-2">
                    Most people give up right before they succeed. Don't let
                    this be you.
                  </p>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    We don't want you to walk away with nothing—so here's what
                    we're offering:
                  </p>
                </div>

                {/* Offer Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          A 50% refund of ${calculateRefundAmount()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-green-700">
                          And lifetime access to Fast-Start — so you can return
                          anytime, ready.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 italic">
                    This is a one-time offer, created to help cover the cost of
                    our team while giving you the full value you signed up for.
                  </p>
                </div>

                {/* Benefits Reminder */}
                <div>
                  <p className="text-sm text-slate-700 mb-3">
                    When you keep access, you still get:
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <strong className="text-md text-slate-700">
                        Complete monetization blueprint – turn your ideas into
                        passive income
                      </strong>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <strong className="text-md text-slate-700">
                        Done-for-you templates to accelerate your results
                      </strong>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <strong className="text-md text-slate-700">
                        Confidence to finally build your financial future on
                        your terms
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Closing Message */}
                <div className="text-center">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Thousands of people give up at this very stage. But{" "}
                    {firstName}— the ones who succeed? They stay in the game.
                    They push just a little further. You're closer than you
                    think.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 w-full pt-4">
                  <Button
                    onClick={() =>
                      setLocation("/full-refund-request?isFullRefund=false")
                    }
                    className="w-full text-white px-6 py-4 rounded-lg font-semibold inline-flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-sm"
                  >
                    <span>
                      <strong>Yes!</strong> Give me <strong>50% refund</strong>{" "}
                      and lifetime access
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setLocation("/full-refund-request?isFullRefund=true")
                    }
                    className="w-full px-6 py-4 rounded-lg font-normal inline-flex items-center justify-center space-x-2 border-red-300 text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-400 bg-white text-sm"
                  >
                    <span>Cancel my access and request a full refund</span>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
