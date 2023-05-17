import { NextPage } from "next";
import { useEffect, useState } from "react";
import Container from "../components/Container";
import { Box, Button, MenuItem, Select, Stack, TextField } from "@mui/material";
import { ecdh_generate_keypair, ecdh_export, ecdh_import, ecdh_derive_key, aes_encrypt, aes_decrypt } from "../libs/cryptoext";
import { toHexFromNumbers } from "../libs/store";


const Home: NextPage = () => {

  const names = ["P-256", "P-384", "P-521"]

  useEffect(() => {

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      //on load
    }

  });

  const [curve, setCurve] = useState('P-256');
  const [logInfo, setLogInfo] = useState<any>(null);
  const [data, setData] = useState('1234567890');


  let logBugger = logInfo ?? ""

  const AddLog = (dir: string, message: any, final: boolean = false) => {
    logBugger = logBugger + "\r\n" + dir;
    let obj;

    if (typeof message == "string" && message[0] == '{') {
      obj = JSON.parse(message)
    }
    else if (Array.isArray(message)) {
      obj = toHexFromNumbers(message.map(Number))
    }
    else {
      obj = message;
    }

    logBugger += JSON.stringify(obj, (key, value) => Array.isArray(value) ? toHexFromNumbers(value.map(Number)) : value, 2)

  }


  async function сlick(event: any): Promise<void> {

    logBugger = ''
    setLogInfo('');

    const skp = await ecdh_generate_keypair(curve);

    try {
      const sjwk = await ecdh_export(skp.publicKey);

      AddLog("server_jwk:", sjwk)

      const spkey = await ecdh_import(sjwk, curve);
      const ckp = await ecdh_generate_keypair(curve);
      const cjwk = await ecdh_export(ckp.publicKey);

      AddLog("client_jwk:", cjwk)

      const cdek = await ecdh_derive_key(spkey, ckp.privateKey);

      AddLog("text:", data)

      const ivrv = crypto.getRandomValues(new Uint8Array(8))

      const iv = Buffer.from(ivrv).toString("hex")
      AddLog("iv:", iv)

      const encText = await aes_encrypt(cdek, iv, data);
      AddLog("encText:", encText)

      const sdec = await ecdh_derive_key(ckp.publicKey, skp.privateKey);


      const decText = await aes_decrypt(sdec, iv, encText)

      AddLog("decText", decText)

    }
    catch (err: any) {

      logBugger += "\r\n" + err.message;
    }
    finally {
      setLogInfo(logBugger);

    }

  }
  return (

    <Container title="webcrypro">
      <Stack margin="1%">
        <Box>
        <Select
          labelId="curve"
          id="curve"
          value={curve}
          onChange={(e) => setCurve(e.target.value)}
        >
          {names.map((name) => (
            <MenuItem
              key={name}
              value={name}
            >
              {name}
            </MenuItem>
          ))}
           
        </Select>
        <TextField id="data" label="data" variant="outlined" defaultValue={data} onChange={(e) => setData(e.target.value)} />
      </Box>
      <Button onClick={сlick}>Test EDCH</Button>
      {!!logInfo && <pre>{logInfo}</pre>}
      </Stack>
    </Container>
  );
};

export default Home;

