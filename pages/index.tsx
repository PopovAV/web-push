import type { NextPage } from "next";
import Container from "../components/Container";
import { useEffect, useState } from "react";

const Home: NextPage = () => {

  const [fingerprint, setFingerPrint] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined'  && 'serviceWorker' in navigator) {

       import('clientjs').then( (m)=>{
        
        const client = new m.ClientJS();

        // Get the client's fingerprint id
        const value = client.getFingerprint();
       
        setFingerPrint(value.toString())
      });

    }
  })

  

  return (
    <Container title="Dashboard">
      <div>Select action from menu for test</div>
      <div  >{fingerprint}</div>
    </Container>
  );
};

export default Home;
