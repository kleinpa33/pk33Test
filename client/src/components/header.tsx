import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, LogOut, User, Beaker } from "lucide-react";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <a href="/" className="flex items-center gap-2" data-testid="link-home">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Beaker className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            BioSync Labs
          </span>
        </a>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.profileImageUrl ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {(user.firstName?.[0] ?? "") +
                        (user.lastName?.[0] ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">
                    {user.firstName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href="/profile" data-testid="link-profile">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/logout" data-testid="link-logout">
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild data-testid="button-login">
              <a href="/api/login">Log In</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
