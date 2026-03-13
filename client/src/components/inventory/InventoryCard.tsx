import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Info, ArrowRightCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Item } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface InventoryCardProps {
  item: Item;
}

export default function InventoryCard({ item }: InventoryCardProps) {
  const [location, setLocation] = useLocation();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleViewDetails = () => {
    setLocation(`/items/${item.id}`);
  };

  const handleCheckout = async () => {
    if (item.status !== "available") return;

    setIsCheckingOut(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      await apiRequest("POST", "/api/checkout", {
        itemId: item.id,
        checkedOutBy: "Current User",
        dueBack: dueDate.toISOString(),
      });

      toast({
        title: "Success",
        description: `You've checked out ${item.name} until ${format(dueDate, 'MMM dd, yyyy')}`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check out item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const renderThumbnail = () => {
    const imageUrl = item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls[0]
      : null;

    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      );
    }

    const iconMap: Record<string, string> = {
      "camping": "tent",
      "hiking": "hiking",
      "biking": "bicycle",
      "water": "life-ring",
      "winter": "snowflake",
      "other": "box"
    };

    const iconName = iconMap[item.category] || "box";

    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-12 w-12 text-muted-foreground"
        >
          {iconName === "tent" && <path d="M19 20 10 4l-9 16h18z"/>}
          {iconName === "hiking" && <path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4.68 7.37 2.33-2.33a2 2 0 0 1 2.83 0l2.33 2.33M8 12l-1 10 5-1 5 1-1-10"/>}
          {iconName === "bicycle" && (
            <>
              <circle cx="5" cy="16" r="3"/>
              <circle cx="19" cy="16" r="3"/>
              <path d="M5 13v-2l4-1 3 3 4-3 2 1"/>
            </>
          )}
          {iconName === "life-ring" && (
            <>
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <path d="m15 9-3 3-3-3m0 6 3-3 3 3"/>
            </>
          )}
          {iconName === "snowflake" && <path d="M12 2v20m8-10H4m15-5L7 17m0-10 12 10"/>}
          {iconName === "box" && (
            <>
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>
            </>
          )}
        </svg>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="h-48 overflow-hidden relative">
        {renderThumbnail()}
        <Badge
          className={`absolute top-2 right-2 ${
            item.status === 'available'
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-secondary hover:bg-secondary/90'
          }`}
        >
          {item.status === 'available' ? 'Available' : 'Checked Out'}
        </Badge>
      </div>

      <CardContent className="p-4 flex-1">
        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{item.brand || "No brand specified"}</p>

        <div className="flex items-center mb-3">
          <User className="text-primary h-4 w-4 mr-2" />
          <span className="text-sm">Owner: {item.owner}</span>
        </div>

        <div className="flex items-center mb-3">
          <MapPin className="text-primary h-4 w-4 mr-2" />
          <span className="text-sm">Storage: {item.storageLocation}</span>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="text-primary border-primary hover:bg-primary/10"
          onClick={handleViewDetails}
        >
          <Info className="h-4 w-4 mr-1" /> Details
        </Button>

        {item.status === "available" ? (
          <Button
            variant="default"
            size="sm"
            className="bg-secondary hover:bg-secondary/90"
            onClick={handleCheckout}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-secondary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </div>
            ) : (
              <span>Check Out</span>
            )}
          </Button>
        ) : (
          <div className="text-secondary font-medium text-sm flex items-center">
            <ArrowRightCircle className="h-4 w-4 mr-1" /> Due back soon
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
