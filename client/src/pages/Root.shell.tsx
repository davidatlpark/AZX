import { AppHeader } from "@/components/AppHeader/AppHeader";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "react-router";

export function RootShell() {

    return (
        <AppShell
            header={{ height: 60 }}
            padding="md"
        >
            <AppShell.Header><AppHeader /></AppShell.Header>
            <AppShell.Main><Outlet /></AppShell.Main>
        </AppShell>
    )
}