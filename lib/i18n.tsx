"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TranslationMap } from "@/models/translations";

const I18nContext = createContext<TranslationMap>({});

export function I18nProvider({
	dictionary,
	children,
}: {
	dictionary: TranslationMap;
	children: ReactNode;
}) {
	return <I18nContext.Provider value={dictionary}>{children}</I18nContext.Provider>;
}

export function useT() {
	const dict = useContext(I18nContext);
	return function t(key: string, fallback?: string): string {
		return dict[key] ?? fallback ?? key;
	};
}
