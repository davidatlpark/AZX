import { ColorSchemeToggle } from "@/components/ColorSchemeToggle/ColorSchemeToggle";
import { Container, Title, Text, Button, Stack, Paper, Group } from "@mantine/core";
import { IconUpload, IconBuildingSkyscraper } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export function HomePage() {
    return (
        <Container size="md" py="xl">
            <Stack gap="xl">
                <div>
                    <Title order={1} mb="md">PFMan - Portfolio Manager</Title>
                    <Text size="lg" c="dimmed">
                        Welcome to the AZX Portfolio Management Platform
                    </Text>
                </div>

                <Paper withBorder p="xl" radius="md">
                    <Stack gap="md">
                        <Group gap="sm">
                            <IconBuildingSkyscraper size={24} />
                            <Title order={2}>Portfolio Management</Title>
                        </Group>
                        
                        <Text>
                            Manage your commercial real estate portfolios with AI-powered insights 
                            for decarbonization and compliance initiatives.
                        </Text>

                        <Button
                            component={Link}
                            to="/portfolio/import"
                            leftSection={<IconUpload size={16} />}
                            size="md"
                            mt="md"
                        >
                            Import Portfolio
                        </Button>
                    </Stack>
                </Paper>

                <Paper withBorder p="md" radius="md">
                    <Group justify="space-between" align="center">
                        <div>
                            <Text size="sm" fw={500}>Theme Settings</Text>
                            <Text size="xs" c="dimmed">Toggle between light and dark mode</Text>
                        </div>
                        <ColorSchemeToggle />
                    </Group>
                </Paper>
            </Stack>
        </Container>
    );
}