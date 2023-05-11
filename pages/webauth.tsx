import { TextField } from '@mui/material';
import Container from '../components/Container';
import CardMedia from '@mui/material/CardMedia';
import { useState } from 'react';


const Webauth = function () {

    const [url, setUrl] = useState("https://web-push-silk.vercel.app/webauthn");

    function OnkeyPresset(ev:any) {
        if (ev.key === 'Enter') {
            // Do code here
            ev.preventDefault();
            setUrl(ev.target.value)
        }
    }

    return (
        <Container title='webauth' >
            <TextField id="url" label="url" fullWidth  onKeyUp={OnkeyPresset} defaultValue={url} margin="dense" />
            <CardMedia component="iframe"
                src={url} allow="publickey-credentials-get *" allowFullScreen height="100%" scrolling='none' ></CardMedia>
            
        </Container>
    )

}

export default Webauth;