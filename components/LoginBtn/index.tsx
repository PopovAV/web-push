import { Box, Button } from "@mui/material"
import { useSession, signIn, signOut } from "next-auth/react"

export default function Component() {
    const { data: session } = useSession()
    if (session) {
        return (
            <>
                <Box>
                    {session.user?.email}
                    <Button onClick={() => signOut()}>Sign out</Button>
                </Box>
            </>
        )
    }
    return (
        <>
            <Box>
                Not signed in
                <Button onClick={() => signIn("yandex")}>Sign in</Button>
            </Box>
        </>
    )
}