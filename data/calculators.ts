import { HeartPulse, ShieldCheck, Calculator } from "lucide-react";

import type { CalculatorGroup } from "@/types";

export const calculatorGroups: CalculatorGroup[] = [
  {
    title: "Health & Wellness calculators",
    gradient: "from-teal/15 to-teal/5",
    icon: HeartPulse,
    items: ["BMI Calculator", "Ideal Weight Calculator", "Calorie Calculator", "Body Fat Calculator"],
  },
  {
    title: "Term Insurance calculators",
    gradient: "from-brand/15 to-brand/5",
    icon: ShieldCheck,
    items: ["Life Insurance Calculator", "Term Insurance Calculator", "Human Life Value Calculator", "NRI Term Insurance Calculator"],
  },
  {
    title: "Policy premium calculators",
    gradient: "from-violet/15 to-violet/5",
    icon: Calculator,
    items: ["Health Insurance Premium Calculator", "Car Insurance Calculator", "Bike Insurance Calculator", "Travel Insurance Calculator"],
  },
];
