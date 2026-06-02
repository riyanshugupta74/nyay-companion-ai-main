import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardSettings = () => {
  const { language, setLanguage } = useDashboard();

  return (
    <div className="flex items-center gap-2">
      {/* Language Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'हिं'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'bg-primary/10' : ''}
          >
            <span className="mr-2">🇬🇧</span>
            English
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setLanguage('hi')}
            className={language === 'hi' ? 'bg-primary/10' : ''}
          >
            <span className="mr-2">🇮🇳</span>
            हिंदी (Hindi)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DashboardSettings;



// This component adds:

// ✅ language button
// ✅ dropdown menu
// ✅ English/Hindi switching
// ✅ active language highlight
// ✅ language icon

// to dashboard settings.

// 🧠 What this code does

// This component is just a language switch button.