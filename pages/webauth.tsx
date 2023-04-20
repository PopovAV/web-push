import Box, { BoxProps } from '@mui/material/Box';
import Container from '../components/Container';
import CardMedia from '@mui/material/CardMedia';
import CssBaseline from '@mui/material/CssBaseline';


const webauth = function () {

    return (
        <Container title='webauth' >
          <CssBaseline/>
          <CardMedia component="iframe"
             src='https://webauthn.me/' allow="publickey-credentials-get *"  allowFullScreen height="100%" scrolling='none' ></CardMedia>
        </Container>
    )

}

export default webauth;