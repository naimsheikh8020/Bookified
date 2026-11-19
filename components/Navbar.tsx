
'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Show,
    SignInButton,
    UserButton,
    useUser,
} from "@clerk/nextjs";
import {
    CreditCard,
    Menu,
    X,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
    { label: "Library", href: "/" },
    { label: "Add New", href: "/books/new" },
    { label: "Pricing", href: "/subscriptions" },
];

const Navbar = () => {
    const pathName = usePathname();
    const { user } = useUser();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Replace with actual subscription data from your backend.
    const currentPlan = "Free";

    const closeMenu = () => setIsMenuOpen(false);

    const renderNavLinks = (mobile = false) =>
        navItems.map(({ label, href }) => {
            const isActive =
                pathName === href ||
                (href !== "/" && pathName.startsWith(href));

            return (
                <Link
                    href={href}
                    key={label}
                    onClick={closeMenu}
                    className={cn(
                        "nav-link-base",
                        isActive
                            ? "nav-link-active"
                            : "text-black hover:opacity-70",
                        mobile && "block w-full py-3"
                    )}
                >
                    {label}
                </Link>
            );
        });

    return (
        <header className="fixed top-0 z-50 w-full bg-(--bg-primary) shadow-sm">
            <div className="wrapper navbar-height flex items-center justify-between py-4">

                {/* Logo */}
                <Link
                    href="/"
                    onClick={closeMenu}
                    className="flex shrink-0 items-center gap-0.5"
                >
                    <Image
                        src="/assets/logo.png"
                        alt="Bookified"
                        width={42}
                        height={26}
                        priority
                    />
                    <span className="logo-text">Bookified</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-6 md:flex lg:gap-7.5">
                    {renderNavLinks()}
                </nav>

                {/* Desktop Authentication */}
                <div className="hidden items-center gap-3 md:flex">
                    <Show when="signed-out">
                        <SignInButton mode="modal" />
                    </Show>

                    <Show when="signed-in">
                        <div className="flex items-center gap-3">
                            <UserButton>
                                <UserButton.MenuItems>
                                    <UserButton.Action
                                        label="My Plan"
                                        labelIcon={<CreditCard size={16} />}
                                        open="billing"
                                    />
                                    <UserButton.Action label="signOut" />
                                </UserButton.MenuItems>

                                <UserButton.UserProfilePage
                                    label="My Plan"
                                    url="billing"
                                    labelIcon={<CreditCard size={16} />}
                                >
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold">
                                            My Subscription
                                        </h2>

                                        <p className="mt-4 text-sm text-gray-500">
                                            Current Plan
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {currentPlan}
                                        </p>

                                        <p className="mt-2 text-sm text-gray-500">
                                            Manage your Bookified subscription.
                                        </p>

                                        <Link
                                            href="/subscriptions"
                                            className="mt-5 inline-block rounded-lg bg-black px-5 py-2 text-white hover:opacity-80"
                                        >
                                            View Plans
                                        </Link>
                                    </div>
                                </UserButton.UserProfilePage>
                            </UserButton>

                            {user?.firstName && (
                                <span className="nav-user-name">
                                    {user.firstName}
                                </span>
                            )}
                        </div>
                    </Show>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex items-center gap-4 md:hidden">
                    <Show when="signed-out">
                        <SignInButton mode="modal" />
                    </Show>

                    <Show when="signed-in">
                        <UserButton>
                            <UserButton.MenuItems>
                                <UserButton.Action
                                    label="My Plan"
                                    labelIcon={<CreditCard size={16} />}
                                    open="billing"
                                />
                                <UserButton.Action label="signOut" />
                            </UserButton.MenuItems>

                            <UserButton.UserProfilePage
                                label="My Plan"
                                url="billing"
                                labelIcon={<CreditCard size={16} />}
                            >
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold">
                                        My Subscription
                                    </h2>

                                    <p className="mt-4 text-sm text-gray-500">
                                        Current Plan
                                    </p>

                                    <p className="mt-1 text-2xl font-bold">
                                        {currentPlan}
                                    </p>

                                    <Link
                                        href="/subscriptions"
                                        className="mt-5 inline-block rounded-lg bg-black px-5 py-2 text-white"
                                    >
                                        View Plans
                                    </Link>
                                </div>
                            </UserButton.UserProfilePage>
                        </UserButton>
                    </Show>

                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/5"
                    >
                        {isMenuOpen ? (
                            <X size={24} />
                        ) : (
                            <Menu size={24} />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="border-t border-black/10 bg-(--bg-primary) px-6 py-4 md:hidden">
                    <nav className="flex flex-col gap-2">
                        {renderNavLinks(true)}

                        <Show when="signed-in">
                            {user?.firstName && (
                                <div className="border-t border-black/10 pt-4 text-sm font-medium">
                                    Signed in as {user.firstName}
                                </div>
                            )}
                        </Show>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Navbar;
