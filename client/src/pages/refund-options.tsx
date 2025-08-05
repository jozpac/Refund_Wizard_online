import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowRight, X, ArrowLeft } from "lucide-react";
import { getProductBenefits } from "@/utils/product-utils";

// Special products that skip 50% refund option
const GOOGLE_FORM_PRODUCTS = [
  "Copy-paste",
  "Income Stream Bundle",
  "Channel Brand Kit",
];
// Fast Start skips the refund-request (50% refund) step
const FAST_START_PRODUCT = "Fast-Start";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function RefundOptions() {
  const [, setLocation] = useLocation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [firstName, setFirstName] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [customerEmail, setCustomerEmail] = useState<string>("");

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedFirstName = localStorage.getItem("firstName") || "Customer";
    const storedProduct = localStorage.getItem("selectedProduct");
    const storedEmail = localStorage.getItem("customerEmail") || "";

    console.log("Loading firstName from localStorage:", storedFirstName);
    setFirstName(storedFirstName);
    setCustomerEmail(storedEmail);

    if (storedProduct) {
      try {
        setSelectedProduct(JSON.parse(storedProduct));
      } catch (error) {
        console.error("Error parsing selected product:", error);
      }
    }
  }, []);

  // Check if this product should skip the 50% refund option
  const shouldSkipPartialRefund =
    selectedProduct && GOOGLE_FORM_PRODUCTS.includes(selectedProduct.name);

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
          onClick={() =>
            setLocation(`/${encodeURIComponent(customerEmail)}/orders`)
          }
          className="mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        <div className="max-w mx-auto">
          {/* Refund Options Card */}
          <Card>
            <CardContent className="p-8 text-center">
              <div className="p-6 space-y-6">
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-4">💔</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Wait {firstName}… what if this is the moment that changes
                      everything?
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      You're here.
                      <br />
                      <br />
                      Hovering over the refund button.
                      <br />
                      <br />
                      Finger ready.
                      <br />
                      <br />
                      Mind made up.
                      <br />
                      <br />
                      But pause—just for a second—and ask yourself:
                    </p>

                    <p className="text-md font-medium text-center py-6 mb-3">
                      Why did you even sign up in the first place, {firstName}?
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      It wasn't for "just another course."
                      <br />
                      <br />
                      It was because something inside you whispered,
                      <br />
                      <br />
                      "There's more for me than this life I'm settling for."
                    </p>

                    <p className="text-sm font-medium pt-6 mb-3">
                      And you listened.
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      You didn't just buy a product.
                      <br />
                      <br />
                      You made a decision.
                      <br />
                      <br />A rare, powerful, courageous decision—to bet on
                      yourself.
                    </p>

                    <p className="text-md font-medium text-center py-6 mb-3">
                      Most people never do.
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      They scroll.
                      <br />
                      <br />
                      They wish.
                      <br />
                      <br />
                      They wait.
                      <br />
                      <br />
                      And when they do start?
                      <br />
                      <br />
                      They quit the second it feels uncomfortable.
                      <br />
                      <br />
                      They give up right before the breakthrough.
                      <br />
                      <br />
                      They never realize how close they were.
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      But {firstName}, you are not most people.
                      <br />
                      <br />
                      You're already ahead.
                      <br />
                      <br />
                      Because you didn't just dream it—you moved.
                      <br />
                      <br />
                      You took action.
                      <br />
                      <br />
                      And that puts you in the top 5% of people who actually
                      start building something real.
                    </p>

                    <p className="text-md font-medium text-center py-6 mb-3">
                      Now you're at a crossroads.
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      You can walk away.
                      <br />
                      <br />
                      Refund your progress.
                      <br />
                      <br />
                      <strong>Cancel your future.</strong>
                      <br />
                      <br />
                    </p>

                    <p className="text-md font-medium text-center py-6 mb-3">
                      Or...
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong>You can reclaim your power.</strong>
                      <br />
                      <br />
                      <strong>Pick your momentum back up.</strong>
                      <br />
                      <br />
                      And say: <strong>"I'm not done yet.</strong>
                    </p>
                  </div>
                  <p className="text-md font-medium text-center py-6 mb-3">
                    So before you walk away, we just ask this:
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    Tell us how we can do better—for you, and for those
                    following behind you.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    But if something inside you is saying "maybe I should keep
                    going"...
                    <br />
                    <br />
                    Even if it's small.
                    <br />
                    <br />
                    Even if it's scared.
                  </p>
                  <p className="text-md font-semibold text-center py-2 mb-4">
                    Listen to that voice.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-5">
                    Because that voice is the future version of you—
                    <br />
                    <br />
                    already living the life you came here to build.
                  </p>

                  <div className="py-2 space-y-4">
                    <hr />
                  </div>

                  <div className="py-2 space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      When you joined our mission to help 500 everyday people
                      build life-changing YouTube channels, you joined a
                      movement bigger than just you.
                      <br />
                      <br />
                      You joined a mission that's helping real people quit jobs
                      they hate, build lives they love, and finally find the
                      freedom they've been searching for.
                    </p>

                    <p className="text-md font-medium text-center py-6 mb-3">
                      And you became part of that.
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed">
                      Your belief fueled our small but passionate team of 5+
                      creators, editors, and educators who wake up every day to
                      make this possible for people like you.
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed mt-3">
                      We've made this program accessible so we can reach as many
                      lives as possible.
                      <br />
                      <br />A refund doesn't just{" "}
                      <strong>pause your access.</strong>
                      <br />
                      <br />
                      <strong>It slows down a movement.</strong>
                      <br />
                      <br />
                      It subtracts one more story from this revolution.
                      <br />
                      <br />
                      <span className="font-medium">
                        <strong>Your story.</strong>
                      </span>
                    </p>
                  </div>
                  {selectedProduct && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-bold mb-2 py-1 text-lg">
                        Let's keep your access to the {selectedProduct.name}
                      </h4>
                      <div className="space-y-2">
                        {getProductBenefits(selectedProduct.name).map(
                          (benefit, index) => (
                            <div key={index} className="flex items-start">
                              <span className="text-green-600 mr-2">✅</span>
                              <span className="text-sm text-left">{benefit}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed mt-4">
                    You're already on the path.
                    <br />
                    <br />
                    Let's not hit pause now — you've come too far to quit.
                    <br />
                    <br />
                    If there's a way we can support you better, just let us
                    know.
                    <br />
                    <br />
                    We truly want to help.
                    <br />
                    <br />
                    <strong>You're part of something bigger.</strong>
                    <br />
                    <br />
                    <strong>And we still believe in you.</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full">
                <Button
                  onClick={() => setLocation("/finish")}
                  className="w-full text-white px-6 py-4 rounded-lg font-medium inline-flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-lg"
                >
                  <span>Keep my access and continue</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    if (
                      shouldSkipPartialRefund ||
                      selectedProduct?.name === FAST_START_PRODUCT
                    ) {
                      // For special products and Fast Start, go directly to full refund request
                      setLocation("/full-refund-request?isFullRefund=true");
                    } else {
                      // For regular products, go to refund request with 50% option
                      setLocation("/refund-request");
                    }
                  }}
                  className="w-full px-6 py-4 rounded-lg font-normal inline-flex items-center justify-center space-x-2 border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 bg-white"
                >
                  <span>Cancel and request refund</span>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
