"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    ArrowRight,
    CheckCircle,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMounted } from "../../hooks/useMounted";
import { useTranslations } from "next-intl";

// Password strength configuration (using keys)
const passwordRequirements = [
    { regex: /.{8,}/, label: "reqLength" },
    { regex: /[A-Z]/, label: "reqUpper" },
    { regex: /[a-z]/, label: "reqLower" },
    { regex: /[0-9]/, label: "reqNumber" },
    { regex: /[^A-Za-z0-9]/, label: "reqSpecial" },
];

export default function AuthForm({ mode = "login" }: { mode?: "login" | "signup" }) {
    const t = useTranslations('Auth');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const mounted = useMounted();
    const successRef = useRef<HTMLDivElement>(null);

    // Accessibility: Focus success message when it appears
    useEffect(() => {
        if (emailSent && successRef.current) {
            successRef.current.focus();
        }
    }, [emailSent]);

    const isLogin = mode === "login";
    const isLight = resolvedTheme === "light";

    // Theme-based colors
    const getThemeColors = () => {
        switch (resolvedTheme) {
            case "light":
                return {
                    accent: "text-blue-600",
                    accentBg: "bg-blue-500",
                    accentBorder: "border-blue-500",
                    gradientFrom: "from-blue-500",
                    gradientTo: "to-cyan-500",
                    glow: "bg-blue-500/10",
                    cardBg: "bg-white",
                    cardBorder: "border-slate-200",
                    inputBg: "bg-slate-50",
                    inputBorder: "border-slate-200",
                    text: "text-slate-800",
                    textMuted: "text-slate-500",
                    textMutedLight: "text-slate-400",
                    icon: "text-slate-400",
                    iconFocus: "text-blue-500",
                    buttonText: "text-white",
                    success: "text-green-600",
                    successBg: "bg-green-500",
                    socialBg: "bg-slate-50",
                    socialBorder: "border-slate-200",
                    socialHover: "hover:bg-slate-100",
                };
            case "neon":
                return {
                    accent: "text-pink-500",
                    accentBg: "bg-pink-500",
                    accentBorder: "border-pink-500",
                    gradientFrom: "from-pink-500",
                    gradientTo: "to-purple-500",
                    glow: "bg-pink-500/20",
                    cardBg: "bg-pink-950/50",
                    cardBorder: "border-pink-500/30",
                    inputBg: "bg-black/40",
                    inputBorder: "border-pink-500/30",
                    text: "text-white",
                    textMuted: "text-pink-300/60",
                    textMutedLight: "text-pink-400/40",
                    icon: "text-pink-400/50",
                    iconFocus: "text-pink-400",
                    buttonText: "text-white",
                    success: "text-green-400",
                    successBg: "bg-green-500",
                    socialBg: "bg-pink-950/50",
                    socialBorder: "border-pink-500/30",
                    socialHover: "hover:bg-pink-900/50",
                };
            case "cyber":
                return {
                    accent: "text-cyan-400",
                    accentBg: "bg-cyan-400",
                    accentBorder: "border-cyan-400",
                    gradientFrom: "from-cyan-500",
                    gradientTo: "to-blue-500",
                    glow: "bg-cyan-400/20",
                    cardBg: "bg-slate-900/60",
                    cardBorder: "border-cyan-500/30",
                    inputBg: "bg-slate-950/50",
                    inputBorder: "border-cyan-500/30",
                    text: "text-cyan-50",
                    textMuted: "text-cyan-300/50",
                    textMutedLight: "text-cyan-400/40",
                    icon: "text-cyan-400/50",
                    iconFocus: "text-cyan-400",
                    buttonText: "text-black",
                    success: "text-green-400",
                    successBg: "bg-green-500",
                    socialBg: "bg-slate-900/60",
                    socialBorder: "border-cyan-500/30",
                    socialHover: "hover:bg-slate-800/60",
                };
            default:
                return {
                    accent: "text-amber-500",
                    accentBg: "bg-amber-500",
                    accentBorder: "border-amber-500",
                    gradientFrom: "from-amber-500",
                    gradientTo: "to-orange-600",
                    glow: "bg-amber-500/20",
                    cardBg: "bg-slate-900/60",
                    cardBorder: "border-amber-500/30",
                    inputBg: "bg-white/5",
                    inputBorder: "border-white/10",
                    text: "text-amber-50",
                    textMuted: "text-amber-300/50",
                    textMutedLight: "text-amber-400/40",
                    icon: "text-amber-400/50",
                    iconFocus: "text-amber-400",
                    buttonText: "text-black",
                    success: "text-green-400",
                    successBg: "bg-green-500",
                    socialBg: "bg-white/5",
                    socialBorder: "border-white/10",
                    socialHover: "hover:bg-white/10",
                };
        }
    };

    const colors = mounted ? getThemeColors() : getThemeColors();

    useEffect(() => {
        router.prefetch("/dashboard");
    }, [router]);

    // Calculate password strength
    const calculatePasswordStrength = useCallback((pwd: string) => {
        let strength = 0;
        passwordRequirements.forEach((req) => {
            if (req.regex.test(pwd)) strength++;
        });
        setPasswordStrength(strength);
    }, []);

    useEffect(() => {
        if (!isLogin) {
            calculatePasswordStrength(password);
        }
    }, [password, isLogin, calculatePasswordStrength]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success(t('welcomeBack')); // Translated
                // Small delay to allow session to be set
                await new Promise(resolve => setTimeout(resolve, 100));
                router.push("/dashboard");
            } else {
                // Enforce Password Strength
                if (passwordStrength < passwordRequirements.length) {
                    toast.error("Please ensure your password meets all requirements"); // Consider translating later
                    setLoading(false);
                    return;
                }

                const origin = window.location.origin;
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${origin}/dashboard`,
                        data: { username },
                    },
                });
                if (error) throw error;
                if (data.session) {
                    toast.success(t('accountCreated')); // Translated
                    await new Promise(resolve => setTimeout(resolve, 100));
                    router.push("/dashboard");
                } else {
                    setEmailSent(true);
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';

            if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
                toast.error(t('userExists'));
            } else {
                toast.error(errorMessage);
            }
            setLoading(false);
        }
    };


    if (emailSent) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                    "relative p-8 text-center space-y-6 rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden focus:outline-none",
                    colors.cardBg,
                    colors.cardBorder
                )}
                ref={successRef}
                tabIndex={-1}
                role="alert"
                aria-live="polite"
            >
                {/* Animated gradient border */}
                <div className={cn(
                    "absolute inset-0 rounded-2xl p-[1px]",
                    `bg-gradient-to-r ${colors.gradientFrom} via-white/50 to-${colors.gradientTo.replace("from-", "")}`
                )} />
                <div className={cn("absolute inset-[1px] rounded-2xl", colors.cardBg)} />

                <div className="relative">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className={cn(
                            "mx-auto w-20 h-20 rounded-full flex items-center justify-center border mb-6",
                            colors.glow,
                            colors.accentBorder
                        )}
                    >
                        <motion.svg
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className={cn("w-10 h-10", colors.success)}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <motion.path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </motion.svg>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={cn("text-3xl font-bold mb-2", colors.text)}
                    >
                        {t('checkEmail')}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={colors.textMuted}
                    >
                        {t('sentLink')}
                        <br />
                        <span className={cn("font-medium", colors.text)}>{email}</span>
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={cn("p-4 rounded-xl border text-sm", colors.inputBg, colors.inputBorder, colors.textMuted)}
                >
                    {t('clickLink')}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Link
                        href="/login"
                        className={cn(
                            "inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80",
                            colors.accent
                        )}
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        {t('backToLogin')}
                    </Link>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md"
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2 mb-6 sm:mb-8"
            >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none mb-2 sm:mb-3">
                    <span className={cn(isLight ? "text-slate-900" : "text-white")}>
                        {isLogin ? t('login').slice(0, 3).toUpperCase() : t('signup').slice(0, 4).toUpperCase()}
                    </span>
                    <span className={cn("bg-clip-text text-transparent bg-gradient-to-r", colors.gradientFrom, colors.gradientTo)}>
                        {isLogin ? t('login').slice(3).toUpperCase() : t('signup').slice(4).toUpperCase()}
                    </span>
                </h2>
                <p className={cn("text-xs sm:text-sm font-medium tracking-wide", colors.textMuted)}>
                    {isLogin
                        ? t('logHelper')
                        : t('signHelper')}
                </p>
            </motion.div>

            {/* Divider */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6"
            >
                <div className={cn("flex-1 h-px bg-gradient-to-r from-transparent to-current", colors.textMutedLight)} />
                <span className={cn("text-[10px] sm:text-xs uppercase tracking-wider", colors.textMuted)}>{t('continueEmail')}</span>
                <div className={cn("flex-1 h-px bg-gradient-to-l from-transparent to-current", colors.textMutedLight)} />
            </motion.div>

            <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
                {!isLogin && (
                    <motion.div
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative group"
                    >
                        <div
                            className={cn(
                                "absolute inset-0 rounded-xl blur-xl transition-opacity duration-300",
                                focusedField === "username" ? colors.glow : "opacity-0"
                            )}
                        />
                        <div className="relative flex items-center">
                            <User
                                className={cn(
                                    "absolute left-4 w-5 h-5 transition-colors",
                                    focusedField === "username" ? colors.iconFocus : colors.icon
                                )}
                            />
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setFocusedField("username")}
                                onBlur={() => setFocusedField(null)}
                                className={cn(
                                    "w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl outline-none transition-all placeholder:text-xs sm:placeholder:text-sm peer",
                                    colors.inputBg,
                                    colors.inputBorder,
                                    colors.text,
                                    "focus:border-current border hover:border-opacity-50",
                                    focusedField === "username" ? colors.accentBorder : "",
                                    isLight ? "placeholder:text-slate-400" : "placeholder:text-slate-500"
                                )}
                                required
                                placeholder={t('username')}
                            />
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: isLogin ? 0.3 : 0.35 }}
                    className="relative group"
                >
                    <div
                        className={cn(
                            "absolute inset-0 rounded-xl blur-xl transition-opacity duration-300",
                            focusedField === "email" ? colors.glow : "opacity-0"
                        )}
                    />
                    <div className="relative flex items-center">
                        <Mail
                            className={cn(
                                "absolute left-4 w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                                focusedField === "email" ? colors.iconFocus : colors.icon
                            )}
                        />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            className={cn(
                                "w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl outline-none transition-all placeholder:text-xs sm:placeholder:text-sm peer",
                                colors.inputBg,
                                colors.inputBorder,
                                colors.text,
                                "focus:border-current border hover:border-opacity-50",
                                focusedField === "email" ? colors.accentBorder : "",
                                isLight ? "placeholder:text-slate-400" : "placeholder:text-slate-500"
                            )}
                            required
                            placeholder={t('email')}
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: isLogin ? 0.4 : 0.45 }}
                    className="relative group"
                >
                    <div
                        className={cn(
                            "absolute inset-0 rounded-xl blur-xl transition-opacity duration-300",
                            focusedField === "password" ? colors.glow : "opacity-0"
                        )}
                    />
                    <div className="relative flex items-center">
                        <Lock
                            className={cn(
                                "absolute left-4 w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                                focusedField === "password" ? colors.iconFocus : colors.icon
                            )}
                        />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                calculatePasswordStrength(e.target.value);
                            }}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => setFocusedField(null)}
                            className={cn(
                                "w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 rounded-xl outline-none transition-all placeholder:text-xs sm:placeholder:text-sm peer",
                                colors.inputBg,
                                colors.inputBorder,
                                colors.text,
                                "focus:border-current border hover:border-opacity-50",
                                focusedField === "password" ? colors.accentBorder : "",
                                isLight ? "placeholder:text-slate-400" : "placeholder:text-slate-500"
                            )}
                            required
                            placeholder={t('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={cn(
                                "absolute right-3 sm:right-4 transition-colors",
                                colors.icon,
                                "hover:text-current"
                            )}
                        >
                            {showPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                        </button>
                    </div>

                    {/* Password strength indicator for signup */}
                    {!isLogin && password && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 sm:mt-4 space-y-2 sm:space-y-3"
                        >
                            <div className={cn("h-1.5 rounded-full overflow-hidden", isLight ? "bg-slate-200" : "bg-white/10")}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(passwordStrength / passwordRequirements.length) * 100}%` }}
                                    className={cn(
                                        "h-full rounded-full transition-colors duration-300",
                                        passwordStrength <= 2 ? "bg-red-500" :
                                            passwordStrength <= 3 ? "bg-yellow-500" : "bg-green-500"
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-[10px] sm:text-xs">
                                {passwordRequirements.map((req, index) => {
                                    const isMet = req.regex.test(password);
                                    return (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-center gap-1.5 transition-colors",
                                                isMet ? colors.success : colors.textMuted
                                            )}
                                        >
                                            <CheckCircle size={12} />
                                            {t(req.label)}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {isLogin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                        className="flex justify-end"
                    >
                        <Link
                            href="/forgot-password"
                            className={cn("text-[10px] sm:text-xs transition-colors hover:opacity-80", colors.textMuted, "hover:" + colors.accent.replace("text-", ""))}
                        >
                            {t('forgotPassword')}
                        </Link>
                    </motion.div>
                )}

                <motion.button
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: isLogin ? 0.5 : 0.55 }}
                    type="submit"
                    disabled={loading}
                    className={cn(
                        "group relative w-full py-3 sm:py-4 rounded-xl overflow-hidden font-bold uppercase tracking-wider disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-current/20 hover:shadow-current/40 transition-all duration-300"
                    )}
                >
                    {/* Gradient background with Shine effect */}
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-r transition-all duration-300 opacity-100 group-hover:scale-105",
                        colors.gradientFrom,
                        colors.gradientTo
                    )} />

                    {/* Shine overlay */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {/* Grid overlay */}
                    <div className={cn("absolute inset-0 opacity-20 bg-[url('/grid.svg')]", isLight ? "brightness-0 invert" : "")} />

                    <div className={cn("relative flex items-center justify-center gap-1 sm:gap-2", colors.buttonText)}>
                        {loading ? (
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        ) : (
                            <>
                                <span className="text-xs sm:text-sm">{loading ? t('processing') : isLogin ? t('signInAction') : t('createAccountAction')}</span>
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </div>
                </motion.button>
            </form>


            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-5 sm:pt-6 flex justify-center items-center gap-3 sm:gap-4"
            >
                <Link
                    href={isLogin ? "/signup" : "/login"}
                    className={cn(
                        "text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-80",
                        colors.textMuted,
                        "hover:" + colors.accent.replace("text-", "")
                    )}
                >
                    {isLogin ? t('createAccountAction') : t('backToLogin')}
                </Link>
            </motion.div>


        </motion.div>
    );
}
