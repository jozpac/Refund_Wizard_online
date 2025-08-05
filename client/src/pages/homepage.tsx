import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function Homepage() {
  const [, setLocation] = useLocation();

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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Original Card */}
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <h2 className="text-lg font-bold text-slate-800 mb-3">
                Need help with your Viral Profits purchase?
              </h2>

              <p className="text-slate-600 text-sm mb-8 leading-relaxed px-4 sm:px-0 sm:max-w-[60%] sm:mx-auto">
                If you're looking to review your purchases or request a refund,
                we're here to help you out.
              </p>

              <Button
                onClick={() => setLocation("/search")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold inline-flex items-center space-x-2"
              >
                <span>Manage your order</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Need other assistance? Contact us at{" "}
                  <a
                    href="mailto:hello@viralprofits.yt"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    hello@viralprofits.yt
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>


        </div>
      </main>
    </div>
  );
}
