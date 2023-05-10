import { Alert, Button, FormControlLabel, Snackbar, Stack, Switch, TextField } from '@mui/material';
import Container from '../components/Container';
import { useEffect, useState } from 'react';

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useSession } from 'next-auth/react';
import { NextPage } from 'next';
import { authOptions } from './api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"

export async function getServerSideProps(context:any) {
  const session = await getServerSession(context.req, context.res, authOptions)

  return {
    props: {
      session,
    },
  }
}

const WebAuthN: NextPage = () => {

    const { update, data: session, status } = useSession()

    useEffect(() => {
        if (status === "authenticated") {
            console.log(session.user)
            setLogin(session?.user?.email)
        }
    }, [update])

    const [{ isRegistred, text }, setIsRegistred] = useState({ isRegistred: false, text: "Login" })
    const [login, setLogin] = useState(session?.user?.email);
    const [{ result, isError }, setResult] = useState({ result: "", isError: false })
    const [ keyInfo , setKeyInfo] = useState<any>(null)

    const SwitchMode = async (event: { preventDefault: () => void }) => {
        event.preventDefault()
        let text = isRegistred ? "Login" : "Register"
        setIsRegistred({ isRegistred: !isRegistred, text: text })
    }

    const ShowResult = (res: any, error: boolean = false) => {
        let newResult = typeof res == "string" ? res : JSON.stringify(res, null, 2);
        setResult({ result: newResult, isError: !!error });
        console.log(newResult);
    }

    async function сlick(event: { preventDefault: () => void; }) {
        await (isRegistred ? sendReg(event) : sendLogin(event))
    }

    async function sendReg(event: { preventDefault: () => void; }) {

        const resp = await fetch('/api/authn/get_reg_options/' + login, { cache: 'no-store' });

        let attResp;
        let opt
        try {

            opt = await resp.json()

            if (resp.status == 400) {
                console.log(opt)
                throw new Error(opt.error)
            }

            // Pass the options to the authenticator and wait for a response
            attResp = await startRegistration(opt);

        } catch (error: any) {
            // Some basic error handling
            if (error.name === 'InvalidStateError') {
                ShowResult('Error: Authenticator was probably already registered by user', true);
            } else {
                ShowResult(error.message, true)
            }
            return;

        }

        const verificationResp = await fetch(`/api/authn/verify-registration/${login}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(attResp),
        });

        // Wait for the results of verification
        const verificationJSON = await verificationResp.json();

        // Show UI appropriate for the `verified` status
        if (verificationJSON && verificationJSON.verified) {
            setKeyInfo(verificationJSON)
        } else {
            ShowResult(verificationJSON, true)
        };

    }

    async function sendLogin(event: { preventDefault: () => void; }) {
        // GET authentication options from the endpoint that calls
        // @simplewebauthn/server -> generateAuthenticationOptions()
       
        let asseResp;
        try {
            const resp = await fetch(`/api/authn/get_auth_options/${login}`, { cache: 'no-store' });
            // Pass the options to the authenticator and wait for a response
            const authOptions = await resp.json();
            setKeyInfo(authOptions)
            asseResp = await startAuthentication(authOptions);

        } catch (error: any) {
            // Some basic error handling
            ShowResult(error, true)
            return;
        }

        // POST the response to the endpoint that calls
        // @simplewebauthn/server -> verifyAuthenticationResponse()
        const verificationResp = await fetch(`/api/authn/verify-login/${login}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(asseResp),
        });

        // Wait for the results of verification
        const verificationJSON = await verificationResp.json();

        // Show UI appropriate for the `verified` status
        if (verificationJSON && verificationJSON.verified) {
            ShowResult(verificationJSON)
        } else {
            ShowResult(verificationJSON, true)
        };
    }


    return (
        <Container title="webauthn">
            <FormControlLabel
                control={
                    <Switch
                        checked={isRegistred}
                        onChange={SwitchMode}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label={text}
            />

            <Stack margin={"10%"}>
                <TextField id="login" label="UseName" variant="standard" defaultValue={login} onChange={(e) => setLogin(e.target.value)} />
                <Button onClick={сlick}>Send</Button>
            </Stack>
            {!!keyInfo && <pre >{ JSON.stringify(keyInfo,null, 2)}</pre >}
            <Snackbar
                open={!!result}
                autoHideDuration={30000}
                onClose={() => setResult({ result: '', isError: false })}>
                <Alert severity={!isError ? "success" : "error"} sx={{ width: '100%' }}>
                    {result}
                </Alert>
            </Snackbar>

        </Container>
    )

}

export default WebAuthN;

