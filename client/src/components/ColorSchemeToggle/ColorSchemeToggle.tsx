import { Button, Group, useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const {t} = useTranslation();

  return (
    <Group justify="center" mt="xl">
      <Button onClick={() => setColorScheme('light')}>{t('theme.light')}</Button>
      <Button onClick={() => setColorScheme('dark')}>{t('theme.dark')}</Button>
      <Button onClick={() => setColorScheme('auto')}>{t('theme.auto')}</Button>
    </Group>
  );
}