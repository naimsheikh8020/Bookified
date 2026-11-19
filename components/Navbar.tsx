
'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Show,
    SignInButton,
    UserButton,
    useUser,
} from "@clerk/nextjs";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Library", href: "/" },
    { label: "Add New", href: "/books/new" },
    { label: "Pricing", href: "/subscriptions" },
];

const Navbar = () => {
    const pathName = usePathname();
    const { user } = useUser();

    // TODO: Replace with actual subscription data from your backend.
    const currentPlan = "Free";

    return (
        <header className="w-full fixed z-50 bg-(--bg-primary)">
            <div className="wrapper navbar-height py-4 flex justify-between items-center">

                {/* Logo */}
                <Link href="/" className="flex gap-0.5 items-center">
                    <Image
                        src="/assets/logo.png"
                        alt="Bookified"
                        width={42}
                        height={26}
                    />
                    <span className="logo-text">Bookified</span>
                </Link>

                {/* Navigation */}
                <nav className="w-fit flex gap-7.5 items-center">
                    {navItems.map(({ label, href }) => {
                        const isActive =
                            pathName === href ||
                            (href !== "/" && pathName.startsWith(href));

                        return (
                            <Link
                                href={href}
                                key={label}
                                className={cn(
                                    "nav-link-base",
                                    isActive
                                        ? "nav-link-active"
                                        : "text-black hover:opacity-70"
                                )}
                            >
                                {label}
                            </Link>
                        );
                    })}

                    {/* Authentication */}
                    <Show when="signed-out">
                        <SignInButton mode="modal" />
                    </Show>

                    <Show when="signed-in">
                        <div className="flex gap-3 items-center">

                            <UserButton>

                                {/* User menu */}
                                <UserButton.MenuItems>
                                    <UserButton.Action
                                        label="My Plan"
                                        labelIcon={<CreditCard size={16} />}
                                        open="billing"
                                    />

                                    <UserButton.Action label="signOut" />
                                </UserButton.MenuItems>

                                {/* Custom My Plan page */}
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

                                        <p className="text-2xl font-bold mt-1">
                                            {currentPlan}
                                        </p>

                                        <p className="mt-2 text-sm text-gray-500">
                                            Manage your Bookified subscription.
                                        </p>

                                        <Link
                                            href="/subscriptions"
                                            className="inline-block mt-5 px-5 py-2 rounded-lg bg-black text-white hover:opacity-80"
                                        >
                                            View Plans
                                        </Link>

                                    </div>
                                </UserButton.UserProfilePage>

                            </UserButton>

                            {/* User name */}
                            {user?.firstName && (
                                <span className="nav-user-name">
                                    {user.firstName}
                                </span>
                            )}

                        </div>
                    </Show>
                </nav>
            </div>
        </header>
    );
};

export default Navbar;
