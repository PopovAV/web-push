import { Alert, Button, FormControlLabel, Snackbar, Stack, Switch, TextField } from '@mui/material';
import Container from '../components/Container';
import { useState } from 'react';
import {

    KE1,
    KE2,
    OpaqueClient,
    OpaqueID,
    RegistrationRequest,
    RegistrationResponse,
    getOpaqueConfig
} from '@cloudflare/opaque-ts'

const Webpin = () => {

    const server_identity = 'PWA OPAQUE demo'

    const [{ isRegistred, text }, setIsRegistred] = useState({ isRegistred: false, text: "Login" })
    const [pin, setPin] = useState("");
    const [login, setLogin] = useState("");
    const [{ result, isError }, setResult] = useState({ result: "", isError: false })

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
            ShowResult(await response.json(), true);
            return;
        }

        const envelope = RegistrationResponse.deserialize(cfg, result['envelope']);

        const registration = await client.registerFinish(envelope, server_identity, login);

        if (registration instanceof Error) {
            ShowResult('Error: ' + registration.message, true);
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
            let ev = { preventDefault: () => { } }
            SwitchMode(ev)
            ShowResult(result)
        }
        else {
            let errorResp = await response.json()
            ShowResult('Error: ' + errorResp.message, true);
        }

    }

    async function sendLogin(event: { preventDefault: () => void; }) {

        const cfg = getOpaqueConfig(OpaqueID.OPAQUE_P256);

        const client = new OpaqueClient(cfg);

        const authInit = await client.authInit(pin);

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
            ShowResult(await response.json());
            return;
        }

        const ke2 = KE2.deserialize(cfg, result['ke2'])

        const authFinish = await client.authFinish(ke2, server_identity, login)
        if (authFinish instanceof Error) {
            ShowResult('Error: ' + authFinish.message, true);
            return;
        }


        const { ke3, session_key } = authFinish

        response = await fetch('/api/auth/login_finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: login, ke3: ke3.serialize(), session_key: JSON.stringify(session_key) })
        })

        if (response.status == 200) {
            result = await response.json()
            ShowResult(result);
        }
        else
            ShowResult(await response.json())

    }

    return (
        <Container title="opaque">
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
                <TextField id="login" label="UseName" variant="standard" onChange={(e) => setLogin(e.target.value)} />
                <TextField id="pin" label="Pin" variant="standard" onChange={(e) => setPin(e.target.value)} />
                <Button onClick={сlick}>Send</Button>
            </Stack>
            <Snackbar
                open={!!result}
                autoHideDuration={6000}
                onClose={() => setResult({ result: '', isError: false })}>
                <Alert severity={!isError ? "success" : "error"} sx={{ width: '100%' }}>
                    {result}
                </Alert>
            </Snackbar>

        </Container>
    )

}

export default Webpin