import { ColorSchemeToggle } from "@/components/ColorSchemeToggle/ColorSchemeToggle";

export function HomePage() {
    return (
        <>
            <h1>Welcome to the Home Page!</h1>
            <p>This is a simple React application using React Router.</p>
            <ColorSchemeToggle/>
        </>
    )
}