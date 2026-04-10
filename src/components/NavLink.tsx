import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props extends NavLinkProps {
  activeClassName?: string;
}

export function NavLink({ className, activeClassName = "bg-sidebar-accent text-sidebar-accent-foreground font-semibold", ...props }: Props) {
  return (
    <RouterNavLink
      className={({ isActive }) => cn(className, isActive && activeClassName)}
      {...props}
    />
  );
}
