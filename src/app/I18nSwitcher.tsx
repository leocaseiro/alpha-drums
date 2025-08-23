"use client";
import { useI18n } from "./i18n";
import { Select, createListCollection, Portal } from "@chakra-ui/react";

export default function I18nSwitcher() {
  const { lang, setLang } = useI18n();
  
  const languages = createListCollection({
    items: [
      { label: "🇺🇸 EN", value: "en" },
      { label: "🇧🇷 PT-BR", value: "pt-BR" },
    ],
  });

  return (
    <Select.Root 
      collection={languages} 
      value={[lang]} 
      onValueChange={(details) => setLang(details.value[0])}
      size="sm"
      positioning={{ placement: "bottom-end" }}
    >
      <Select.Trigger minW="100px">
        <Select.ValueText placeholder="Language" />
      </Select.Trigger>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {languages.items.map((language) => (
              <Select.Item item={language} key={language.value}>
                {language.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
