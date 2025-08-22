"use client";
import { useI18n } from "./i18n";

export default function I18nText({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}
