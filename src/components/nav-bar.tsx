import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Toggle } from "@/components/ui/toggle";
import { Moon, Sun } from "lucide-react";

const NavBar = () => {
  return (
    <div className="flex justify-between items-center px-4 pb-2 w-full border-b">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" />
      </Avatar>
      <Toggle aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
        <Moon className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

export default NavBar;
