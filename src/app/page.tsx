'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Users, Shield, CheckCircle, ArrowRight, Search, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import ShibaScene from '@/components/ShibaScene';
import AnimatedChatIcon from '@/components/AnimatedChatIcon';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  // Animation refs
  const navRef = useRef<HTMLElement>(null);
  const giveRef = useRef<HTMLSpanElement>(null);
  const benefitRef = useRef<HTMLSpanElement>(null);
  const repeatRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  
  // Testimonials data
  const testimonials = [
    { name: "Sarah Johnson", quote: "GiftFlow made our charity's fundraising so much more transparent and trustworthy.", charity: "Hope Foundation", avatar: "SJ" },
    { name: "Michael Chen", quote: "As a donor, I love knowing my contributions are tax-deductible and verified.", charity: "Children's Hospital", avatar: "MC" },
    { name: "Emily Rodriguez", quote: "The AI verification gives us confidence in every donation we receive.", charity: "Animal Rescue", avatar: "ER" },
    { name: "David Thompson", quote: "Finally, a platform that makes giving both secure and simple.", charity: "Food Bank", avatar: "DT" },
    { name: "Lisa Wang", quote: "Our donors trust GiftFlow's verification process completely.", charity: "Education Fund", avatar: "LW" },
    { name: "James Wilson", quote: "The tax documentation feature saves us hours of administrative work.", charity: "Environmental Group", avatar: "JW" },
    { name: "Maria Garcia", quote: "GiftFlow has increased our donation volume by 40% this year.", charity: "Community Center", avatar: "MG" },
    { name: "Robert Brown", quote: "Transparent, secure, and user-friendly - exactly what we needed.", charity: "Homeless Shelter", avatar: "RB" },
    { name: "Jennifer Lee", quote: "The verification system gives donors peace of mind.", charity: "Medical Research", avatar: "JL" },
    { name: "Christopher Davis", quote: "GiftFlow has revolutionized how we handle charitable giving.", charity: "Youth Program", avatar: "CD" },
  ];
  
  // Scroll animation refs
  const featuresRef = useRef<HTMLElement>(null);
  const featuresTitleRef = useRef<HTMLHeadingElement>(null);
  const featuresCardsRef = useRef<HTMLDivElement[]>([]);
  const trustRef = useRef<HTMLElement>(null);
  const trustTitleRef = useRef<HTMLHeadingElement>(null);
  const trustStatsRef = useRef<HTMLDivElement[]>([]);
  const verifierRef = useRef<HTMLElement>(null);
  const verifierTitleRef = useRef<HTMLHeadingElement>(null);
  const verifierContentRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Get user role from user metadata
      if (user?.user_metadata?.role) {
        setUserRole(user.user_metadata.role);
      }
      
      setLoading(false);
    };

    getUser();
  }, [supabase.auth]);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Animation useEffect
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.1 });

    // Animate header dropdown
    tl.to(navRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out"
    })
    // Animate headline words one by one
    .to(giveRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.4")
    .to(benefitRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "+=0.5")
    .to(repeatRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "+=0.5")
    // Animate button last
    .to(buttonRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "+=0.5");

  }, []);

  // Scroll animations useEffect
  useEffect(() => {
    // Features section animations
    if (featuresTitleRef.current && featuresCardsRef.current.length > 0) {
      gsap.fromTo(featuresTitleRef.current, 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      featuresCardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(card,
            { y: 60, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.out",
              delay: index * 0.2,
              scrollTrigger: {
                trigger: featuresRef.current,
                start: "top 70%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
              }
            }
          );
        }
      });
    }

    // Trust indicators animations
    if (trustTitleRef.current && trustStatsRef.current.length > 0) {
      gsap.fromTo(trustTitleRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: trustRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      trustStatsRef.current.forEach((stat, index) => {
        if (stat) {
          gsap.fromTo(stat,
            { y: 40, opacity: 0, scale: 0.9 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              ease: "back.out(1.7)",
              delay: index * 0.1,
              scrollTrigger: {
                trigger: trustRef.current,
                start: "top 70%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
              }
            }
          );
        }
      });
    }

    // Verifier section animations
    if (verifierTitleRef.current && verifierContentRef.current) {
      gsap.fromTo([verifierTitleRef.current, verifierContentRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: verifierRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }


    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Mouse tracking for Shiba
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      setMousePosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  // Scroll handlers
  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDashboardClick = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Unicorn.studio Interactive Background - Placeholder */}
      <div 
        id="unicorn-studio-background" 
        className="fixed inset-0 -z-10"
        style={{ 
          background: 'linear-gradient(135deg, var(--background) 0%, var(--muted) 100%)',
          opacity: 0.3
        }}
      >
        {/* This div will be replaced with unicorn.studio interactive background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="relative z-50 border-b bg-background/80 backdrop-blur-sm opacity-0 -translate-y-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">GiftFlow</span>
            </div>

            {/* Primary Navigation */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <button 
                    onClick={handleDashboardClick}
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    Dashboard
                  </button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button 
                    onClick={() => scrollToSection(featuresRef)}
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    How It Works
                  </button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button 
                    onClick={() => scrollToSection(verifierRef)}
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    Verify Links
                  </button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <button 
                    onClick={() => scrollToSection(testimonialsRef)}
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    Reviews
                  </button>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    <div className="flex items-center justify-end space-x-1">
                      <div 
                        className="text-xs font-medium px-2 py-1 rounded-full" 
                        style={{ 
                          backgroundColor: userRole === 'patron' ? 'var(--accent)' : userRole === 'charity' ? 'var(--secondary)' : 'var(--muted)',
                          color: userRole === 'patron' ? 'var(--accent-foreground)' : userRole === 'charity' ? 'var(--secondary-foreground)' : 'var(--muted-foreground)'
                        }}
                      >
                        {userRole === 'patron' ? 'Patron' : 
                         userRole === 'charity' ? 'Charity' : 
                         'User'}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Join up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - 100vh */}
      <section 
        ref={heroRef}
        className="relative h-screen flex flex-col lg:flex-row"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Content on the left */}
        <div className="flex-1 flex items-start pt-20 z-10 lg:w-1/2">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 w-full">
            <div className="max-w-4xl ml-8 lg:ml-16">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-foreground leading-none mb-12">
              <span ref={giveRef} className="opacity-0 translate-y-12">Give.</span>
              <br />
              <span ref={benefitRef} className="opacity-0 translate-y-12">Benefit.</span>
              <br />
              <span ref={repeatRef} className="text-primary opacity-0 translate-y-12">Repeat.</span>
            </h1>
            <div ref={buttonRef} className="flex items-center space-x-4 mt-8 opacity-0 translate-y-8">
              <div className="relative">
                <Button size="lg" className="text-lg px-8 py-6 relative z-10" asChild>
                  <Link href="/signup">
                    Try it out
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                {/* Glowing effect */}
                <div className="absolute inset-0 bg-primary rounded-lg animate-glow opacity-60 blur-sm"></div>
              </div>
            </div>
            </div>
          </div>
        </div>
        
        {/* 3D Shiba on the right */}
        <div className="w-full lg:w-1/2 h-1/2 lg:h-full relative z-0">
          <ShibaScene className="w-full h-full" mousePosition={mousePosition} />
          {/* Animated Chat Icon - appears after other animations */}
          <AnimatedChatIcon delay={3} />
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 ref={featuresTitleRef} className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How GiftFlow Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect Patrons with Charities through verified, tax-deductible wishes. 
              Every wish is verified for tax eligibility before publication.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card ref={(el) => { if (el) featuresCardsRef.current[0] = el; }}>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Charities Post Wishes</CardTitle>
                <CardDescription>
                  Charities post their needs as tax-deductible wishes with supporting documentation.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card ref={(el) => { if (el) featuresCardsRef.current[1] = el; }}>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">AI Verification Process</CardTitle>
                <CardDescription>
                  Our system verifies each wish for tax deductibility using OCR, rules engine, and AI.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card ref={(el) => { if (el) featuresCardsRef.current[2] = el; }}>
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Patrons Fulfill</CardTitle>
                <CardDescription>
                  Patrons browse verified wishes and fulfill them, receiving tax-deductible receipts.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section ref={trustRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 ref={trustTitleRef} className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              We Operate with Complete Transparency
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div ref={(el) => { if (el) trustStatsRef.current[0] = el; }} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Tax Verified</div>
            </div>
            <div ref={(el) => { if (el) trustStatsRef.current[1] = el; }} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </div>
            <div ref={(el) => { if (el) trustStatsRef.current[2] = el; }} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Secure</div>
              <div className="text-muted-foreground">Platform</div>
            </div>
            <div ref={(el) => { if (el) trustStatsRef.current[3] = el; }} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">Free</div>
              <div className="text-muted-foreground">To Use</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Verifier Section */}
      <section ref={verifierRef} className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left side - Text content */}
            <div className="flex-1 text-left">
              <h2 ref={verifierTitleRef} className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Concerned about the legitimacy of a fundraiser?
              </h2>
              <div ref={verifierContentRef}>
                <p className="text-xl text-muted-foreground">
                  Verify any fundraising link through our AI-powered verification system. 
                  Get instant analysis of legitimacy, tax status, and trustworthiness.
                </p>
              </div>
            </div>
            
            {/* Right side - Trapezoid button */}
            <div className="flex-shrink-0">
              <Link href="/verify" className="inline-block">
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary rounded-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-300"></div>
                  <div className="relative bg-primary text-primary-foreground px-8 py-6 rounded-lg transform -rotate-3 group-hover:-rotate-6 transition-transform duration-300 shadow-lg hover:shadow-xl">
                    <div className="flex items-center space-x-3">
                      <Search className="h-6 w-6" />
                      <span className="text-lg font-semibold">Verify a Link</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-16 bg-background overflow-hidden">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6">
            Trusted by Charities and Patrons
          </h2>
          <p className="text-xl text-muted-foreground text-center max-w-3xl mx-auto">
            Join thousands of Patrons and Charities making tax-deductible giving simple and secure.
          </p>
        </div>
        
        {/* Top row - animating left */}
        <div className="flex animate-marquee-left mb-8">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <Card key={`top-${index}`} className="flex-shrink-0 w-80 mx-4 bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Quote className="h-4 w-4 text-primary mr-1" />
                      <p className="text-sm text-muted-foreground italic">
                        "{testimonial.quote}"
                      </p>
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.charity}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Bottom row - animating right */}
        <div className="flex animate-marquee-right">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <Card key={`bottom-${index}`} className="flex-shrink-0 w-80 mx-4 bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Quote className="h-4 w-4 text-primary mr-1" />
                      <p className="text-sm text-muted-foreground italic">
                        "{testimonial.quote}"
                      </p>
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.charity}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 GiftFlow. Making a difference, one wish at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}