import type { NextPage } from "next";
import Container from "../components/Container";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"
import { InterceptFetch } from "../libs/fingerprint";



const Home: NextPage = () => {

  const [fingerprint, setFingerPrint] = useState("");
  const { data: session } = useSession();
  const [{ ua, uad }, setUserAgent] = useState({ ua: "", uad: "" });
  const [devices, setDevices] = useState<string | null>(null);

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

      const Update = async () => {
        const fp = await InterceptFetch(null)
        if (fp != null) {
          setFingerPrint(fp)
        } else {
          const im = import('clientjs')
          const m = await im;
          const client = new m.ClientJS();
          const value = client.getFingerprint();
          await InterceptFetch(value.toString())
          setFingerPrint(value.toString())
        }
      };

      Update();

      const getDevices = async () => {
        const res = await fetch("/api/devices")
        setDevices(JSON.stringify(await res.json(), null, 2))
      }
      if (session?.user && devices == null) {
        getDevices();
      }

    }
  }, [fingerprint, devices, session]);

  return (

    <Container title="Dashboard">
      <p>{ua}</p>
      <p>FingerPrint : {fingerprint}</p>
      {!!session &&
        <div>
          <p>{session.user?.name}</p>
          <img src={session.user?.image ?? ""} alt={session.user?.email ?? ""} />
        </div>
      }
      {!!devices && <pre>{devices}</pre>}
      {!!uad && <pre>{uad}</pre>}
    </Container>
  );
};

export default Home;
