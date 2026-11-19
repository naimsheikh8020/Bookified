import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] px-3 py-8 sm:px-6 sm:py-12">
            <section className="w-full max-w-md">
                <div className="mb-6 text-center sm:mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-[#252525] sm:text-3xl">
                        Create your account
                    </h1>
                    <p className="mt-2 px-2 text-sm text-gray-500 sm:text-base">
                        Start building your personal reading library.
                    </p>
                </div>

                <SignUp
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    appearance={{
                        elements: {
                            rootBox: "w-full max-w-full",
                            card: "w-full max-w-full rounded-2xl border border-gray-100 shadow-lg",
                            headerTitle: "text-xl font-bold sm:text-2xl",
                            headerSubtitle: "text-sm text-gray-500",
                            formButtonPrimary:
                                "bg-[#D97736] hover:bg-[#C5682C] text-white shadow-none rounded-lg",
                            footerActionLink:
                                "text-[#D97736] hover:text-[#C5682C]",
                            formFieldInput:
                                "rounded-lg border-gray-200 focus:ring-[#D97736]",
                            socialButtonsBlockButton:
                                "rounded-lg border-gray-200 hover:bg-gray-50",
                            formFieldLabel: "text-sm font-medium",
                            footer: "px-2",
                        },
                    }}
                />

                <p className="mt-6 text-center text-xs text-gray-400 sm:text-sm">
                    Your personal library, always within reach.
                </p>
            </section>
        </main>
    );
}