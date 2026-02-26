// src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "../components/Header";
import Footer from "../components/Footer";

const RootLayout = () => (
    <>
        <Header />
        <div className="app-container">
            <main>
                <Outlet />
            </main>
        </div>
        <Footer />
        <TanStackRouterDevtools />
    </>
);
export const Route = createRootRoute({ component: RootLayout });