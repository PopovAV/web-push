import { Alert, Box, Button, Snackbar, Stack, Switch, TextField } from '@mui/material';
import Container from '../components/Container';
import { useState } from 'react';
import {

    KE1,
    KE2,
    KE3,
    OpaqueClient,
    OpaqueID,
    OpaqueServer,
    RegistrationClient,
    RegistrationRecord,
    RegistrationRequest,
    RegistrationResponse,
    RegistrationServer,
    getOpaqueConfig
} from '@cloudflare/opaque-ts'

export default function webpin() {

    const server_identity = 'PWA OPAQUE demo'

    const [isRegistred, setIsReistred] = useState(false)

    const [pin, setPin] = useState("");

    const [login, setLogin] = useState("");

    const [result, showResult] = useState("")

    const SwitchMode = async (event: { preventDefault: () => void }) => {
        event.preventDefault()
        setIsReistred(!isRegistred)
    }

    const ShowResult = (text: any) => {
        showResult(JSON.stringify());
        console.log(text);
    }


    async function sendReg(event: { preventDefault: () => void; }) {

        const cfg = getOpaqueConfig(OpaqueID.OPAQUE_P256);

        const client = new OpaqueClient(cfg);

        const initialization = await client.registerInit(pin);

        // for network traffic
        let response: Response, result;
        let resp = { username: login, init: (initialization as RegistrationRequest).serialize() };

        response = await fetch('/api/auth/reg_init', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify(resp)
        });
        if (response.status == 200)
            result = await response.json();
        else {
            ShowResult(await response.json());
            return;
        }

        const envelope = RegistrationResponse.deserialize(cfg, result['envelope']);

        const registration = await client.registerFinish(envelope, server_identity, login);
       
        if (registration instanceof Error) {
            ShowResult('sealing of registration envelope failure');
            return;
        }

        const { record, export_key } = registration;
        response = await fetch('/api/auth/reg_finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: login, record: record.serialize() })
        });
        if (response.status == 200) {
            result = await response.json();
            setIsReistred(true)
            ShowResult(result)
        }
        else {
            ShowResult(await response.json());
        }

    }

    async function sendLogin(event: { preventDefault: () => void; }) {

        const cfg = getOpaqueConfig(OpaqueID.OPAQUE_P256);

        const client = new OpaqueClient(cfg);

        const authInit = await client.authInit(pin);

        console.log(authInit);

        // for network traffic
        let response: Response, result;
        let resp = { username: login, ke1: (authInit as KE1).serialize() };

        response = await fetch('/api/auth/login_init', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify(resp)
        });
        if (response.status == 200)
            result = await response.json();
        else {
            ShowResult(await response.text());
            return;
        }

        const ke2 = KE2.deserialize(cfg, result['ke2'])

        const authFinish = await client.authFinish(ke2, server_identity, login)
        if (authFinish instanceof Error)
            throw authFinish

        const { ke3, session_key } = authFinish

        response = await fetch('/api/auth/login_finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: login, ke3: ke3.serialize(), session_key: JSON.stringify(session_key) })
        })

        if (response.status == 200)
            result = await response.json()
        else
            ShowResult(await response.text())

        // show success message

        ShowResult("sucscessfyly");
    }

    const handleClose = ()=>{
        showResult("");
    }

    return (
        <Container title="opaque">

            <Box sx={{
                width: 300,
                height: 300,
                justifyContent: 'center',
                margin: 10
            }}>

                <Switch
                    checked={isRegistred}
                    onChange={SwitchMode}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
                <Stack>
                    <TextField id="login" label="Login" variant="standard" onChange={(e) => setLogin(e.target.value)} />
                    <TextField id="pin" label="Pin" variant="standard" onChange={(e) => setPin(e.target.value)} />
                    {!isRegistred
                        ? <Button onClick={sendReg}> Register </Button>
                        : <Button onClick={sendLogin}> Login </Button>
                    }

                    <Snackbar
                        open={!!result}
                        autoHideDuration={6000}
                        onClose={handleClose}
                        message={result}
                    />
                </Stack>
            </Box>
        </Container>
    )

}