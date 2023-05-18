import { Box, Button, Icon, Modal, Stack } from "@mui/material"
import { BuiltInProviderType } from "next-auth/providers";
import { useSession, signIn, signOut, getProviders, LiteralUnion, ClientSafeProvider } from "next-auth/react"
import { useState } from "react";
import Image from 'next/image';


const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

function getIcon(id: string) {
    return `https://authjs.dev/img/providers/${id}.svg`;
}

export default function Component() {

    const { data: session } = useSession()
    const [open, setOpen] = useState(false);
    const [providers, setProviders] = useState<Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider> | null>(null)

    const handleOpen = async () => {
        if (providers == null) {
            const providers = await getProviders();
            setProviders(providers)
        }
        setOpen(true);
    }

    const handleClose = () => setOpen(false);


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
                <Button onClick={handleOpen}>Sign in</Button>
            </Box>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Stack>
                        {
                            Object.values(providers ?? []).map((provider) => (
                                <Button key={provider.id}
                                    size="large"
                                    onClick={() => signIn(provider.id)}
                                    startIcon={

                                        <img height="32px" src={getIcon(provider.id)} />
                                    } >
                                    Sign in with {provider.name}
                                </Button>
                            ))
                        }
                    </Stack>
                </Box>
            </Modal>

        </>
    )
}