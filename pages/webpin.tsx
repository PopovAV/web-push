import { Alert, Button, FormControlLabel, Snackbar, Stack, Switch, TextField } from '@mui/material';
import Container from '../components/Container';
import { useEffect, useState } from 'react';
import {

    KE1,
    KE2,
    OpaqueClient,
    OpaqueID,
    RegistrationRequest,
    RegistrationResponse,
    getOpaqueConfig
} from '@cloudflare/opaque-ts'

import { useSession } from 'next-auth/react';
import { NextPage } from 'next';

import { authOptions } from './api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { ImportKey, aesDecrypt, aesEncrypt } from '../libs/cryptoext';
import { toHexFromNumbers } from '../libs/store';

export async function getServerSideProps(context: any) {
    const session = await getServerSession(context.req, context.res, authOptions)
    return {
        props: {
            session,
        },
    }
}


const Webpin: NextPage = () => {

    const server_identity = 'PWA OPAQUE demo'
    const { update, data: session, status } = useSession();

    useEffect(() => {

        if (status === "authenticated") {
            setLogin(session.user?.email ?? "")
        }

    }, [update])


    const [{ isRegistred, text }, setIsRegistred] = useState({ isRegistred: false, text: "Login" })
    const [pin, setPin] = useState("");
    const [login, setLogin] = useState(session?.user?.email ?? "");
    const [{ result, isError }, setResult] = useState({ result: "", isError: false });
    const [logInfo, setLogInfo] = useState<any>(null);

    let logBugger = logInfo ?? ""


    const SwitchMode = async (event: { preventDefault: () => void }) => {
        event.preventDefault()
        let text = isRegistred ? "Login" : "Register"
        setIsRegistred({ isRegistred: !isRegistred, text: text })

    }

    const ShowResult = (res: any, error: boolean = false) => {
        let newResult = typeof res == "string" ? res : JSON.stringify(res, null, 2);
        setResult({ result: newResult, isError: !!error });
    }

    const AddLog = (dir: string, message: any, final: boolean = false) => {
        logBugger = logBugger + "\r\n" + dir;
        let obj;

        if (typeof message == "string" && message[0] == '{') {
            obj = JSON.parse(message)
        }
        else {
            obj = message;
        }

        logBugger += JSON.stringify(obj, (key, value) => Array.isArray(value) ? toHexFromNumbers(value.map(Number)) : value, 2)

    }

    async function сlick(event: { preventDefault: () => void; }) {

        logBugger = "";

        await (isRegistred ? sendReg(event) : sendLogin(event))

        setLogInfo(logBugger)
    }



    async function sendReg(event: { preventDefault: () => void; }) {

        const cfg = getOpaqueConfig(OpaqueID.OPAQUE_P256);

        const client = new OpaqueClient(cfg);

        const initialization = await client.registerInit(pin);

        let response: Response, result;

        let resp = { username: login, init: (initialization as RegistrationRequest).serialize() };

        const regBody = JSON.stringify(resp);

        AddLog("->", regBody)

        response = await fetch('/api/auth-opake/reg_init', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: regBody
        });

        if (response.status == 200)
            result = await response.json();
        else {
            ShowResult(await response.json(), true);
            return;
        }

        AddLog("<-", result)

        const envelope = RegistrationResponse.deserialize(cfg, result['envelope']);

        const registration = await client.registerFinish(envelope, server_identity, login);

        if (registration instanceof Error) {
            ShowResult('Error: ' + registration.message, true);
            return;
        }

        const { record, export_key } = registration;

        AddLog("ClientSecretDK", { key: export_key });

        const key = await ImportKey(export_key)
        const data = await aesEncrypt(JSON.stringify(session), key)
        window.sessionStorage.setItem("encSessionData", JSON.stringify(data))

        AddLog("save to sessionStore", data)

        const finBody = JSON.stringify({ username: login, record: record.serialize() })

        AddLog("->", finBody)

        response = await fetch('/api/auth-opake/reg_finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: finBody
        });

        if (response.status == 200) {
            result = await response.json();
            let ev = { preventDefault: () => { } }
            SwitchMode(ev)
            ShowResult(result)
            AddLog("<-", result)
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
        let initBody = JSON.stringify(resp)

        AddLog("->", initBody)

        response = await fetch('/api/auth-opake/login_init', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: initBody
        });
        if (response.status == 200)
            result = await response.json();
        else {
            ShowResult(await response.json(), true);
            return;
        }
        AddLog("<-", result)

        const ke2 = KE2.deserialize(cfg, result['ke2'])

        const authFinish = await client.authFinish(ke2, server_identity, login)
        if (authFinish instanceof Error) {
            ShowResult('Error: ' + authFinish.message, true);
            return;
        }

        const { ke3, session_key, export_key } = authFinish

        AddLog("ClientSecretDK", { key: export_key });

        const encData = window.sessionStorage.getItem("encSessionData")
        if (encData) {
            window.sessionStorage.removeItem("encSessionData")
            let { chipterText, iv } = JSON.parse(encData)
            if (chipterText != undefined) {
                let key = await ImportKey(export_key)
                let data = await aesDecrypt(chipterText, iv, key)
                AddLog("get from sessionStore", data)
            }
        }

        const loginFinish = JSON.stringify({ username: login, ke3: ke3.serialize(), session_key: session_key });

        AddLog("->", loginFinish)

        response = await fetch('/api/auth-opake/login_finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: loginFinish
        })

        if (response.status == 200) {
            result = await response.json()
            AddLog("<-", result);
            ShowResult(result.message);
        }
        else
            ShowResult(await response.json(), true)

    }

    async function rotateKeys(event: any) {
        const response = await fetch('/api/auth-opake/change_keys' ,{ method: "OPTIONS"} );
        if (response.status == 200) {
            const result = await response.json();
            AddLog("<-", result,true)
            setLogInfo(logBugger)
            ShowResult("Ok");
        }
        else {
            ShowResult(await response.json(), true);
        }
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
                <TextField id="login" label="UseName" variant="standard" defaultValue={login} onChange={(e) => setLogin(e.target.value)} autoComplete='username' />
                <TextField id="pin" label="Pin" variant="standard" onChange={(e) => setPin(e.target.value)} autoComplete={isRegistred ? "current-password" : 'new-password'} />
                <Button onClick={сlick}>Send</Button>
                <Button onClick={rotateKeys}>RotateKeys</Button>
            </Stack>
   
            <Snackbar
                open={!!result}
                autoHideDuration={10000}
                onClose={() => setResult({ result: '', isError: false })}>
                <Alert severity={!isError ? "success" : "error"} sx={{ width: '100%' }}>
                    {result}
                </Alert>
            </Snackbar>
            {!!logInfo && <pre >{logInfo}</pre >}
        </Container>
    )

}

export default Webpin