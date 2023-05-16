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
        luad+="Divices:";
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            devices.forEach((device) => {
              diviceIfno += `\r\n${device.kind}: ${device.label} id = ${device.deviceId}`;
            });
          })
          .catch((err) => {
            console.log(`${err.name}: ${err.message}`);
          });
      }

      setUserAgent({ ua:navigator.userAgent, uad : luad })

      let diviceIfno = "";
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
      } else {
        // List cameras and microphones.
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            devices.forEach((device) => {
              diviceIfno += `${device.kind}: ${device.label} id = ${device.deviceId} \r\n`;
            });
          })
          .catch((err) => {
            console.log(`${err.name}: ${err.message}`);
          });
      }
      



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
