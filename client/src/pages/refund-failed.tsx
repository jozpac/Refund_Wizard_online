import { useEffect } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function RefundFailed() {
  const [, setLocation] = useLocation();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleTryAgain = () => {
    setLocation("/");
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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <div className="max-w-md mx-auto">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-16 text-center space-y-8">
              {/* X Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-10 h-10 text-red-600" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900">
                Refund request failed
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-lg leading-relaxed">
                We couldn't process the refund at the moment. Please try again, or contact our customer support.
              </p>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={handleTryAgain}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Try Again
                </Button>
                
                <Button
                  onClick={() => window.location.href = 'mailto:hello@viralprofits.yt'}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-6 py-3 rounded-lg font-medium"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}