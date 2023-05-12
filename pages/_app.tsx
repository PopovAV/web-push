import "../styles/globals.css";
import type { AppProps } from "next/app";
import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import { ThemeProvider } from "styled-components";
import { theme } from "../styles/theme";
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"


function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) {
  return (

    <ThemeProvider theme={theme}>
      <SessionProvider session={session}>
        {Component.displayName!= undefined
          ? <Component {...pageProps} />
          : <DashboardLayout>
            <Component {...pageProps} />
          </DashboardLayout>
        }
      </SessionProvider>
    </ThemeProvider>

  )
}
export default MyApp;


