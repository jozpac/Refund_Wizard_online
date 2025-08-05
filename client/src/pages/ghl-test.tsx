import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function GHLTest() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userFound, setUserFound] = useState<boolean | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [stripeResponse, setStripeResponse] = useState<any>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [wooCommerceResponse, setWooCommerceResponse] = useState<any>(null);
  const [isLoadingWooCommerce, setIsLoadingWooCommerce] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setUserFound(null);
    setApiResponse(null);
    setStripeResponse(null);
    setWooCommerceResponse(null);

    try {
      console.log('Testing GHL API for email:', email);
      
      const response = await fetch('/api/ghl/test-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('GHL API Response:', data);
      
      setApiResponse(data);
      setUserFound(data.success && data.contact);
      
    } catch (error) {
      console.error('Error testing GHL API:', error);
      setUserFound(false);
    } finally {
      setIsLoading(false);
    }
  };

  const testStripe = async () => {
    if (!email) return;

    setIsLoadingStripe(true);
    setStripeResponse(null);

    try {
      console.log('Testing Stripe API for email:', email);
      
      const response = await fetch(`/api/stripe-orders?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      console.log('Stripe API Response:', data);
      setStripeResponse(data);
      
    } catch (error) {
      console.error('Error testing Stripe API:', error);
      setStripeResponse({ error: 'Failed to fetch Stripe data' });
    } finally {
      setIsLoadingStripe(false);
    }
  };

  const testWooCommerce = async () => {
    if (!email) return;

    setIsLoadingWooCommerce(true);
    setWooCommerceResponse(null);

    try {
      console.log('Testing WooCommerce API for email:', email);
      
      const response = await fetch(`/api/woocommerce/test-orders?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      console.log('WooCommerce API Response:', data);
      setWooCommerceResponse(data);
      
    } catch (error) {
      console.error('Error testing WooCommerce API:', error);
      setWooCommerceResponse({ error: 'Failed to fetch WooCommerce data' });
    } finally {
      setIsLoadingWooCommerce(false);
    }
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
      <Navbar title="Viral Profits | GHL Testing" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Homepage
        </Button>

        <div className="max-w-lg mx-auto">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Test GoHighLevel API
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email to search in GHL"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? "Searching..." : "Test GHL Contact Search"}
                  </Button>
                </form>

                {/* User Found Status */}
                {userFound !== null && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    userFound 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {userFound ? 'User found in GoHighLevel!' : 'User not found in GoHighLevel'}
                  </div>
                )}

                {/* API Response Display */}
                {apiResponse && (
                  <div className="mt-6 text-left space-y-4">
                    <div>
                      <h3 className="font-medium text-slate-800 mb-2">Contact Search Response:</h3>
                      <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto max-h-40 text-slate-700">
                        {JSON.stringify({
                          success: apiResponse.success,
                          email: apiResponse.email,
                          contact: apiResponse.contact,
                          found: apiResponse.found
                        }, null, 2)}
                      </pre>
                    </div>

                    {/* Transactions Response */}
                    {apiResponse.transactions !== null && (
                      <div>
                        <h3 className="font-medium text-slate-800 mb-2">Transactions Response:</h3>
                        <pre className="bg-blue-50 p-3 rounded text-xs overflow-auto max-h-60 text-slate-700">
                          {JSON.stringify(apiResponse.transactions, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Transactions Error */}
                    {apiResponse.transactionsError && (
                      <div>
                        <h3 className="font-medium text-red-800 mb-2">Transactions Error:</h3>
                        <div className="bg-red-50 p-3 rounded text-xs text-red-700">
                          {apiResponse.transactionsError}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stripe Test Section */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-4">Test Stripe Integration</h3>
                  <Button
                    onClick={testStripe}
                    disabled={isLoadingStripe || !email}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isLoadingStripe ? "Searching Stripe..." : "Test Stripe Orders"}
                  </Button>

                  {/* Stripe Response */}
                  {stripeResponse && (
                    <div className="mt-4 text-left">
                      <h4 className="font-medium text-slate-800 mb-2">Stripe Response:</h4>
                      <pre className="bg-purple-50 p-3 rounded text-xs overflow-auto max-h-60 text-slate-700">
                        {JSON.stringify(stripeResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* WooCommerce Test Section */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-4">Test WooCommerce Integration</h3>
                  <Button
                    onClick={testWooCommerce}
                    disabled={isLoadingWooCommerce || !email}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoadingWooCommerce ? "Searching WooCommerce..." : "Test WooCommerce Orders"}
                  </Button>

                  {/* WooCommerce Response */}
                  {wooCommerceResponse && (
                    <div className="mt-4 text-left">
                      <h4 className="font-medium text-slate-800 mb-2">WooCommerce Response:</h4>
                      <pre className="bg-green-50 p-3 rounded text-xs overflow-auto max-h-60 text-slate-700">
                        {JSON.stringify(wooCommerceResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}