import type { NextPage } from "next";
import Container from "../components/Container";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"
import { Box, Button } from "@mui/material";
import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/router";

const Payment: NextPage = () => {


  const router = useRouter();

  const { data: session } = useSession();
  const [{ isSupported, reason }, setIsSupported] = useState({ isSupported: false, reason: '' });
  const [authOption, setAuthOption] = useState<any>()

  let location: Location;

  useEffect(() => {

    location = window.location;

    isSecurePaymentConfirmationSupported().then(result => {
      const [isSupported, reason] = result;
      setIsSupported({ isSupported, reason })
      getAuthOptions().then((opt) => {
        setAuthOption(opt)
      })
    });
  }, [session, router.pathname])


  const replacer = (key: string, value: any) => {
    if (typeof value == "object" && (value["dataView"] !== undefined || key === 'credentialID')) {
      return bufferToBase64URLString(
        Buffer.from(Object.keys(value).filter(x => x != 'dataView').map((key) => { return Number(value[key]) })
        ));
    }
    return value;
  }

  const isSecurePaymentConfirmationSupported = async () => {
    if (!('PaymentRequest' in window)) {
      return [false, 'Payment Request API is not supported'];
    }

    try {

      const supportedInstruments = [
        {
          supportedMethods: "secure-payment-confirmation",
          data: {
            rpId: location.host.split(':')[0],
            credentialIds: [new Uint8Array(1)],
            challenge: new Uint8Array(1),
            instrument: {
              displayName: ' ',
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
            },
            payeeOrigin: 'https://non-existent.example',
          }
        }
      ];
      const details = {
        total: { label: 'Total', amount: { currency: 'USD', value: '0' } },
      };
      const request = new PaymentRequest(supportedInstruments, details);
      const canMakePayment = await request.canMakePayment();
      return [canMakePayment, canMakePayment ? '' : 'SPC is not available'];
    } catch (error: any) {
      return [false, error.message];
    }
  };

  const base64URLStringToBuffer = (base64URLString: string) => {
    const base64 = base64URLString.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64.padEnd(base64.length + padLength, '=');
    const binary = atob(padded);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  const bufferToUTF8String = (value: ArrayBuffer) => {
    return new TextDecoder('utf-8').decode(value);
  }

  const bufferToBase64URLString = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (const charCode in bytes) {
      str += String.fromCharCode(Number(charCode));
    }
    const base64String = btoa(str);
    return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  const toJson = (credential: any) => {
    const { id, rawId, response, type } = credential;
    let userHandle = undefined;
    if (response.userHandle) {
      userHandle = bufferToUTF8String(response.userHandle);
    }

    return {
      id,
      rawId: bufferToBase64URLString(rawId),
      response: {
        authenticatorData: bufferToBase64URLString(response.authenticatorData),
        clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
        signature: bufferToBase64URLString(response.signature),
        userHandle,
      },
      type,
      clientExtensionResults: credential.getClientExtensionResults(),
      // authenticatorAttachment: toAuthenticatorAttachment(credential.authenticatorAttachment),
    };
  }

  const getAuthOptions = async () => {
    const resp = await fetch(`/api/authn/get_auth_options/${session?.user?.email}`, { cache: 'no-store' });
    const options = await resp.json();
    console.log(options);
    return options;
  }

  const RegPaymentToken = async () => {

    const resp = await fetch('/api/authn/get_reg_options/' + session?.user?.email, { cache: 'no-store' });

    const creationOptionsJSON = await resp.json()

    const paymentExtension = {
      ...creationOptionsJSON,
      authenticatorSelection: {
        userVerification: "required",
        residentKey: "required",
        authenticatorAttachment: "platform",
      },
      extensions: { "payment": { isPayment: true, } }
    }
    let attResp;
    try {
      // Pass the options to the authenticator and wait for a response
      attResp = await startRegistration(paymentExtension);

    } catch (error: any) {
      // Some basic error handling
      if (error.name === 'InvalidStateError') {
        setKeyInfo('Error: Authenticator was probably already registered by user');
      } else {
        setKeyInfo(error.message)
      }
      return;

    }

    const verificationResp = await fetch(`/api/authn/verify-registration/${session?.user?.email}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attResp),
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();
    setKeyInfo(verificationJSON)

  }

  const PayClick = async (event: { preventDefault: () => void; }) => {

    const { allowCredentials, challenge } = authOption;

    const paymentMethod = {
      supportedMethods: "secure-payment-confirmation",
      data: {
        type: "webauthn.get",
        rpId: window.location.host.split(':')[0],
        credentialIds: allowCredentials.map((cr: any) => base64URLStringToBuffer(cr.id)),
        challenge: base64URLStringToBuffer(challenge),
        instrument: {
          displayName: "Fancy Card ****1234",
          icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
          iconMustBeShown: false
        },
        payeeName: session?.user?.email,
        payeeOrigin: "https://test.merchant.com",
        timeout: 360000
      }
    }
    const details = {
      total: {
        label: "Total",
        amount: {
          currency: "USD",
          value: "5.00",
        },
      }
    }

    const request = new PaymentRequest([paymentMethod], details);

    let paymentResponse;
    let clientDataJson;
    try {
      paymentResponse = await request.show();
      console.log(paymentResponse.toJSON())
      clientDataJson = bufferToUTF8String(paymentResponse.details.response.clientDataJSON);
      const verificationResp = await fetch(`/api/authn/verify-login/${session?.user?.email}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toJson(paymentResponse.details)),
      });
      if (verificationResp.status == 400) {
        let error = await verificationResp.json();
        throw new Error(error.error)
      }

      // Wait for the results of verification
      const verificationJSON = await verificationResp.json();

    } catch (err: any) {
      // SPC cannot be used; merchant should fallback to traditional flows
      paymentResponse?.complete("fail")
      console.log(clientDataJson);
      setKeyInfo(JSON.parse(clientDataJson ?? `{ error : ${err.message}}`));
    }

  }

  const [keyInfo, setKeyInfo] = useState<any>(null)


  return (

    <Container title="Payment">
      {
        isSupported ?
          <Box>
            <Button onClick={PayClick} > Pay </Button>
            <Button onClick={RegPaymentToken} > Reg Key </Button>
          </Box>
          : <div> {reason} </div>
      }

      {!!keyInfo && <pre >{JSON.stringify(keyInfo, replacer, 2)}</pre >}
    </Container>
  );
};

Payment.displayName = "payment"

export default Payment;
