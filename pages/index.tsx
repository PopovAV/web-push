import type { NextPage } from "next";
import Container from "../components/Container";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"

const Home: NextPage = () => {

  const [fingerprint, setFingerPrint] = useState("");
  const { data: session } = useSession();
  const [{ ua , uad }, setUserAgent] = useState({ ua:"", uad: "" });

  useEffect(() => {

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {

      let luad = ''
    
      if('userAgentData' in navigator){
        luad = JSON.stringify(navigator.userAgentData,(k, v)=> v,2);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
      } else {
        let deviceInfo = '';
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            devices.forEach((device) => {
              deviceInfo += `\r\n${device.kind}: ${device.label} id = ${device.deviceId}`;
            });
          })
          .catch((err) => {
            console.log(`${err.name}: ${err.message}`);
          });
          if(deviceInfo.length>0){
            luad += "\r\nDevices" + deviceInfo;
          }
      }

      setUserAgent({ ua:navigator.userAgent, uad : luad })


      import('clientjs').then((m) => {
        console.log(m);
        const client = new m.ClientJS();
        const value = client.getFingerprint();
        setFingerPrint(value.toString())

      });
      
    }
  },[fingerprint]);

  return (
  
    <Container title="Dashboard">
      <p>{ua}</p>
      <p>FingerPrint : {fingerprint}</p>
      {!!session &&
        <div>
          <p>{session.user?.name}</p>
          <img src={session.user?.image??""} alt={session.user?.email??""} />
        </div>
      }
      {!!uad && <pre>{uad}</pre> }
    </Container>
  );
};

export default Home;
