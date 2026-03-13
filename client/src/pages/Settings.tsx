import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useThemeSettings, COLOR_THEMES, FONT_OPTIONS } from "@/hooks/use-theme-settings";
import { useLocation } from "wouter";
import {
  User, Shield, Bell, Database, Save, Palette, RotateCcw, Check,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, updateSettings, resetSettings } = useThemeSettings();
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const tabFromUrl = searchParams.get("tab");

  const handleTabChange = (value: string) => {
    setLocation(`/settings?tab=${value}`, { replace: true });
  };

  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    email: "user@example.com",
    fullName: "",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your profile changes have been saved.",
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password updated",
      description: "Your password has been successfully changed.",
    });
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: "Settings reset",
      description: "Appearance settings have been restored to defaults.",
    });
  };

  return (
    <Layout>
      <div className="py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs
          defaultValue={tabFromUrl || "appearance"}
          className="space-y-4"
          onValueChange={handleTabChange}
        >
          <TabsList>
            <TabsTrigger value="appearance" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            {/* Color Theme */}
            <Card>
              <CardHeader>
                <CardTitle>Color Theme</CardTitle>
                <CardDescription>
                  Choose a color scheme for the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => updateSettings({ colorTheme: key })}
                      className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:scale-105 ${
                        settings.colorTheme === key
                          ? "border-foreground shadow-md"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      {settings.colorTheme === key && (
                        <div className="absolute -top-2 -right-2 rounded-full bg-foreground p-0.5">
                          <Check className="h-3 w-3 text-background" />
                        </div>
                      )}
                      <div className="flex gap-1">
                        <div
                          className="h-8 w-8 rounded-full border"
                          style={{ backgroundColor: `hsl(${theme.primary})` }}
                        />
                        <div
                          className="h-8 w-8 rounded-full border"
                          style={{ backgroundColor: `hsl(${theme.secondary})` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Font Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>
                  Customize the font and text size
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={settings.fontFamily}
                      onValueChange={(v) => updateSettings({ fontFamily: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {["Sans-serif", "Serif", "Monospace"].map((cat) => {
                          const fonts = FONT_OPTIONS.filter((f) => f.category === cat);
                          if (!fonts.length) return null;
                          return (
                            <SelectGroup key={cat}>
                              <SelectLabel>{cat}</SelectLabel>
                              {fonts.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  <span style={{ fontFamily: f.css }}>{f.label}</span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Font Size: {settings.fontSize}px
                    </Label>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={([v]) => updateSettings({ fontSize: v })}
                      min={12}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>12px</span>
                      <span>16px</span>
                      <span>20px</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">Preview</p>
                  <p className="text-lg font-semibold">The quick brown fox jumps over the lazy dog</p>
                  <p className="text-sm">
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Layout */}
            <Card>
              <CardHeader>
                <CardTitle>Layout</CardTitle>
                <CardDescription>
                  Adjust the content area width
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Content Width: {settings.contentWidth}px
                  </Label>
                  <Slider
                    value={[settings.contentWidth]}
                    onValueChange={([v]) => updateSettings({ contentWidth: v })}
                    min={800}
                    max={1920}
                    step={40}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Narrow (800)</span>
                    <span>Default (1280)</span>
                    <span>Full (1920)</span>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden bg-muted/20">
                  <div className="h-2 bg-primary/20" />
                  <div className="flex">
                    <div className="w-12 bg-primary/10 h-16" />
                    <div className="flex-1 p-2">
                      <div
                        className="mx-auto bg-primary/10 h-12 rounded"
                        style={{
                          maxWidth: `${Math.round((settings.contentWidth / 1920) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={profileForm.username}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={profileForm.fullName}
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="flex gap-1">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button type="submit">Update Password</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Notification settings coming soon. This will allow you to receive alerts for gear checkouts, returns, and maintenance schedules.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Details about the Gear Vault system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Application Version</span>
                    <span className="text-muted-foreground">1.0.0</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Total Items</span>
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Storage Locations</span>
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium">Database Status</span>
                    <span className="text-primary font-medium">Connected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
