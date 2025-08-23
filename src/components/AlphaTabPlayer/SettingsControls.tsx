/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Slider,
  Switch,
  Select,
  createListCollection,
  Button,
  Input,
  Editable,
} from '@chakra-ui/react';
import { SettingSchema, SettingsContextProps } from './settings-config';

interface SettingsControlProps {
  setting: SettingSchema;
  context: SettingsContextProps;
}

export function SettingsControl({ setting, context }: SettingsControlProps) {
  const rawValue = setting.getValue(context);
  // Safely convert complex values to primitives
  const value = rawValue !== null && typeof rawValue === 'object' ? JSON.stringify(rawValue) : rawValue;
  const { control } = setting;

  const handleChange = (newValue: any) => {
    setting.setValue(context, newValue);
  };

  // Helper function to safely convert values to strings
  const safeStringValue = (val: any, defaultVal: string = ''): string => {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  switch (control.type) {
    case 'number-range':
      return (
        <VStack align="stretch" gap={2}>
          <HStack justify="space-between">
            <Text fontSize="sm">{setting.label}</Text>
            <Text fontSize="xs" color="gray.500">{value?.toFixed(2) || '0'}</Text>
          </HStack>
          <Slider.Root
            min={control.min || 0}
            max={control.max || 100}
            step={control.step || 1}
            value={[value || 0]}
            onValueChange={(details) => handleChange(details.value[0])}
          >
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
        </VStack>
      );

    case 'number-input':
      return (
        <HStack justify="space-between" align="center">
          <Text fontSize="sm">{setting.label}</Text>
          <Input
            type="number"
            value={String(value || 0)}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              if (!isNaN(newValue)) {
                handleChange(newValue);
              }
            }}
            min={control.min}
            max={control.max}
            step={control.step || 1}
            w="80px"
            size="sm"
          />
        </HStack>
      );

    case 'boolean-toggle':
      return (
        <HStack justify="space-between">
          <Text fontSize="sm">{setting.label}</Text>
          <Switch.Root
            checked={Boolean(value ?? false)}
            onCheckedChange={(details) => handleChange(details.checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
      );

    case 'enum-dropdown':
      const enumValues = Object.keys(control.enumType || {})
        .filter(key => isNaN(Number(key)))
        .map(key => ({
          label: key.replace(/([A-Z])/g, ' $1').trim(),
          value: (control.enumType as any)[key]
        }));
      
      const enumCollection = createListCollection({ items: enumValues });

      return (
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm">{setting.label}</Text>
          <Select.Root
            collection={enumCollection}
            value={[safeStringValue(value, '0')]}
            onValueChange={(details) => handleChange(Number(details.value[0]))}
          >
            <Select.Trigger>
              <Select.ValueText placeholder="Select..." />
            </Select.Trigger>
            <Select.Content>
              {enumValues.map((option) => (
                <Select.Item item={option} key={option.value}>
                  {option.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </VStack>
      );

    case 'button-group':
      return (
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm">{setting.label}</Text>
          <HStack>
            {control.options?.map((option) => (
              <Button
                key={String(option.value)}
                size="sm"
                variant={value === option.value ? 'solid' : 'outline'}
                onClick={() => handleChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </HStack>
        </VStack>
      );

    case 'color-picker':
      return (
        <HStack justify="space-between" align="center">
          <Text fontSize="sm">{setting.label}</Text>
          <HStack>
            <Input
              type="color"
              value={safeStringValue(value, '#000000')}
              onChange={(e) => handleChange(e.target.value)}
              w="60px"
              h="30px"
              p={1}
            />
            <Editable.Root
              value={safeStringValue(value, '#000000')}
              onValueChange={(details) => handleChange(details.value)}
              w="80px"
            >
              <Editable.Preview fontSize="xs" />
              <Editable.Input fontSize="xs" />
            </Editable.Root>
          </HStack>
        </HStack>
      );

    case 'font-picker':
      const commonFonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
        'Verdana', 'Courier New', 'Trebuchet MS', 'Arial Black'
      ];
      
      const fontCollection = createListCollection({
        items: commonFonts.map(font => ({ label: font, value: font }))
      });

      return (
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm">{setting.label}</Text>
          <Select.Root
            collection={fontCollection}
            value={[safeStringValue(value, 'Arial')]}
            onValueChange={(details) => handleChange(details.value[0])}
          >
            <Select.Trigger>
              <Select.ValueText placeholder="Select font..." />
            </Select.Trigger>
            <Select.Content>
              {commonFonts.map((font) => (
                <Select.Item item={{ label: font, value: font }} key={font}>
                  <Text fontFamily={font}>{font}</Text>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </VStack>
      );

    default:
      return (
        <HStack justify="space-between">
          <Text fontSize="sm">{setting.label}</Text>
          <Text fontSize="xs" color="gray.400">Unsupported control type</Text>
        </HStack>
      );
  }
}