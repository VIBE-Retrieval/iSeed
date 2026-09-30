"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Home, FileImage, MapPin, Users, User, BookOpen } from "lucide-react"

const navigation = [
  { name: "그림 분석", href: "/analysis", icon: FileImage },
  { name: "맞춤 솔루션", href: "/solutions", icon: FileImage },
  { name: "주변 상담소", href: "/counseling", icon: MapPin },
  { name: "맘스퀘어", href: "/community", icon: Users },
  { name: "마이페이지", href: "/mypage", icon: User },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const showTransparent = isHomePage && !isScrolled

  return (
    <header 
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        showTransparent 
          ? "bg-transparent" 
          : "bg-white border-b border-slate-200 shadow-sm"
      }`}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <span className={`text-xl font-bold ${showTransparent ? "text-primary" : "text-primary"}`}>
            iSeed
          </span>
          <span className={`text-xl font-bold ${showTransparent ? "text-white" : "text-foreground"}`}>
            센터
          </span>
        </Link>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden lg:flex items-center gap-6 mx-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                showTransparent 
                  ? "text-white/90 hover:text-white" 
                  : "text-slate-600 hover:text-primary"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <Link href="/analysis">
            <Button 
              size="sm" 
              className={`rounded-md px-6 h-9 ${
                showTransparent 
                  ? "bg-primary text-white hover:bg-primary/90" 
                  : ""
              }`}
            >
              상담 문의
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-9 w-9 ${showTransparent ? "text-white hover:bg-white/10" : ""}`}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <div className="flex flex-col gap-4 pt-6">
              <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-1 px-4 mb-2">
                <span className="text-lg font-bold text-primary">iSeed</span>
                <span className="text-lg font-bold text-foreground">센터</span>
              </Link>
              <nav className="flex flex-col">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              <div className="border-t border-slate-100 pt-4 px-4">
                <Link href="/analysis" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">
                    상담 문의
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
