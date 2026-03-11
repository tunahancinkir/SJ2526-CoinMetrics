// src/routes/liste.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/liste')({
    component: Liste,
})

function Liste() {
    return (
        <div className="liste-container">
            {/* Page content will be added here */}
        </div>
    )
}
