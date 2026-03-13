import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
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
import { Loader2, Package, UsersRound, Share2, Calendar } from "lucide-react";

interface StatsResponse {
  total: number;
  available: number;
  checkedOut: number;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<StatsResponse>({
    queryKey: ['/api/stats'],
  });

  const chartData = [
    { name: 'Available', value: stats?.available || 0 },
    { name: 'Checked Out', value: stats?.checkedOut || 0 },
  ];

  // Use CSS variable colors for charts
  const root = typeof document !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const primaryColor = root ? `hsl(${root.getPropertyValue("--primary").trim()})` : "hsl(150 45% 30%)";
  const secondaryColor = root ? `hsl(${root.getPropertyValue("--secondary").trim()})` : "hsl(25 70% 45%)";
  const COLORS = [primaryColor, secondaryColor];

  const categoryData = [
    { name: 'Camping', value: 5 },
    { name: 'Hiking', value: 3 },
    { name: 'Biking', value: 2 },
    { name: 'Water', value: 1 },
    { name: 'Winter', value: 1 },
  ];

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
                  <div className="text-2xl font-bold">2</div>
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
                        <YAxis className="text-muted-foreground" />
                        <Tooltip />
                        <Bar dataKey="value" fill={primaryColor} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates to your inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Tent was added to inventory</p>
                      <p className="text-xs text-muted-foreground">Today at 2:30 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Sleeping bag was checked out</p>
                      <p className="text-xs text-muted-foreground">Yesterday at 10:15 AM</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Hiking boots were shared</p>
                      <p className="text-xs text-muted-foreground">Feb 25, 2023</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
