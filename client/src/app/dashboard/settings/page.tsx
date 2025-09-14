"use client";
// client/src/app/dashboard/settings/page.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
    const [username, setUsername] = React.useState("johndoe");
    const [email, setEmail] = React.useState("john@example.com");
    const [darkMode, setDarkMode] = React.useState(false);
    const [notifications, setNotifications] = React.useState(true);
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: "Settings saved",
            description: "Your changes have been saved successfully.",
        });
    };

    return (
        <div className=" mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="preferences">Preferences</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>
                        <TabsContent value="profile">
                            <form
                                className="space-y-4"
                                onSubmit={e => {
                                    e.preventDefault();
                                    handleSave();
                                }}
                            >
                                <div>
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button type="submit">Save Profile</Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="preferences">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="dark-mode">Dark Mode</Label>
                                    <Switch
                                        id="dark-mode"
                                        checked={darkMode}
                                        onCheckedChange={setDarkMode}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="notifications">Email Notifications</Label>
                                    <Switch
                                        id="notifications"
                                        checked={notifications}
                                        onCheckedChange={setNotifications}
                                    />
                                </div>
                                <Button onClick={handleSave}>Save Preferences</Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="advanced">
                            <div className="space-y-4">
                                <div>
                                    <Label>Danger Zone</Label>
                                    <Separator className="my-2" />
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            toast({
                                                title: "Account deleted",
                                                description: "Your account has been deleted.",
                                                type: "destructive",
                                            })
                                        }
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                                <div>
                                    <Label>Export Data</Label>
                                    <Separator className="my-2" />
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            toast({
                                                title: "Data exported",
                                                description: "Your data export has started.",
                                            })
                                        }
                                    >
                                        Export
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}




