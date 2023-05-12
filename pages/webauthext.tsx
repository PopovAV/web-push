import { Box,  Divider,  IconButton, TextField } from '@mui/material';
import Container from '../components/Container';
import CardMedia from '@mui/material/CardMedia';
import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';



const WebauthExt: NextPage = function () {

    let location: Location;

    const router = useRouter()

    const [url, setUrl] = useState('');

    useEffect(() => {
        location = window.location;

        let paymentUrl = `${location.protocol}/payment`

        if (paymentUrl != null)
            setUrl(paymentUrl)

    }, [router.pathname])

    function OnkeyPresset(event: { preventDefault: () => void, key: string, target: any }) {

        event.preventDefault();
        
        if (event.key == 'Enter') {
            setUrl(event.target.value)
        }
    }

    return (
        <Container title='webauth' >
            <Box>
                <TextField id="url" label="url" onKeyUp={OnkeyPresset} fullWidth defaultValue={url} margin="dense" />
            </Box>
            <Divider/>
            <CardMedia component="iframe"
                src={url} allow="payment * publickey-credentials-get *" allowFullScreen height="100%" scrolling='none' ></CardMedia>

        </Container>
    )

}

export default WebauthExt;