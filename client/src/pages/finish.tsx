import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function Finish() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState<string>("");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load firstName from localStorage on component mount
  useEffect(() => {
    const storedFirstName = localStorage.getItem("firstName") || "Customer";
    setFirstName(storedFirstName);
  }, []);

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
            <CardContent className="p-8 text-center">
              {/* Trophy Icon */}
              <div className="mb-6">
                <div className="text-6xl">🏆</div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 mb-4">
                You made the right decision, {firstName}!
              </h2>

              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                We're thrilled that you've decided to continue this journey to
                better life and more freedom with us. We know your dedication is
                strong, and we're committed to providing you with the best
                support possible on road to success.
              </p>

              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm font-medium">
                  Your access to all materials remains active and unchanged.
                </p>
              </div>

              <Button
                onClick={() => setLocation("/")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
