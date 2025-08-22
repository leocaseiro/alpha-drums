"use client";
import { useI18n } from "./i18n";

export default function I18nSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <select
      aria-label="switch language"
      value={lang}
      onChange={e => setLang(e.target.value)}
      style={{ marginLeft: 8 }}
    >
      <option value="en">EN</option>
      <option value="pt-BR">PT-BR</option>
    </select>
  );
}
