import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Check, ArrowRightCircle, ClipboardList } from "lucide-react";

interface DashboardStats {
  total: number;
  available: number;
  checkedOut: number;
}

export default function DashboardStats() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white">
            <CardContent className="p-6">
              <div className="h-16 flex items-center justify-center">
                <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <h3 className="font-medium">Failed to load statistics</h3>
        <p className="text-sm mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Available Gear",
      value: stats.available,
      icon: <Check className="text-green-600" />,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      onClick: () => setLocation("/all-gear")
    },
    {
      title: "Checked Out",
      value: stats.checkedOut,
      icon: <ArrowRightCircle className="text-amber-600" />,
      bgColor: "bg-amber-100",
      textColor: "text-amber-600",
      onClick: () => setLocation("/checked-out")
    },
    {
      title: "Total Inventory",
      value: stats.total,
      icon: <ClipboardList className="text-blue-600" />,
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      onClick: () => setLocation("/all-gear")
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={card.onClick}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`rounded-full ${card.bgColor} p-3 mr-4`}>
                <div className="h-6 w-6">
                  {card.icon}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-neutral-800">{card.title}</h3>
                <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
