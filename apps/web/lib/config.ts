export const siteConfig = {
  name: "designcn",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.jpg",
  description:
    "Customize your design system. Pick your component library, icons, base color, theme, fonts and create your own version.",
  links: {
    github: "https://github.com/Berget1411/designcn",
  },
  navItems: [
    {
      href: "/create",
      label: "Create",
    },
  ],
}

export const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
}
