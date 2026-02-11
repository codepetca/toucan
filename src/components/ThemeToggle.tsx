"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return <div className="h-8 w-8" />;
	}

	return (
		<button
			type="button"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
			className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg-muted"
		>
			{resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
		</button>
	);
}
