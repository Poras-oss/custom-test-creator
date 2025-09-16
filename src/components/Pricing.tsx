import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, X, Loader2, Zap, Infinity } from "lucide-react"
import { useUser } from "@clerk/clerk-react"

import { Button } from "../components/ui/button"
import { Switch } from "../components/ui/switch"
import { Alert, AlertDescription } from "../components/ui/alert"

interface Feature {
  name: string;
  value: string;
  negative?: boolean;
  unlimited?: boolean;
}

interface PlanPrice {
  monthly: number;
  yearly: number;
}

interface RazorpayPlanIds {
  monthly: string;
  yearly: string;
}

interface Plan {
  name: string;
  planId: string;
  price: PlanPrice;
  description: string;
  features: Feature[];
  free?: boolean;
  popular?: boolean;
  enterprise?: boolean;
  razorpayPlanIds: RazorpayPlanIds | null;
}

// Add RazorpayResponse interface for the handler
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

// Add Razorpay to window object
declare global {
  interface Window {
    Razorpay: any; // You can create a more specific type if needed
  }
}

const plans: Plan[] = [
  {
    name: "Free",
    planId: "free",
    price: { monthly: 0, yearly: 0 },
    description: "Get started with basic features",
    features: [
      { name: "Daily Fuel Bonus ⛽", value: "+20 Fuel" },
      { name: "Max Fuel Storage", value: "100 Fuel" },
      { name: "Standard Questions 📚", value: "Yes" },
      { name: "Premium Questions", value: "No", negative: true },
      { name: "Data Sense Exclusive Questions", value: "No", negative: true },
      { name: "Mock Test (100L)", value: "1 Test Only" },
      { name: "Live Test", value: "Yes" },
      { name: "Customized Test", value: "1 Test Only" },
      { name: "Battle Challenges ⚔️", value: "Limited" },
      { name: "Ranked Battles (Leaderboard) 🏆", value: "No", negative: true },
      { name: "Hidden Challenges 🔥", value: "No", negative: true },
      { name: "Leaderboard Participation 📊", value: "No", negative: true },
      { name: "Resume Review (50L)", value: "2 Reviews" },
      { name: "JD Review (100L)", value: "1 Review" },
    ],
    free: true,
    razorpayPlanIds: null, // No subscription for free plan
  },
  {
    name: "Pro",
    planId: "plan_QBObaZLRPpakhP",
    price: { monthly: 249, yearly: 2490 },
    description: "Perfect for serious learners",
    features: [
      { name: "Daily Fuel Bonus ⛽", value: "+100 Fuel" },
      { name: "Max Fuel Storage", value: "3000 Fuel" },
      { name: "Standard Questions 📚", value: "Yes" },
      { name: "Premium Questions", value: "Yes" },
      { name: "Data Sense Exclusive Questions", value: "No", negative: true },
      { name: "Mock Test (100L)", value: "Yes" },
      { name: "Live Test", value: "Yes" },
      { name: "Customized Test", value: "Yes" },
      { name: "Battle Challenges ⚔️", value: "Yes" },
      { name: "Ranked Battles (Leaderboard) 🏆", value: "Yes" },
      { name: "Hidden Challenges 🔥", value: "Yes" },
      { name: "Leaderboard Participation 📊", value: "Yes" },
      { name: "Resume Review (50L)", value: "2 Reviews Per Day" },
      { name: "JD Review (100L)", value: "1 Per Day" },
    ],
    popular: true,
    razorpayPlanIds: {
      monthly: "plan_QBObaZLRPpakhP", // Replace with actual Razorpay plan ID
      yearly: "plan_ProYearly",   // Replace with actual Razorpay plan ID
    },
  },
  {
    name: "Elite",
    planId: "plan_QBOcAVOQUhZ4fX",
    price: { monthly: 399, yearly: 3990 },
    description: "For the ultimate experience",
    features: [
      { name: "Daily Fuel Bonus ⛽", value: "Unlimited", unlimited: true },
      { name: "Max Fuel Storage", value: "Unlimited", unlimited: true },
      { name: "Standard Questions 📚", value: "Yes" },
      { name: "Premium Questions", value: "Yes" },
      { name: "Data Sense Exclusive Questions", value: "Yes" },
      { name: "Mock Test (100L)", value: "Yes" },
      { name: "Live Test", value: "Yes" },
      { name: "Customized Test", value: "Yes" },
      { name: "Battle Challenges ⚔️", value: "Yes" },
      { name: "Ranked Battles (Leaderboard) 🏆", value: "Yes" },
      { name: "Hidden Challenges 🔥", value: "Yes" },
      { name: "Leaderboard Participation 📊", value: "Yes" },
      { name: "Resume Review (50L)", value: "Unlimited", unlimited: true },
      { name: "JD Review (100L)", value: "Unlimited", unlimited: true },
    ],
    enterprise: true,
    razorpayPlanIds: {
      monthly: "plan_QBOcAVOQUhZ4fX", // Replace with actual Razorpay plan ID
      yearly: "plan_EliteYearly",   // Replace with actual Razorpay plan ID
    },
  },
]

