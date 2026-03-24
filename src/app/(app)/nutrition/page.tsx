"use client";
import TopBar from "@/components/layout/TopBar";
import { currentUser, meals } from "@/lib/data";
import { Apple, Send, Zap, Flame, Bot, User, Plus, Target, TrendingUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string; time: string };

const suggestedQueries = [
  "What should I eat post-workout?",
  "Create a high-protein meal plan",
  "How much protein do I need daily?",
  "Suggest healthy snacks for muscle gain",
];

const aiResponses: Record<string, string> = {
  default: "Based on your goal of **muscle gain** and your stats (78kg, 180cm), here's what I recommend:\n\n• **Daily Calories:** 2,800-3,000 kcal\n• **Protein:** 156-180g (2g per kg bodyweight)\n• **Carbs:** 320-380g (fuel for training)\n• **Fats:** 80-100g (hormonal health)\n\nWould you like me to generate a full weekly meal plan? 💪",
  "what should i eat post-workout?": "**Post-workout nutrition is critical** for recovery and muscle growth. Here's what I recommend:\n\n🥩 **Protein (within 30 mins):**\n• Whey protein shake (25-30g protein)\n• Grilled chicken breast\n• Greek yogurt\n\n🍚 **Carbs (replenish glycogen):**\n• White rice or banana (fast-absorbing)\n• Sweet potato\n\n**Ideal combo:** 40g protein + 60g carbs within 45 minutes post-workout.\n\n*Sample meal:* Chicken rice bowl with 200g chicken + 1 cup rice + vegetables = ~550 kcal, 45g protein",
  "create a high-protein meal plan": "**7-Day High-Protein Meal Plan** (for muscle gain):\n\n**Day 1:**\n• Breakfast: Eggs + oats + banana (450 kcal, 35g protein)\n• Lunch: Chicken rice bowl (580 kcal, 52g protein)\n• Dinner: Salmon + sweet potato + veggies (620 kcal, 48g protein)\n• Snacks: Whey shake + almonds (280 kcal, 32g protein)\n\n**Total: ~1,930 kcal, 167g protein** ✅\n\nWant me to generate all 7 days?",
  "how much protein do i need daily?": "For your profile (78kg, muscle gain goal):\n\n**Recommended:** 156-180g protein/day\n*(2.0-2.3g per kg bodyweight)*\n\n**Best protein sources:**\n• 🥩 Chicken breast: 31g/100g\n• 🐟 Salmon: 25g/100g\n• 🥚 Eggs: 6g each\n• 🫘 Greek yogurt: 17g/100g\n• 🥛 Whey protein: 25g/scoop\n\n**Timing tip:** Spread across 4-5 meals for optimal muscle protein synthesis. Never go more than 4 hours without protein during waking hours.",
  "suggest healthy snacks for muscle gain": "**Top muscle-building snacks:**\n\n1. 🥜 **Greek yogurt + almonds** — 280 kcal, 25g protein\n2. 🥤 **Whey + banana** — 220 kcal, 28g protein\n3. 🧀 **Cottage cheese + berries** — 180 kcal, 20g protein\n4. 🥚 **Hard-boiled eggs (3)** — 210 kcal, 18g protein\n5. 🫘 **Edamame** — 190 kcal, 17g protein\n6. 🍗 **Chicken rice cakes** — 160 kcal, 22g protein\n\n*Tip: Aim for 20-30g protein per snack to maximize muscle protein synthesis.*",
};

