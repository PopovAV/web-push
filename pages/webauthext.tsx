import { Box, Button, Divider, TextField } from '@mui/material';
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

        if (location.search != "") {
            console.log(location.search.substring(1))
            setUrl(location.search.substring(1))
        }

        if (paymentUrl != null)
            setUrl(paymentUrl)

    }, [router.pathname])

    function OnkeyPresset(event: { preventDefault: () => void, key: string, target: any }) {

        event.preventDefault();
        console.log(event.key)
        if (event.key == 'Enter') {
            setUrl(event.target.value)
        }
    }

    function OnBlur(event: { preventDefault: () => void,  target: any }) {
        console.log(event)
        setUrl(event.target.value)
    }

    return (
        <Container title='webauth' >
            <Box>
                <TextField id="url" label="url" onBlur={OnBlur} onKeyUp={OnkeyPresset} fullWidth defaultValue={url} margin="dense" />
            </Box>
            <Divider />
            <CardMedia component="iframe"
                src={url} allow="payment * publickey-credentials-get *" allowFullScreen height="100%" scrolling='none'></CardMedia>

        </Container>
    )

}

export default WebauthExt;