export default function RazorpayPricingPage() {
  // Add isDarkMode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isYearly, setIsYearly] = useState(false)
  const [hoveredPlan, setHoveredPlan] = useState<null | string>(null)
  const [loadingPlanId, setLoadingPlanId] = useState<null | string>(null)
  const [error, setError] = useState("")
  const { user, isSignedIn } = useUser()

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const initializeRazorpay = async (plan: Plan) => {
    if (plan.free) {
      // Handle free plan signup without payment
      try {
        setLoadingPlanId(plan.planId)
        const response = await fetch("https://server.datasenseai.com/payment/signup-free", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerkId: user?.id,
            plan: plan.planId,
          }),
        })
        if (!response.ok) throw new Error("Failed to sign up for free plan")
        window.location.href = "https://server.datasenseai.com/payment/free-signup-success"
      } catch (err) {
        setError("Failed to sign up for free plan. Please try again.")
      } finally {
        setLoadingPlanId(null)
      }
      return
    }

    if (!isSignedIn || !user) {
      setError("Please log in before making a purchase.")
      return
    }

    try {
      setLoadingPlanId(plan.planId)
      setError("")

      // Select the appropriate Razorpay plan ID based on billing cycle
      if (!plan.razorpayPlanIds) {
        throw new Error("No Razorpay plan IDs available")
      }
      
      const razorpayPlanId = plan.razorpayPlanIds[isYearly ? "yearly" : "monthly"]

      // Create subscription
      const response = await fetch("https://server.datasenseai.com/payment/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpayPlanId: razorpayPlanId,
          clerkId: user.id,
          email: user.emailAddresses?.[0]?.emailAddress || "",
          plan_id: plan.planId, // Optional, for reference on server
        }),
      })

      if (!response.ok) throw new Error("Failed to create subscription")

      const subscription = await response.json()
     
      const options = {
        key: 'rzp_test_gGfozkxP1yjUMG',
        subscription_id: subscription.id, 
        name: "Datasense LMS",
        description: `${plan.name} - ${isYearly ? "Yearly" : "Monthly"} Subscription`,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyResponse = await fetch("https://server.datasenseai.com/payment/verify-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                clerkId: user.id,
                plan_id: plan.planId,
              }),
            })
            
            if (!verifyResponse.ok) throw new Error("Subscription verification failed")

            window.location.href = "https://server.datasenseai.com/payment/subscription-success"
          } catch (err) {
            setError("Subscription verification failed. Please contact support.")
          }
        },
        prefill: {
          name: user?.fullName || "",
          email: user?.emailAddresses?.[0]?.emailAddress || "",
        },
        theme: {
          color: "#10B981",
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError("Failed to initialize subscription. Please try again.")
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <>
    {/* Update Navbar to pass and receive isDarkMode */}
    
    {/* Update the main container div */}
    <div 
      className={`font-sans min-h-screen ${
        isDarkMode 
        ? "dark bg-[#1D1E23]" 
        : "bg-[#1D1E23]"
      } text-white`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto py-10"
      >
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Choose the plan that's right for you
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Unlock the power of data with our flexible pricing options. Save up to 20% with our yearly plans!
          </motion.p>

          <div className="flex items-center justify-center mt-8 gap-3">
            <span className={`${!isYearly ? "text-emerald-400" : "text-gray-400"}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-emerald-500" />
            <span className={`${isYearly ? "text-emerald-400" : "text-gray-400"}`}>
              Yearly
              <span className="ml-2 inline-block bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">
                Save 20%!
              </span>
            </span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 mx-auto max-w-md">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              onMouseEnter={() => setHoveredPlan(plan.name)}
              onMouseLeave={() => setHoveredPlan(null)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className={`relative rounded-2xl p-6 transition-all duration-300 ease-in-out transform ${
                hoveredPlan === plan.name
                  ? "scale-105 shadow-2xl bg-gradient-to-br from-teal-900/70 to-teal-800/50 border border-teal-500/30 -translate-y-4"
                  : plan.popular
                    ? "bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border border-emerald-500/20"
                    : plan.enterprise
                      ? "bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/20"
                      : "bg-gray-800/50 border border-gray-700/30"
              } hover:cursor-pointer`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-sm px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              {plan.enterprise && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-sm px-3 py-1 rounded-full">
                  Best Value
                </span>
              )}
              <h3
                className={`text-xl font-semibold mb-2 ${
                  hoveredPlan === plan.name ? "text-teal-300" : plan.enterprise ? "text-purple-300" : ""
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-4 ${
                  hoveredPlan === plan.name ? "text-teal-200" : plan.enterprise ? "text-purple-200" : "text-gray-400"
                }`}
              >
                {plan.description}
              </p>
              <div className="mb-6">
                <span
                  className={`text-4xl font-bold ${
                    hoveredPlan === plan.name ? "text-teal-200" : plan.enterprise ? "text-purple-200" : ""
                  }`}
                >
                  {plan.price.monthly === 0 ? "Free" : `₹${isYearly ? plan.price.yearly : plan.price.monthly}`}
                </span>
                {plan.price.monthly !== 0 && (
                  <span
                    className={`ml-2 ${
                      hoveredPlan === plan.name
                        ? "text-teal-300"
                        : plan.enterprise
                          ? "text-purple-300"
                          : "text-gray-400"
                    }`}
                  >
                    /{isYearly ? "year" : "month"}
                  </span>
                )}
              </div>
              <Button
                className={`w-full mb-6 ${
                  hoveredPlan === plan.name
                    ? "bg-teal-600 hover:bg-teal-700"
                    : plan.popular
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : plan.enterprise
                        ? "bg-purple-500 hover:bg-purple-600"
                        : plan.free
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-gray-700 hover:bg-gray-600"
                }`}
                variant={plan.popular || plan.enterprise ? "default" : "outline"}
                onClick={() => initializeRazorpay(plan)}
                disabled={loadingPlanId === plan.planId}
              >
                {loadingPlanId === plan.planId ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    {plan.free ? "Sign Up Free" : "Get Started"}
                  </>
                )}
              </Button>
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature.name} className="flex items-start gap-3 text-sm">
                    {feature.negative ? (
                      <X className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                    ) : feature.unlimited ? (
                      <Infinity
                        className={`h-5 w-5 shrink-0 mt-0.5 ${
                          plan.enterprise ? "text-purple-400" : "text-emerald-500"
                        }`}
                      />
                    ) : (
                      <Check
                        className={`h-5 w-5 shrink-0 mt-0.5 ${
                          plan.enterprise ? "text-purple-400" : "text-emerald-500"
                        }`}
                      />
                    )}
                    <div>
                      <span
                        className={`${
                          hoveredPlan === plan.name
                            ? "text-teal-100"
                            : plan.enterprise
                              ? "text-purple-100"
                              : "text-gray-300"
                        }`}
                      >
                        {feature.name}
                      </span>
                      {feature.value !== "Yes" && feature.value !== "No" && (
                        <span
                          className={`ml-1 ${
                            feature.negative
                              ? "text-red-400"
                              : feature.unlimited
                                ? plan.enterprise
                                  ? "text-purple-300"
                                  : "text-emerald-400"
                                : "text-gray-400"
                          }`}
                        >
                          ({feature.value})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
    </>
  )
}