export default function NutritionPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm your **AFIT AI Nutritionist** 🥗\n\nI've analyzed your profile and I'm ready to help you crush your **muscle gain** goal with personalized nutrition advice.\n\nWhat would you like to know?",
      time: "Now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "log" | "plan">("ai");

  const totalCals = meals.flatMap(m => m.items).reduce((s, i) => s + i.calories, 0);
  const totalProtein = meals.flatMap(m => m.items).reduce((s, i) => s + i.protein, 0);
  const totalCarbs = meals.flatMap(m => m.items).reduce((s, i) => s + i.carbs, 0);
  const totalFat = meals.flatMap(m => m.items).reduce((s, i) => s + i.fat, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string = input) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim(), time: "Now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const key = text.trim().toLowerCase();
      const response = aiResponses[key] || aiResponses.default;
      setMessages(prev => [...prev, { role: "assistant", text: response, time: "Now" }]);
      setLoading(false);
    }, 1200);
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="animate-fade-in">
      <TopBar title="Nutrition" />
      <div className="px-4 lg:px-6 py-5 max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-[#111111] border border-[#1f1f1f] rounded-xl p-1">
          {([["ai", "AI Coach"], ["log", "Today's Log"], ["plan", "Meal Plan"]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? "bg-green-500/10 text-green-400 border border-green-500/20" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Daily macros summary */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              Today&apos;s Macros
            </h3>
            <span className="text-xs text-gray-500">{totalCals} / {currentUser.calorieGoal} kcal</span>
          </div>
          <div className="h-2 bg-[#1a1a1a] rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={{ width: `${Math.min(100, (totalCals/currentUser.calorieGoal)*100)}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Protein", value: totalProtein, goal: 180, color: "bg-blue-500", unit: "g" },
              { label: "Carbs", value: totalCarbs, goal: 320, color: "bg-yellow-500", unit: "g" },
              { label: "Fat", value: totalFat, goal: 90, color: "bg-orange-500", unit: "g" },
            ].map(macro => (
              <div key={macro.label} className="bg-[#1a1a1a] rounded-xl p-2.5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">{macro.label}</span>
                  <span className="text-white font-medium">{macro.value}{macro.unit}</span>
                </div>
                <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className={`h-full ${macro.color} rounded-full`} style={{ width: `${Math.min(100, (macro.value/macro.goal)*100)}%` }} />
                </div>
                <p className="text-[10px] text-gray-600 mt-1">/ {macro.goal}{macro.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {activeTab === "ai" && (
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl flex flex-col" style={{ height: "500px" }}>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AFIT AI Nutritionist</p>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  Online
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.role === "assistant" ? "bg-gradient-to-br from-green-500 to-emerald-700" : "bg-gradient-to-br from-blue-500 to-blue-700"
                  }`}>
                    {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`max-w-xs lg:max-w-sm ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 rounded-tl-none"
                        : "bg-green-500/10 border border-green-500/20 text-white rounded-tr-none"
                    }`} dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {suggestedQueries.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="shrink-0 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1.5 text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-[#1f1f1f] flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask about nutrition, diet, meals..."
                className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500/40"
              />
              <button
                onClick={() => sendMessage()}
                className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "log" && (
          <div className="space-y-4">
            <button className="w-full border border-dashed border-green-500/30 rounded-xl py-3 text-sm text-green-400 hover:bg-green-500/5 transition-colors flex items-center justify-center gap-2 font-medium">
              <Plus className="w-4 h-4" /> Log a meal
            </button>
            {meals.map((meal) => {
              const cals = meal.items.reduce((s, i) => s + i.calories, 0);
              const prot = meal.items.reduce((s, i) => s + i.protein, 0);
              return (
                <div key={meal.time} className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white text-sm">{meal.time}</h3>
                    <span className="text-xs text-gray-500">{cals} kcal · {prot}g protein</span>
                  </div>
                  <div className="space-y-2">
                    {meal.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between py-2 border-b border-[#1f1f1f] last:border-0">
                        <div>
                          <p className="text-sm text-white">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.protein}g P · {item.carbs}g C · {item.fat}g F</p>
                        </div>
                        <span className="text-sm font-medium text-gray-300">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "plan" && (
          <div className="space-y-4">
            <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI-Generated Meal Plan</h3>
                  <p className="text-xs text-green-400">Optimized for Muscle Gain</p>
                </div>
              </div>
              {[
                { time: "7:00 AM", meal: "Greek Yogurt Parfait + Banana", cals: 425, protein: 29 },
                { time: "12:00 PM", meal: "Grilled Chicken Rice Bowl", cals: 580, protein: 52 },
                { time: "3:30 PM", meal: "Whey Protein + Apple", cals: 220, protein: 28 },
                { time: "6:30 PM", meal: "Salmon + Sweet Potato + Veggies", cals: 620, protein: 48 },
                { time: "9:00 PM", meal: "Cottage Cheese + Almonds", cals: 240, protein: 22 },
              ].map((m) => (
                <div key={m.time} className="flex items-center gap-3 py-3 border-t border-[#1f1f1f]">
                  <span className="text-xs text-gray-500 w-16 shrink-0">{m.time}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{m.meal}</p>
                    <p className="text-xs text-gray-500">{m.protein}g protein</p>
                  </div>
                  <span className="text-xs font-medium text-gray-300 shrink-0">{m.cals} kcal</span>
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-[#1f1f1f] flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <span className="text-white font-bold">2,085 kcal</span> · <span className="text-white font-bold">179g</span> protein
                </div>
                <button className="text-xs text-green-400 border border-green-500/20 rounded-lg px-3 py-1.5 hover:bg-green-500/5 transition-colors font-medium">
                  Regenerate ✨
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
