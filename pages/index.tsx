import type { NextPage } from "next";
import Container from "../components/Container";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"

const Home: NextPage = () => {

  const [fingerprint, setFingerPrint] = useState("");
  const { data: session } = useSession();
  const [{ ua, uad }, setUserAgent] = useState({ ua: "", uad: "" });

  async function GetUserMedia(): Promise<string> {
    let deviceInfo = '';
    if ('permissions' in navigator) {
      try {
        const permissionName = "microphone" as PermissionName;
        let status = await navigator.permissions.query({ name: permissionName });
        if (status.name == "granted ") {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          const devices = await navigator.mediaDevices.enumerateDevices()
          devices.forEach((device) => {
            deviceInfo += `\r\n${device.kind}: ${device.label} id = ${device.deviceId}`;
          });
          if (deviceInfo.length > 0) {
            deviceInfo = "Devices" + deviceInfo;
          }
        }
      } catch (err: any) {
        console.log(`${err.name}: ${err.message}`);
      }
    }
    return deviceInfo
  }

  useEffect(() => {

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {

      let luad = ''

      if ('userAgentData' in navigator) {
        luad = JSON.stringify(navigator.userAgentData, (k, v) => v, 2);
      }

      GetUserMedia().then((dv) => {
        luad += dv;
      }).finally(() => {
        setUserAgent({ ua: navigator.userAgent, uad: luad });
      });

      import('clientjs').then((m) => {
        const client = new m.ClientJS();
        const value = client.getFingerprint();
        setFingerPrint(value.toString())

      });
    }
  }, [fingerprint]);

  return (

    <Container title="Dashboard">
      <p>{ua}</p>
      <p>FingerPrint : {fingerprint}</p>
      <a href="web+payment:/payment">Test Hander</a>
      {!!session &&
        <div>
          <p>{session.user?.name}</p>
          <img src={session.user?.image ?? ""} alt={session.user?.email ?? ""} />
        </div>
      }
      {!!uad && <pre>{uad}</pre>}
    </Container>
  );
};

export default Home;
