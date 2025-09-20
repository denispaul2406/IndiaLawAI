
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { FileText, Settings, Languages, Loader2, User, Image, Mail } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { translations } from "@/lib/i18n";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const formData = new FormData(event.currentTarget);
    const displayName = formData.get("displayName") as string;

    try {
      await updateProfile(user, { displayName });
      toast({
        title: "Profile Updated",
        description: "Your display name has been successfully updated.",
      });
      // Force a re-render or state update if needed to show new name immediately
      // This can be done by updating the user object in the auth context
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length === 1 && names[0].includes('@')) {
      return names[0][0].toUpperCase();
    }
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase().slice(0, 2);
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] font-body bg-background">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Logo />
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <FileText className="h-4 w-4" />
                {t.dashboard_nav_analysis}
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                {t.dashboard_nav_settings}
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
           <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 mb-4">
                    <Logo />
                </div>
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <FileText className="h-5 w-5" />
                  {t.dashboard_nav_analysis}
                </Link>
                 <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                >
                  <Settings className="h-5 w-5" />
                  {t.dashboard_nav_settings}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="font-headline text-lg font-semibold md:text-2xl">{t.settings_title}</h1>
          </div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Select language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.keys(translations).map((lang) => (
                <DropdownMenuItem key={lang} onSelect={() => setLanguage(lang as any)}>
                  {lang}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">{t.settings_profile_title}</CardTitle>
                <CardDescription>{t.settings_profile_description}</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-6" onSubmit={handleProfileUpdate}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      {user.photoURL && <AvatarImage src={user.photoURL} alt="User Avatar" />}
                      <AvatarFallback className="text-2xl">{getInitials(user.displayName || user.email)}</AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline" disabled>
                      <Image className="mr-2 h-4 w-4" />
                      {t.settings_profile_change_picture_button}
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="displayName">{t.settings_profile_display_name_label}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="displayName" name="displayName" defaultValue={user.displayName || ""} className="pl-9" />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t.settings_profile_email_label}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" value={user.email || ""} disabled className="pl-9 bg-muted/50" />
                    </div>
                  </div>

                  <Button type="submit" className="w-fit">{t.settings_profile_save_button}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
