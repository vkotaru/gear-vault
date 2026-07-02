import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { Item } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2, Package, Share2, Calendar } from "lucide-react";

interface StatsResponse {
  total: number;
  available: number;
  checkedOut: number;
}

// Category keys (from the schema enum) mapped to display labels.
const CATEGORY_LABELS: Record<string, string> = {
  camping: "Camping",
  hiking: "Hiking",
  biking: "Biking",
  water: "Water",
  winter: "Winter",
  other: "Other",
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ['/api/stats'],
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ['/api/items'],
  });

  const isLoading = statsLoading || itemsLoading;

  const chartData = [
    { name: 'Available', value: stats?.available || 0 },
    { name: 'Checked Out', value: stats?.checkedOut || 0 },
  ];

  // Use CSS variable colors for charts
  const root = typeof document !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const primaryColor = root ? `hsl(${root.getPropertyValue("--primary").trim()})` : "hsl(150 45% 30%)";
  const secondaryColor = root ? `hsl(${root.getPropertyValue("--secondary").trim()})` : "hsl(25 70% 45%)";
  const COLORS = [primaryColor, secondaryColor];

  // Real counts per category, derived from the inventory.
  const categoryData = Object.entries(CATEGORY_LABELS).map(([key, name]) => ({
    name,
    value: items.filter((item) => item.category === key).length,
  }));

  const sharedCount = items.filter((item) => item.isShared).length;

  // Most recently added items (the schema has no activity log, so we surface
  // additions ordered by addedOn).
  const recentItems = [...items]
    .sort((a, b) => new Date(b.addedOn).getTime() - new Date(a.addedOn).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.username}</h1>
        <p className="text-muted-foreground">Here's an overview of your gear inventory</p>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Items in your inventory
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.available || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Items ready to use
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.checkedOut || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Items currently in use
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Shared Items</CardTitle>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sharedCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Items shared with others
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Inventory Status</CardTitle>
                  <CardDescription>
                    Available vs. checked out items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill={primaryColor}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Items by Category</CardTitle>
                  <CardDescription>
                    Distribution across categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-muted-foreground" />
                        <YAxis className="text-muted-foreground" allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill={primaryColor} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recently added */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recently Added</CardTitle>
                <CardDescription>
                  Latest additions to your inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No items yet. Add your first piece of gear to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentItems.map((item) => (
                      <div key={item.id} className="flex items-center">
                        <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.name} was added to inventory</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.addedOn), "PPp")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
