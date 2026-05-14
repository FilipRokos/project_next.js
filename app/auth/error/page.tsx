"use client"

import { useSearchParams } from "next/navigation"

export default function AuthErrorPage() {
    const params = useSearchParams()

    const error = params.get("error")

    return (
        <div>
            {error === "drive_permission_required" && (
                <p>
                    Musíš povolit Google Drive oprávnění.
                </p>
            )}
        </div>
    )
}