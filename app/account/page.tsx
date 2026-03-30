"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, LogOut, Package, Heart, MapPin } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saved, setSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSave = async () => {
    if (!name.trim()) return;
    const result = await updateProfile({ name: name.trim(), phone: phone || undefined });
    if (result?.success) {
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Account</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar */}
        <div className="space-y-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <Package className="h-4 w-4" />
              Orders
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <Heart className="h-4 w-4" />
              Wishlist
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
            >
              <MapPin className="h-4 w-4" />
              Addresses
            </Button>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </nav>
        </div>

        {/* Main content */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Manage your account details
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setName(user.name);
                      setPhone(user.phone || "");
                      setIsEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {saved && (
                <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  Profile updated successfully!
                </div>
              )}

              <div className="space-y-2">
                <Label>Full Name</Label>
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                ) : (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm">
                    {user.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <p className="rounded-md bg-muted px-3 py-2 text-sm">
                  {user.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                {isEditing ? (
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm">
                    {user.phone || "Not provided"}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
