import { useI18n } from "@/shared/i18n/I18nProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <select
      value={language}
      onChange={(event) => setLanguage(event.currentTarget.value as "en" | "km")}
      aria-label={t("language.switch")}
      title={t("language.switch")}
      className="min-h-[38px] min-w-[82px] shrink-0 rounded-xl border border-border bg-surface px-2.5 text-xs font-semibold text-secondary outline-none transition hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/15 max-[560px]:min-h-[35px] max-[560px]:min-w-[72px] max-[560px]:px-1.5"
    >
      <option value="en">English</option>
      <option value="km">ខ្មែរ</option>
    </select>
  );
}

