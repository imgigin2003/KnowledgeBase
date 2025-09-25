import React, { createContext, useContext, useState } from "react";
import { Button } from "./button"; // Assumes you have shadcn's button component here

// 1. Sidebar Context for global state (e.g., open/close for mobile)
const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false); // Can be used for mobile sidebar toggle
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

// 2. Main Sidebar container
export const Sidebar = ({ children, className }) => (
  <aside className={`w-64 flex-shrink-0 ${className}`}>{children}</aside>
);

// 3. Header section of the sidebar
export const SidebarHeader = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

// 4. Main scrollable content area of the sidebar
export const SidebarContent = ({ children, className }) => (
  <div className={`flex-1 overflow-y-auto ${className}`}>{children}</div>
);

// 5. Footer section of the sidebar
export const SidebarFooter = ({ children, className }) => (
  <div className={`p-4 border-t border-gray-200 ${className}`}>{children}</div>
);

// 6. Grouping for navigation items
export const SidebarGroup = ({ children }) => (
  <div className="mb-4">{children}</div>
);
export const SidebarGroupLabel = ({ children, className }) => (
  <h3
    className={`text-xs uppercase font-semibold text-gray-500 mb-2 ${className}`}
  >
    {children}
  </h3>
);
export const SidebarGroupContent = ({ children }) => <div>{children}</div>;

// 7. Navigation menu
export const SidebarMenu = ({ children }) => <nav>{children}</nav>;
export const SidebarMenuItem = ({ children }) => <div>{children}</div>;

// 8. Button for menu items (can act as a link or a regular button)
export const SidebarMenuButton = ({
  asChild,
  children,
  className,
  ...props
}) => {
  // If asChild is true, it passes props to its direct child (useful for <Link>)
  if (asChild) {
    return React.cloneElement(children, {
      className: `w-full text-left flex items-center gap-3 ${className}`,
      ...props,
    });
  }
  return (
    <Button
      variant="ghost"
      className={`w-full text-left justify-start ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};

// 9. Trigger for opening/closing sidebar (e.g., on mobile)
export const SidebarTrigger = ({ children, className, ...props }) => {
  const { setIsOpen } = useContext(SidebarContext); // Use context to toggle sidebar state
  return (
    <Button
      variant="ghost"
      onClick={() => setIsOpen((prev) => !prev)}
      className={`p-2 rounded-md ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};
