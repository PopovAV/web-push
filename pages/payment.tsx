import type { NextPage } from "next";
import Container from "../components/Container";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"
import { Button } from "@mui/material";
import { fromHex, fromb64, fromb64url } from "../libs/store";

const Payment: NextPage = () => {

  const { data: session } = useSession();

  // A unique identifier for your website
  const rpID = `${process.env.HOST_NAME}`;

  const [ { isSupported, reason} , setIsSupported] = useState({ isSupported: false, reason: ''});

  useEffect(() => {
    isSecurePaymentConfirmationSupported().then(result => {
      const [isSupported, reason] = result;
      setIsSupported({ isSupported, reason })
    });
  },[session])

  const isSecurePaymentConfirmationSupported = async () => {
    if (!('PaymentRequest' in window)) {
      return [false, 'Payment Request API is not supported'];
    }
  
    try {
      // The data below is the minimum required to create the request and
      // check if a payment can be made.
      const supportedInstruments = [
        {
          supportedMethods: "secure-payment-confirmation",
          data: {
            // RP's hostname as its ID
            rpId: rpID,
            // A dummy credential ID
            credentialIds: [new Uint8Array(1)],
            // A dummy challenge
            challenge: new Uint8Array(1),
            instrument: {
              // Non-empty display name string
              displayName: ' ',
              // Transparent-black pixel.
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
            },
            // A dummy merchant origin
            payeeOrigin: 'https://non-existent.example',
          }
        }
      ];
  
      const details = {
        // Dummy shopping details
        total: {label: 'Total', amount: {currency: 'USD', value: '0'}},
      };
  
      const request = new PaymentRequest(supportedInstruments, details);
      const canMakePayment = await request.canMakePayment();
      return [canMakePayment, canMakePayment ? '' : 'SPC is not available'];
    } catch (error: any) {
      console.error(error);
      return [false, error.message];
    }
  };

  const PayClick = async (event: { preventDefault: () => void; })=>{
    const resp = await fetch(`/api/authn/get_auth_options/${session?.user?.email}`, { cache: 'no-store' });
    // Pass the options to the authenticator and wait for a response
    const options = await resp.json();
    console.log(options);

    const { allowCredentials, challenge } = options;
    
    const request = new PaymentRequest([{
      // Specify `secure-payment-confirmation` as payment method.
      supportedMethods: "secure-payment-confirmation",
      data: {
        // The RP ID
        rpId: rpID,
    
        // List of credential IDs obtained from the RP server.
        credentialIds : allowCredentials.map((cr:any)=> fromb64(cr.id)),
    
        // The challenge is also obtained from the RP server.
        challenge : fromb64(challenge),
    
        // A display name and an icon that represent the payment instrument.
        instrument: {
          displayName: "Fancy Card ****1234",
          icon: "https://rp.example/card-art.png",
          iconMustBeShown: false
        },
    
        // The origin of the payee (merchant)
        payeeOrigin: "https://merchant.example",
    
        // The number of milliseconds to timeout.
        timeout: 360000,  // 6 minutes
      }
    }], {
      // Payment details.
      total: {
        label: "Total",
        amount: {
          currency: "USD",
          value: "5.00",
        },
      },
    });
    
    try {
      const response = await request.show();
    
      // response.details is a PublicKeyCredential, with a clientDataJSON that
      // contains the transaction data for verification by the issuing bank.
      // Make sure to serialize the binary part of the credential before
      // transferring to the server.
      //const result = fetchFromServer('https://rp.example/spc-auth-response', response.details);
      //if (result.success) {
     //   await response.complete('success');
     // } else {
        await response.complete('fail');
     // }
    } catch (err) {
      // SPC cannot be used; merchant should fallback to traditional flows
      console.error(err);
    }

  }


  return (

    <Container title="Payment">
      {
        isSupported ? <Button onClick={PayClick} > Pay </Button> : <div> { reason } </div>
      }
    </Container>
  );
};

export default Payment;
